import { haptic } from '../lib/juice'
import { TabCalendar, TabHome, TabLounge, TabMy } from '../ui/icons'

export type Tab = 'home' | 'calendar' | 'lounge' | 'my'

const ITEMS: { id: Tab; label: string; Icon: typeof TabHome }[] = [
  { id: 'home', label: '홈', Icon: TabHome },
  { id: 'calendar', label: '일정', Icon: TabCalendar },
  { id: 'lounge', label: '라운지', Icon: TabLounge },
  { id: 'my', label: 'MY', Icon: TabMy },
]

// 하단 탭 — 현재 탭을 다시 누르면 맨 위로 스크롤(onReselect)
export function TabBar({
  tab,
  onChange,
  onReselect,
  badges,
}: {
  tab: Tab
  onChange: (t: Tab) => void
  onReselect: (t: Tab) => void
  badges?: Partial<Record<Tab, boolean>>
}) {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {ITEMS.map(({ id, label, Icon }) => {
        const on = tab === id
        return (
          <button
            key={id}
            className={'tab-btn' + (on ? ' on' : '')}
            aria-current={on ? 'page' : undefined}
            onClick={() => {
              haptic(6)
              if (on) onReselect(id)
              else onChange(id)
            }}
          >
            <span className="tab-ic">
              <Icon active={on} />
              {badges?.[id] && <i className="badge-dot" aria-label="새 소식" />}
            </span>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
