// 게임 "손맛" 유틸: 진동 · 콘페티 · 토스트. (사운드 없음 — 단순화)

// 진동 on/off (시스템 설정에서 토글). App이 store 값으로 동기화.
let hapticsEnabled = true
export function setHapticsEnabled(v: boolean): void {
  hapticsEnabled = v
}

export function haptic(ms: number | number[] = 12): void {
  if (!hapticsEnabled) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

export function confetti(colors: string[] = ['#ffb01f', '#5b8cff', '#b06bff', '#2fd180', '#ff5c8a']): void {
  try {
    const c = document.createElement('canvas')
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2000'
    c.width = window.innerWidth
    c.height = window.innerHeight
    document.body.appendChild(c)
    setTimeout(() => c.remove(), 2500) // rAF가 멈춰도 캔버스 정리 보장
    const ctx = c.getContext('2d')
    if (!ctx) return
    const parts = Array.from({ length: 110 }, () => ({
      x: c.width / 2 + (Math.random() - 0.5) * 120,
      y: c.height * 0.42,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1) * 13 - 4,
      g: 0.38 + Math.random() * 0.3,
      size: 5 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
    }))
    let frame = 0
    const tick = () => {
      frame++
      ctx.clearRect(0, 0, c.width, c.height)
      for (const p of parts) {
        p.vy += p.g
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, 1 - frame / 110)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
      if (frame < 110) requestAnimationFrame(tick)
      else c.remove()
    }
    requestAnimationFrame(tick)
  } catch {
    /* ignore */
  }
}

// ===== Toast pub/sub =====
export interface ToastMsg {
  id: number
  text: string
  icon?: string
}
const listeners = new Set<(t: ToastMsg) => void>()
let tid = 0
export function toast(text: string, icon?: string): void {
  const t = { id: ++tid, text, icon }
  listeners.forEach((l) => l(t))
}
export function onToast(cb: (t: ToastMsg) => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
