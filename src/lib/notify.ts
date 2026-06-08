import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Ipo } from '../types'

const isNative = Capacitor.isNativePlatform()

// 상장일 로컬 알림 동기화 — 참여한(청약/예측) 종목의 상장일 오전 9시에 알림 예약.
// 매번 기존 예약을 비우고 다시 깔아 멱등하게 유지. 백엔드 불필요(기기 자체 예약).
export async function syncListingNotifications(ipos: Ipo[], enabled: boolean, betIds: string[]): Promise<void> {
  if (!isNative) return
  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
    }
    if (!enabled) return

    const bet = new Set(betIds)
    const now = new Date()
    const targets = ipos
      .filter((i) => bet.has(i.id) && i.listingDate)
      .map((i) => ({ ipo: i, at: new Date(`${i.listingDate}T09:00:00`) }))
      .filter((x) => x.at.getTime() > now.getTime())
      .slice(0, 20)
    if (targets.length === 0) return

    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions()
      if (req.display !== 'granted') return
    }

    await LocalNotifications.schedule({
      notifications: targets.map((x, idx) => ({
        id: 2000 + idx,
        title: '오늘 상장일이에요 📈',
        body: `${x.ipo.name} 상장 예정일입니다. 결과를 확인해 정산하세요!`,
        schedule: { at: x.at },
      })),
    })
  } catch {
    // 권한 거부/플러그인 미지원 등 → 무시
  }
}
