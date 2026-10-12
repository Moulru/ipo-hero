import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { haptic } from './juice'

const THRESHOLD = 72
const MAX = 120

// 스크롤 맨 위에서 아래로 당기면 새로고침 (터치 전용). pull=당긴 거리(px), refreshing=진행 중
export function usePullToRefresh(ref: MutableRefObject<HTMLElement | null>, onRefresh: () => Promise<unknown>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const st = useRef({ y0: 0, active: false, armed: false, busy: false })
  const cb = useRef(onRefresh)
  cb.current = onRefresh

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const s = st.current
    const start = (e: TouchEvent) => {
      if (s.busy || el.scrollTop > 0) return
      s.y0 = e.touches[0].clientY
      s.active = true
      s.armed = false
    }
    const move = (e: TouchEvent) => {
      if (!s.active) return
      const dy = e.touches[0].clientY - s.y0
      if (dy <= 0 || el.scrollTop > 0) {
        if (dy <= 0) setPull(0)
        return
      }
      e.preventDefault() // 브라우저 기본 오버스크롤 대신 자체 인디케이터
      const d = Math.min(MAX, dy * 0.5)
      setPull(d)
      if (d >= THRESHOLD && !s.armed) {
        s.armed = true
        haptic(10)
      } else if (d < THRESHOLD) s.armed = false
    }
    const end = async () => {
      if (!s.active) return
      s.active = false
      if (s.armed) {
        s.busy = true
        setRefreshing(true)
        setPull(56)
        const t0 = Date.now()
        try {
          await cb.current()
        } finally {
          // 너무 빨리 끝나도 인디케이터가 한 번은 보이게
          setTimeout(() => {
            setRefreshing(false)
            setPull(0)
            s.busy = false
          }, Math.max(0, 500 - (Date.now() - t0)))
        }
      } else setPull(0)
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
    }
  }, [ref])

  return { pull, refreshing, progress: Math.min(1, pull / THRESHOLD) }
}
