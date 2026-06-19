import { useStore } from '../store'
import { useBackClose } from '../lib/backStack'
import { refreshIpos, useDataTimestamp } from '../data/loadIpos'
import { toast } from '../lib/juice'

const APP_VERSION = '0.0.1'
const CONTACT_EMAIL = 'contact@eous.cc'

function fmtTime(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 시스템 설정 (별도 상세 화면) — 화면(다크/진동) · 데이터(새로고침) · 정보
export function SystemSettings({ onClose }: { onClose: () => void }) {
  useBackClose(onClose)
  const s = useStore()
  const updatedAt = useDataTimestamp()

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
          <Toggle label="진동 효과" checked={s.haptics} onChange={(v) => s.setHaptics(v)} />
        </div>

        {/* 데이터 */}
        <div className="panel">
          <div className="block-title">🔄 데이터</div>
          <div className="info-row">
            <span>마지막 갱신</span>
            <span className="muted">{fmtTime(updatedAt)}</span>
          </div>
          <button
            className="refresh-btn"
            onClick={async () => {
              await refreshIpos()
              toast('최신 공모주 데이터로 갱신했어요', '🔄')
            }}
          >
            데이터 새로고침
          </button>
          <div className="settings-note muted">공모주 데이터는 앱 실행 시 자동으로 최신화돼요.</div>
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
          <div className="info-row">
            <span>개인정보</span>
            <span className="muted">수집하지 않음</span>
          </div>
          <div className="info-row">
            <span>문의</span>
            <span className="muted">{CONTACT_EMAIL}</span>
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
