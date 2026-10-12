import { Capacitor, registerPlugin } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { closeTopOverlay } from './backStack'

// 하단 시스템 네비게이션 바(뒤로가기·홈·최근앱) 아이콘 색상 — @capacitor/status-bar는
// 상태바만 제어하고 네비게이션 바는 건드리지 않아, 자체 네이티브 플러그인으로 보강.
// (android/app/.../NavigationBarAppearancePlugin.java, MainActivity에 등록)
interface NavigationBarAppearancePlugin {
  setLight(options: { light: boolean }): Promise<void>
}
const NavigationBarAppearance = registerPlugin<NavigationBarAppearancePlugin>('NavigationBarAppearance')

const isNative = Capacitor.isNativePlatform()

// 앱 배경색(styles/tokens.css의 --bg와 동일) — 상태바·브라우저 테마색 동기화용
export const THEME_BG = { light: '#f2f3f6', dark: '#0e0f12' } as const

// 앱 시작 시 1회: 스플래시 숨김 + 하드웨어 뒤로가기 처리.
// onFallback(): 열린 오버레이가 없을 때 호출 — 처리하면 true(앱 종료 안 함), 아니면 false(종료).
export function setupNative(onFallback: () => boolean): void {
  if (!isNative) {
    setupWebBack(onFallback)
    return
  }
  SplashScreen.hide().catch(() => {})
  CapApp.addListener('backButton', () => {
    if (closeTopOverlay()) return // 1) 열린 모달/시트부터 닫기
    if (onFallback()) return // 2) 탭 처리 등
    CapApp.exitApp().catch(() => {}) // 3) 앱 종료
  }).catch(() => {})
}

// 앱이 백그라운드에서 복귀할 때 콜백 (데이터 자동 갱신용). 웹=no-op.
export function onResume(cb: () => void): void {
  if (!isNative) return
  CapApp.addListener('resume', cb).catch(() => {})
}

// 상태바+네비게이션바 아이콘 색을 테마에 맞춤 (라이트=어두운 아이콘, 다크=밝은 아이콘).
// Style.Dark="어두운 배경용(밝은 아이콘)", Style.Light="밝은 배경용(어두운 아이콘)" — Capacitor 정의 기준.
export function applyStatusBar(darkMode: boolean): void {
  if (!isNative) return
  StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light }).catch(() => {})
  StatusBar.setBackgroundColor({ color: darkMode ? THEME_BG.dark : THEME_BG.light }).catch(() => {})
  NavigationBarAppearance.setLight({ light: !darkMode }).catch(() => {})
}

// 웹(브라우저): 뒤로가기 버튼을 앱 뒤로가기처럼 처리 — 가드 히스토리 항목을 하나 쌓아 두고,
// popstate 때 닫을 오버레이/탭이 있으면 처리 후 가드를 다시 쌓는다. 없으면 그대로 이탈.
let webBackReady = false
function setupWebBack(onFallback: () => boolean): void {
  if (webBackReady) return // StrictMode(개발)에서 이펙트가 두 번 돌아도 한 번만 등록
  webBackReady = true
  try {
    history.replaceState({ ipoHeroRoot: true }, '')
    history.pushState({ ipoHeroGuard: true }, '')
    window.addEventListener('popstate', () => {
      if (closeTopOverlay() || onFallback()) history.pushState({ ipoHeroGuard: true }, '')
      else history.back()
    })
  } catch {
    /* ignore */
  }
}
