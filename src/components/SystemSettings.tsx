import { Capacitor } from '@capacitor/core'
import { useStore } from '../store'
import { useBackClose } from '../lib/backStack'
import { refreshIpos, useDataTimestamp } from '../data/loadIpos'
import { toast } from '../lib/juice'

const APP_VERSION = '1.0.0'
const CONTACT_EMAIL = 'contact@eous.cc'
const PRIVACY_URL = 'https://app.eous.cc/ipo-hero-privacy'

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
              const r = await refreshIpos()
              if (r === 'updated') toast('최신 공모주 데이터로 갱신했어요', '🔄')
              else if (r === 'same') toast('이미 최신 데이터예요', '✅')
              else toast('네트워크 연결을 확인해 주세요', '⚠️')
            }}
          >
            데이터 새로고침
          </button>
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
          {/* 네이티브(WebView)에선 target=_blank가 무반응일 수 있어 메인 프레임 내비게이션으로 —
              외부 호스트는 Capacitor가 시스템 브라우저로 넘김 */}
          <a
            className="info-row info-link"
            href={PRIVACY_URL}
            target={Capacitor.isNativePlatform() ? undefined : '_blank'}
            rel="noopener noreferrer"
          >
            <span>개인정보처리방침</span>
            <span className="muted">보기 ›</span>
          </a>
          <div className="settings-note muted">
            공모주 히어로는 정보 제공·가상 모의청약 앱으로, 투자 자문·권유가 아니에요. 데이터는 DART·KIND 등 공개 자료
            기반으로 지연·오류가 있을 수 있어요.
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
