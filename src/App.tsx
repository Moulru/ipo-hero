import { useEffect, useState } from 'react'
import { useStore } from './store'
import { refreshIpos } from './data/loadIpos'
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
  const [tab, setTab] = useState<Tab>('home')
  const [showClass, setShowClass] = useState(false)
  const [showDex, setShowDex] = useState(false)
  const [showRelicDex, setShowRelicDex] = useState(false)
  const [showAch, setShowAch] = useState(false)
  const [showSystem, setShowSystem] = useState(false)

  useEffect(() => {
    tick()
  }, [tick])

  // 앱 시작 시 최신 공모주 데이터(cron 갱신본) 가져오기 — 실패 시 번들 데이터 유지
  useEffect(() => {
    refreshIpos()
  }, [])

  // 다크 모드: html에 .dark 토글 (기본 라이트)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

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
