import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { OUTCOME_META, RARITY_META, formatMan, signedPct } from '../lib/calc'
import { rankInfo } from '../data/ranks'
import { confetti, haptic } from '../lib/juice'

export function ResultModal() {
  const r = useStore((s) => s.lastResult)!
  const clear = useStore((s) => s.clearResult)
  const [phase, setPhase] = useState(0) // 0 굴림 · 1 배정 · 2 결과 · 3 보상

  useEffect(() => {
    const timers = [setTimeout(() => setPhase(1), 900), setTimeout(() => setPhase(2), 1700), setTimeout(() => setPhase(3), 2500)]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase === 1) {
      haptic(10)
    } else if (phase === 2) {
      if (r.predictionCorrect) haptic([15, 30, 15])
      else if (r.predictionCorrect === false) haptic(30)
    } else if (phase === 3) {
      if (r.realOutcome === 'ttassang' || r.ipo.rarity === 'legendary') confetti()
      else if (r.predictionCorrect) confetti(['#2fd180', '#5b8cff'])
    }
  }, [phase, r])

  const rm = RARITY_META[r.ipo.rarity]
  const om = OUTCOME_META[r.realOutcome]
  const profitPos = r.profit >= 0
  const lvUp = rankInfo(r.newLevel)

  return (
    <div className="settle-overlay">
      <div className="settle">
        <div className="settle-ipo" style={{ color: rm.color }}>
          {r.ipo.name} · {r.ipo.sector}
        </div>
        <div className="settle-src">{r.kind === 'real' ? '실전 정산 · 시즌 자산 반영' : '연습 모드'}</div>

        <div className={`gacha ${phase >= 1 ? 'done' : 'rolling'}`} style={{ borderColor: rm.color }}>
          {phase < 1 ? (
            <div className="gacha-roll">🎰</div>
          ) : (
            <>
              <div className="gacha-label">배정 결과</div>
              <div className="gacha-shares" style={{ color: rm.color }}>
                {r.allocatedShares}주
              </div>
              <div className="gacha-sub">
                {r.subscribedShares}주 청약 → {r.allocatedShares}주
              </div>
            </>
          )}
        </div>

        {phase >= 2 && (
          <div className="settle-result fade-in">
            <div className="result-outcome" style={{ color: om.color }}>
              상장 {signedPct(r.listingReturn)} · {om.label}
            </div>
            {r.kind === 'real' && (
              <div className={`result-profit ${profitPos ? 'pos' : 'neg'}`}>
                {profitPos ? '+' : ''}
                {formatMan(r.profit)}
              </div>
            )}
            {r.kind === 'real' && r.deposit > 0 && (
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                증거금 {formatMan(r.deposit)} 반환 + 손익 반영
              </div>
            )}
            {r.prediction && (
              <div className={`pred-verdict ${r.predictionCorrect ? 'hit' : 'miss'}`}>
                예측 {OUTCOME_META[r.prediction].label} → {r.predictionCorrect ? '적중! 🎯' : '빗나감'}
              </div>
            )}
            {r.predictionCorrect && r.combo > 1 && (
              <div className="combo-badge">
                🔥 {r.combo}연승 · 보상 ×{r.comboMult.toFixed(1)}
              </div>
            )}
          </div>
        )}

        {phase >= 3 && (
          <div className="settle-rewards fade-in">
            <div className="rew gold">🪙 골드 +{r.goldGain}</div>
            <div className="rew">⭐ XP +{r.xpGain}</div>
            {r.leveledUp && (
              <div className="rew levelup">
                🎉 {lvUp.rank.emoji} {lvUp.rank.name} Lv.{lvUp.rankLevel} 달성! ✨
              </div>
            )}
          </div>
        )}

        <button className="cta" disabled={phase < 3} onClick={() => clear()}>
          {phase < 3 ? '두구두구...' : '확인'}
        </button>
      </div>
    </div>
  )
}
