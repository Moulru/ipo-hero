import { useEffect, useRef } from 'react'

// 안드로이드 하드웨어 뒤로가기: 열린 오버레이(모달/시트)를 먼저 닫기 위한 스택.
type CloseFn = () => void
const stack: CloseFn[] = []

function register(fn: CloseFn): () => void {
  stack.push(fn)
  return () => {
    const i = stack.lastIndexOf(fn)
    if (i >= 0) stack.splice(i, 1)
  }
}

// 가장 최근에 열린 오버레이를 닫는다. 닫을 게 있으면 true.
export function closeTopOverlay(): boolean {
  const fn = stack[stack.length - 1]
  if (fn) {
    fn()
    return true
  }
  return false
}

// 오버레이 컴포넌트에서 호출 — 마운트되어 있는 동안 뒤로가기 닫기 대상으로 등록.
export function useBackClose(onClose: () => void): void {
  const ref = useRef(onClose)
  ref.current = onClose
  useEffect(() => register(() => ref.current()), [])
}
