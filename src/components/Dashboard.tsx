import { useEffect, useState, type ReactNode } from 'react'
import { refreshIpos, useDataTimestamp, useIpos } from '../data/loadIpos'
import type { Ipo, Stage } from '../types'
import { useStore } from '../store'
import { useBackCloseWhen } from '../lib/backStack'
import { OUTCOME_META, RARITY_META, STAGE_META, computeStage, daysUntil, mdShort, outcomeFromReturn, signedPct, todayYmd } from '../lib/calc'
import { toast } from '../lib/juice'
import { IpoDetail } from './IpoDetail'
import { CalendarView } from './CalendarView'

const isSpac = (i: Ipo) => i.sector === '스팩'
const notSpac = (i: Ipo) => i.sector !== '스팩'

export function Dashboard() {
  const ALL = useIpos()
  const [selected, setSelected] = useState<Ipo | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'cal'>('list')
  const predictions = useStore((s) => s.predictions)
  const subscriptions = useStore((s) => s.subscriptions)
  const settledIds = useStore((s) => s.settledIds)

  // '오늘'은 state — 자정 넘김·백그라운드 복귀 시에도 브리핑/D-day/단계가 실제 날짜를 따르도록
  const [today, setToday] = useState(todayYmd())
  useEffect(() => {
    const update = () => setToday(todayYmd())
    const onVis = () => {
      if (document.visibilityState === 'visible') update()
    }
    document.addEventListener('visibilitychange', onVis)
    const t = setInterval(update, 60_000) // 같은 값이면 리렌더 없음(React bail-out)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(t)
    }
  }, [])

  // 검색·캘린더 상태에서 하드웨어 뒤로가기 → 앱 종료 대신 목록 복귀
  useBackCloseWhen(query !== '' || view === 'cal', () => {
    setQuery('')
    setView('list')
  })

  const bet = (i: Ipo) => predictions[i.id] != null || subscriptions[i.id] != null
  const staged = ALL.map((ipo) => ({ ipo, stage: computeStage(ipo, today) }))
  const of = (st: Stage) => staged.filter((x) => x.stage === st).map((x) => x.ipo)

  const subscription = of('subscription')
  const upcoming = of('upcoming').sort((a, b) => (a.subscriptionStart ?? '').localeCompare(b.subscriptionStart ?? ''))
  const pendingAll = of('pending')
  const listed = of('listed')

  const mySettle = [...pendingAll, ...listed].filter((i) => bet(i) && !settledIds.includes(i.id))
  const pendingInfo = pendingAll.filter((i) => !bet(i) && i.listingDate) // 상장일 미정 숨김

  // 최근 상장 결과 5건 (최신순) — 평균은 따상 몇 건에 끌려가 왜곡되므로 개별 수익률을 그대로 보여줌
  const past = listed
    .filter((i) => notSpac(i) && i.listingDate && i.listingReturn != null)
    .sort((a, b) => (b.listingDate ?? '').localeCompare(a.listingDate ?? ''))
    .slice(0, 5)

  // 상세 시트는 항상 최신 데이터 객체로 — 자동 갱신 후에도 스냅샷(구 값)이 남지 않게
  const liveSelected = selected ? (ALL.find((i) => i.id === selected.id) ?? selected) : null

  // 검색: 이름·섹터·증권사 (스팩 포함)
  const q = query.trim().toLowerCase()
  const results = q
    ? staged.filter(
        ({ ipo }) =>
          ipo.name.toLowerCase().includes(q) ||
          ipo.sector.toLowerCase().includes(q) ||
          (ipo.underwriter ?? '').toLowerCase().includes(q),
      )
    : []

  return (
    <div className="dashboard">
      <div className="dash-head">
        <div className="dash-title-row">
          <h1>공모주</h1>
          <DataChip />
        </div>
      </div>

      <TodayBrief staged={staged} today={today} onPick={setSelected} />

      <div className="dash-tools">
        <div className="searchbar">
          <span className="search-ico">🔍</span>
          <input
            className="search-input"
            type="search"
            placeholder="종목·업종·증권사 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="공모주 검색"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="검색어 지우기">
              ✕
            </button>
          )}
        </div>
        <div className="view-toggle" role="tablist">
          <button className={view === 'list' ? 'vt-btn sel' : 'vt-btn'} onClick={() => setView('list')}>
            목록
          </button>
          <button className={view === 'cal' ? 'vt-btn sel' : 'vt-btn'} onClick={() => setView('cal')}>
            캘린더
          </button>
        </div>
      </div>

      {q ? (
        <Section title={`🔍 검색 결과`} desc={`${results.length}건`}>
          {results.length ? (
            results.map(({ ipo, stage }) => (
              <IpoCard key={ipo.id} ipo={ipo} stage={stage} mine={bet(ipo)} onClick={() => setSelected(ipo)} />
            ))
          ) : (
            <div className="empty-mini">‘{query.trim()}’ 검색 결과가 없어요.</div>
          )}
        </Section>
      ) : view === 'cal' ? (
        <CalendarView ipos={ALL} today={today} onSelect={setSelected} />
      ) : (
        <>
          {mySettle.length > 0 && (
            <Section title="⏳ 내 정산 대기" desc="상장일 다음날 결과로 정산해요">
              {mySettle.map((i) => (
                <IpoCard key={i.id} ipo={i} stage={computeStage(i, today)} mine onClick={() => setSelected(i)} />
              ))}
            </Section>
          )}

          <Section title="🔥 청약 중">
            {subscription.filter(notSpac).length > 0 ? (
              subscription.filter(notSpac).map((i) => <IpoCard key={i.id} ipo={i} stage="subscription" mine={bet(i)} onClick={() => setSelected(i)} />)
            ) : subscription.filter(isSpac).length === 0 ? (
              <div className="empty-mini">지금 청약 중인 공모주가 없어요.</div>
            ) : null}
            <SpacFold ipos={subscription.filter(isSpac)} stage="subscription" onSelect={setSelected} />
          </Section>

          {upcoming.length > 0 && (
            <Section title="📅 곧 시작">
              {upcoming.filter(notSpac).map((i) => (
                <IpoCard key={i.id} ipo={i} stage="upcoming" onClick={() => setSelected(i)} />
              ))}
              <SpacFold ipos={upcoming.filter(isSpac)} stage="upcoming" onSelect={setSelected} />
            </Section>
          )}

          {pendingInfo.length > 0 && (
            <Section title="🕒 상장 대기">
              {pendingInfo.filter(notSpac).map((i) => (
                <IpoCard key={i.id} ipo={i} stage="pending" onClick={() => setSelected(i)} />
              ))}
              <SpacFold ipos={pendingInfo.filter(isSpac)} stage="pending" onSelect={setSelected} />
            </Section>
          )}

          {past.length > 0 && (
            <Section title="📜 최근 상장" desc="최신순 · 첫날 종가">
              <div className="past-list">
                {past.map((i) => {
                  const om = OUTCOME_META[outcomeFromReturn(i.listingReturn ?? 0)]
                  return (
                    <button key={i.id} className="past-item" onClick={() => setSelected(i)}>
                      <div className="past-main">
                        <span className="past-name">{i.name}</span>
                        <span className="past-meta muted">
                          {i.sector} · {md(i.listingDate)} 상장
                        </span>
                      </div>
                      <span className="past-return" style={{ color: om.color }}>
                        {signedPct(i.listingReturn ?? 0)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}
        </>
      )}

      <footer className="dash-foot">
        <div className="foot-box">
          <div className="foot-title">📊 등급 산정 기준</div>
          <b>기관 수요예측 경쟁률 · 통합 청약경쟁률 · 의무보유확약</b>(수요·품귀)을 핵심으로, 공모 규모를 함께 반영해 매겨집니다. (스팩 제외)
        </div>
        <div className="foot-box">
          <div className="foot-title">ℹ️ 안내</div>
          공모주 히어로는 <b>정보 제공 · 가상 모의청약</b> 앱으로, 투자 자문·권유가 아닙니다. 데이터는 DART·KIND 등 공개 자료
          기반으로 지연·오류가 있을 수 있으며, 투자 판단의 책임은 이용자에게 있습니다.
        </div>
      </footer>

      {liveSelected && (
        <IpoDetail
          key={liveSelected.id}
          ipo={liveSelected}
          stage={computeStage(liveSelected, today)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

// 데이터 기준 시각 칩 — 탭하면 즉시 새로고침 (표시는 기기 로컬 시간대 기준)
function DataChip() {
  const updatedAt = useDataTimestamp()
  const [busy, setBusy] = useState(false)
  const d = new Date(updatedAt)
  const p = (n: number) => String(n).padStart(2, '0')
  const label = updatedAt && !isNaN(d.getTime()) ? `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}` : '-'
  return (
    <button
      className="data-chip"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        const r = await refreshIpos()
        setBusy(false)
        if (r === 'updated') toast('최신 공모주 데이터로 갱신했어요', '🔄')
        else if (r === 'same') toast('이미 최신 데이터예요', '✅')
        else toast('네트워크 연결을 확인해 주세요', '⚠️')
      }}
      aria-label="데이터 새로고침"
    >
      🕒 {label} <span className="data-chip-re">{busy ? '…' : '↻'}</span>
    </button>
  )
}

// 오늘의 브리핑 — 앱을 열자마자 '오늘 할 일'을 3초 안에 (스팩 제외)
function TodayBrief({ staged, today, onPick }: { staged: { ipo: Ipo; stage: Stage }[]; today: string; onPick: (i: Ipo) => void }) {
  const pool = staged.filter(({ ipo }) => notSpac(ipo))
  const closes = pool.filter((x) => x.stage === 'subscription' && x.ipo.subscriptionEnd === today).map((x) => x.ipo)
  const starts = pool.filter((x) => x.stage === 'subscription' && x.ipo.subscriptionStart === today).map((x) => x.ipo)
  const lists = pool.filter((x) => x.ipo.listingDate === today).map((x) => x.ipo)

  const rows: { icon: string; label: string; ipos: Ipo[] }[] = []
  if (closes.length) rows.push({ icon: '⏰', label: '오늘 청약 마감', ipos: closes })
  if (starts.length) rows.push({ icon: '🟢', label: '오늘 청약 시작', ipos: starts })
  if (lists.length) rows.push({ icon: '🔔', label: '오늘 상장', ipos: lists })

  // 오늘 일정이 없으면 가장 가까운 다음 일정 안내
  let next: { d: number; label: string; ipo: Ipo } | null = null
  if (!rows.length) {
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
  }

  return (
    <div className="brief">
      <div className="brief-title">
        📌 오늘 <span className="muted">{mdShort(today)}</span>
      </div>
      {rows.length ? (
        rows.map((r) => (
          <div key={r.label} className="brief-row">
            <span className="brief-lbl">
              {r.icon} {r.label}
            </span>
            <span className="brief-chips">
              {r.ipos.map((i) => (
                <button key={i.id} className="brief-chip" onClick={() => onPick(i)}>
                  {i.name}
                </button>
              ))}
            </span>
          </div>
        ))
      ) : next ? (
        <div className="brief-row">
          <span className="brief-lbl muted">오늘 일정 없음 · 다음</span>
          <span className="brief-chips">
            <button className="brief-chip" onClick={() => onPick(next.ipo)}>
              {next.ipo.name} {next.label} D-{next.d}
            </button>
          </span>
        </div>
      ) : (
        <div className="brief-row">
          <span className="brief-lbl muted">예정된 공모주 일정이 없어요</span>
        </div>
      )}
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-title">{title}</span>
        {desc && <span className="section-desc">{desc}</span>}
      </div>
      {children}
    </section>
  )
}

// 스팩: 수요 낮고 성향이 달라 단계별로 작게 접어둠 (기본 접힘)
function SpacFold({ ipos, stage, onSelect }: { ipos: Ipo[]; stage: Stage; onSelect: (i: Ipo) => void }) {
  const [open, setOpen] = useState(false)
  if (!ipos.length) return null
  return (
    <div className="spac-fold">
      <button className="spac-toggle" onClick={() => setOpen((o) => !o)}>
        <span>🪙 스팩 {ipos.length}개</span>
        <span className="spac-arrow">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="spac-list">
          {ipos.map((i) => (
            <button key={i.id} className="spac-item" onClick={() => onSelect(i)}>
              <span className="spac-name">{i.name}</span>
              <span className="muted">{footLabel(i, stage)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 카드 안에 자연스럽게 표기하는 청약/상장 '날짜'
function schedText(ipo: Ipo, stage: Stage): string {
  const range =
    ipo.subscriptionStart && ipo.subscriptionEnd
      ? `${md(ipo.subscriptionStart)}–${md(ipo.subscriptionEnd)}`
      : ipo.subscriptionStart
        ? md(ipo.subscriptionStart)
        : ''
  if (stage === 'subscription') return range ? `🔥 청약 ${range}` : '🔥 청약 중'
  if (stage === 'upcoming') return range ? `📅 청약 ${range}` : '📅 청약 예정'
  if (stage === 'listed') return ipo.listingDate ? `✅ ${md(ipo.listingDate)} 상장` : '✅ 상장 완료'
  return ipo.listingDate ? `📅 ${md(ipo.listingDate)} 상장 예정` : '📅 상장일 미정'
}

// 우측 카운트다운(D-day)
function footLabel(ipo: Ipo, stage: Stage, mine = false): string {
  if (stage === 'listed') {
    if (!mine) return '상장 완료'
    const d = daysUntil(ipo.listingDate)
    return d != null && d >= 0 ? '🔒 내일 정산' : '✅ 정산하기' // 상장 당일은 잠금(상장+1일 정산)
  }
  if (stage === 'subscription') {
    const d = daysUntil(ipo.subscriptionEnd)
    return d != null && d >= 0 ? `마감 D-${d}` : `~${md(ipo.subscriptionEnd)}`
  }
  if (stage === 'upcoming') {
    const d = daysUntil(ipo.subscriptionStart)
    return d != null && d >= 0 ? `D-${d}` : md(ipo.subscriptionStart)
  }
  const d = daysUntil(ipo.listingDate)
  if (!ipo.listingDate) return '상장 대기'
  if (d == null || d < 0) return md(ipo.listingDate)
  return d === 0 ? '🔔 오늘 상장' : `상장 D-${d}`
}

function IpoCard({ ipo, stage, mine, onClick }: { ipo: Ipo; stage: Stage; mine?: boolean; onClick: () => void }) {
  const rm = RARITY_META[ipo.rarity]
  const sm = STAGE_META[stage]
  const priceText = ipo.priceConfirmed
    ? `공모가 ${ipo.offerPrice.toLocaleString()}원`
    : ipo.priceLow && ipo.priceHigh
      ? `희망 ${ipo.priceLow.toLocaleString()}–${ipo.priceHigh.toLocaleString()}원`
      : '공모가 미정'

  return (
    <button className="ipo-card" onClick={onClick} style={{ borderLeftColor: rm.color }}>
      <div className="ipo-card-top">
        <span className={`stage-badge ${sm.cls}`}>{sm.label}</span>
        <span className="rarity-tag" style={{ color: rm.color }}>
          {rm.label}
        </span>
        <span className="ipo-sector">{ipo.sector}</span>
        {!ipo.isReal && <span className="sample-chip">샘플</span>}
        {mine && <span className="pred-chip">참여</span>}
      </div>
      <div className="ipo-card-name">{ipo.name}</div>
      <div className="ipo-card-sched">{schedText(ipo, stage)}</div>
      <div className="ipo-card-drop">
        {ipo.expectedPer10 != null ? (
          <>
            🎰 10주 → <b style={{ color: rm.color }}>{ipo.expectedPer10.toFixed(2)}주</b>
            <span className="ipo-card-comp">경쟁률 {ipo.competitionRate?.toLocaleString()}:1</span>
          </>
        ) : (
          <span className="muted">🎰 예상 배정 · 청약 후 공개</span>
        )}
      </div>
      <div className="ipo-card-foot">
        <span>{priceText}</span>
        <span className="muted">{footLabel(ipo, stage, mine)}</span>
      </div>
    </button>
  )
}

function md(s: string | null): string {
  return s ? s.slice(5).replace('-', '/') : ''
}
