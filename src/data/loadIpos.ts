import { useSyncExternalStore } from 'react'
import type { Ipo } from '../types'
import { FALLBACK_IPOS } from './mockIpos'
import data from './ipos.json'

interface IpoFile {
  generatedAt?: string
  ipos?: Ipo[]
}

const bundled = data as unknown as IpoFile

function listFrom(file: IpoFile | null | undefined): Ipo[] {
  const list = file?.ipos
  return Array.isArray(list) && list.length > 0 ? list : FALLBACK_IPOS
}

// 번들된 데이터(빌드 시점) — 즉시 표시 + 오프라인 폴백
export function getIpos(): Ipo[] {
  return listFrom(bundled)
}

// ── 런타임 라이브 데이터: cron이 갱신한 ipos.json을 fetch해서 교체 ──
let current: Ipo[] = getIpos()
let generatedAt: string = bundled.generatedAt ?? ''
const listeners = new Set<() => void>()

// 최신 데이터 URL: 빌드 env(VITE_DATA_URL)로 절대경로 지정(모바일/외부 호스팅), 없으면 같은 출처의 /ipos.json
const DATA_URL = import.meta.env.VITE_DATA_URL || `${import.meta.env.BASE_URL}ipos.json`

// 앱 시작 시 1회 호출 — 실패(오프라인 등) 시 번들 데이터 유지
export async function refreshIpos(): Promise<void> {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' })
    if (!res.ok) return
    const json = (await res.json()) as IpoFile
    const list = json?.ipos
    if (!Array.isArray(list) || list.length === 0) return
    // generatedAt(ISO)이 더 최신일 때만 교체 — 동률/구버전 무시
    if (json.generatedAt && generatedAt && json.generatedAt <= generatedAt) return
    current = list
    generatedAt = json.generatedAt ?? generatedAt
    for (const fn of listeners) fn()
  } catch {
    // 네트워크 실패 → 번들 데이터 유지
  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// 컴포넌트용: 번들 데이터로 시작, refreshIpos 성공 시 자동 리렌더
export function useIpos(): Ipo[] {
  return useSyncExternalStore(subscribe, () => current, () => current)
}
