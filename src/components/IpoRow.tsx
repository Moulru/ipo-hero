import type { ReactNode } from 'react'
import type { Ipo, Stage } from '../types'
import { daysUntil, returnColor, signedPct } from '../lib/calc'
import { fmtMD, fmtMDW, fmtRange, fmtRate, priceShort, underwriterShort } from '../lib/format'
import { useStore } from '../store'
import { openIpo } from '../nav'
import { GradeChip, StockLogo, Tag } from '../ui/kit'
import { Star } from '../ui/icons'

// 종목 한 줄 — 단계별로 오른쪽 핵심 수치/일정이 바뀜
export function IpoRow({
  ipo,
  stage,
  today,
  right,
  sub,
  onClick,
}: {
  ipo: Ipo
  stage: Stage
  today: string
  right?: { top: ReactNode; bottom?: ReactNode }
  sub?: ReactNode
  onClick?: () => void
}) {
  const watched = useStore((s) => s.watchlist.includes(ipo.id))
  const mine = useStore((s) => (s.subscriptions[ipo.id] != null || s.predictions[ipo.id] != null) && !s.settledIds.includes(ipo.id))
  const r = right ?? rightOf(ipo, stage, today)
  const uw = underwriterShort(ipo)
  const subText =
    sub ??
    (stage === 'subscription'
      ? [uw, `청약 ${fmtRange(ipo.subscriptionStart, ipo.subscriptionEnd)}`]
      : stage === 'upcoming'
      ? [uw, ipo.subscriptionStart ? `청약 ${fmtMDW(ipo.subscriptionStart)}` : '청약일 미정']
      : stage === 'pending'
      ? [uw, ipo.listingDate ? `상장 ${fmtMDW(ipo.listingDate)}` : '상장일 미정']
      : [ipo.market, ipo.listingDate ? `${fmtMD(ipo.listingDate)} 상장` : '상장 완료']
    )
      .filter(Boolean)
      .join(' · ')

  return (
    <button className="ipo-row pressable" onClick={onClick ?? (() => openIpo(ipo.id))}>
      <StockLogo ipo={ipo} />
      <span className="ipo-row-main">
        <span className="ipo-row-name">
          <span className="nm">{ipo.name}</span>
          {watched && <Star className="watch-mark" size={13} fill="currentColor" strokeWidth={0} aria-label="관심 종목" />}
          {stage !== 'listed' && <GradeChip ipo={ipo} />}
          {mine && <Tag tone="brand">참여</Tag>}
          {!ipo.isReal && <Tag>샘플</Tag>}
        </span>
        <span className="ipo-row-sub">{subText}</span>
      </span>
      <span className="ipo-row-right">
        <span className="r1">{r.top}</span>
        {r.bottom != null && <span className="r2">{r.bottom}</span>}
      </span>
    </button>
  )
}

function rightOf(ipo: Ipo, stage: Stage, today: string): { top: ReactNode; bottom?: ReactNode } {
  if (stage === 'listed') {
    const ret = ipo.listingReturn
    return {
      top: ret != null ? <b style={{ color: returnColor(ret) }}>{signedPct(ret)}</b> : <span className="t3">-</span>,
      bottom: priceShort(ipo),
    }
  }
  if (stage === 'subscription') {
    const d = daysUntil(ipo.subscriptionEnd, today)
    return {
      top: ipo.competitionRate ? fmtRate(ipo.competitionRate) : priceShort(ipo),
      bottom: d === 0 ? <b className="t-up">오늘 마감</b> : d != null && d > 0 ? <span className="t-brand">마감 D-{d}</span> : null,
    }
  }
  if (stage === 'upcoming') {
    const d = daysUntil(ipo.subscriptionStart, today)
    return { top: priceShort(ipo), bottom: d != null && d >= 0 ? `D-${d}` : null }
  }
  const d = daysUntil(ipo.listingDate, today)
  return {
    top: priceShort(ipo),
    bottom: d === 0 ? <b className="t-green">오늘 상장</b> : d != null && d > 0 ? `상장 D-${d}` : null,
  }
}
