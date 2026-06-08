import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { refreshIpos, getIpos } from './data/loadIpos'
import { setupNative, applyStatusBar } from './lib/native'
import { syncListingNotifications } from './lib/notify'
import { confetti, haptic, toast } from './lib/juice'
import { achById } from './data/achievements'
import { TopBar } from './components/TopBar'
import { BottomNav, type Tab } from './components/BottomNav'
import { Dashboard } from './components/Dashboard'
import { Play } from './components/Play'
import { My } from './components/My'
import { Dex } from './components/Dex'
import { RelicDex } from './components/RelicDex'
import { Achievements } from './components/Achievements'
import { ClassPicker } from './components/ClassPicker'
import { SystemSettings } from './components/SystemSettings'
import { ResultModal } from './components/ResultModal'
import { RelicReveal } from './components/RelicReveal'
import { ToastHost } from './components/Toast'

export default function App() {
  const tick = useStore((s) => s.tick)
  const lastResult = useStore((s) => s.lastResult)
  const relicReveal = useStore((s) => s.relicReveal)
  const lastUnlocks = useStore((s) => s.lastUnlocks)
  const clearUnlocks = useStore((s) => s.clearUnlocks)
  const darkMode = useStore((s) => s.darkMode)
  const notifyListing = useStore((s) => s.notifyListing)
  const subscriptions = useStore((s) => s.subscriptions)
  const predictions = useStore((s) => s.predictions)
  const [tab, setTab] = useState<Tab>('home')
  const tabRef = useRef(tab)
  tabRef.current = tab
  const [showClass, setShowClass] = useState(false)
  const [showDex, setShowDex] = useState(false)
  const [showRelicDex, setShowRelicDex] = useState(false)
  const [showAch, setShowAch] = useState(false)
  const [showSystem, setShowSystem] = useState(false)

  useEffect(() => {
    tick()
  }, [tick])

  // 앱 시작: 최신 데이터 가져오기 + 네이티브(스플래시·뒤로가기) 초기화
  useEffect(() => {
    refreshIpos()
    // 뒤로가기: 오버레이 닫기 → (홈이 아니면)홈 탭 → 앱 종료
    setupNative(() => {
      if (tabRef.current !== 'home') {
        setTab('home')
        return true
      }
      return false
    })
  }, [])

  // 다크 모드: html에 .dark 토글 (기본 라이트) + 상태바 색
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    applyStatusBar(darkMode)
  }, [darkMode])

  // 상장일 로컬 알림: 참여(청약/예측) 종목의 상장일에 예약 (설정/참여 변경 시 재동기화)
  useEffect(() => {
    const betIds = Array.from(new Set([...Object.keys(subscriptions), ...Object.keys(predictions)]))
    syncListingNotifications(getIpos(), notifyListing, betIds)
  }, [notifyListing, subscriptions, predictions])

  useEffect(() => {
    if (lastUnlocks.length) {
      lastUnlocks.forEach((id) => {
        const a = achById(id)
        if (a) toast(`업적 달성: ${a.name} (+${a.gold}🪙)`, a.emoji)
      })
      confetti()
      haptic([20, 40, 20])
      clearUnlocks()
    }
  }, [lastUnlocks, clearUnlocks])

  return (
    <div className="app">
      <TopBar />
      <main className="screen">
        {tab === 'home' && <Dashboard />}
        {tab === 'play' && <Play onOpenCards={() => setShowRelicDex(true)} />}
        {tab === 'my' && (
          <My
            onPickClass={() => setShowClass(true)}
            onOpenDex={() => setShowDex(true)}
            onOpenAch={() => setShowAch(true)}
            onOpenSystem={() => setShowSystem(true)}
          />
        )}
      </main>
      <BottomNav tab={tab} onChange={setTab} />

      {showClass && <ClassPicker onClose={() => setShowClass(false)} />}
      {showSystem && <SystemSettings onClose={() => setShowSystem(false)} />}
      {showDex && <Dex onClose={() => setShowDex(false)} />}
      {showRelicDex && <RelicDex onClose={() => setShowRelicDex(false)} />}
      {showAch && <Achievements onClose={() => setShowAch(false)} />}
      {relicReveal && <RelicReveal />}
      {lastResult && <ResultModal />}
      <ToastHost />
    </div>
  )
}
