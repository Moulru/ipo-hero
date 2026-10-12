import { useEffect, useRef, useState } from 'react'
import { onToast, type ToastMsg } from '../lib/juice'
import { Emoji } from './Emoji'
import { useNavStack } from '../nav'

// 하단 스낵바 토스트 — 한 번에 하나(새 메시지가 이전 것을 교체), 2.4초 후 사라짐
export function ToastHost() {
  const [cur, setCur] = useState<(ToastMsg & { out?: boolean }) | null>(null)
  const timers = useRef<number[]>([])
  const overPage = useNavStack().some((e) => !e.closing)
  useEffect(
    () =>
      onToast((t) => {
        timers.current.forEach(clearTimeout)
        setCur(t)
        timers.current = [
          window.setTimeout(() => setCur((c) => (c && c.id === t.id ? { ...c, out: true } : c)), 2400),
          window.setTimeout(() => setCur((c) => (c && c.id === t.id ? null : c)), 2650),
        ]
      }),
    []
  )
  return (
    <div className={'toast-host' + (overPage ? ' over-page' : '')} aria-live="polite" role="status">
      {cur && (
        <div key={cur.id} className={'toast' + (cur.out ? ' out' : '')}>
          {cur.icon && <Emoji e={cur.icon} size={22} />}
          <span>{cur.text}</span>
        </div>
      )}
    </div>
  )
}
