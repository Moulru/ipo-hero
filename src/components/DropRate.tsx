import type { Ipo } from '../types'
import { RARITY_META } from '../lib/calc'

// 경쟁률을 "N주 청약 → 예상 M주"로 직관 변환. 경쟁률 미확정(청약 전)이면 안내 표시.
export function DropRate({ ipo, shares = 10 }: { ipo: Ipo; shares?: number }) {
  const rm = RARITY_META[ipo.rarity]

  if (ipo.expectedPer10 == null) {
    return (
      <div className="droprate">
        <div className="droprate-top">
          <span className="dice">🎰</span>
          <span className="dr-text">
            예상 배정 <b className="muted">청약 후 공개</b>
          </span>
          <span className="dr-rarity" style={{ color: rm.color, borderColor: rm.color }}>
            {rm.label}
          </span>
        </div>
        {ipo.institutionalRate != null && (
          <div className="dr-sub">기관 경쟁률 {ipo.institutionalRate.toLocaleString()}:1</div>
        )}
      </div>
    )
  }

  const expected = (shares / 10) * ipo.expectedPer10
  const fill = Math.max(6, Math.min(100, ipo.expectedPer10 * 50))
  return (
    <div className="droprate">
      <div className="droprate-top">
        <span className="dice">🎰</span>
        <span className="dr-text">
          {shares}주 청약 → 예상 <b style={{ color: rm.color }}>{expected.toFixed(2)}주</b>
        </span>
        <span className="dr-rarity" style={{ color: rm.color, borderColor: rm.color }}>
          {rm.label}
        </span>
      </div>
      <div className="dr-bar">
        <div className="dr-bar-fill" style={{ width: `${fill}%`, background: rm.color }} />
      </div>
      <div className="dr-sub">통합 경쟁률 {ipo.competitionRate?.toLocaleString() ?? '-'}:1</div>
    </div>
  )
}
