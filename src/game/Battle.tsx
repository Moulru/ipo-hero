import { useEffect, useRef } from 'react'
import { SPRITES } from './sprites'
import { game, tapAttack, type Fx } from './engine'
import { zoneOf } from './balance'

// 논리 해상도 160×90(16:9) — 실제 캔버스는 기기 해상도로 그리고 도트는 정수 배율로 확대(선명)
const LW = 160
const LH = 90
const GROUND = 70
const HERO_X = 34
const MON_X = 108

// 스프라이트 → 오프스크린 캔버스(지역별 색조·피격 흰색 변형 캐시)
const cache = new Map<string, HTMLCanvasElement>()
function spriteCanvas(key: string, hue = 0, white = false): HTMLCanvasElement {
  const id = `${key}|${hue}|${white}`
  const hit = cache.get(id)
  if (hit) return hit
  const sp = SPRITES[key]
  const base = document.createElement('canvas')
  base.width = 16
  base.height = 16
  const bctx = base.getContext('2d')!
  sp.px.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return
      bctx.fillStyle = white ? '#ffffff' : sp.pal[ch]
      bctx.fillRect(x, y, 1, 1)
    })
  )
  let out = base
  if (hue && !white) {
    out = document.createElement('canvas')
    out.width = 16
    out.height = 16
    const o = out.getContext('2d')!
    o.filter = `hue-rotate(${hue}deg)`
    o.drawImage(base, 0, 0)
  }
  cache.set(id, out)
  return out
}

export function Battle({ active, onTap }: { active: boolean; onTap?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    let raf = 0
    let k = 1
    const resize = () => {
      const w = wrap.current!.clientWidth
      const dpr = Math.min(3, window.devicePixelRatio || 1)
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(((w * LH) / LW) * dpr)
      k = cv.width / LW
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap.current!)
    const draw = () => {
      render(ctx, k)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [active])

  return (
    <div className="battle-canvas" ref={wrap}>
      <canvas
        ref={ref}
        aria-label="전투 화면 — 탭하면 추가 공격"
        role="img"
        onPointerDown={() => {
          if (tapAttack()) onTap?.()
        }}
      />
    </div>
  )
}

function render(ctx: CanvasRenderingContext2D, k: number) {
  const g = game
  const zone = zoneOf(g.monster.stage)
  ctx.imageSmoothingEnabled = false
  ctx.save()
  // 치명타 화면 흔들림
  if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 2 * k, (Math.random() - 0.5) * 2 * k)

  // 하늘
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND * k)
  sky.addColorStop(0, zone.sky[0])
  sky.addColorStop(1, zone.sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(-4 * k, -4 * k, (LW + 8) * k, (LH + 8) * k)

  // 별(밤·동굴 지역) / 해
  if (zone.name === '별빛 하늘' || zone.name === '깊은 동굴') {
    ctx.fillStyle = 'rgba(255,255,255,.8)'
    for (let i = 0; i < 26; i++) {
      const x = ((i * 53 + 7) % LW) - ((g.scroll * 0.05) % LW)
      const y = (i * 29) % 46
      const tw = Math.sin(g.time * 2 + i) > 0.6 ? 1 : 0.5
      ctx.globalAlpha = tw
      px(ctx, (x + LW) % LW, y + 2, 1, 1, k)
    }
    ctx.globalAlpha = 1
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.55)'
    // 구름
    for (let i = 0; i < 3; i++) {
      const x = ((i * 70 + 20 - g.scroll * 0.15) % (LW + 40)) - 20
      const cx = x < -20 ? x + LW + 40 : x
      px(ctx, cx, 10 + i * 9, 18, 3, k)
      px(ctx, cx + 4, 7 + i * 9, 10, 3, k)
    }
  }

  // 먼 언덕(시차 스크롤)
  ctx.fillStyle = zone.hill
  for (let x = 0; x <= LW; x += 2) {
    const wx = x + g.scroll * 0.35
    const h = 10 + Math.round(Math.sin(wx * 0.045) * 5 + Math.sin(wx * 0.11) * 2)
    px(ctx, x, GROUND - h, 2, h, k)
  }

  // 땅
  ctx.fillStyle = zone.ground
  px(ctx, 0, GROUND, LW, 4, k)
  ctx.fillStyle = zone.dirt
  px(ctx, 0, GROUND + 4, LW, LH - GROUND - 4, k)
  // 바닥 타일 무늬(이동감)
  ctx.fillStyle = 'rgba(0,0,0,.12)'
  const off = Math.floor(g.scroll) % 12
  for (let x = -off; x < LW; x += 12) {
    px(ctx, x, GROUND + 7, 5, 1, k)
    px(ctx, x + 6, GROUND + 12, 4, 1, k)
  }
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  for (let x = -off; x < LW; x += 12) px(ctx, x + 2, GROUND, 3, 1, k)

  // 보스 스테이지: 화면을 살짝 어둡게
  if (g.monster.boss) {
    ctx.fillStyle = 'rgba(60,0,20,.18)'
    ctx.fillRect(0, 0, LW * k, LH * k)
  }

  // ── 영웅 ──
  const walking = g.phase === 'walk'
  const bob = walking ? Math.round(Math.abs(Math.sin(g.time * 12)) * 1.5) : Math.round(Math.sin(g.time * 3) * 0.6)
  let hx = HERO_X + (g.heroLunge > 0 ? Math.sin((g.heroLunge / 0.16) * Math.PI) * 9 : 0)
  let hy = GROUND - 32 - bob
  let heroAlpha = 1
  let heroRot = 0
  if (g.phase === 'lose') {
    const t = Math.min(1, g.phaseT / 0.6)
    heroRot = (-Math.PI / 2) * t
    hy += 10 * t
    heroAlpha = 1 - Math.max(0, (g.phaseT - 0.7) / 0.6)
    hx -= g.phaseT * 6
  }
  shadow(ctx, HERO_X + 16, GROUND + 1, 12, k)
  drawSprite(ctx, 'knight', hx, hy, 2, k, 0, g.heroFlash > 0, heroAlpha, heroRot)

  // 공격 이펙트(베기)
  if (g.heroLunge > 0.04) {
    const t = 1 - g.heroLunge / 0.16
    ctx.strokeStyle = `rgba(255,255,255,${0.9 - t * 0.6})`
    ctx.lineWidth = 2 * k
    ctx.beginPath()
    ctx.arc((MON_X + 8) * k, (GROUND - 18) * k, 14 * k, -1.2 + t, 0.6 + t)
    ctx.stroke()
  }

  // ── 몬스터 ──
  const m = g.monster
  const scale = m.boss ? 2.6 : 2
  const size = 16 * scale
  let mx = MON_X - (size - 32) / 2
  if (g.phase === 'walk') mx += (1 - easeOut(Math.min(1, g.phaseT / 0.9))) * 70
  if (g.monLunge > 0) mx -= Math.sin((g.monLunge / 0.16) * Math.PI) * 8
  let my = GROUND - size + Math.round(Math.sin(g.time * 4 + 1) * 1)
  if (m.kind === 'bat' || m.kind === 'ghost') my -= 8 + Math.sin(g.time * 3) * 2 // 비행형
  let monAlpha = 1
  if (g.phase === 'win') {
    monAlpha = 1 - Math.min(1, g.phaseT / 0.45)
    my += g.phaseT * 14
  }
  if (monAlpha > 0) {
    shadow(ctx, mx + size / 2, GROUND + 1, size * 0.38, k, monAlpha)
    drawSprite(ctx, m.kind, mx, my, scale, k, zone.hue, g.monFlash > 0, monAlpha, 0)
  }
  // 처치 파편
  if (g.phase === 'win' && g.phaseT < 0.6) {
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      const r = g.phaseT * 60
      ctx.globalAlpha = 1 - g.phaseT / 0.6
      px(ctx, mx + size / 2 + Math.cos(a) * r, GROUND - size / 2 + Math.sin(a) * r * 0.6, 2, 2, k)
    }
    ctx.globalAlpha = 1
  }

  // ── HP 바 ──
  if (g.phase !== 'lose') hpBar(ctx, HERO_X + 2, GROUND - 40, 28, g.heroHp / Math.max(1, g.heroMax), '#38d97a', k)
  if (g.phase === 'fight' || g.phase === 'walk') {
    hpBar(ctx, mx + size / 2 - 16, my - 8, 32, g.monHp / Math.max(1, m.hp), m.boss ? '#ff4d6a' : '#ff8a3d', k)
    // 몬스터 이름
    ctx.font = `700 ${Math.round(5.2 * k)}px 'Pretendard Variable', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(0,0,0,.45)'
    ctx.fillText(SPRITES[m.kind].name, (mx + size / 2) * k + k * 0.5, (my - 10.5) * k + k * 0.5)
    ctx.fillStyle = '#fff'
    ctx.fillText(SPRITES[m.kind].name, (mx + size / 2) * k, (my - 10.5) * k)
  }

  // ── 데미지 숫자 ──
  for (const f of g.fx) drawFx(ctx, f, k, mx + size / 2, my)

  // 보스 등장 배너
  if (m.boss && g.phase === 'walk') {
    const a = Math.min(1, g.phaseT / 0.2) * (1 - Math.max(0, (g.phaseT - 0.7) / 0.2))
    ctx.globalAlpha = a
    ctx.fillStyle = 'rgba(20,0,10,.6)'
    ctx.fillRect(0, 30 * k, LW * k, 16 * k)
    ctx.font = `900 ${Math.round(10 * k)}px 'Pretendard Variable', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ff4d6a'
    ctx.fillText('BOSS', (LW / 2) * k, 41.5 * k)
    ctx.globalAlpha = 1
  }
  if (g.phase === 'lose') {
    ctx.globalAlpha = Math.min(1, g.phaseT / 0.3)
    ctx.fillStyle = 'rgba(0,0,0,.35)'
    ctx.fillRect(0, 0, LW * k, LH * k)
    ctx.font = `800 ${Math.round(9 * k)}px 'Pretendard Variable', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.fillText('후퇴! 이전 스테이지에서 재정비해요', (LW / 2) * k, 40 * k)
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, k: number) {
  ctx.fillRect(Math.round(x * k), Math.round(y * k), Math.ceil(w * k), Math.ceil(h * k))
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  scale: number,
  k: number,
  hue: number,
  white: boolean,
  alpha: number,
  rot: number
) {
  const img = spriteCanvas(key, hue, white)
  const w = 16 * scale * k
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(Math.round(x * k + w / 2), Math.round(y * k + w / 2))
  if (rot) ctx.rotate(rot)
  ctx.drawImage(img, -w / 2, -w / 2, w, w)
  ctx.restore()
}

function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, k: number, a = 1) {
  ctx.fillStyle = `rgba(0,0,0,${0.18 * a})`
  ctx.beginPath()
  ctx.ellipse(cx * k, cy * k, rx * k, 2.2 * k, 0, 0, Math.PI * 2)
  ctx.fill()
}

function hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, ratio: number, color: string, k: number) {
  const r = Math.max(0, Math.min(1, ratio))
  ctx.fillStyle = 'rgba(0,0,0,.55)'
  px(ctx, x - 0.5, y - 0.5, w + 1, 4, k)
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  px(ctx, x, y, w, 3, k)
  ctx.fillStyle = color
  px(ctx, x, y, w * r, 3, k)
  ctx.fillStyle = 'rgba(255,255,255,.35)'
  px(ctx, x, y, w * r, 1, k)
}

function drawFx(ctx: CanvasRenderingContext2D, f: Fx, k: number, monCx: number, monTop: number) {
  const t = f.t
  const rise = t * 22
  const a = 1 - Math.max(0, (t - 0.55) / 0.55)
  let x: number
  let y: number
  let size = 6.5
  let color = '#ffffff'
  let text = f.text
  if (f.side === 'mon') {
    x = monCx + f.jitter * 10
    y = monTop + 18 - rise
  } else {
    x = HERO_X + 16 + f.jitter * 6
    y = GROUND - 38 - rise
  }
  if (f.kind === 'crit') {
    size = 9
    color = '#ffd23f'
    text = `${f.text}!`
  } else if (f.kind === 'hurt') color = '#ff6b7d'
  else if (f.kind === 'tap') {
    size = 5.5
    color = '#c9f1ff'
  } else if (f.kind === 'gold') {
    size = 7.5
    color = '#ffcc33'
    y = monTop - 10 - t * 14
    x = monCx + 14
  }
  const pop = f.kind === 'crit' ? 1 + Math.max(0, 0.25 - t) * 1.6 : 1
  ctx.globalAlpha = Math.max(0, a)
  ctx.font = `900 ${Math.round(size * pop * k)}px 'Pretendard Variable', sans-serif`
  ctx.textAlign = 'center'
  ctx.lineWidth = 1.6 * k
  ctx.strokeStyle = 'rgba(0,0,0,.6)'
  ctx.strokeText(text, x * k, y * k)
  ctx.fillStyle = color
  ctx.fillText(text, x * k, y * k)
  ctx.globalAlpha = 1
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

// UI용 정적 도트 이미지(시트·목록)
export function PixelSprite({ kind, size = 48, hue = 0 }: { kind: string; size?: number; hue?: number }) {
  const src = useRef<string>('')
  if (!src.current) src.current = spriteCanvas(kind, hue).toDataURL()
  return <img className="pixel" src={src.current} width={size} height={size} alt="" aria-hidden draggable={false} />
}
