import { useState } from 'react'
import { useStore } from '../store'
import { questById } from '../data/quests'
import { PITY_PULLS, RELIC_COST, RELIC_COST_10, RELICS } from '../data/relics'
import { nextRank, rankInfo } from '../data/ranks'
import { todayYmd } from '../lib/calc'
import { confetti, haptic, toast } from '../lib/juice'
import { nav } from '../nav'
import { TabScreen } from '../ui/TabScreen'
import { Card, CardHead, CountUp, MenuRow, Progress } from '../ui/kit'
import { Emoji } from '../ui/Emoji'
import { Check, ChevronRight, CircleHelp } from '../ui/icons'
import { OddsSheet, RankSheet } from '../sheets/InfoSheets'

const reward = (streak: number) => 50 + Math.min(streak, 7) * 20

export function Lounge() {
  const gold = useStore((s) => s.gold)
  return (
    <TabScreen
      id="lounge"
      header={
        <>
          <div className="tab-title">라운지</div>
          <div className="gold-pill" aria-label={`보유 골드 ${gold}`}>
            <Emoji e="🪙" size={20} />
            <span className="num">
              <CountUp value={gold} />
            </span>
          </div>
        </>
      }
    >
      <p className="tab-lead">출석하고 공모주를 살펴보며 등급을 올려 보세요</p>
      <RankCard />
      <CheckIn />
      <Quests />
      <CardDraw />
    </TabScreen>
  )
}

// ───────── 투자자 등급 ─────────
function RankCard() {
  const level = useStore((s) => s.level)
  const xp = useStore((s) => s.xp)
  const { rank, index, rankLevel, isMaxRank } = rankInfo(level)
  const next = nextRank(level)
  const [open, setOpen] = useState(false)
  const xpIn = xp % 100
  return (
    <Card className="rank-card">
      <button className="rank-main" onClick={() => setOpen(true)}>
        <span className="rank-emblem">
          <Emoji e={rank.emoji} size={56} />
        </span>
        <span className="rank-txt">
          <span className="t3 fs13">나의 투자자 등급</span>
          <span className="rank-name">
            {rank.name} <span className="t-brand">Lv.{rankLevel}</span>
          </span>
        </span>
        <ChevronRight className="t4" size={20} />
      </button>
      <div className="rank-xp">
        <Progress value={xpIn} max={100} height={10} />
        <div className="rank-xp-row">
          <span className="t3 fs13 num">경험치 {xpIn} / 100</span>
          <span className="t3 fs13">{isMaxRank ? '최고 등급이에요' : next ? `Lv.10 달성 시 ${next.name} 승급` : ''}</span>
        </div>
      </div>
      {open && <RankSheet index={index} onClose={() => setOpen(false)} />}
    </Card>
  )
}

// ───────── 출석 체크 ─────────
function CheckIn() {
  const lastRewardClaim = useStore((s) => s.lastRewardClaim)
  const streak = useStore((s) => s.streak)
  const claim = useStore((s) => s.claimDailyReward)
  const claimed = lastRewardClaim === todayYmd()
  const r = reward(streak)
  // 7일 주기 진행 표시 (스트릭 1~7 → 해당 칸, 8일째부터 다시 1칸부터 최대 보상 유지)
  const pos = ((streak - 1) % 7) + 1

  return (
    <Card>
      <CardHead
        title={
          <>
            출석 체크 <span className="streak-badge">{streak}일 연속</span>
          </>
        }
        sub={claimed ? '오늘 보상을 받았어요. 내일 또 만나요!' : '매일 들러서 보상을 받아 가세요'}
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
            toast(`출석 보상 ${r}골드를 받았어요`, '🎁')
          }}
        >
          {claimed ? '오늘 출석 완료' : `${r}골드 받기`}
        </button>
      </div>
    </Card>
  )
}

// ───────── 오늘의 퀘스트 ─────────
const QUEST_EMOJI: Record<string, string> = { checkin: '📅', view: '🔍', pull: '🃏' }

function Quests() {
  const quests = useStore((s) => s.quests)
  const claimQuest = useStore((s) => s.claimQuest)
  if (!quests.items.length) return null
  const doneCount = quests.items.filter((q) => q.claimed).length
  return (
    <Card>
      <CardHead title="오늘의 퀘스트" sub={`${doneCount}/${quests.items.length} 완료 · 매일 자정에 바뀌어요`} />
      <div className="card-list">
        {quests.items.map((q) => {
          const def = questById(q.id)
          if (!def) return null
          const done = q.progress >= def.target
          return (
            <div key={q.id} className={'quest' + (q.claimed ? ' claimed' : '')}>
              <span className="quest-ic">
                <Emoji e={QUEST_EMOJI[def.type] ?? '✨'} size={28} />
              </span>
              <span className="quest-main">
                <span className="quest-label">{def.label}</span>
                <span className="quest-meta">
                  <span className="num">
                    {Math.min(q.progress, def.target)}/{def.target}
                  </span>
                  <span className="dotsep" />
                  {def.gold}골드 · 경험치 {def.xp}
                </span>
              </span>
              <button
                className={'btn btn-sm ' + (q.claimed ? 'btn-ghost' : done ? 'btn-primary' : 'btn-secondary')}
                disabled={!done || q.claimed}
                onClick={() => {
                  claimQuest(q.id)
                  haptic(12)
                  toast(`퀘스트 보상 ${def.gold}골드를 받았어요`, '🎯')
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
  const pull1 = useStore((s) => s.pullRelic)
  const pull10 = useStore((s) => s.pullRelic10)
  const [odds, setOdds] = useState(false)
  const uniq = new Set(owned).size
  const complete = uniq >= RELICS.length

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
        <div className="draw-sub">
          {complete ? '100종을 모두 모았어요. 축하해요!' : `카드 ${RELICS.length}종을 모아 보세요. 정산 보상이 커져요`}
        </div>
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
          disabled={complete || gold < RELIC_COST}
          onClick={() => {
            pull1()
            haptic(12)
          }}
        >
          1회 <span className="sub num">{RELIC_COST}골드</span>
        </button>
        <button
          className="btn btn-primary btn-lg"
          disabled={complete || gold < RELIC_COST_10}
          onClick={() => {
            pull10()
            haptic(12)
          }}
        >
          10회 <span className="sub num">{RELIC_COST_10.toLocaleString()}골드</span>
        </button>
      </div>
      {!complete && gold < RELIC_COST && <p className="draw-hint">출석과 퀘스트로 골드를 모을 수 있어요</p>}

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
export function useLoungeBadge(): boolean {
  const lastRewardClaim = useStore((s) => s.lastRewardClaim)
  const quests = useStore((s) => s.quests)
  if (lastRewardClaim !== todayYmd()) return true
  return quests.items.some((q) => {
    const def = questById(q.id)
    return def && !q.claimed && q.progress >= def.target
  })
}
