// 방치형 RPG 밸런스 공식 — scripts 없이 시뮬레이션으로 튜닝(스테이지 50≈15분, 100≈1시간, 150≈20시간, 200≈수백 시간)
// 원칙: 게임은 시즌 자산을 '읽기만' 한다(배율). 게임 결과는 시즌 자산·모의청약에 절대 영향 없음.
import type { ClassId, Rarity } from '../types'
import { RELICS, aggregateEffects } from '../data/relics'

export type StatKind = 'atk' | 'def' | 'hp'

export const HERO_ATK_INTERVAL = 0.8 // 초
export const MON_ATK_INTERVAL = 1.2
export const BASE_CRIT = 0.05
export const OFFLINE_CAP_SEC = 8 * 3600
export const OFFLINE_EFFICIENCY = 0.5
export const FARM_RETRY_KILLS = 10 // 패배 후 이전 스테이지에서 N마리 처치하면 자동 재도전

export const isBoss = (stage: number) => stage % 10 === 0

// 10레벨마다 ×2 돌파 보너스
const milestone = (lv: number) => 2 ** Math.floor(lv / 10)

export function baseStat(kind: StatKind, lv: number): number {
  if (kind === 'atk') return (6 + 4 * lv) * milestone(lv)
  if (kind === 'def') return 2 * lv * milestone(lv)
  return (90 + 30 * lv) * milestone(lv)
}

const COST_BASE: Record<StatKind, number> = { atk: 12, def: 14, hp: 10 }
export const COST_GROWTH = 1.13
export function upgradeCost(kind: StatKind, lv: number): number {
  return Math.ceil(COST_BASE[kind] * COST_GROWTH ** (lv - 1))
}

// n레벨 일괄 구매 비용(등비수열 합)
export function upgradeCostN(kind: StatKind, lv: number, n: number): number {
  if (n <= 0) return 0
  let sum = 0
  for (let i = 0; i < n; i++) sum += upgradeCost(kind, lv + i)
  return sum
}

// 가진 골드로 살 수 있는 최대 레벨 수 (상한 1000)
export function maxAffordable(kind: StatKind, lv: number, gold: number): number {
  let n = 0
  let sum = 0
  while (n < 1000) {
    const c = upgradeCost(kind, lv + n)
    if (sum + c > gold) break
    sum += c
    n++
  }
  return n
}

export interface Monster {
  stage: number
  kind: string // sprites 키
  boss: boolean
  hp: number
  atk: number
  gold: number
  zone: number
}

export const REGULARS = ['slime', 'bat', 'mushroom', 'goblin', 'skeleton', 'ghost', 'bear', 'golem', 'witch'] as const

export function monsterAt(stage: number): Monster {
  const boss = isBoss(stage)
  const g = stage - 1
  return {
    stage,
    boss,
    kind: boss ? 'dragon' : REGULARS[((stage - 1) % 10) % REGULARS.length],
    hp: Math.round(40 * 1.12 ** g * (boss ? 4 : 1)),
    atk: 6 * 1.11 ** g * (boss ? 1.4 : 1),
    gold: Math.round(4 * 1.12 ** g * (boss ? 8 : 1)),
    zone: Math.floor(g / 10),
  }
}

// 지역(10스테이지 단위) — 배경·몬스터 색 변주
export const ZONES = [
  { name: '새싹 초원', sky: ['#9fdcff', '#e6f7ff'], hill: '#7ccf8a', ground: '#5fae5a', dirt: '#8a6a3c', hue: 0 },
  { name: '그늘 숲', sky: ['#7fc6b8', '#d6f2e8'], hill: '#3f8f63', ground: '#3d7a45', dirt: '#6b4f2c', hue: 40 },
  { name: '노을 사막', sky: ['#ffb072', '#ffe2b8'], hill: '#e7b46a', ground: '#d99a4e', dirt: '#a8713a', hue: 300 },
  { name: '얼음 설원', sky: ['#a9c8ff', '#eef4ff'], hill: '#d5e4f5', ground: '#c3d6ee', dirt: '#8aa1bf', hue: 180 },
  { name: '깊은 동굴', sky: ['#3a3552', '#6b6390'], hill: '#4b4568', ground: '#5a5470', dirt: '#3a354d', hue: 90 },
  { name: '화산 지대', sky: ['#5a2230', '#c4573f'], hill: '#7a2f2f', ground: '#5c2a2a', dirt: '#3d1b1b', hue: 220 },
  { name: '별빛 하늘', sky: ['#141a3d', '#3b3f8a'], hill: '#262d63', ground: '#2f3570', dirt: '#1e2350', hue: 140 },
]
export const zoneOf = (stage: number) => ZONES[Math.floor((stage - 1) / 10) % ZONES.length]

// ── 배율 ──
// 시즌 자산 배율: √(총 자산 ÷ 1,000만원), 0.5–3배
export function seasonMult(totalAsset: number): number {
  return Math.min(3, Math.max(0.5, Math.sqrt(Math.max(0, totalAsset) / 10_000_000)))
}

// 카드 도감 보너스: 보유 카드 등급별 전체 스탯 +1/2/4/8%
export const RARITY_STAT_PCT: Record<Rarity, number> = { common: 1, rare: 2, epic: 4, legendary: 8 }
export function collectionPct(owned: string[]): number {
  let pct = 0
  for (const id of new Set(owned)) {
    const r = RELICS.find((x) => x.id === id)
    if (r) pct += RARITY_STAT_PCT[r.rarity]
  }
  return pct
}

export const CLASS_PASSIVE: Record<ClassId, string> = {
  farmer: '전투 골드 +20%',
  hunter: '치명타 확률 +15%p · 치명타 피해 2.5배',
  value: '방어력·체력 +20%',
}

export interface HeroStats {
  atk: number
  def: number
  hp: number
  crit: number
  critMul: number
  goldMult: number
  power: number // 전투력(표시용)
  season: number
  collection: number // %
}

export function heroStats(p: { lv: Record<StatKind, number>; totalAsset: number; owned: string[]; cls: ClassId | null }): HeroStats {
  const season = seasonMult(p.totalAsset)
  const collection = collectionPct(p.owned)
  const fx = aggregateEffects(p.owned) // xpMult 카드 → 공격력 보너스, goldMult 카드 → 골드 보너스
  const common = season * (1 + collection / 100)
  const tough = p.cls === 'value' ? 1.2 : 1
  const atk = baseStat('atk', p.lv.atk) * common * fx.xpMult
  const def = baseStat('def', p.lv.def) * common * tough
  const hp = baseStat('hp', p.lv.hp) * common * tough
  const crit = BASE_CRIT + (p.cls === 'hunter' ? 0.15 : 0)
  const critMul = p.cls === 'hunter' ? 2.5 : 2
  const goldMult = fx.goldMult * (p.cls === 'farmer' ? 1.2 : 1)
  const power = Math.round(atk * 4 + def * 6 + hp * 0.6)
  return { atk, def, hp, crit, critMul, goldMult, power, season, collection }
}

// 몬스터 → 영웅 피해 (방어력은 감소율 공식: 무적 방지)
export function damageTaken(monAtk: number, def: number): number {
  return (monAtk * monAtk) / (monAtk + def)
}

// 결정론적 전투 예측(방치 보상·자동 진행 판단용): 이기는지, 처치 소요 시간
export function predictFight(h: HeroStats, m: Monster): { win: boolean; killTime: number } {
  const avgHit = h.atk * (1 + h.crit * (h.critMul - 1))
  const hits = Math.ceil(m.hp / avgHit)
  const killTime = hits * HERO_ATK_INTERVAL
  const taken = damageTaken(m.atk, h.def)
  const surviveTime = Math.ceil(h.hp / taken) * MON_ATK_INTERVAL
  return { win: killTime < surviveTime, killTime }
}

// 보상 스케일: 최고 스테이지에 맞춰 출석·퀘스트·정산·카드 비용이 함께 커짐 (스테이지 1 = ×1)
export function rewardScale(bestCleared: number): number {
  return 1.12 ** Math.max(0, bestCleared - 1)
}

// 큰 수 한국식 표기: 9,999 → 1.2만 → 3.4억 → 5.6조 …
const UNITS = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정', '재', '극']
export function fmtBig(n: number): string {
  if (!isFinite(n)) return '∞'
  const v = Math.floor(Math.max(0, n))
  if (v < 10_000) return v.toLocaleString('ko-KR')
  let u = 0
  let x = v
  while (x >= 10_000 && u < UNITS.length - 1) {
    x /= 10_000
    u++
  }
  return `${x >= 100 ? Math.floor(x) : x.toFixed(x >= 10 ? 1 : 2).replace(/\.?0+$/, '')}${UNITS[u]}`
}
