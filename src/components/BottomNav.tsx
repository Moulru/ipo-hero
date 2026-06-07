import { haptic } from '../lib/juice'

export type Tab = 'home' | 'play' | 'my'

const ITEMS: { id: Tab; ic: string; label: string }[] = [
  { id: 'home', ic: '🏠', label: '공모주' },
  { id: 'play', ic: '🛋️', label: '라운지' },
  { id: 'my', ic: '👤', label: 'MY' },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottomnav">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={tab === it.id ? 'nav-btn active' : 'nav-btn'}
          onClick={() => {
            if (tab !== it.id) haptic(8)
            onChange(it.id)
          }}
        >
          <span className="nav-ic">{it.ic}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
