import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

// 텍스트 공유: 네이티브 공유 시트 → Web Share API → 클립보드 복사 순 폴백.
// 반환: 'shared'(공유 시트 열림) | 'copied'(클립보드 복사됨) | null(취소/실패 — 조용히 무시)
export async function shareText(title: string, text: string): Promise<'shared' | 'copied' | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text, dialogTitle: title })
      return 'shared'
    } catch {
      return null // 사용자가 공유 시트를 닫아도 reject됨 — 무시
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch {
      return null
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return null
  }
}
