import { useEffect, useRef, useState } from 'react'

// 숫자가 부드럽게 올라가는 카운트업
export function CountUp({ value, ms = 600 }: { value: number; ms?: number }) {
  const [disp, setDisp] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    if (from === to) {
      setDisp(to)
      return
    }
    // setInterval 기반 트윈 (헤드리스/백그라운드에서도 동작)
    const steps = Math.max(1, Math.round(ms / 40))
    let i = 0
    const id = setInterval(() => {
      i++
      const p = Math.min(1, i / steps)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(from + (to - from) * eased))
      if (p >= 1) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [value, ms])

  return <>{disp.toLocaleString('ko-KR')}</>
}
