import { useEffect, useState } from 'react'
import type { Ipo, PredictionChoice, Stage } from '../types'
import { useStore } from '../store'
import { DropRate } from './DropRate'
import {
  OUTCOME_META,
  RARITY_META,
  daysUntil,
  depositFor,
  formatEok,
  formatMan,
  formatWon,
  maxAffordableShares,
  outcomeFromReturn,
  signedPct,
  todayYmd,
} from '../lib/calc'

const OUTCOMES: PredictionChoice[] = ['ttassang', 'up', 'flat', 'down']

export function IpoDetail({ ipo, stage, onClose }: { ipo: Ipo; stage: Stage; onClose: () => void }) {
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

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <div className="sheet-sector" style={{ color: rm.color }}>
              {rm.label} · 공모 {formatEok(ipo.offerAmount)}
              {!ipo.isReal && ' · 샘플'}
            </div>
            <h2>{ipo.name}</h2>
            <div className="muted under">{ipo.sector}</div>
          </div>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

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
              <div className="uw-note muted">증권사마다 청약 경쟁률·배정이 달라요. 증권사별 실시간 배정 비교는 업데이트 예정이에요.</div>
            )}
          </div>
        )}

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
              {savedShares != null ? '모의투자 수정' : '모의투자 하기'}
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
              내 모의투자 — {prediction ? `예측 ${OUTCOME_META[prediction].label}` : '예측 없음'} · 청약 {savedShares ?? 0}주
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
      </div>
    </div>
  )
}

function infoNote(ipo: Ipo): string {
  if (ipo.listingReturn != null || (ipo.listingDate && todayYmd() > ipo.listingDate)) return '이미 상장된 종목이에요.'
  const d = daysUntil(ipo.subscriptionStart)
  return `아직 청약 전이에요. 청약 시작${d != null && d >= 0 ? `(D-${d})` : ''}부터 모의투자할 수 있어요.`
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

function md(s: string | null): string {
  return s ? s.slice(5).replace('-', '/') : ''
}
