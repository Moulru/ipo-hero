import { useMemo, useState } from 'react'
import type { Ipo } from '../types'
import { mdShort } from '../lib/calc'

// 청약 캘린더 — 월간 그리드에 청약 시작/마감/상장 이벤트를 표시하고,
// 날짜를 탭하면 해당 일정 목록 → 종목 탭 시 상세로. (스팩 제외)
type EvType = 'start' | 'end' | 'listing'
interface CalEvent {
  type: EvType
  ipo: Ipo
}

const EV_META: Record<EvType, { label: string; cls: string }> = {
  start: { label: '청약 시작', cls: 'ev-start' },
  end: { label: '청약 마감', cls: 'ev-end' },
  listing: { label: '상장', cls: 'ev-listing' },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function ymOf(ymd: string): string {
  return ymd.slice(0, 7)
}

export function CalendarView({ ipos, today, onSelect }: { ipos: Ipo[]; today: string; onSelect: (i: Ipo) => void }) {
  const [ym, setYm] = useState(() => ymOf(today)) // 'YYYY-MM'
  const [sel, setSel] = useState(today)

  // 날짜(YYYY-MM-DD) → 이벤트 목록
  const events = useMemo(() => {
    const m = new Map<string, CalEvent[]>()
    const push = (date: string | null, type: EvType, ipo: Ipo) => {
      if (!date) return
      const list = m.get(date) ?? []
      list.push({ type, ipo })
      m.set(date, list)
    }
    for (const ipo of ipos) {
      if (ipo.sector === '스팩') continue
      push(ipo.subscriptionStart, 'start', ipo)
      push(ipo.subscriptionEnd, 'end', ipo)
      push(ipo.listingDate, 'listing', ipo)
    }
    return m
  }, [ipos])

  const [year, month] = ym.split('-').map(Number) // month: 1–12
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leading = first.getDay() // 앞 공백 칸 수

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`),
  ]

  const move = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setYm(next)
    setSel(next === ymOf(today) ? today : `${next}-01`) // 선택 날짜가 이전 달에 남지 않게
  }

  const selEvents = events.get(sel) ?? []

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => move(-1)} aria-label="이전 달">
          ◀
        </button>
        <div className="cal-title">
          {year}년 {month}월
          {ym !== ymOf(today) && (
            <button
              className="cal-today"
              onClick={() => {
                setYm(ymOf(today))
                setSel(today)
              }}
            >
              오늘
            </button>
          )}
        </div>
        <button className="cal-nav" onClick={() => move(1)} aria-label="다음 달">
          ▶
        </button>
      </div>

      <div className="cal-week">
        {WEEKDAYS.map((w, i) => (
          <span key={w} className={i === 0 ? 'sun' : i === 6 ? 'sat' : ''}>
            {w}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((date, idx) =>
          date == null ? (
            <div key={`b${idx}`} className="cal-day blank" />
          ) : (
            <button
              key={date}
              className={
                'cal-day' + (date === today ? ' today' : '') + (date === sel ? ' sel' : '') + (events.has(date) ? ' has' : '')
              }
              onClick={() => setSel(date)}
            >
              <span className="cal-num">{+date.slice(8)}</span>
              <span className="cal-dots">
                {(events.get(date) ?? []).slice(0, 3).map((e, i) => (
                  <i key={i} className={`cal-dot ${EV_META[e.type].cls}`} />
                ))}
              </span>
            </button>
          ),
        )}
      </div>

      <div className="cal-legend muted">
        <span>
          <i className="cal-dot ev-start" /> 청약 시작
        </span>
        <span>
          <i className="cal-dot ev-end" /> 마감
        </span>
        <span>
          <i className="cal-dot ev-listing" /> 상장
        </span>
        <span className="cal-legend-note">스팩 제외</span>
      </div>

      <div className="cal-events">
        <div className="cal-events-title">
          {mdShort(sel)} {sel === today && <b>오늘</b>}
        </div>
        {selEvents.length ? (
          selEvents.map((e, i) => (
            <button key={`${e.ipo.id}-${e.type}-${i}`} className="cal-event" onClick={() => onSelect(e.ipo)}>
              <span className={`cal-ev-badge ${EV_META[e.type].cls}`}>{EV_META[e.type].label}</span>
              <span className="cal-ev-name">{e.ipo.name}</span>
              <span className="cal-ev-arrow muted">›</span>
            </button>
          ))
        ) : (
          <div className="empty-mini">이 날짜엔 공모주 일정이 없어요.</div>
        )}
      </div>
    </div>
  )
}
