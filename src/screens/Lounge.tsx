import { useEffect, useRef, useState } from 'react'
import { useStore, checkinReward } from '../store'
import { questById } from '../data/quests'
import { PITY_PULLS, RELICS, relicCost, relicCost10 } from '../data/relics'
import { rankInfo } from '../data/ranks'
import { CLASSES } from '../data/classes'
import { confetti, haptic, toast } from '../lib/juice'
import { nav } from '../nav'
import { TabScreen } from '../ui/TabScreen'
import { Card, CardHead, Col, Cols, MenuRow, Progress, Segmented, Switch } from '../ui/kit'
import { Emoji } from '../ui/Emoji'
import { Check, ChevronRight, CircleHelp } from '../ui/icons'
import { OddsSheet, RankSheet } from '../sheets/InfoSheets'
import { BattleHelpSheet, IntroSheet } from '../sheets/GameSheets'
import { Battle } from '../game/Battle'
import { restartStage, useHeroStats } from '../game/engine'
import {
  FARM_RETRY_KILLS,
  type StatKind,
  baseStat,
  fmtBig,
  isBoss,
  maxAffordable,
  monsterAt,
  rewardScale,
  upgradeCostN,
  zoneOf,
} from '../game/balance'

export function Lounge({ today, active }: { today: string; active: boolean }) {
  const gold = useStore((s) => s.gold)
  const intro = useStore((s) => s.rpg.intro)
  return (
    <TabScreen
      id="lounge"
      header={
        <>
          <div className="tab-title">라운지</div>
          <div className="gold-pill" aria-label={`보유 골드 ${fmtBig(gold)}`}>
            <Emoji e="🪙" size={20} />
            <span className="num">{fmtBig(gold)}</span>
          </div>
        </>
      }
    >
      <Cols>
        <Col>
          <BattleCard active={active} />
          <Upgrades />
        </Col>
        <Col>
          <Bonuses />
          <RankCard />
          <CheckIn today={today} />
          <Quests />
          <CardDraw />
        </Col>
      </Cols>
      {intro && active && <IntroSheet />}
    </TabScreen>
  )
}

// ───────── 전투 ─────────
function BattleCard({ active }: { active: boolean }) {
  const rpg = useStore((s) => s.rpg)
  const challenge = useStore((s) => s.rpgChallenge)
  const setAuto = useStore((s) => s.rpgSetAuto)
  // 전투력은 능력치·배율 변화에 따라 — 스토어 변경 시 재계산
  const power = useHeroStats().power
  const zone = zoneOf(rpg.stage)
  const [help, setHelp] = useState(false)

  return (
    <Card className="battle-card">
      <div className="battle-head">
        <div>
          <div className="battle-stage num">
            STAGE {rpg.stage}
            {isBoss(rpg.stage) && <span className="boss-tag">BOSS</span>}
          </div>
          <div className="battle-zone">
            {zone.name} · 최고 {rpg.best}
          </div>
        </div>
        <div className="battle-power">
          <span className="t3 fs12">전투력</span>
          <b className="num">{fmtBig(power)}</b>
        </div>
      </div>
      <Battle active={active} />
      <div className="battle-foot">
        {rpg.farming ? (
          <>
            <span className="farm-chip">
              <Emoji e="⛏️" size={18} />
              골드 모으는 중{rpg.auto ? ` · ${rpg.farmCount}/${FARM_RETRY_KILLS}마리 잡으면 재도전` : ''}
            </span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                challenge()
                restartStage()
                haptic(10)
              }}
            >
              {isBoss(rpg.best + 1) ? '보스 재도전' : '다시 도전'}
            </button>
          </>
        ) : (
          <span className="t3 fs13">탭하면 한 번 더 공격해요</span>
        )}
        <span className="auto-row">
          <span className="fs13 t2">자동 재도전</span>
          <Switch checked={rpg.auto} onChange={setAuto} label="자동 재도전" />
        </span>
        <button className="help-btn" onClick={() => setHelp(true)} aria-label="전투 도움말">
          <CircleHelp size={18} strokeWidth={2.2} />
        </button>
      </div>
      {help && <BattleHelpSheet onClose={() => setHelp(false)} />}
    </Card>
  )
}

// ───────── 능력치 강화 ─────────
const STAT_META: Record<StatKind, { label: string; emoji: string; unit: string }> = {
  atk: { label: '공격력', emoji: '⚔️', unit: '' },
  def: { label: '방어력', emoji: '🛡️', unit: '' },
  hp: { label: '체력', emoji: '❤️', unit: '' },
}
type Amount = '1' | '10' | 'max'

function Upgrades() {
  const [amount, setAmount] = useState<Amount>('1')
  return (
    <Card>
      <div className="card-head">
        <div className="card-head-txt">
          <h2 className="card-title">능력치 강화</h2>
          <div className="card-sub">10레벨마다 능력치가 2배가 돼요. 길게 누르면 계속 강화해요</div>
        </div>
      </div>
      <div className="amount-seg">
        <Segmented<Amount>
          size="sm"
          value={amount}
          onChange={setAmount}
          options={[
            { value: '1', label: '×1' },
            { value: '10', label: '×10' },
            { value: 'max', label: '최대' },
          ]}
        />
      </div>
      <div className="card-list">
        {(['atk', 'def', 'hp'] as StatKind[]).map((k) => (
          <UpgradeRow key={k} kind={k} amount={amount} />
        ))}
      </div>
    </Card>
  )
}

function UpgradeRow({ kind, amount }: { kind: StatKind; amount: Amount }) {
  const lv = useStore((s) => s.rpg.lv[kind])
  const gold = useStore((s) => s.gold)
  const upgrade = useStore((s) => s.rpgUpgrade)
  const stats = useHeroStats()
  const n = amount === 'max' ? Math.max(1, maxAffordable(kind, lv, gold)) : Number(amount)
  const cost = upgradeCostN(kind, lv, n)
  const can = gold >= cost
  // 표시값: 배율 적용 실제 능력치 → n레벨 후
  const mult = (stats[kind] || 1) / baseStat(kind, lv)
  const now = stats[kind]
  const next = baseStat(kind, lv + n) * mult
  const milestone = Math.floor((lv + n) / 10) > Math.floor(lv / 10)
  const m = STAT_META[kind]

  const buy = () => {
    const s = useStore.getState()
    const nn = amount === 'max' ? Math.max(1, maxAffordable(kind, s.rpg.lv[kind], s.gold)) : Number(amount)
    const ok = upgrade(kind, nn)
    if (ok) {
      haptic(6)
      if (Math.floor((s.rpg.lv[kind] + nn) / 10) > Math.floor(s.rpg.lv[kind] / 10)) {
        haptic([10, 30, 10])
        toast(`${m.label}이 2배가 됐어요`, '✨')
      }
    }
    return ok
  }
  const hold = useHold(buy)

  return (
    <div className="upg">
      <span className="upg-ic">
        <Emoji e={m.emoji} size={30} />
      </span>
      <span className="upg-main">
        <span className="upg-name">
          {m.label} <span className="t3 num">Lv.{lv}</span>
        </span>
        <span className="upg-val num">
          {fmtBig(now)} <span className="t4">→</span> <b className={milestone ? 't-brand' : 't-green'}>{fmtBig(next)}</b>
          {milestone && <span className="pill tone-brand sm upg-x2">×2 돌파</span>}
        </span>
      </span>
      <button
        className={'upg-btn' + (can ? '' : ' off')}
        disabled={!can}
        {...hold}
        aria-label={`${m.label} ${n}레벨 강화, ${fmtBig(cost)}골드`}
      >
        <span className="upg-n">+{n}</span>
        <span className="upg-cost num">
          <Emoji e="🪙" size={14} />
          {fmtBig(cost)}
        </span>
      </button>
    </div>
  )
}

// 길게 누르면 연속 실행 (400ms 후 90ms 간격, 실패하면 멈춤)
function useHold(fn: () => boolean) {
  const t = useRef<number | null>(null)
  const iv = useRef<number | null>(null)
  const fired = useRef(false)
  const stop = () => {
    if (t.current) clearTimeout(t.current)
    if (iv.current) clearInterval(iv.current)
    t.current = iv.current = null
  }
  useEffect(() => stop, [])
  return {
    onPointerDown: () => {
      fired.current = false
      stop()
      t.current = window.setTimeout(() => {
        fired.current = true
        if (!fn()) return // 길게 누른 순간 1회 구매 후 연속 구매 시작
        iv.current = window.setInterval(() => {
          if (!fn()) stop()
        }, 90)
      }, 400)
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: () => {
      if (!fired.current) fn()
      fired.current = false
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}

// ───────── 전투 보너스 ─────────
function Bonuses() {
  const stats = useHeroStats()
  const cls = useStore((s) => CLASSES.find((c) => c.id === s.chosenClass) ?? CLASSES[0])
  const owned = useStore((s) => new Set(s.ownedRelics).size)
  const [help, setHelp] = useState(false)
  return (
    <Card pad={false}>
      <CardHead
        title="전투 보너스"
        right={
          <button className="help-btn" onClick={() => setHelp(true)} aria-label="보너스 설명">
            <CircleHelp size={18} strokeWidth={2.2} />
          </button>
        }
      />
      <div className="bonus-list">
        <div className="bonus">
          <Emoji e="💰" size={26} />
          <span className="bonus-txt">
            <span className="fw6">시즌 자산 배율</span>
            <span className="t3 fs13">시즌 자산이 많을수록 모든 능력치가 올라가요</span>
          </span>
          <b className="num t-brand">×{stats.season.toFixed(2)}</b>
        </div>
        <div className="bonus">
          <Emoji e="🗂️" size={26} />
          <span className="bonus-txt">
            <span className="fw6">카드 도감</span>
            <span className="t3 fs13">
              {owned}/{RELICS.length}장 모음
            </span>
          </span>
          <b className="num t-brand">+{stats.collection}%</b>
        </div>
        <div className="bonus">
          <Emoji e={cls.emoji} size={26} />
          <span className="bonus-txt">
            <span className="fw6">투자 성향 · {cls.name}</span>
            <span className="t3 fs13">{cls.passive}</span>
          </span>
        </div>
      </div>
      {help && <BattleHelpSheet onClose={() => setHelp(false)} />}
    </Card>
  )
}

// ───────── 투자자 등급 (최고 스테이지) ─────────
function RankCard() {
  const best = useStore((s) => s.rpg.best)
  const { rank, index, next, progress, isMaxRank } = rankInfo(best)
  const [open, setOpen] = useState(false)
  return (
    <Card className="rank-card">
      <button className="rank-main" onClick={() => setOpen(true)}>
        <span className="rank-emblem">
          <Emoji e={rank.emoji} size={52} />
        </span>
        <span className="rank-txt">
          <span className="t3 fs13">나의 투자자 등급</span>
          <span className="rank-name">{rank.name}</span>
        </span>
        <ChevronRight className="t4" size={20} />
      </button>
      <div className="rank-xp">
        <Progress value={progress * 100} max={100} height={10} />
        <div className="rank-xp-row">
          <span className="t3 fs13 num">최고 스테이지 {best}</span>
          <span className="t3 fs13">{isMaxRank ? '최고 등급이에요' : next ? `스테이지 ${next.minStage}부터 ${next.name}` : ''}</span>
        </div>
      </div>
      {open && <RankSheet index={index} onClose={() => setOpen(false)} />}
    </Card>
  )
}

// ───────── 출석 체크 ─────────
function CheckIn({ today }: { today: string }) {
  const lastRewardClaim = useStore((s) => s.lastRewardClaim)
  const streak = useStore((s) => s.streak)
  const best = useStore((s) => s.rpg.best)
  const claim = useStore((s) => s.claimDailyReward)
  const claimed = lastRewardClaim === today
  const r = checkinReward(streak, best)
  const pos = ((streak - 1) % 7) + 1

  return (
    <Card>
      <CardHead
        title={
          <>
            출석 체크 <span className="streak-badge">{streak}일 연속</span>
          </>
        }
        sub={claimed ? '오늘 보상을 받았어요' : '최고 스테이지가 높을수록 보상이 커져요'}
      />
      <div className="week-strip">
        {Array.from({ length: 7 }, (_, i) => {
          const day = i + 1
          const done = day < pos || (day === pos && claimed)
          const isToday = day === pos && !claimed
          return (
            <div key={i} className={'wk' + (done ? ' done' : '') + (isToday ? ' now' : '')}>
              <span className="wk-coin">{done ? <Check size={16} strokeWidth={3} /> : <Emoji e="🪙" size={22} />}</span>
              <span className="wk-lbl num">{isToday ? '오늘' : `${day}일`}</span>
            </div>
          )
        })}
      </div>
      <div className="card-pad-x">
        <button
          className="btn btn-primary btn-lg btn-block"
          disabled={claimed}
          onClick={() => {
            claim()
            haptic([10, 30, 10])
            confetti(['#ffb31a', '#ffd666', '#5b4cf0'])
            toast(`출석 보상 ${fmtBig(r)}골드를 받았어요`, '🎁')
          }}
        >
          {claimed ? '오늘 출석 완료' : `${fmtBig(r)}골드 받기`}
        </button>
      </div>
    </Card>
  )
}

// ───────── 오늘의 퀘스트 ─────────
const QUEST_EMOJI: Record<string, string> = { checkin: '📅', view: '🔍', pull: '🃏', kill: '⚔️', stage: '🚩', upgrade: '🔨' }

function Quests() {
  const quests = useStore((s) => s.quests)
  const best = useStore((s) => s.rpg.best)
  const claimQuest = useStore((s) => s.claimQuest)
  if (!quests.items.length) return null
  const doneCount = quests.items.filter((q) => q.claimed).length
  const scale = rewardScale(best)
  return (
    <Card>
      <CardHead title="오늘의 퀘스트" sub={`${doneCount}/${quests.items.length} 완료 · 자정에 새로 바뀌어요`} />
      <div className="card-list">
        {quests.items.map((q) => {
          const def = questById(q.id)
          if (!def) return null
          const done = q.progress >= def.target
          const g = Math.round(def.gold * scale)
          return (
            <div key={q.id} className={'quest' + (q.claimed ? ' claimed' : '')}>
              <span className="quest-ic">
                <Emoji e={QUEST_EMOJI[def.type] ?? '✨'} size={28} />
              </span>
              <span className="quest-main">
                <span className="quest-label">{def.label}</span>
                <span className="quest-prog">
                  <Progress value={Math.min(q.progress, def.target)} max={def.target} height={5} tone={done ? 'green' : 'brand'} />
                  <span className="quest-meta num">
                    {Math.min(q.progress, def.target)}/{def.target} · {fmtBig(g)}골드
                  </span>
                </span>
              </span>
              <button
                className={'btn btn-sm ' + (q.claimed ? 'btn-ghost' : done ? 'btn-primary' : 'btn-secondary')}
                disabled={!done || q.claimed}
                onClick={() => {
                  claimQuest(q.id)
                  haptic(12)
                  toast(`퀘스트 보상 ${fmtBig(g)}골드를 받았어요`, '🎯')
                }}
              >
                {q.claimed ? '완료' : done ? '받기' : '진행 중'}
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ───────── 투자 카드 뽑기 ─────────
function CardDraw() {
  const gold = useStore((s) => s.gold)
  const owned = useStore((s) => s.ownedRelics)
  const pity = useStore((s) => s.pullsSinceEpic)
  const best = useStore((s) => s.rpg.best)
  const pull1 = useStore((s) => s.pullRelic)
  const pull10 = useStore((s) => s.pullRelic10)
  const [odds, setOdds] = useState(false)
  const uniq = new Set(owned).size
  const complete = uniq >= RELICS.length
  const c1 = relicCost(best)
  const c10 = relicCost10(best)

  return (
    <Card className="draw-card">
      <div className="draw-hero">
        <div className="draw-art" aria-hidden>
          <span className="draw-c c1">
            <Emoji e="💎" size={40} />
          </span>
          <span className="draw-c c2">
            <Emoji e="🃏" size={48} />
          </span>
          <span className="draw-c c3">
            <Emoji e="👑" size={40} />
          </span>
        </div>
        <div className="draw-title">투자 카드 뽑기</div>
        <div className="draw-sub">{complete ? '카드 100종을 모두 모았어요' : '모은 카드만큼 전체 능력치가 올라가요'}</div>
      </div>

      {!complete && (
        <div className="pity">
          <div className="pity-row">
            <span className="fs13 t2">새 카드 확정까지</span>
            <span className="fs13 fw6 num">{PITY_PULLS - pity}회 남음</span>
          </div>
          <Progress value={pity} max={PITY_PULLS} height={6} tone="orange" />
        </div>
      )}

      <div className="draw-btns">
        <button
          className="btn btn-weak btn-lg"
          disabled={complete || gold < c1}
          onClick={() => {
            pull1()
            haptic(12)
          }}
        >
          1회 <span className="sub num">{fmtBig(c1)}골드</span>
        </button>
        <button
          className="btn btn-primary btn-lg"
          disabled={complete || gold < c10}
          onClick={() => {
            pull10()
            haptic(12)
          }}
        >
          10회 <span className="sub num">{fmtBig(c10)}골드</span>
        </button>
      </div>
      {!complete && (
        <p className="draw-hint">
          {gold < c1 ? '골드가 부족해요. ' : ''}몬스터 약 {Math.max(1, Math.round(c1 / Math.max(1, monsterAt(Math.max(1, best)).gold)))}
          마리를 잡으면 1회 뽑을 수 있어요
        </p>
      )}

      <div className="hr" />
      <MenuRow
        icon={<Emoji e="🗂️" size={24} />}
        label="투자 카드 도감"
        value={
          <span className="num">
            {uniq}/{RELICS.length}
          </span>
        }
        onClick={() => nav.push({ k: 'cardDex' })}
      />
      <MenuRow icon={<CircleHelp size={22} strokeWidth={2} />} label="확률 정보" onClick={() => setOdds(true)} />
      {odds && <OddsSheet onClose={() => setOdds(false)} />}
    </Card>
  )
}

// 라운지 탭 배지: 받을 출석 보상이나 완료된 퀘스트가 있으면 표시
export function useLoungeBadge(today: string): boolean {
  const lastRewardClaim = useStore((s) => s.lastRewardClaim)
  const quests = useStore((s) => s.quests)
  if (lastRewardClaim !== today) return true
  return quests.items.some((q) => {
    const def = questById(q.id)
    return def && !q.claimed && q.progress >= def.target
  })
}
