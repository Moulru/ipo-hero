import { useSyncExternalStore } from 'react'

// 화면 위에 쌓이는 상세 페이지 스택 (탭 화면 위로 오른쪽에서 밀려 들어옴)
export type Route =
  | { k: 'ipo'; id: string; tab?: 'info' | 'sim' }
  | { k: 'search' }
  | { k: 'settings' }
  | { k: 'ipoDex' }
  | { k: 'cardDex' }
  | { k: 'achievements' }
  | { k: 'licenses' }
  | { k: 'myBets' }
  | { k: 'listed' }

export interface NavEntry {
  key: number
  route: Route
  closing: boolean
}

let stack: NavEntry[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const PAGE_EXIT_MS = 240

export const nav = {
  push(route: Route) {
    // 같은 페이지 연속 중복 열기 방지(더블탭)
    const top = stack[stack.length - 1]
    if (top && !top.closing && JSON.stringify(top.route) === JSON.stringify(route)) return
    stack = [...stack, { key: ++seq, route, closing: false }]
    emit()
  },
  // 애니메이션 후 제거
  close(key: number) {
    const e = stack.find((x) => x.key === key)
    if (!e || e.closing) return
    stack = stack.map((x) => (x.key === key ? { ...x, closing: true } : x))
    emit()
    setTimeout(() => {
      stack = stack.filter((x) => x.key !== key)
      emit()
    }, PAGE_EXIT_MS)
  },
  closeAll() {
    stack.forEach((e) => nav.close(e.key))
  },
  get size() {
    return stack.filter((e) => !e.closing).length
  },
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useNavStack(): NavEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => stack,
    () => stack
  )
}

export const openIpo = (id: string, tab?: 'info' | 'sim') => nav.push({ k: 'ipo', id, tab })
