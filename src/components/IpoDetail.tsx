import { useEffect, useState } from 'react'
import type { Ipo, PredictionChoice, Stage } from '../types'
import { useStore } from '../store'
import { useBackClose } from '../lib/backStack'
import { useIpos } from '../data/loadIpos'
import { shareText } from '../lib/share'
import { toast } from '../lib/juice'
import { DropRate } from './DropRate'
import {
  OUTCOME_META,
  RARITY_META,
  daysUntil,
  depositFor,
  estRefundDate,
  formatEok,
  formatMan,
  formatWon,
  maxAffordableShares,
  mdShort,
  outcomeFromReturn,
  signedPct,
  todayYmd,
} from '../lib/calc'

const OUTCOMES: PredictionChoice[] = ['ttassang', 'up', 'flat', 'down']

export function IpoDetail({ ipo, stage, onClose }: { ipo: Ipo; stage: Stage; onClose: () => void }) {
  useBackClose(onClose)
  const ALL = useIpos()
  const seedMoney = useStore((s) => s.seedMoney)
  const escrowHeld = useStore((s) => s.escrow[ipo.id] ?? 0)
  const prediction = useStore((s) => s.predictions[ipo.id])
  const savedShares = useStore((s) => s.subscriptions[ipo.id])
  const settledIds = useStore((s) => s.settledIds)
  const setPrediction = useStore((s) => s.setPrediction)
  const setSubscription = useStore((s) => s.setSubscription)
  const settleReal = useStore((s) => s.settleReal)
  const viewIpo = useStore((s) => s.viewIpo)

  useEffect(() => {
    viewIpo(ipo.id)
  }, [ipo.id, viewIpo])

  // 이미 잠긴 증거금은 다시 청약 가능 한도에 포함(수정 시 상향 가능)
  const maxShares = maxAffordableShares(seedMoney + escrowHeld, ipo.offerPrice)
  const [shares, setShares] = useState<number>(savedShares ?? 10)
  const [tab, setTab] = useState<'info' | 'sim'>('info') // 정보(기본) · 모의청약
  const rm = RARITY_META[ipo.rarity]

  const today = todayYmd()
  const isDday = !!ipo.listingDate && today === ipo.listingDate
  const afterListing = !!ipo.listingDate && today > ipo.listingDate
  const settled = settledIds.includes(ipo.id)
  const didBet = prediction != null || savedShares != null
  const mode: 'settled' | 'bet' | 'locked' | 'settle' | 'info' = settled
    ? 'settled'
    : afterListing && didBet && ipo.listingReturn != null
      ? 'settle'
      : isDday
        ? 'locked'
        : stage === 'subscription' || stage === 'pending'
          ? 'bet'
          : 'info'

  const priceText = ipo.priceConfirmed
    ? formatWon(ipo.offerPrice)
    : ipo.priceLow && ipo.priceHigh
      ? `${ipo.priceLow.toLocaleString()}–${ipo.priceHigh.toLocaleString()}원`
      : '미정'

  function saveBet() {
    setSubscription(ipo.id, shares, depositFor(shares, ipo.offerPrice))
    onClose()
  }
  function doSettle() {
    settleReal(ipo)
    onClose()
  }

  // 종목 정보 텍스트 공유 (카톡 등) — 정보 확산용
  async function doShare() {
    const lines = [
      `📈 ${ipo.name} (${ipo.sector})`,
      ipo.subscriptionStart && ipo.subscriptionEnd ? `청약 ${mdShort(ipo.subscriptionStart)}–${mdShort(ipo.subscriptionEnd)}` : null,
      `공모가 ${priceText}`,
      ipo.listingDate ? `상장 ${mdShort(ipo.listingDate)}` : null,
      ipo.underwriter ? `증권사 ${ipo.underwriter}` : null,
      '— 공모주 히어로',
    ]
      .filter(Boolean)
      .join('\n')
    const r = await shareText(`공모주 ${ipo.name}`, lines)
    if (r === 'copied') toast('종목 정보를 클립보드에 복사했어요', '📋')
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <div className="sheet-sector" style={{ color: rm.color }}>
              {ipo.market ? `${ipo.market} · ` : ''}
              {rm.label} · 공모 {formatEok(ipo.offerAmount)}
              {!ipo.isReal && ' · 샘플'}
            </div>
            <h2>{ipo.name}</h2>
            <div className="muted under">{ipo.sector}</div>
          </div>
          <div className="sheet-actions">
            <button className="share-btn" onClick={doShare}>
              공유
            </button>
            <button className="x" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
        </div>

        <div className="sheet-tabs" role="tablist">
          <button className={tab === 'info' ? 'sheet-tab sel' : 'sheet-tab'} onClick={() => setTab('info')}>
            공모주 정보
          </button>
          <button className={tab === 'sim' ? 'sheet-tab sel' : 'sheet-tab'} onClick={() => setTab('sim')}>
            모의청약
            {(mode === 'bet' || mode === 'settle') && <i className="sheet-tab-dot" />}
          </button>
        </div>

        {tab === 'info' && (
          <>
            <div className="info-grid">
              <Info label="공모가" value={priceText} />
              <Info label="공모 규모" value={formatEok(ipo.offerAmount)} />
              <Info label="기관 경쟁률" value={ipo.institutionalRate ? `${ipo.institutionalRate.toLocaleString()}:1` : '미정'} />
              <Info label="의무확약" value={ipo.lockupRatio != null ? `${ipo.lockupRatio}%` : '미정'} />
              <Info label="통합 경쟁률" value={ipo.competitionRate ? `${ipo.competitionRate.toLocaleString()}:1` : '청약 후'} />
              <Info
                label="청약일"
                value={ipo.subscriptionStart && ipo.subscriptionEnd ? `${md(ipo.subscriptionStart)}–${md(ipo.subscriptionEnd)}` : '-'}
              />
            </div>

            {ipo.listingReturn != null && (
              <div className="result-banner" style={{ color: OUTCOME_META[outcomeFromReturn(ipo.listingReturn)].color }}>
                상장 첫날 {signedPct(ipo.listingReturn)} · {OUTCOME_META[outcomeFromReturn(ipo.listingReturn)].label}
              </div>
            )}

            <DemandGauge ipo={ipo} all={ALL} />

            {stage !== 'listed' && <RealCheck ipo={ipo} today={today} />}

            {ipo.underwriter && (
              <div className="uw-block">
                <div className="uw-label">청약 가능 증권사</div>
                <div className="uw-chips">
                  {ipo.underwriter.split(',').map((u) => (
                    <span key={u} className="uw-chip">
                      {u.trim()}
                    </span>
                  ))}
                </div>
                {ipo.underwriter.includes(',') && (
                  <div className="uw-note muted">증권사마다 청약 경쟁률·배정이 다를 수 있어요.</div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'sim' && (
          <>
            <div className="sim-intro muted">🎮 가상머니로 청약·예측하고 실제 상장 결과로 정산하는 연습이에요 (실거래 아님)</div>

            {mode === 'settled' && (
              <div className="result-banner" style={{ color: OUTCOME_META[outcomeFromReturn(ipo.listingReturn ?? 0)].color }}>
                상장 결과 {signedPct(ipo.listingReturn ?? 0)} · {OUTCOME_META[outcomeFromReturn(ipo.listingReturn ?? 0)].label} · 정산 완료
              </div>
            )}

            {mode === 'bet' && (
              <>
                <DropRate ipo={ipo} shares={shares} />
                <Predict value={prediction} onPick={(o) => setPrediction(ipo.id, o)} />
                <Subscribe shares={shares} max={maxShares} offerPrice={ipo.offerPrice} onChange={setShares} />
                <button className="cta" onClick={saveBet}>
                  {savedShares != null ? '모의청약 수정' : '모의청약 하기'}
                </button>
                <div className="wait-note">증거금이 시즌 자산에서 차감돼요 · 상장 전까지 수정 가능</div>
              </>
            )}

            {mode === 'locked' && (
              <div className="bet-summary">
                🔒 상장 당일이에요 — 수정 불가, 내일 결과로 정산됩니다
                {didBet && (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {prediction ? `예측 ${OUTCOME_META[prediction].label}` : '예측 없음'} · 청약 {savedShares ?? 0}주 · 증거금 {formatMan(escrowHeld)}
                  </div>
                )}
              </div>
            )}

            {mode === 'settle' && (
              <>
                <div className="bet-summary">
                  내 모의청약 — {prediction ? `예측 ${OUTCOME_META[prediction].label}` : '예측 없음'} · 청약 {savedShares ?? 0}주
                </div>
                <button className="cta" onClick={doSettle}>
                  🎰 정산하기 (실제 상장 결과로)
                </button>
              </>
            )}

            {mode === 'info' && (
              <>
                <DropRate ipo={ipo} shares={10} />
                <div className="info-note">{infoNote(ipo)}</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function infoNote(ipo: Ipo): string {
  if (ipo.listingReturn != null || (ipo.listingDate && todayYmd() > ipo.listingDate)) return '이미 상장된 종목이에요.'
  const d = daysUntil(ipo.subscriptionStart)
  return `아직 청약 전이에요. 청약 시작${d != null && d >= 0 ? `(D-${d})` : ''}부터 모의청약할 수 있어요.`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-cell">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}

function Predict({ value, onPick }: { value: PredictionChoice | undefined; onPick: (o: PredictionChoice) => void }) {
  return (
    <div className="block">
      <div className="block-title">📊 상장일 예측</div>
      <div className="outcome-grid">
        {OUTCOMES.map((o) => (
          <button
            key={o}
            className={value === o ? 'outcome-btn sel' : 'outcome-btn'}
            style={value === o ? { borderColor: OUTCOME_META[o].color, color: OUTCOME_META[o].color } : undefined}
            onClick={() => onPick(o)}
          >
            <b>{OUTCOME_META[o].label}</b>
            <span>{OUTCOME_META[o].range}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Subscribe({
  shares,
  max,
  offerPrice,
  onChange,
}: {
  shares: number
  max: number
  offerPrice: number
  onChange: (n: number) => void
}) {
  return (
    <div className="block">
      <div className="block-title">
        🎟️ 가상 청약 <span className="muted">(증거금 시즌 자산 차감)</span>
      </div>
      <input type="range" min={10} max={max} step={10} value={shares} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="sub-row">
        <span>{shares}주 청약</span>
        <span className="muted">증거금 {formatMan(depositFor(shares, offerPrice))}</span>
      </div>
    </div>
  )
}

// 수요 지표 위치 — 수집된 종목(스팩 제외) 대비 백분위 게이지
function DemandGauge({ ipo, all }: { ipo: Ipo; all: Ipo[] }) {
  if (ipo.sector === '스팩') return null
  const pool = all.filter((i) => i.sector !== '스팩')
  const rows: { label: string; value: string; fill: number; top: number }[] = []

  const add = (label: string, v: number | null, get: (i: Ipo) => number | null, fmt: (n: number) => string) => {
    if (v == null) return
    const vals = pool.map(get).filter((x): x is number => x != null)
    if (vals.length < 5) return // 모수가 너무 작으면 표시 안 함
    const below = vals.filter((x) => x < v).length
    const pct = Math.round((below / vals.length) * 100)
    const fill = Math.max(4, pct) // 바 최소폭은 시각용 — 수치 계산엔 미사용
    const top = Math.max(1, 100 - pct)
    rows.push({ label, value: fmt(v), fill, top })
  }

  add('기관 경쟁률', ipo.institutionalRate, (i) => i.institutionalRate, (n) => `${n.toLocaleString()}:1`)
  add('통합 경쟁률', ipo.competitionRate, (i) => i.competitionRate, (n) => `${n.toLocaleString()}:1`)
  add('의무확약', ipo.lockupRatio, (i) => i.lockupRatio, (n) => `${n}%`)
  if (!rows.length) return null

  return (
    <div className="block">
      <div className="block-title">
        📈 수요 지표 위치 <span className="muted gauge-note">수집 종목 대비</span>
      </div>
      <div className="gauge-list">
        {rows.map((r) => (
          <div key={r.label} className="gauge-row">
            <span className="gauge-lbl">{r.label}</span>
            <div className="gauge-bar">
              <div className="gauge-fill" style={{ width: `${r.fill}%` }} />
            </div>
            <span className="gauge-val">
              {r.value} <b>상위 {r.top}%</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 실전 체크 — 자금 타임라인(청약→환불→상장) + 최소 청약 증거금 (정보 전용 · 추정)
function RealCheck({ ipo, today }: { ipo: Ipo; today: string }) {
  const steps: { date: string; label: string; est?: boolean }[] = []
  const push = (date: string | null | undefined, label: string, est = false) => {
    if (date) steps.push({ date, label, est })
  }
  push(ipo.demandForecastDate, '수요예측')
  push(ipo.subscriptionStart, '청약 시작')
  push(ipo.subscriptionEnd, '청약 마감 · 증거금 납입')
  push(estRefundDate(ipo.subscriptionEnd), '증거금 환불', true)
  push(ipo.listingDate, '상장')
  if (!steps.length && ipo.offerPrice <= 0) return null

  return (
    <div className="block">
      <div className="block-title">
        💼 실전 체크 <span className="muted gauge-note">정보용 · 실제 청약은 증권사 앱에서</span>
      </div>
      {steps.length > 0 && (
        <div className="tl">
          {steps.map((s) => {
            const d = daysUntil(s.date, today)
            const state = s.date < today ? 'past' : s.date === today ? 'now' : ''
            return (
              <div key={`${s.date}-${s.label}`} className={`tl-row ${state}`}>
                <span className="tl-dot" />
                <span className="tl-date">{mdShort(s.date)}</span>
                <span className="tl-lbl">
                  {s.label}
                  {s.est && <i className="tl-est">추정</i>}
                </span>
                <span className="tl-dday muted">{d != null && d > 0 ? `D-${d}` : d === 0 ? '오늘' : ''}</span>
              </div>
            )
          })}
        </div>
      )}
      {ipo.offerPrice > 0 && (
        <div className="rc-deposit">
          최소 청약 <b>10주</b> 증거금(50%) <b>{formatWon(depositFor(10, ipo.offerPrice))}</b>
        </div>
      )}
      <div className="rc-note muted">
        환불일은 통상(마감+2영업일) 기준 추정으로 공휴일·증권사에 따라 다를 수 있어요. 수수료 별도 · 투자 권유 아님.
      </div>
    </div>
  )
}

function md(s: string | null): string {
  return s ? s.slice(5).replace('-', '/') : ''
}
