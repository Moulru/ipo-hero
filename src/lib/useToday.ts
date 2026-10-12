import { useEffect, useState } from 'react'
import { todayYmd } from './calc'

// '오늘'(YYYY-MM-DD) — 자정 넘김·백그라운드 복귀에도 실제 날짜를 따르도록 1분마다/복귀 시 갱신
export function useToday(): string {
  const [today, setToday] = useState(todayYmd())
  useEffect(() => {
    const update = () => setToday(todayYmd())
    const onVis = () => {
      if (document.visibilityState === 'visible') update()
    }
    document.addEventListener('visibilitychange', onVis)
    const t = setInterval(update, 60_000) // 같은 값이면 리렌더 없음(React bail-out)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(t)
    }
  }, [])
  return today
}

// 상대 시각 표기를 주기적으로 다시 그리기 위한 현재 시각(ms)
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
