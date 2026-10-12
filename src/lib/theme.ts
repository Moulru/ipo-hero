import { useEffect, useState } from 'react'
import type { ThemeMode } from '../store'
import { THEME_BG, applyStatusBar } from './native'

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

// 시스템 다크 모드 여부(변경 구독)
function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => !!mq?.matches)
  useEffect(() => {
    if (!mq) return
    const on = () => setDark(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return dark
}

// 테마 적용: html.dark 토글 + 브라우저 theme-color + 네이티브 상태바/내비게이션바
export function useApplyTheme(mode: ThemeMode): boolean {
  const systemDark = useSystemDark()
  const dark = mode === 'dark' || (mode === 'system' && systemDark)
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-switching') // 전환 순간 트랜지션 깜빡임 방지
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
    // index.html의 미디어별 theme-color(첫 페인트용)를 앱 테마 기준 하나로 교체
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove())
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = dark ? THEME_BG.dark : THEME_BG.light
    document.head.appendChild(meta)
    document.documentElement.style.background = dark ? THEME_BG.dark : THEME_BG.light
    applyStatusBar(dark)
    const t = setTimeout(() => root.classList.remove('theme-switching'), 50)
    return () => clearTimeout(t)
  }, [dark])
  return dark
}
