import { useMemo, useRef, useState } from 'react'
import { useIpos } from '../data/loadIpos'
import type { Ipo } from '../types'
import { computeStage } from '../lib/calc'
import { fmtMDW, fmtMonthDay, isSpac, weekdayKo } from '../lib/format'
import { haptic } from '../lib/juice'
import { TabScreen } from '../ui/TabScreen'
import { Card, Switch } from '../ui/kit'
import { ChevronLeft, ChevronRight } from '../ui/icons'
import { Emoji } from '../ui/Emoji'
import { IpoRow } from '../components/IpoRow'

type EvType = 'demand' | 'start' | 'end' | 'listing'
interface CalEvent {
  type: EvType
  ipo: Ipo
  date: string
}

const EV: Record<EvType, { label: string; tone: string }> = {
  demand: { label: '수요예측', tone: 'orange' },
  start: { label: '청약 시작', tone: 'brand' },
  end: { label: '청약 마감', tone: 'up' },
  listing: { label: '상장', tone: 'green' },
}
const EV_ORDER: EvType[] = ['end', 'start', 'listing', 'demand']
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

const ymOf = (ymd: string) => ymd.slice(0, 7)

export function CalendarTab({ today }: { today: string }) {
  const ipos = useIpos()
  const [ym, setYm] = useState(() => ymOf(today))
  const [sel, setSel] = useState(today)
  const [withSpac, setWithSpac] = useState(false)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const [slide, setSlide] = useState<'l' | 'r' | null>(null)

  const events = useMemo(() => {
    const m = new Map<string, CalEvent[]>()
    const push = (date: string | null | undefined, type: EvType, ipo: Ipo) => {
      if (!date) return
      const list = m.get(date) ?? []
      list.push({ type, ipo, date })
      m.set(date, list)
    }
    for (const ipo of ipos) {
      if (!withSpac && isSpac(ipo)) continue
      push(ipo.demandForecastDate, 'demand', ipo)
      push(ipo.subscriptionStart, 'start', ipo)
      if (ipo.subscriptionEnd !== ipo.subscriptionStart) push(ipo.subscriptionEnd, 'end', ipo)
      push(ipo.listingDate, 'listing', ipo)
    }
    for (const list of m.values()) list.sort((a, b) => EV_ORDER.indexOf(a.type) - EV_ORDER.indexOf(b.type))
    return m
  }, [ipos, withSpac])

  const [year, month] = ym.split('-').map(Number)
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leading = first.getDay()
  const total = Math.ceil((leading + daysInMonth) / 7) * 7
  const cells: (string | null)[] = Array.from({ length: total }, (_, i) => {
    const d = i - leading + 1
    return d >= 1 && d <= daysInMonth ? `${ym}-${String(d).padStart(2, '0')}` : null
  })

  const move = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setSlide(delta > 0 ? 'l' : 'r')
    setYm(next)
    setSel(next === ymOf(today) ? today : `${next}-01`)
    haptic(6)
  }
  const goToday = () => {
    setSlide(ym < ymOf(today) ? 'l' : 'r')
    setYm(ymOf(today))
    setSel(today)
  }

  // 월 안의 이벤트 수(헤더 요약)
  const monthCount = useMemo(() => {
    let n = 0
    for (const [d, list] of events) if (d.startsWith(ym)) n += list.length
    return n
  }, [events, ym])

  const selEvents = events.get(sel) ?? []
  const upcoming = useMemo(() => {
    if (selEvents.length) return []
    const out: CalEvent[] = []
    const dates = [...events.keys()].filter((d) => d > sel).sort()
    for (const d of dates) {
      out.push(...events.get(d)!)
      if (out.length >= 5) break
    }
    return out.slice(0, 5)
  }, [events, sel, selEvents.length])

  return (
    <TabScreen
      id="calendar"
      header={
        <>
          <div className="tab-title">일정</div>
          {ym !== ymOf(today) && (
            <button className="btn btn-sm btn-secondary today-btn" onClick={goToday}>
              오늘
            </button>
          )}
        </>
      }
    >
      <Card className="cal-card">
        <div className="cal-head">
          <button className="icon-btn sm" onClick={() => move(-1)} aria-label="이전 달">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <div className="cal-title">
            {year}년 {month}월<span className="cal-count">{monthCount ? `일정 ${monthCount}개` : '일정 없음'}</span>
          </div>
          <button className="icon-btn sm" onClick={() => move(1)} aria-label="다음 달">
            <ChevronRight size={22} strokeWidth={2.2} />
          </button>
        </div>

        <div className="cal-week">
          {WEEK.map((w, i) => (
            <span key={w} className={i === 0 ? 'sun' : i === 6 ? 'sat' : undefined}>
              {w}
            </span>
          ))}
        </div>

        <div
          className={'cal-grid' + (slide ? ` slide-${slide}` : '')}
          key={ym}
          onAnimationEnd={() => setSlide(null)}
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={(e) => {
            const t = touch.current
            touch.current = null
            if (!t) return
            const dx = e.changedTouches[0].clientX - t.x
            const dy = e.changedTouches[0].clientY - t.y
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1)
          }}
        >
          {cells.map((date, idx) =>
            date == null ? (
              <span key={`b${idx}`} className="cal-day blank" />
            ) : (
              <button
                key={date}
                className={
                  'cal-day' +
                  (date === today ? ' today' : '') +
                  (date === sel ? ' sel' : '') +
                  (idx % 7 === 0 ? ' sun' : idx % 7 === 6 ? ' sat' : '') +
                  (date < today ? ' past' : '')
                }
                onClick={() => {
                  if (date !== sel) haptic(5)
                  setSel(date)
                }}
                aria-label={`${fmtMonthDay(date)} ${weekdayKo(date)}요일${events.has(date) ? `, 일정 ${events.get(date)!.length}개` : ''}`}
                aria-pressed={date === sel}
              >
                <span className="cal-num">{+date.slice(8)}</span>
                <span className="cal-dots">
                  {uniqTypes(events.get(date)).map((t) => (
                    <i key={t} className={`cal-dot ev-${t}`} />
                  ))}
                </span>
              </button>
            )
          )}
        </div>

        <div className="cal-legend">
          {(['demand', 'start', 'end', 'listing'] as EvType[]).map((t) => (
            <span key={t}>
              <i className={`cal-dot ev-${t}`} />
              {EV[t].label}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-head">
          <div className="card-head-txt">
            <h2 className="card-title">
              {fmtMonthDay(sel)} {weekdayKo(sel)}요일
              {sel === today && <span className="pill tone-brand sm head-pill">오늘</span>}
            </h2>
            <div className="card-sub">{selEvents.length ? `일정 ${selEvents.length}개` : '이 날은 공모주 일정이 없어요'}</div>
          </div>
        </div>
        <div className="card-list">
          {selEvents.map((e) => (
            <IpoRow
              key={`${e.ipo.id}-${e.type}`}
              ipo={e.ipo}
              stage={computeStage(e.ipo, today)}
              today={today}
              right={{ top: <span className={`pill tone-${EV[e.type].tone}`}>{EV[e.type].label}</span> }}
            />
          ))}
          {!selEvents.length && upcoming.length > 0 && (
            <>
              <div className="list-label">다가오는 일정</div>
              {upcoming.map((e) => (
                <IpoRow
                  key={`${e.ipo.id}-${e.type}`}
                  ipo={e.ipo}
                  stage={computeStage(e.ipo, today)}
                  today={today}
                  sub={`${fmtMDW(e.date)} ${EV[e.type].label}`}
                  right={{ top: <span className={`pill tone-${EV[e.type].tone}`}>{EV[e.type].label}</span> }}
                />
              ))}
            </>
          )}
          {!selEvents.length && !upcoming.length && (
            <div className="empty">
              <Emoji e="🗓️" size={56} />
              <div className="empty-desc">이후로 예정된 일정이 없어요</div>
            </div>
          )}
        </div>
      </Card>

      <Card pad={false}>
        <div className="menu-row">
          <span className="menu-txt">
            <span className="menu-label">스팩 일정도 보기</span>
            <span className="menu-sub">기업인수목적회사 공모 일정</span>
          </span>
          <Switch checked={withSpac} onChange={setWithSpac} label="스팩 일정 보기" />
        </div>
      </Card>
    </TabScreen>
  )
}

function uniqTypes(list: CalEvent[] | undefined): EvType[] {
  if (!list) return []
  const s = new Set(list.map((e) => e.type))
  return EV_ORDER.filter((t) => s.has(t)).slice(0, 3)
}
