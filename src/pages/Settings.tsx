import { useState } from 'react'
import { useStore, type ThemeMode } from '../store'
import { useDataTimestamp } from '../data/loadIpos'
import { SEED_MONEY } from '../lib/calc'
import { fmtDateTime, fmtKrw, relTime } from '../lib/format'
import { useNow } from '../lib/useToday'
import { manualRefresh } from '../lib/refresh'
import { haptic, toast } from '../lib/juice'
import { nav } from '../nav'
import { Page } from '../ui/Page'
import { clearDrafts } from './IpoDetail'
import { Confirm } from '../ui/Sheet'
import { Card, MenuRow, Segmented, Switch } from '../ui/kit'
import { ExternalLink, FileText, Info, Mail, Moon, RefreshCw, RotateCcw, Sun } from '../ui/icons'

export const APP_VERSION = '2.0.0' // android versionName과 동일하게 유지
const CONTACT_EMAIL = 'contact@eous.cc'
const PRIVACY_URL = 'https://app.eous.cc/ipo-hero-privacy'

export function SettingsPage() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const haptics = useStore((s) => s.haptics)
  const setHaptics = useStore((s) => s.setHaptics)
  const resetSeason = useStore((s) => s.resetSeason)
  const updatedAt = useDataTimestamp()
  const now = useNow()
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <Page title="설정">
      <div className="settings">
        <div className="menu-group-title">화면</div>
        <Card pad={false}>
          <div className="menu-row col">
            <span className="menu-txt">
              <span className="menu-label">테마</span>
              <span className="menu-sub">시스템 설정을 따르면 기기 테마에 맞춰 바뀌어요</span>
            </span>
            <Segmented<ThemeMode>
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'system', label: '시스템' },
                {
                  value: 'light',
                  label: (
                    <>
                      <Sun size={15} strokeWidth={2.4} />
                      라이트
                    </>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <>
                      <Moon size={15} strokeWidth={2.4} />
                      다크
                    </>
                  ),
                },
              ]}
            />
          </div>
          <div className="menu-row">
            <span className="menu-txt">
              <span className="menu-label">진동</span>
              <span className="menu-sub">버튼을 누르거나 보상을 받을 때 가볍게 진동해요</span>
            </span>
            <Switch
              checked={haptics}
              label="진동"
              onChange={(v) => {
                setHaptics(v)
                if (v) setTimeout(() => haptic(20), 30)
              }}
            />
          </div>
        </Card>

        <div className="menu-group-title">데이터</div>
        <Card pad={false}>
          <MenuRow
            icon={<RefreshCw size={22} strokeWidth={2} className={busy ? 'spin' : undefined} />}
            label="지금 새로고침"
            sub={updatedAt ? `${fmtDateTime(updatedAt)} 기준 · ${relTime(updatedAt, now)}` : '업데이트 정보 없음'}
            onClick={async () => {
              if (busy) return
              setBusy(true)
              await manualRefresh()
              setBusy(false)
            }}
            chevron={false}
          />
          <p className="settings-note">공모주 정보는 30분마다 자동으로 모아요. 앱을 다시 열 때도 최신 정보를 불러와요.</p>
        </Card>

        <div className="menu-group-title">모의청약</div>
        <Card pad={false}>
          <MenuRow
            icon={<RotateCcw size={22} strokeWidth={2} />}
            label="시즌 초기화"
            sub={`시즌 자산을 ${fmtKrw(SEED_MONEY)}으로 되돌려요`}
            danger
            onClick={() => setConfirmReset(true)}
            chevron={false}
          />
        </Card>

        <div className="menu-group-title">정보</div>
        <Card pad={false}>
          <MenuRow icon={<Info size={22} strokeWidth={2} />} label="앱 버전" value={`v${APP_VERSION}`} />
          <MenuRow
            icon={<Mail size={22} strokeWidth={2} />}
            label="문의하기"
            value={CONTACT_EMAIL}
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[공모주 히어로] 문의')}`}
          />
          <MenuRow icon={<ExternalLink size={22} strokeWidth={2} />} label="개인정보처리방침" href={PRIVACY_URL} />
          <MenuRow icon={<FileText size={22} strokeWidth={2} />} label="오픈소스 라이선스" onClick={() => nav.push({ k: 'licenses' })} />
        </Card>

        <div className="settings-foot">
          <p>공모주 히어로는 개인정보를 수집하지 않아요. 모든 기록은 이 기기에만 저장돼요.</p>
          <p>
            정보 제공과 가상 모의청약을 위한 서비스로, 투자 자문이나 권유가 아니에요. 데이터는 DART·KIND 등 공개 자료를 바탕으로 하며
            지연되거나 다를 수 있어요.
          </p>
        </div>
      </div>

      {confirmReset && (
        <Confirm
          title="시즌을 초기화할까요?"
          desc={
            <>
              시즌 자산이 {fmtKrw(SEED_MONEY)}으로 돌아가고, 정산 전인 모의청약과 예측이 모두 사라져요. 등급·골드·카드·도감은 그대로 남아요.
            </>
          }
          confirmLabel="초기화"
          danger
          onConfirm={() => {
            resetSeason()
            clearDrafts()
            haptic([10, 40, 10])
            toast('새 시즌을 시작했어요', '🌱')
          }}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </Page>
  )
}

// 오픈소스 라이선스 고지
const LICENSES: { name: string; license: string; by: string; url: string }[] = [
  { name: 'React', license: 'MIT', by: 'Meta Platforms, Inc.', url: 'https://github.com/facebook/react' },
  { name: 'Zustand', license: 'MIT', by: 'Poimandres', url: 'https://github.com/pmndrs/zustand' },
  { name: 'Capacitor', license: 'MIT', by: 'Ionic', url: 'https://github.com/ionic-team/capacitor' },
  { name: 'Pretendard', license: 'SIL Open Font License 1.1', by: 'Kil Hyung-jin', url: 'https://github.com/orioncactus/pretendard' },
  { name: 'Lucide Icons', license: 'ISC', by: 'Lucide Contributors', url: 'https://github.com/lucide-icons/lucide' },
  { name: 'Fluent Emoji', license: 'MIT', by: 'Microsoft Corporation', url: 'https://github.com/microsoft/fluentui-emoji' },
  { name: '@lobehub/fluent-emoji-3d', license: 'MIT', by: 'LobeHub', url: 'https://github.com/lobehub/fluent-emoji' },
  { name: 'Vite', license: 'MIT', by: 'VoidZero Inc. and contributors', url: 'https://github.com/vitejs/vite' },
]

export function LicensesPage() {
  return (
    <Page title="오픈소스 라이선스">
      <p className="page-lead">공모주 히어로는 아래 오픈소스 소프트웨어와 리소스를 사용해요. 만들어 주신 분들께 감사드려요.</p>
      <Card pad={false}>
        {LICENSES.map((l) => (
          <MenuRow key={l.name} label={l.name} sub={`${l.license} · ${l.by}`} href={l.url} />
        ))}
      </Card>
    </Page>
  )
}
