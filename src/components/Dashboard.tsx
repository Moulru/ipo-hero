import { useState, type ReactNode } from 'react'
import { useIpos } from '../data/loadIpos'
import type { Ipo, Stage } from '../types'
import { useStore } from '../store'
import { OUTCOME_META, RARITY_META, STAGE_META, computeStage, daysUntil, outcomeFromReturn, signedPct, todayYmd } from '../lib/calc'
import { IpoDetail } from './IpoDetail'

const isSpac = (i: Ipo) => i.sector === '스팩'
const notSpac = (i: Ipo) => i.sector !== '스팩'

export function Dashboard() {
  const ALL = useIpos()
  const [selected, setSelected] = useState<Ipo | null>(null)
  const predictions = useStore((s) => s.predictions)
  const subscriptions = useStore((s) => s.subscriptions)
  const settledIds = useStore((s) => s.settledIds)
  const today = todayYmd()

  const bet = (i: Ipo) => predictions[i.id] != null || subscriptions[i.id] != null
  const staged = ALL.map((ipo) => ({ ipo, stage: computeStage(ipo, today) }))
  const of = (st: Stage) => staged.filter((x) => x.stage === st).map((x) => x.ipo)

  const subscription = of('subscription')
  const upcoming = of('upcoming').sort((a, b) => (a.subscriptionStart ?? '').localeCompare(b.subscriptionStart ?? ''))
  const pendingAll = of('pending')
  const listed = of('listed')

  const mySettle = [...pendingAll, ...listed].filter((i) => bet(i) && !settledIds.includes(i.id))
  const pendingInfo = pendingAll.filter((i) => !bet(i) && i.listingDate) // 상장일 미정 숨김

  // 지난 7일 내 상장한 공모주 기록 (최신순)
  const past = listed
    .filter((i) => notSpac(i) && i.listingDate && i.listingReturn != null)
    .filter((i) => {
      const d = daysUntil(i.listingDate, today)
      return d != null && d <= 0 && d >= -7
    })
    .sort((a, b) => (b.listingDate ?? '').localeCompare(a.listingDate ?? ''))

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>공모주</h1>
        <p className="dash-sub">다가오는 청약부터 지난 결과까지</p>
      </div>

      {mySettle.length > 0 && (
        <Section title="⏳ 내 정산 대기" desc="상장일 다음날 결과로 정산해요">
          {mySettle.map((i) => (
            <IpoCard key={i.id} ipo={i} stage={computeStage(i, today)} mine onClick={() => setSelected(i)} />
          ))}
        </Section>
      )}

      <Section title="🔥 청약 중" desc="지금 모의투자할 수 있어요">
        {subscription.filter(notSpac).length > 0 ? (
          subscription.filter(notSpac).map((i) => <IpoCard key={i.id} ipo={i} stage="subscription" mine={bet(i)} onClick={() => setSelected(i)} />)
        ) : subscription.filter(isSpac).length === 0 ? (
          <div className="empty-mini">지금 청약 중인 공모주가 없어요.</div>
        ) : null}
        <SpacFold ipos={subscription.filter(isSpac)} stage="subscription" onSelect={setSelected} />
      </Section>

      {upcoming.length > 0 && (
        <Section title="📅 곧 시작" desc="청약 시작 후 모의투자할 수 있어요">
          {upcoming.filter(notSpac).map((i) => (
            <IpoCard key={i.id} ipo={i} stage="upcoming" onClick={() => setSelected(i)} />
          ))}
          <SpacFold ipos={upcoming.filter(isSpac)} stage="upcoming" onSelect={setSelected} />
        </Section>
      )}

      {pendingInfo.length > 0 && (
        <Section title="🕒 상장 대기" desc="상장 전 · 모의투자 가능">
          {pendingInfo.filter(notSpac).map((i) => (
            <IpoCard key={i.id} ipo={i} stage="pending" onClick={() => setSelected(i)} />
          ))}
          <SpacFold ipos={pendingInfo.filter(isSpac)} stage="pending" onSelect={setSelected} />
        </Section>
      )}

      {past.length > 0 && (
        <Section title="📜 지난 공모주" desc="최근 7일 상장 결과">
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

      <footer className="dash-foot">
        <div className="foot-box">
          <div className="foot-title">📊 등급 산정 기준</div>
          <b>기관 수요예측 경쟁률 · 통합 청약경쟁률 · 의무보유확약</b>(수요·품귀)을 핵심으로, 공모 규모를 함께 반영해 매겨집니다. (스팩 제외)
        </div>
      </footer>

      {selected && (
        <IpoDetail key={selected.id} ipo={selected} stage={computeStage(selected, today)} onClose={() => setSelected(null)} />
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
function footLabel(ipo: Ipo, stage: Stage): string {
  if (stage === 'listed') return '✅ 정산하기'
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
        <span className="muted">{footLabel(ipo, stage)}</span>
      </div>
    </button>
  )
}

function md(s: string | null): string {
  return s ? s.slice(5).replace('-', '/') : ''
}
