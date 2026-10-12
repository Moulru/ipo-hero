import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import type { Ipo, Rarity, Stage } from '../types'
import { GRADE_META, STAGE_META } from '../lib/calc'
import { isSpac } from '../lib/format'
import { haptic } from '../lib/juice'
import { ChevronRight } from './icons'
import { Emoji } from './Emoji'

// ───────── 종목 로고(모노그램) — 이름 해시로 색상 고정, 테마 대응(HSL 변수) ─────────
function hashHue(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const hues = [222, 248, 268, 292, 336, 8, 24, 152, 172, 196] // 채도 있는 10색 팔레트
  return hues[h % hues.length]
}

export function StockLogo({ ipo, size = 40 }: { ipo: Pick<Ipo, 'name' | 'sector'>; size?: number }) {
  const spac = ipo.sector === '스팩'
  const ch = spac ? 'S' : ipo.name.replace(/^[(（]?주[)）]?\s*/, '').trim()[0] ?? '?'
  return (
    <span
      className={'stock-logo' + (spac ? ' spac' : '')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), ['--h' as string]: hashHue(ipo.name) }}
      aria-hidden
    >
      {ch}
    </span>
  )
}

// ───────── 상태 배지 ─────────
export function StagePill({ stage, small }: { stage: Stage; small?: boolean }) {
  const m = STAGE_META[stage]
  return <span className={`pill tone-${m.tone}` + (small ? ' sm' : '')}>{m.label}</span>
}

// 수요 등급 칩 (S/A/B/C) — 스팩은 '스팩'
export function GradeChip({ ipo, withLabel }: { ipo: Pick<Ipo, 'rarity' | 'sector'>; withLabel?: boolean }) {
  if (ipo.sector === '스팩') return <span className="grade grade-spac">스팩</span>
  const g = GRADE_META[ipo.rarity as Rarity]
  return (
    <span className={`grade grade-${g.grade.toLowerCase()}`} title={`수요 등급 ${g.grade}`}>
      {withLabel ? `수요 ${g.grade} · ${g.label}` : g.grade}
    </span>
  )
}

export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'up' | 'down' | 'green' | 'orange'
}) {
  return <span className={`tag tone-${tone}`}>{children}</span>
}

// ───────── 스위치 ─────────
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={'switch' + (checked ? ' on' : '')}
      onClick={() => {
        haptic(8)
        onChange(!checked)
      }}
    >
      <span className="switch-knob" />
    </button>
  )
}

// ───────── 세그먼트 컨트롤 ─────────
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T
  options: { value: T; label: ReactNode; badge?: boolean }[]
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}) {
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  )
  return (
    <div className={`segmented seg-${size}`} role="tablist" style={{ ['--n' as string]: options.length, ['--i' as string]: idx }}>
      <span className="seg-thumb" aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={'seg-btn' + (o.value === value ? ' on' : '')}
          onClick={() => {
            if (o.value !== value) haptic(6)
            onChange(o.value)
          }}
        >
          {o.label}
          {o.badge && <i className="dot" aria-label="새 알림" />}
        </button>
      ))}
    </div>
  )
}

// ───────── 칩 탭 (가로 스크롤) ─────────
export function ChipTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="chip-tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={'chip' + (o.value === value ? ' on' : '')}
          onClick={() => {
            if (o.value !== value) haptic(6)
            onChange(o.value)
          }}
        >
          {o.label}
          {o.count != null && <span className="chip-count">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ───────── 카드 · 섹션 ─────────
export function Card({ children, className, pad = false }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={'card' + (pad ? ' pad' : '') + (className ? ` ${className}` : '')}>{children}</section>
}

export function CardHead({ title, sub, right, onMore }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; onMore?: () => void }) {
  return (
    <div className="card-head">
      <div className="card-head-txt">
        <h2 className="card-title">{title}</h2>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {right}
      {onMore && (
        <button className="more-btn" onClick={onMore}>
          전체보기 <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

// 메뉴형 리스트 행 (설정·MY 메뉴)
export function MenuRow({
  icon,
  label,
  value,
  onClick,
  href,
  chevron = true,
  danger,
  right,
  sub,
}: {
  icon?: ReactNode
  label: ReactNode
  value?: ReactNode
  onClick?: () => void
  href?: string
  chevron?: boolean
  danger?: boolean
  right?: ReactNode
  sub?: ReactNode
}) {
  const inner = (
    <>
      {icon && <span className="menu-ic">{icon}</span>}
      <span className="menu-txt">
        <span className={'menu-label' + (danger ? ' danger' : '')}>{label}</span>
        {sub && <span className="menu-sub">{sub}</span>}
      </span>
      {value != null && <span className="menu-val">{value}</span>}
      {right}
      {chevron && (onClick || href) && <ChevronRight className="menu-chev" size={18} strokeWidth={2.2} />}
    </>
  )
  if (href)
    return (
      // 네이티브(WebView)에선 target=_blank가 무반응일 수 있어 메인 프레임 내비게이션 → Capacitor가 외부 호스트를 시스템 브라우저로 넘김
      <a
        className="menu-row pressable"
        href={href}
        target={Capacitor.isNativePlatform() || href.startsWith('mailto:') ? undefined : '_blank'}
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    )
  if (onClick)
    return (
      <button className="menu-row pressable" onClick={onClick}>
        {inner}
      </button>
    )
  return <div className="menu-row">{inner}</div>
}

// ───────── 진행 바 ─────────
export function Progress({
  value,
  max = 100,
  tone = 'brand',
  height = 8,
}: {
  value: number
  max?: number
  tone?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className="progress" style={{ height }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill tone-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ───────── 빈 상태 ─────────
export function Empty({ emoji, title, desc, action }: { emoji: string; title: string; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <Emoji e={emoji} size={64} />
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {action}
    </div>
  )
}

// ───────── 숫자 카운트업 ─────────
export function CountUp({
  value,
  ms = 650,
  format = (n: number) => n.toLocaleString('ko-KR'),
}: {
  value: number
  ms?: number
  format?: (n: number) => string
}) {
  const [disp, setDisp] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    if (from === to || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisp(to)
      return
    }
    const steps = Math.max(1, Math.round(ms / 32))
    let i = 0
    const id = setInterval(() => {
      i++
      const p = Math.min(1, i / steps)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(from + (to - from) * eased))
      if (p >= 1) clearInterval(id)
    }, 32)
    return () => clearInterval(id)
  }, [value, ms])
  return <>{format(disp)}</>
}

// 스팩 여부 재노출(화면에서 import 단순화)
export { isSpac }
