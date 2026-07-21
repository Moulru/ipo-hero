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

// 앱 시작 시 1회: 스플래시 숨김 + 하드웨어 뒤로가기 처리.
// onFallback(): 열린 오버레이가 없을 때 호출 — 처리하면 true(앱 종료 안 함), 아니면 false(종료).
export function setupNative(onFallback: () => boolean): void {
  if (!isNative) return
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
  StatusBar.setBackgroundColor({ color: darkMode ? '#0c0e14' : '#f6f4ef' }).catch(() => {})
  NavigationBarAppearance.setLight({ light: !darkMode }).catch(() => {})
}
