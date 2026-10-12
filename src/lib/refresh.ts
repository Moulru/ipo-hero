import { refreshIpos } from '../data/loadIpos'
import { toast } from './juice'

// 사용자가 직접 누른 새로고침 — 결과를 토스트로 알림
export async function manualRefresh(): Promise<void> {
  const r = await refreshIpos()
  if (r === 'updated') toast('최신 공모주 정보로 업데이트했어요', '✅')
  else if (r === 'same') toast('이미 최신 정보예요', '👌')
  else toast('인터넷 연결을 확인해 주세요', '📡')
}
