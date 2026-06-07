import { useStore, type NotifyRarity } from '../store'

const APP_VERSION = '0.0.1'

const RARITY_THRESHOLDS: { v: NotifyRarity; label: string }[] = [
  { v: 'all', label: '전체' },
  { v: 'rare', label: '레어↑' },
  { v: 'epic', label: '에픽↑' },
  { v: 'legendary', label: '레전더리' },
]

// 시스템 설정 (별도 상세 화면) — 화면(다크모드) · 알림 · 정보
export function SystemSettings({ onClose }: { onClose: () => void }) {
  const s = useStore()

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="dex-screen" onClick={(e) => e.stopPropagation()}>
        <div className="dex-screen-head">
          <h2>⚙️ 시스템 설정</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 화면 */}
        <div className="panel">
          <div className="block-title">🎨 화면</div>
          <Toggle label="다크 모드" checked={s.darkMode} onChange={(v) => s.setDark(v)} />
        </div>

        {/* 알림 */}
        <div className="panel">
          <div className="block-title">🔔 알림</div>
          <Toggle label="새 공모주 알림" checked={s.notifyNewIpo} onChange={(v) => s.setNotify({ notifyNewIpo: v })} />
          {s.notifyNewIpo && (
            <div className="notify-rarity">
              <span className="muted">알림 등급</span>
              <div className="rarity-seg">
                {RARITY_THRESHOLDS.map((opt) => (
                  <button
                    key={opt.v}
                    className={s.notifyMinRarity === opt.v ? 'seg sel' : 'seg'}
                    onClick={() => s.setNotify({ notifyMinRarity: opt.v })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Toggle label="상장일 알림" checked={s.notifyListing} onChange={(v) => s.setNotify({ notifyListing: v })} />
          <div className="settings-note muted">실제 휴대폰 알림은 앱(안드로이드) 출시 후 동작해요.</div>
        </div>

        {/* 정보 */}
        <div className="panel">
          <div className="block-title">ℹ️ 정보</div>
          <div className="info-row">
            <span>앱</span>
            <span className="muted">공모주 히어로</span>
          </div>
          <div className="info-row">
            <span>버전</span>
            <span className="muted">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="toggle-row" onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span>{label}</span>
      <span className={checked ? 'switch on' : 'switch'}>
        <span className="knob" />
      </span>
    </button>
  )
}
