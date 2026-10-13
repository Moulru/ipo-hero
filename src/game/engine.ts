// 라운지 방치형 RPG 전투 루프 (앱 전역 싱글턴)
// - 앱이 화면에 보일 때만 진행(document.hidden이면 정지) → 자리를 비운 시간은 computeOffline()으로 별도 정산
// - 렌더링은 Battle 컴포넌트가 이 가변 상태를 rAF로 읽어 그림(React 리렌더 없음)
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from '../store'
import { haptic } from '../lib/juice'
import {
  HERO_ATK_INTERVAL,
  MON_ATK_INTERVAL,
  OFFLINE_CAP_SEC,
  OFFLINE_EFFICIENCY,
  type HeroStats,
  type Monster,
  damageTaken,
  heroStats,
  monsterAt,
  predictFight,
} from './balance'

export type Phase = 'walk' | 'fight' | 'win' | 'lose'

export interface Fx {
  id: number
  kind: 'dmg' | 'crit' | 'hurt' | 'gold' | 'tap'
  text: string
  t: number // 경과 초
  side: 'hero' | 'mon'
  jitter: number
}

const WALK_SEC = 0.9
const WIN_SEC = 0.75
const LOSE_SEC = 1.3
const TAP_COOLDOWN = 0.11

export const game = {
  phase: 'walk' as Phase,
  phaseT: 0,
  monster: monsterAt(1) as Monster,
  heroHp: 1,
  heroMax: 1,
  monHp: 1,
  heroTimer: 0,
  monTimer: 0,
  heroLunge: 0, // 공격 애니메이션 남은 시간
  monLunge: 0,
  heroFlash: 0,
  monFlash: 0,
  shake: 0,
  scroll: 0, // 배경 스크롤(px, 논리 좌표)
  time: 0,
  tapCd: 0,
  fx: [] as Fx[],
  stats: null as HeroStats | null,
  version: 0, // 상태 변화 카운터(HUD 갱신용)
}

let fxId = 0
const pushFx = (f: Omit<Fx, 'id' | 't' | 'jitter'>) => {
  game.fx.push({ ...f, id: ++fxId, t: 0, jitter: Math.random() * 2 - 1 })
  if (game.fx.length > 24) game.fx.shift()
}

// 스토어 → 영웅 능력치
export function currentStats(): HeroStats {
  const s = useStore.getState()
  const escrow = Object.values(s.escrow).reduce((a, b) => a + b, 0)
  return heroStats({ lv: s.rpg.lv, totalAsset: s.seedMoney + escrow, owned: s.ownedRelics, cls: s.chosenClass })
}

// 컴포넌트용: 능력치에 영향을 주는 필드만 얕게 구독 → 메모이즈된 능력치
export function useHeroStats(): HeroStats {
  const d = useStore(useShallow((s) => ({ lv: s.rpg.lv, seed: s.seedMoney, escrow: s.escrow, owned: s.ownedRelics, cls: s.chosenClass })))
  return useMemo(() => {
    const esc = Object.values(d.escrow).reduce((a, b) => a + b, 0)
    return heroStats({ lv: d.lv, totalAsset: d.seed + esc, owned: d.owned, cls: d.cls })
  }, [d.lv, d.seed, d.escrow, d.owned, d.cls])
}

function refreshStats() {
  const next = currentStats()
  const prev = game.stats
  game.stats = next
  // 강화 등으로 최대 체력이 바뀌면 현재 체력 비율 유지
  if (prev && prev.hp !== next.hp && game.heroMax > 0) {
    game.heroHp = (game.heroHp / game.heroMax) * next.hp
  }
  game.heroMax = next.hp
}

function enter(phase: Phase) {
  game.phase = phase
  game.phaseT = 0
  game.version++
}

function startStage() {
  const s = useStore.getState()
  game.monster = monsterAt(s.rpg.stage)
  game.monHp = game.monster.hp
  refreshStats()
  game.heroHp = game.heroMax // 스테이지마다 체력 회복
  game.heroTimer = 0
  game.monTimer = -0.4 // 영웅 선공
  enter('walk')
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function heroHit(mult = 1, kind: 'dmg' | 'tap' = 'dmg') {
  const st = game.stats!
  const crit = kind === 'dmg' && Math.random() < st.crit
  const dmg = st.atk * mult * (crit ? st.critMul : 1) * rand(0.92, 1.08)
  game.monHp -= dmg
  game.monFlash = 0.09
  if (kind === 'dmg') game.heroLunge = 0.16
  if (crit) game.shake = 0.18
  pushFx({ kind: crit ? 'crit' : kind, text: fmtShort(dmg), side: 'mon' })
}

function step(dt: number) {
  game.time += dt
  game.phaseT += dt
  game.tapCd = Math.max(0, game.tapCd - dt)
  game.heroLunge = Math.max(0, game.heroLunge - dt)
  game.monLunge = Math.max(0, game.monLunge - dt)
  game.heroFlash = Math.max(0, game.heroFlash - dt)
  game.monFlash = Math.max(0, game.monFlash - dt)
  game.shake = Math.max(0, game.shake - dt)
  for (const f of game.fx) f.t += dt
  game.fx = game.fx.filter((f) => f.t < 1.1)

  // 0.5초마다 능력치 재계산(강화·카드·시즌 자산 변화 반영)
  if (Math.floor(game.time * 2) !== Math.floor((game.time - dt) * 2)) refreshStats()

  switch (game.phase) {
    case 'walk':
      game.scroll += dt * 34
      if (game.phaseT >= WALK_SEC) enter('fight')
      break
    case 'fight': {
      const st = game.stats!
      game.heroTimer += dt
      game.monTimer += dt
      if (game.heroTimer >= HERO_ATK_INTERVAL) {
        game.heroTimer -= HERO_ATK_INTERVAL
        heroHit()
      }
      if (game.monHp <= 0) return win()
      if (game.monTimer >= MON_ATK_INTERVAL) {
        game.monTimer -= MON_ATK_INTERVAL
        const dmg = damageTaken(game.monster.atk, st.def) * rand(0.9, 1.1)
        game.heroHp -= dmg
        game.heroFlash = 0.09
        game.monLunge = 0.16
        pushFx({ kind: 'hurt', text: fmtShort(dmg), side: 'hero' })
      }
      if (game.heroHp <= 0) return lose()
      break
    }
    case 'win':
      if (game.phaseT >= WIN_SEC) startStage()
      break
    case 'lose':
      if (game.phaseT >= LOSE_SEC) startStage()
      break
  }
}

function win() {
  const st = game.stats!
  const gold = game.monster.gold * st.goldMult
  pushFx({ kind: 'gold', text: `+${fmtShort(gold)}`, side: 'mon' })
  if (game.monster.boss) haptic([12, 40, 12])
  useStore.getState().rpgWin(gold)
  game.monHp = 0
  enter('win')
}

function lose() {
  game.heroHp = 0
  haptic(30)
  useStore.getState().rpgLose()
  enter('lose')
}

// 화면 탭 = 추가 공격(공격력 35%), 연타 제한
export function tapAttack(): boolean {
  if (game.phase !== 'fight' || game.tapCd > 0 || !game.stats) return false
  game.tapCd = TAP_COOLDOWN
  heroHit(0.35, 'tap')
  haptic(4)
  if (game.monHp <= 0) win()
  return true
}

// 보스 재도전 등 외부에서 스테이지가 바뀌면 즉시 새 전투
export function restartStage() {
  startStage()
}

let timer: number | null = null
let last = 0
export function startGame() {
  if (timer != null) return
  startStage()
  last = performance.now()
  timer = window.setInterval(() => {
    const now = performance.now()
    let dt = (now - last) / 1000
    last = now
    if (document.hidden) return // 백그라운드는 방치 보상으로 정산
    if (dt > 0.5) dt = 0.05 // 오랜 정지(스로틀) 후 순간이동 방지
    step(dt)
  }, 50)
}

// 자리를 비운 동안의 보상(최대 8시간, 효율 50%) — 스테이지는 진행하지 않고 이길 수 있는 스테이지에서 파밍
export function computeOffline(now = Date.now()): { sec: number; kills: number; gold: number; stage: number } | null {
  const s = useStore.getState()
  const r = s.rpg
  if (!r.lastSeen) return null
  const sec = Math.min(OFFLINE_CAP_SEC, Math.max(0, (now - r.lastSeen) / 1000))
  if (sec < 60) return null
  const h = currentStats()
  let stage = r.stage
  let pf = predictFight(h, monsterAt(stage))
  while (!pf.win && stage > 1) {
    stage--
    pf = predictFight(h, monsterAt(stage))
  }
  const cycle = pf.killTime + WALK_SEC + WIN_SEC
  const kills = Math.floor((sec * OFFLINE_EFFICIENCY) / cycle)
  if (kills <= 0) return null
  const gold = kills * monsterAt(stage).gold * h.goldMult
  return { sec, kills, gold, stage }
}

// 짧은 숫자: 1,234 / 1.2만 / 3.4억
export function fmtShort(n: number): string {
  const v = Math.max(0, n)
  if (v < 10_000) return Math.round(v).toLocaleString('ko-KR')
  const units = ['만', '억', '조', '경', '해', '자', '양', '구', '간']
  let u = -1
  let x = v
  while (x >= 10_000 && u < units.length - 1) {
    x /= 10_000
    u++
  }
  return `${x >= 100 ? Math.floor(x) : x.toFixed(1).replace(/\.0$/, '')}${units[u]}`
}
