import { useStore } from '../store'
import { RARITY_META } from '../lib/calc'
import { RELICS } from '../data/relics'
import type { Rarity } from '../types'

const ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common']

// 투자 카드 도감 (공모주 도감처럼 별도 상세 화면) — 보유한 카드만 등급별로 표시
export function RelicDex({ onClose }: { onClose: () => void }) {
  const ownedRelics = useStore((s) => s.ownedRelics)
  const owned = new Set(ownedRelics)
  const uniqueOwned = owned.size

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="dex-screen" onClick={(e) => e.stopPropagation()}>
        <div className="dex-screen-head">
          <h2>
            🃏 투자 카드 도감{' '}
            <span className="muted">
              수집 {uniqueOwned}/{RELICS.length}
            </span>
          </h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        {uniqueOwned === 0 && <div className="dex-empty muted">상점에서 카드를 뽑아 모으면 등급별로 모여요.</div>}

        {ORDER.map((r) => {
          const all = RELICS.filter((x) => x.rarity === r)
          const items = all.filter((x) => owned.has(x.id))
          if (!items.length) return null
          const rm = RARITY_META[r]
          return (
            <div key={r} className="dex-rarity-sec">
              <div className="dex-rarity-title" style={{ color: rm.color }}>
                {rm.label}{' '}
                <span className="muted">
                  {items.length}/{all.length}
                </span>
              </div>
              <div className="relic-grid">
                {items.map((card) => (
                  <div key={card.id} className="relic-card" style={{ borderColor: rm.color }}>
                    <div className="relic-emoji">{card.emoji}</div>
                    <div className="relic-name">{card.name}</div>
                    <div className="relic-desc muted">{card.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
