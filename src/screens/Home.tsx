import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useDataStatus, useDataTimestamp, useIpos } from '../data/loadIpos'
import type { Ipo, Stage } from '../types'
import { useStore } from '../store'
import { computeStage, daysUntil } from '../lib/calc'
import { fmtLongDate, isSpac, notSpac, relTime } from '../lib/format'
import { useNow } from '../lib/useToday'
import { usePullToRefresh } from '../lib/usePullToRefresh'
import { manualRefresh } from '../lib/refresh'
import { nav, openIpo } from '../nav'
import { TabScreen } from '../ui/TabScreen'
import { Card, CardHead, ChipTabs, Empty, MenuRow } from '../ui/kit'
import { Emoji } from '../ui/Emoji'
import { BrandMark, ChevronDown, RefreshCw, Search, WifiOff } from '../ui/icons'
import { IpoRow } from '../components/IpoRow'
import { GradeSheet } from '../sheets/InfoSheets'

type Sched = 'subscription' | 'upcoming' | 'pending'

export function Home({ today }: { today: string }) {
  const ALL = useIpos()
  const status = useDataStatus()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const { pull, refreshing, progress } = usePullToRefresh(scrollRef, manualRefresh)
  const [gradeOpen, setGradeOpen] = useState(false)

  const staged = useMemo(() => ALL.map((ipo) => ({ ipo, stage: computeStage(ipo, today) })), [ALL, today])
  const of = (st: Stage) => staged.filter((x) => x.stage === st).map((x) => x.ipo)
  const lists: Record<Sched, Ipo[]> = {
    subscription: of('subscription').sort(by((i) => i.subscriptionEnd)),
    upcoming: of('upcoming').sort(by((i) => i.subscriptionStart)),
    pending: of('pending')
      .filter((i) => i.listingDate)
      .sort(by((i) => i.listingDate)),
  }

  return (
    <TabScreen
      id="home"
      scrollRef={scrollRef}
      header={
        <>
          <div className="brand-title">
            <BrandMark size={26} />
            공모주 히어로
          </div>
          <button className="icon-btn" aria-label="종목 검색" onClick={() => nav.push({ k: 'search' })}>
            <Search size={24} strokeWidth={2.1} />
          </button>
        </>
      }
    >
      <div className="ptr" style={{ height: pull }} aria-hidden={!refreshing}>
        <span
          className={'ptr-ic' + (refreshing ? ' spin' : '')}
          style={{ opacity: progress, transform: refreshing ? undefined : `rotate(${progress * 270}deg)` }}
        >
          <RefreshCw size={20} strokeWidth={2.4} />
        </span>
      </div>

      {status === 'error' && (
        <button className="offline-bar" onClick={() => manualRefresh()}>
          <WifiOff size={16} strokeWidth={2.2} />
          <span>최신 정보를 불러오지 못했어요. 저장된 정보를 보여드려요</span>
          <b>다시 시도</b>
        </button>
      )}

      <Hero staged={staged} today={today} lists={lists} />
      <TodayCard staged={staged} today={today} />
      <MyBets staged={staged} today={today} />
      <Watchlist staged={staged} today={today} />
      <ScheduleCard lists={lists} today={today} />
      <RecentListings staged={staged} today={today} />

      <Card pad={false}>
        <MenuRow
          icon={<Emoji e="🏅" size={26} />}
          label="수요 등급은 어떻게 정해지나요?"
          sub="S·A·B·C 등급 산정 기준"
          onClick={() => setGradeOpen(true)}
        />
      </Card>

      <footer className="home-foot">
        <p>
          공모주 히어로는 공모주 정보를 모아 보여주는 정보 서비스이며, 투자 자문이나 권유가 아니에요. 모의청약은 가상 머니로만 진행돼요.
        </p>
        <p>정보 출처 · 금융감독원 DART, 한국거래소 KIND 등 공개 자료 (지연·오류가 있을 수 있어요)</p>
      </footer>

      {gradeOpen && <GradeSheet onClose={() => setGradeOpen(false)} />}
    </TabScreen>
  )
}

const by = (f: (i: Ipo) => string | null) => (a: Ipo, b: Ipo) => (f(a) ?? '9999').localeCompare(f(b) ?? '9999')

// ───────── 히어로: 오늘 요약 한 문장 ─────────
function Hero({ staged, today, lists }: { staged: { ipo: Ipo; stage: Stage }[]; today: string; lists: Record<Sched, Ipo[]> }) {
  const updatedAt = useDataTimestamp()
  const now = useNow()
  const [busy, setBusy] = useState(false)
  const pool = staged.filter(({ ipo }) => notSpac(ipo))
  const closes = pool.filter((x) => x.stage === 'subscription' && x.ipo.subscriptionEnd === today).length
  const starts = pool.filter((x) => x.stage === 'subscription' && x.ipo.subscriptionStart === today).length
  const listsToday = pool.filter((x) => x.ipo.listingDate === today).length

  let headline: ReactNode
  const parts: ReactNode[] = []
  if (closes)
    parts.push(
      <span key="c">
        청약 마감 <em>{closes}건</em>
      </span>
    )
  if (starts)
    parts.push(
      <span key="s">
        청약 시작 <em>{starts}건</em>
      </span>
    )
  if (listsToday)
    parts.push(
      <span key="l">
        상장 <em>{listsToday}건</em>
      </span>
    )

  if (parts.length) {
    headline = (
      <>
        오늘{' '}
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 ? ', ' : ''}
          </span>
        ))}
        이<br />
        있어요
      </>
    )
  } else {
    const ongoing = lists.subscription.filter(notSpac).length
    const next = nextEvent(pool, today)
    if (ongoing) {
      headline = (
        <>
          지금 청약할 수 있는
          <br />
          공모주가 <em>{ongoing}개</em> 있어요
        </>
      )
    } else if (next) {
      headline = (
        <>
          {next.d === 1 ? '내일' : `${next.d}일 뒤`} <em>{next.ipo.name}</em>
          <br />
          {next.label} 예정이에요
        </>
      )
    } else {
      headline = (
        <>
          아직 예정된
          <br />
          공모주 일정이 없어요
        </>
      )
    }
  }

  return (
    <div className="home-hero">
      <div className="hero-date">{fmtLongDate(today)}</div>
      <h1 className="hero-headline">{headline}</h1>
      <button
        className="fresh"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await manualRefresh()
          setBusy(false)
        }}
        aria-label="정보 새로고침"
      >
        <span>{updatedAt ? `${relTime(updatedAt, now)} 업데이트` : '업데이트 정보 없음'}</span>
        <RefreshCw size={13} strokeWidth={2.4} className={busy ? 'spin' : undefined} />
      </button>
    </div>
  )
}

function nextEvent(pool: { ipo: Ipo; stage: Stage }[], today: string): { d: number; label: string; ipo: Ipo } | null {
  let next: { d: number; label: string; ipo: Ipo } | null = null
  for (const { ipo, stage } of pool) {
    const cand =
      stage === 'upcoming'
        ? { date: ipo.subscriptionStart, label: '청약 시작' }
        : stage === 'subscription'
        ? { date: ipo.subscriptionEnd, label: '청약 마감' }
        : stage === 'pending'
        ? { date: ipo.listingDate, label: '상장' }
        : null
    if (!cand) continue
    const d = daysUntil(cand.date, today)
    if (d != null && d > 0 && (next == null || d < next.d)) next = { d, label: cand.label, ipo }
  }
  return next
}

// ───────── 오늘 일정 카드 ─────────
function TodayCard({ staged, today }: { staged: { ipo: Ipo; stage: Stage }[]; today: string }) {
  const rows: { ipo: Ipo; stage: Stage; label: string; tone: string }[] = []
  for (const { ipo, stage } of staged) {
    if (isSpac(ipo)) continue
    if (stage === 'subscription' && ipo.subscriptionEnd === today) rows.push({ ipo, stage, label: '청약 마감', tone: 'up' })
    else if (stage === 'subscription' && ipo.subscriptionStart === today) rows.push({ ipo, stage, label: '청약 시작', tone: 'brand' })
    if (ipo.listingDate === today) rows.push({ ipo, stage, label: '상장', tone: 'green' })
  }
  if (!rows.length) return null
  return (
    <Card>
      <CardHead title="오늘 일정" sub="놓치지 않게 챙겨 드릴게요" />
      <div className="card-list">
        {rows.map((r) => (
          <IpoRow
            key={r.ipo.id + r.label}
            ipo={r.ipo}
            stage={r.stage}
            today={today}
            right={{ top: <span className={`pill tone-${r.tone}`}>{r.label}</span> }}
          />
        ))}
      </div>
    </Card>
  )
}

// ───────── 내 모의청약 (정산 전) ─────────
function MyBets({ staged, today }: { staged: { ipo: Ipo; stage: Stage }[]; today: string }) {
  const subscriptions = useStore((s) => s.subscriptions)
  const predictions = useStore((s) => s.predictions)
  const settledIds = useStore((s) => s.settledIds)
  const mine = staged.filter(({ ipo }) => (subscriptions[ipo.id] != null || predictions[ipo.id] != null) && !settledIds.includes(ipo.id))
  if (!mine.length) return null
  const ready = mine.filter(({ ipo }) => ipo.listingReturn != null && !!ipo.listingDate && today > ipo.listingDate).length

  return (
    <Card>
      <CardHead
        title={<>내 모의청약 {ready > 0 && <span className="pill tone-up sm head-pill">정산 {ready}건</span>}</>}
        sub="상장 다음 날, 실제 결과로 정산돼요"
        onMore={mine.length > 3 ? () => nav.push({ k: 'myBets' }) : undefined}
      />
      <div className="card-list">
        {mine
          .sort((a, b) => betRank(a.ipo, today) - betRank(b.ipo, today))
          .slice(0, 3)
          .map(({ ipo, stage }) => (
            <IpoRow
              key={ipo.id}
              ipo={ipo}
              stage={stage}
              today={today}
              right={betRight(ipo, today, subscriptions[ipo.id])}
              onClick={() => openIpo(ipo.id, 'sim')}
            />
          ))}
      </div>
    </Card>
  )
}

function betRank(ipo: Ipo, today: string): number {
  if (ipo.listingReturn != null && ipo.listingDate && today > ipo.listingDate) return 0
  if (ipo.listingDate === today) return 1
  return 2
}

export function betRight(ipo: Ipo, today: string, shares: number | undefined): { top: ReactNode; bottom?: ReactNode } {
  const canSettle = ipo.listingReturn != null && !!ipo.listingDate && today > ipo.listingDate
  if (canSettle) return { top: <span className="pill tone-brand">정산하기</span> }
  if (ipo.listingDate === today) return { top: `${shares ?? 0}주`, bottom: <span className="t-green">내일 정산</span> }
  if (ipo.listingDate && today > ipo.listingDate) return { top: `${shares ?? 0}주`, bottom: '결과 집계 중' }
  const d = daysUntil(ipo.listingDate, today)
  return { top: `${shares ?? 0}주`, bottom: d != null && d > 0 ? `상장 D-${d}` : '상장일 미정' }
}

// ───────── 관심 종목 ─────────
function Watchlist({ staged, today }: { staged: { ipo: Ipo; stage: Stage }[]; today: string }) {
  const watchlist = useStore((s) => s.watchlist)
  const [all, setAll] = useState(false)
  const items = watchlist.map((id) => staged.find((x) => x.ipo.id === id)).filter(Boolean) as { ipo: Ipo; stage: Stage }[]
  if (!items.length) return null
  const shown = all ? items : items.slice(0, 4)
  return (
    <Card>
      <CardHead title="관심 종목" sub={`${items.length}개`} />
      <div className={'card-list' + (items.length > 4 ? ' no-pb' : '')}>
        {shown.map(({ ipo, stage }) => (
          <IpoRow key={ipo.id} ipo={ipo} stage={stage} today={today} />
        ))}
      </div>
      {items.length > 4 && (
        <button className="card-foot-btn" onClick={() => setAll((v) => !v)}>
          {all ? '접기' : `${items.length - 4}개 더보기`}
          <ChevronDown size={18} style={{ transform: all ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
        </button>
      )}
    </Card>
  )
}

// ───────── 공모주 일정 (청약 중 · 청약 예정 · 상장 예정) ─────────
function ScheduleCard({ lists, today }: { lists: Record<Sched, Ipo[]>; today: string }) {
  const first: Sched = lists.subscription.length ? 'subscription' : lists.upcoming.length ? 'upcoming' : 'pending'
  const [tab, setTab] = useState<Sched | null>(null)
  const cur = tab ?? first
  const [spacOpen, setSpacOpen] = useState(false)
  const list = lists[cur]
  const main = list.filter(notSpac)
  const spacs = list.filter(isSpac)

  return (
    <Card>
      <CardHead title="공모주 일정" />
      <ChipTabs<Sched>
        value={cur}
        onChange={(v) => {
          setTab(v)
          setSpacOpen(false)
        }}
        options={[
          { value: 'subscription', label: '청약 중', count: lists.subscription.length },
          { value: 'upcoming', label: '청약 예정', count: lists.upcoming.length },
          { value: 'pending', label: '상장 예정', count: lists.pending.length },
        ]}
      />
      <div className={'card-list' + (spacs.length ? ' no-pb' : '')} key={cur}>
        {main.length ? (
          main.map((i) => <IpoRow key={i.id} ipo={i} stage={cur} today={today} />)
        ) : !spacs.length ? (
          <Empty
            emoji={cur === 'subscription' ? '🗓️' : '⏳'}
            title={
              cur === 'subscription'
                ? '지금 청약 중인 공모주가 없어요'
                : cur === 'upcoming'
                ? '예정된 청약이 없어요'
                : '상장 예정 종목이 없어요'
            }
            desc={cur === 'subscription' && lists.upcoming.length ? '청약 예정 탭에서 다음 일정을 확인해 보세요' : undefined}
          />
        ) : null}
        {spacOpen && spacs.map((i) => <IpoRow key={i.id} ipo={i} stage={cur} today={today} />)}
      </div>
      {spacs.length > 0 && (
        <button className="card-foot-btn" onClick={() => setSpacOpen((v) => !v)} aria-expanded={spacOpen}>
          {spacOpen ? '스팩 접기' : `스팩 ${spacs.length}개 보기`}
          <ChevronDown size={18} style={{ transform: spacOpen ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
        </button>
      )}
    </Card>
  )
}

// ───────── 최근 상장 ─────────
function RecentListings({ staged, today }: { staged: { ipo: Ipo; stage: Stage }[]; today: string }) {
  const past = staged
    .filter(({ ipo, stage }) => stage === 'listed' && notSpac(ipo) && ipo.listingDate && ipo.listingReturn != null)
    .sort((a, b) => (b.ipo.listingDate ?? '').localeCompare(a.ipo.listingDate ?? ''))
  if (!past.length) return null
  return (
    <Card>
      <CardHead
        title="최근 상장 결과"
        sub="공모가 대비 상장일 종가"
        onMore={past.length > 5 ? () => nav.push({ k: 'listed' }) : undefined}
      />
      <div className="card-list">
        {past.slice(0, 5).map(({ ipo }) => (
          <IpoRow key={ipo.id} ipo={ipo} stage="listed" today={today} />
        ))}
      </div>
    </Card>
  )
}
