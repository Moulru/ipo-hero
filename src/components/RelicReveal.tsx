import { useEffect } from 'react'
import { useStore } from '../store'
import { type Relic } from '../types'
import { relicById } from '../data/relics'
import { RARITY_META } from '../lib/calc'
import { confetti, haptic } from '../lib/juice'
import { useBackClose } from '../lib/backStack'

export function RelicReveal() {
  const reveal = useStore((s) => s.relicReveal)!
  const clear = useStore((s) => s.clearRelicReveal)
  useBackClose(clear)
  const relics = reveal.ids.map((id) => relicById(id)).filter(Boolean) as Relic[]
  const hasLegend = relics.some((r) => r.rarity === 'legendary')
  const hasEpic = relics.some((r) => r.rarity === 'epic')
  const multi = relics.length > 1

  useEffect(() => {
    haptic(15)
    if (hasLegend) confetti(['#ffb01f', '#ff5c8a', '#fff'])
    else if (hasEpic) confetti(['#b06bff', '#5b8cff'])
  }, [hasLegend, hasEpic])

  return (
    <div className="settle-overlay">
      <div className="settle">
        <div className="settle-src">카드 {multi ? `${relics.length}연차` : '획득'}!</div>
        {!multi ? (
          <SingleReveal relic={relics[0]} />
        ) : (
          <div className="relic-multi">
            {relics.map((r, i) => {
              const rm = RARITY_META[r.rarity]
              return (
                <div key={i} className="relic-multi-card" style={{ borderColor: rm.color }}>
                  <div className="relic-multi-emoji">{r.emoji}</div>
                  <div className="relic-multi-name" style={{ color: rm.color }}>
                    {r.name}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {reveal.refund > 0 && <div className="dup-refund">🪙 중복 환불 +{reveal.refund}G</div>}
        <button className="cta" onClick={() => clear()}>
          확인
        </button>
      </div>
    </div>
  )
}

function SingleReveal({ relic }: { relic: Relic }) {
  const rm = RARITY_META[relic.rarity]
  return (
    <>
      <div className="relic-reveal" style={{ borderColor: rm.color, color: rm.color }}>
        <div className="relic-reveal-emoji">{relic.emoji}</div>
      </div>
      <div className="relic-reveal-rarity" style={{ color: rm.color }}>
        {rm.label}
      </div>
      <div className="relic-reveal-name">{relic.name}</div>
      <div className="relic-reveal-desc muted">{relic.desc}</div>
    </>
  )
}
