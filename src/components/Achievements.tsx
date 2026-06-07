import { ACHIEVEMENTS } from '../data/achievements'
import { useStore } from '../store'

export function Achievements({ onClose }: { onClose: () => void }) {
  const achievements = useStore((s) => s.achievements)
  const got = ACHIEVEMENTS.filter((a) => achievements.includes(a.id))
  const locked = ACHIEVEMENTS.filter((a) => !achievements.includes(a.id))
  const ordered = [...got, ...locked]

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="dex-screen" onClick={(e) => e.stopPropagation()}>
        <div className="dex-screen-head">
          <h2>
            🏆 업적 <span className="muted">{got.length}/{ACHIEVEMENTS.length}</span>
          </h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ach-grid">
          {ordered.map((a) => {
            const has = achievements.includes(a.id)
            return (
              <div key={a.id} className={has ? 'ach-item got' : 'ach-item'}>
                <div className="ach-emoji">{has ? a.emoji : '🔒'}</div>
                <div className="ach-name">{a.name}</div>
                <div className="ach-desc muted">{a.desc}</div>
                <div className="ach-reward">🪙 {a.gold}{a.title ? ` · 칭호 ${a.title}` : ''}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
