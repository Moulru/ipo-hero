import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { refreshIpos } from './data/loadIpos'
import { setupNative, onResume } from './lib/native'
import { confetti, haptic, setHapticsEnabled, toast } from './lib/juice'
import { useApplyTheme } from './lib/theme'
import { useToday } from './lib/useToday'
import { achById } from './data/achievements'
import { nav, useNavStack, type Route } from './nav'
import { PageProvider } from './ui/Page'
import { ToastHost } from './ui/Toast'
import { preloadEmoji } from './ui/Emoji'
import { TabBar, type Tab } from './components/TabBar'
import { Home } from './screens/Home'
import { CalendarTab } from './screens/CalendarTab'
import { Lounge, useLoungeBadge } from './screens/Lounge'
import { MyTab } from './screens/MyTab'
import { IpoDetailPage } from './pages/IpoDetail'
import { SearchPage } from './pages/Search'
import { LicensesPage, SettingsPage } from './pages/Settings'
import { AchievementsPage, CardDexPage, IpoDexPage, ListedPage, MyBetsPage } from './pages/Collections'
import { CardReveal, SettleResult } from './overlays/Overlays'
import { computeOffline, startGame } from './game/engine'
import { fmtBig, rewardScale } from './game/balance'
import { OfflineSheet } from './sheets/GameSheets'

export default function App() {
  const tick = useStore((s) => s.tick)
  const lastResult = useStore((s) => s.lastResult)
  const relicReveal = useStore((s) => s.relicReveal)
  const lastUnlocks = useStore((s) => s.lastUnlocks)
  const clearUnlocks = useStore((s) => s.clearUnlocks)
  const theme = useStore((s) => s.theme)
  const haptics = useStore((s) => s.haptics)
  const today = useToday()
  const loungeBadge = useLoungeBadge(today)
  const stack = useNavStack()

  const [tab, setTab] = useState<Tab>('home')
  const [offline, setOffline] = useState<{ sec: number; kills: number; gold: number } | null>(null)
  // 한 번 방문한 탭은 마운트 유지(스크롤 위치·입력 상태 보존)
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set(['home']))
  const tabRef = useRef(tab)
  tabRef.current = tab

  useApplyTheme(theme)

  // 앱 진입·자정 넘김(포그라운드 유지 중 포함) 시 출석·퀘스트 갱신
  useEffect(() => {
    tick()
  }, [tick, today])

  // 앱 시작: 최신 데이터 + 네이티브(스플래시·뒤로가기) 초기화
  useEffect(() => {
    preloadEmoji(['🎰', '📦', '🎉', '😢', '🙂', '😅', '🎯', '💨', '🪙', '⭐', '🎁', '✅', '👌', '📡'])
    refreshIpos()
    // 라운지 RPG: 자리를 비운 동안의 보상 정산 후 전투 루프 시작
    const settleOffline = () => {
      const o = computeOffline()
      const st = useStore.getState()
      if (o) {
        st.rpgOffline(o.gold, o.kills)
        setOffline(o)
      } else st.rpgSeen()
    }
    settleOffline()
    startGame()
    // 뒤로가기: (오버레이·페이지는 backStack이 먼저 처리) → 홈 탭이 아니면 홈으로 → 앱 종료
    setupNative(() => {
      if (tabRef.current !== 'home') {
        setTab('home')
        return true
      }
      return false
    })
    // 백그라운드 복귀 시 데이터 자동 갱신 + 날짜 롤오버(출석·퀘스트) 반영
    onResume(() => {
      settleOffline()
      refreshIpos()
      tick()
    })
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        useStore.getState().rpgSeen() // 방치 보상 기준 시각
        return
      }
      if (document.visibilityState === 'visible') {
        settleOffline()
        refreshIpos()
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    setHapticsEnabled(haptics)
  }, [haptics])

  // 업적 달성 알림
  useEffect(() => {
    if (!lastUnlocks.length) return
    lastUnlocks.forEach((id, i) => {
      const a = achById(id)
      if (a)
        setTimeout(
          () => toast(`업적 달성 · ${a.name} (${fmtBig(a.gold * rewardScale(useStore.getState().rpg.best))}골드)`, a.emoji),
          i * 2700
        )
    })
    confetti()
    haptic([20, 40, 20])
    clearUnlocks()
  }, [lastUnlocks, clearUnlocks])

  const changeTab = (t: Tab) => {
    setVisited((v) => (v.has(t) ? v : new Set(v).add(t)))
    setTab(t)
  }

  return (
    <div className="app">
      {(['home', 'calendar', 'lounge', 'my'] as Tab[]).map((t) =>
        visited.has(t) ? (
          <section key={t} className="tab-view" hidden={tab !== t} aria-hidden={tab !== t || stack.length > 0}>
            {t === 'home' && <Home today={today} />}
            {t === 'calendar' && <CalendarTab today={today} />}
            {t === 'lounge' && <Lounge today={today} active={tab === 'lounge' && !stack.some((e) => !e.closing)} />}
            {t === 'my' && <MyTab />}
          </section>
        ) : null
      )}

      <TabBar
        tab={tab}
        onChange={changeTab}
        onReselect={(t) => window.dispatchEvent(new CustomEvent('tab-reselect', { detail: t }))}
        badges={{ lounge: loungeBadge }}
      />

      {stack.map((e) => (
        <PageProvider key={e.key} value={{ key: e.key, closing: e.closing }}>
          {renderRoute(e.route)}
        </PageProvider>
      ))}

      {relicReveal && <CardReveal />}
      {lastResult && <SettleResult />}
      {offline && <OfflineSheet {...offline} onClose={() => setOffline(null)} />}
      <ToastHost />
    </div>
  )
}

function renderRoute(r: Route) {
  switch (r.k) {
    case 'ipo':
      return <IpoDetailPage id={r.id} initialTab={r.tab} />
    case 'search':
      return <SearchPage />
    case 'settings':
      return <SettingsPage />
    case 'licenses':
      return <LicensesPage />
    case 'ipoDex':
      return <IpoDexPage />
    case 'cardDex':
      return <CardDexPage />
    case 'achievements':
      return <AchievementsPage />
    case 'myBets':
      return <MyBetsPage />
    case 'listed':
      return <ListedPage />
  }
}

// 개발 편의: 콘솔에서 페이지 열기 (window.__nav.push({k:'settings'}))
if (import.meta.env.DEV) (window as unknown as { __nav: typeof nav }).__nav = nav
