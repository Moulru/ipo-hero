import { useIpos } from '../data/loadIpos'
import { useStore } from '../store'
import { OUTCOME_META, RARITY_META, outcomeFromReturn, signedPct } from '../lib/calc'
import type { Rarity } from '../types'

const ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common']

export function Dex({ onClose }: { onClose: () => void }) {
  const ALL = useIpos()
  const dex = useStore((s) => s.dex)
  const collected = ALL.filter((i) => dex.includes(i.id))

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="dex-screen" onClick={(e) => e.stopPropagation()}>
        <div className="dex-screen-head">
          <h2>
            📒 도감 <span className="muted">{collected.length}종</span>
          </h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        {collected.length === 0 && <div className="dex-empty muted">정산으로 공모주를 수집하면 등급별로 모여요.</div>}

        {ORDER.map((r) => {
          const items = collected.filter((i) => i.rarity === r)
          if (!items.length) return null
          const rm = RARITY_META[r]
          return (
            <div key={r} className="dex-rarity-sec">
              <div className="dex-rarity-title" style={{ color: rm.color }}>
                {rm.label} <span className="muted">{items.length}</span>
              </div>
              <div className="dex-grid">
                {items.map((ipo) => {
                  const om = OUTCOME_META[outcomeFromReturn(ipo.listingReturn ?? 0)]
                  return (
                    <div key={ipo.id} className="dex-card" style={{ borderColor: rm.color }}>
                      <div className="dex-name">{ipo.name}</div>
                      <div className="dex-sector muted">{ipo.sector}</div>
                      <div className="dex-return" style={{ color: om.color }}>
                        {signedPct(ipo.listingReturn ?? 0)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
