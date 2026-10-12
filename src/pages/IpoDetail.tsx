import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Ipo, PredictionChoice, Stage } from '../types'
import { useStore } from '../store'
import { useIpos } from '../data/loadIpos'
import { shareText } from '../lib/share'
import { haptic, toast } from '../lib/juice'
import { useToday } from '../lib/useToday'
import {
  GRADE_META,
  OUTCOME_META,
  computeStage,
  daysUntil,
  depositFor,
  estRefundDate,
  formatEok,
  maxAffordableShares,
  outcomeFromReturn,
  returnColor,
  signedPct,
} from '../lib/calc'
import { fmtKrw, fmtMDW, fmtRange, fmtRate, fmtWon, isSpac, priceLabel, sectorLabel, underwriters } from '../lib/format'
import { Page } from '../ui/Page'
import { Confirm } from '../ui/Sheet'
import { Emoji } from '../ui/Emoji'
import { GradeChip, StagePill, StockLogo, Tag } from '../ui/kit'
import { Check, CircleHelp, Clock, Minus, Plus, Share2, Star } from '../ui/icons'
import { GlossarySheet, GradeSheet } from '../sheets/InfoSheets'

const OUTCOMES: PredictionChoice[] = ['ttassang', 'up', 'flat', 'down']
type Mode = 'settled' | 'bet' | 'locked' | 'settle' | 'info'

export function IpoDetailPage({ id, initialTab }: { id: string; initialTab?: 'info' | 'sim' }) {
  const ALL = useIpos()
  const ipo = ALL.find((i) => i.id === id)
  const today = useToday()
  if (!ipo) {
    return (
      <Page title="종목 정보">
        <div className="empty" style={{ paddingTop: 80 }}>
          <Emoji e="🔍" size={64} />
          <div className="empty-title">종목 정보를 찾을 수 없어요</div>
          <div className="empty-desc">정보가 갱신되면서 목록에서 빠졌을 수 있어요</div>
        </div>
      </Page>
    )
  }
  return <Detail ipo={ipo} all={ALL} today={today} initialTab={initialTab} />
}

function Detail({ ipo, all, today, initialTab }: { ipo: Ipo; all: Ipo[]; today: string; initialTab?: 'info' | 'sim' }) {
  const stage = computeStage(ipo, today)
  const [tab, setTabState] = useState<'info' | 'sim'>(initialTab ?? 'info')
  const tabsRef = useRef<HTMLDivElement>(null)
  // 탭 전환 시: 이미 탭 바 아래까지 스크롤했다면 새 탭의 맨 위(탭 바 바로 아래)로 맞춤
  const setTab = (t: 'info' | 'sim') => {
    if (t === tab) return
    haptic(6)
    setTabState(t)
    const el = tabsRef.current
    const body = el?.closest('.page-body') as HTMLElement | null
    if (el && body && body.scrollTop > el.offsetTop) body.scrollTop = el.offsetTop
  }
  const [help, setHelp] = useState<string[] | null>(null)
  const [gradeOpen, setGradeOpen] = useState(false)
  const watched = useStore((s) => s.watchlist.includes(ipo.id))
  const toggleWatch = useStore((s) => s.toggleWatch)
  const viewIpo = useStore((s) => s.viewIpo)

  useEffect(() => {
    viewIpo(ipo.id)
  }, [ipo.id, viewIpo])

  // 모의청약 상태
  const prediction = useStore((s) => s.predictions[ipo.id])
  const savedShares = useStore((s) => s.subscriptions[ipo.id])
  const settled = useStore((s) => s.settledIds.includes(ipo.id))
  const isDday = !!ipo.listingDate && today === ipo.listingDate
  const didBet = prediction != null || savedShares != null
  // 정산 가능: 결과가 있고 상장일이 지났거나(상장일 미정 데이터 포함) — store.settleReal 조건과 동일
  const canSettle = ipo.listingReturn != null && (!ipo.listingDate || today > ipo.listingDate)
  // 참여한 종목은 절대 'info'로 빠지지 않게: 상장 후 결과 미집계 = 'locked'(대기)
  const mode: Mode = settled
    ? 'settled'
    : didBet && canSettle
    ? 'settle'
    : isDday
    ? 'locked'
    : stage === 'subscription' || stage === 'pending' || (didBet && stage === 'upcoming')
    ? 'bet'
    : didBet
    ? 'locked'
    : 'info'

  async function doShare() {
    const g = !isSpac(ipo) ? ` · 수요 ${GRADE_META[ipo.rarity].grade}` : ''
    const lines = [
      `${ipo.name}${g}`,
      `공모가 ${priceLabel(ipo)}`,
      ipo.subscriptionStart ? `청약 ${fmtRange(ipo.subscriptionStart, ipo.subscriptionEnd)}` : null,
      ipo.listingDate ? `상장 ${fmtMDW(ipo.listingDate)}` : null,
      ipo.institutionalRate ? `기관 경쟁률 ${fmtRate(ipo.institutionalRate)}` : null,
      ipo.underwriter ? `증권사 ${underwriters(ipo).join(', ')}` : null,
      '',
      '공모주 히어로에서 확인했어요',
    ]
      .filter((x) => x != null)
      .join('\n')
    const r = await shareText(`${ipo.name} 공모주 정보`, lines)
    if (r === 'copied') toast('종목 정보를 복사했어요', '📋')
  }

  const footer = tab === 'sim' ? <SimFooter ipo={ipo} mode={mode} /> : undefined

  return (
    <Page
      title={ipo.name}
      titleMode="scroll"
      revealAt={70}
      className="white"
      footer={footer}
      right={
        <>
          <button
            className={'icon-btn' + (watched ? ' on' : '')}
            aria-label={watched ? '관심 종목에서 빼기' : '관심 종목에 추가'}
            aria-pressed={watched}
            onClick={() => {
              const added = toggleWatch(ipo.id)
              haptic(added ? [8, 30, 8] : 8)
              toast(added ? '관심 종목에 추가했어요' : '관심 종목에서 뺐어요', added ? '⭐' : undefined)
            }}
          >
            <Star size={24} strokeWidth={2} fill={watched ? 'currentColor' : 'none'} className={watched ? 'pop' : undefined} />
          </button>
          <button className="icon-btn" aria-label="공유하기" onClick={doShare}>
            <Share2 size={22} strokeWidth={2} />
          </button>
        </>
      }
    >
      <Hero ipo={ipo} stage={stage} today={today} onGrade={() => setGradeOpen(true)} />

      <div className="d-tabs" role="tablist" ref={tabsRef}>
        <button
          role="tab"
          aria-selected={tab === 'info'}
          className={'d-tab' + (tab === 'info' ? ' on' : '')}
          onClick={() => setTab('info')}
        >
          공모 정보
        </button>
        <button role="tab" aria-selected={tab === 'sim'} className={'d-tab' + (tab === 'sim' ? ' on' : '')} onClick={() => setTab('sim')}>
          모의청약
          {(mode === 'bet' && !didBet) || mode === 'settle' ? <i className="dot" /> : null}
        </button>
      </div>

      {tab === 'info' ? (
        <InfoTab ipo={ipo} all={all} stage={stage} today={today} onHelp={setHelp} />
      ) : (
        <SimTab ipo={ipo} stage={stage} mode={mode} today={today} onHelp={setHelp} />
      )}

      {help && <GlossarySheet keys={help} onClose={() => setHelp(null)} />}
      {gradeOpen && <GradeSheet onClose={() => setGradeOpen(false)} />}
    </Page>
  )
}

// ───────── 상단 히어로 ─────────
function Hero({ ipo, stage, today, onGrade }: { ipo: Ipo; stage: Stage; today: string; onGrade: () => void }) {
  const meta = [ipo.market, sectorLabel(ipo)].filter(Boolean).join(' · ')
  const cd = countdown(ipo, stage, today)
  return (
    <div className="d-hero">
      <div className="d-hero-top">
        <StockLogo ipo={ipo} size={48} />
        <div className="d-tags">
          <StagePill stage={stage} />
          {!isSpac(ipo) ? (
            <button className="grade-btn" onClick={onGrade} aria-label="수요 등급 설명 보기">
              <GradeChip ipo={ipo} withLabel />
            </button>
          ) : (
            <GradeChip ipo={ipo} />
          )}
          {!ipo.isReal && <Tag>샘플</Tag>}
        </div>
      </div>
      <h1 className="d-name">{ipo.name}</h1>
      {meta && <div className="d-meta">{meta}</div>}

      <div className="d-price">
        <span className="d-price-label">{stage === 'listed' ? '공모가' : ipo.priceConfirmed ? '확정 공모가' : '희망 공모가'}</span>
        <span className="d-price-val num">{priceLabel(ipo)}</span>
        {ipo.listingReturn != null && (
          <span className="d-return num" style={{ color: returnColor(ipo.listingReturn) }}>
            상장일 {signedPct(ipo.listingReturn)}
          </span>
        )}
      </div>

      {cd && (
        <div className={`d-cd tone-${cd.tone}`}>
          <Clock size={16} strokeWidth={2.3} />
          <span className="fw6">{cd.text}</span>
          {cd.date && <span className="d-cd-date">{cd.date}</span>}
        </div>
      )}
    </div>
  )
}

function countdown(ipo: Ipo, stage: Stage, today: string): { text: string; date?: string; tone: string } | null {
  if (stage === 'subscription') {
    const d = daysUntil(ipo.subscriptionEnd, today)
    if (d === 0) return { text: '오늘 청약 마감이에요', date: '대부분 오후 4시 마감', tone: 'up' }
    return { text: `청약 마감까지 ${d}일`, date: fmtMDW(ipo.subscriptionEnd), tone: 'brand' }
  }
  if (stage === 'upcoming') {
    const d = daysUntil(ipo.subscriptionStart, today)
    if (d == null) return { text: '청약 일정이 아직 정해지지 않았어요', tone: 'neutral' }
    return { text: d === 0 ? '오늘 청약이 시작돼요' : `청약 시작까지 ${d}일`, date: fmtMDW(ipo.subscriptionStart), tone: 'neutral' }
  }
  if (stage === 'pending') {
    const d = daysUntil(ipo.listingDate, today)
    if (d == null) return { text: '상장일이 아직 정해지지 않았어요', tone: 'neutral' }
    if (d === 0) return { text: '오늘 상장해요', date: '오전 9시 거래 시작', tone: 'green' }
    return { text: `상장까지 ${d}일`, date: fmtMDW(ipo.listingDate), tone: 'green' }
  }
  return ipo.listingDate ? { text: `${fmtMDW(ipo.listingDate)} 상장 완료`, tone: 'neutral' } : null
}

// ───────── 정보 탭 ─────────
function InfoTab({ ipo, all, stage, today, onHelp }: { ipo: Ipo; all: Ipo[]; stage: Stage; today: string; onHelp: (k: string[]) => void }) {
  const uws = underwriters(ipo)
  const H = ({ k }: { k: string }) => (
    <button className="help-btn" onClick={() => onHelp([k])} aria-label="용어 설명">
      <CircleHelp size={15} strokeWidth={2.2} />
    </button>
  )
  return (
    <div className="d-body">
      {ipo.listingReturn != null && <ListingResult ipo={ipo} />}

      <section className="d-sec">
        <h3 className="d-sec-title">공모 개요</h3>
        <div className="kv">
          <KV label={ipo.priceConfirmed ? '확정 공모가' : '희망 공모가'} value={priceLabel(ipo)} />
          {ipo.priceConfirmed && ipo.priceLow && ipo.priceHigh && (
            <KV label="희망 공모가 범위" value={`${ipo.priceLow.toLocaleString()}~${ipo.priceHigh.toLocaleString()}원`} muted />
          )}
          <KV label="공모 규모" value={formatEok(ipo.offerAmount)} />
          <KV
            label="청약 기간"
            value={ipo.subscriptionStart ? `${fmtMDW(ipo.subscriptionStart)} ~ ${fmtMDW(ipo.subscriptionEnd)}` : '미정'}
          />
          <KV label="상장일" value={ipo.listingDate ? fmtMDW(ipo.listingDate) : '미정'} />
          {ipo.market && <KV label="시장" value={ipo.market} />}
          {sectorLabel(ipo) && <KV label="업종" value={sectorLabel(ipo)!} />}
        </div>
      </section>

      <div className="band" />

      <section className="d-sec">
        <h3 className="d-sec-title">수요 지표</h3>
        <div className="kv">
          <KV
            label={
              <>
                기관 경쟁률 <H k="instRate" />
              </>
            }
            value={ipo.institutionalRate ? fmtRate(ipo.institutionalRate) : '수요예측 전'}
            muted={!ipo.institutionalRate}
          />
          <KV
            label={
              <>
                의무보유확약 <H k="lockup" />
              </>
            }
            value={ipo.lockupRatio != null ? `${ipo.lockupRatio}%` : '수요예측 전'}
            muted={ipo.lockupRatio == null}
          />
          <KV
            label={
              <>
                통합 경쟁률 <H k="compRate" />
              </>
            }
            value={ipo.competitionRate ? fmtRate(ipo.competitionRate) : '청약 후 공개'}
            muted={!ipo.competitionRate}
          />
        </div>
        <DemandGauge ipo={ipo} all={all} />
      </section>

      <div className="band" />

      <section className="d-sec">
        <h3 className="d-sec-title">주요 일정</h3>
        <Timeline ipo={ipo} today={today} />
      </section>

      {stage !== 'listed' && ipo.offerPrice > 0 && (
        <>
          <div className="band" />
          <section className="d-sec">
            <h3 className="d-sec-title">
              청약 준비 <H k="deposit" />
            </h3>
            <div className="prep">
              <div className="prep-main">
                <span className="t3 fs14">최소 10주 청약 시 필요한 증거금</span>
                <span className="prep-val num">{fmtWon(depositFor(10, ipo.offerPrice))}</span>
              </div>
              <div className="t3 fs13">
                청약 금액 {fmtWon(ipo.offerPrice * 10)}의 50% · {ipo.priceConfirmed ? '확정가' : '희망가 상단'} 기준
              </div>
            </div>
          </section>
        </>
      )}

      {uws.length > 0 && (
        <>
          <div className="band" />
          <section className="d-sec">
            <h3 className="d-sec-title">청약 가능 증권사</h3>
            <div className="uw-list">
              {uws.map((u, i) => (
                <div key={u} className="uw-row">
                  <span className="uw-name">{u}</span>
                  {i === 0 && uws.length > 1 && <span className="pill tone-neutral sm">대표 주관</span>}
                </div>
              ))}
            </div>
            {uws.length > 1 && <p className="t3 fs13 mt8">증권사마다 배정 물량과 경쟁률이 달라요. 중복 청약은 할 수 없어요.</p>}
          </section>
        </>
      )}

      <div className="d-disclaimer">
        공개 자료(DART·KIND 등)를 바탕으로 정리한 정보로, 실제와 다르거나 늦게 반영될 수 있어요. 청약 전 증권사 공지를 꼭 확인해 주세요.
      </div>
    </div>
  )
}

function KV({ label, value, muted }: { label: ReactNode; value: ReactNode; muted?: boolean }) {
  return (
    <div className="kv-row">
      <span className="kv-label">{label}</span>
      <span className={'kv-val' + (muted ? ' muted' : '')}>{value}</span>
    </div>
  )
}

function ListingResult({ ipo }: { ipo: Ipo }) {
  const r = ipo.listingReturn!
  const om = OUTCOME_META[outcomeFromReturn(r)]
  const close = Math.round(ipo.offerPrice * (1 + r / 100))
  return (
    <div className="listing-result" style={{ ['--c' as string]: returnColor(r) }}>
      <div className="lr-top">
        <span className="t3 fs14">상장일 종가 수익률</span>
        <span className="pill tone-neutral sm">{om.label}</span>
      </div>
      <div className="lr-val num">{signedPct(r)}</div>
      {ipo.offerPrice > 0 && (
        <div className="t3 fs14 num">
          공모가 {fmtWon(ipo.offerPrice)} → 종가 약 {fmtWon(close)}
        </div>
      )}
    </div>
  )
}

// 수요 지표 위치 — 수집된 종목(스팩 제외) 대비 백분위
function DemandGauge({ ipo, all }: { ipo: Ipo; all: Ipo[] }) {
  const rows = useMemo(() => {
    if (isSpac(ipo)) return []
    const pool = all.filter((i) => !isSpac(i))
    const out: { label: string; top: number; pct: number }[] = []
    const add = (label: string, v: number | null, get: (i: Ipo) => number | null) => {
      if (v == null) return
      const vals = pool.map(get).filter((x): x is number => x != null)
      if (vals.length < 5) return // 모수가 너무 작으면 표시 안 함
      const below = vals.filter((x) => x < v).length
      const pct = Math.round((below / vals.length) * 100)
      out.push({ label, pct, top: Math.max(1, 100 - pct) })
    }
    add('기관 경쟁률', ipo.institutionalRate, (i) => i.institutionalRate)
    add('통합 경쟁률', ipo.competitionRate, (i) => i.competitionRate)
    add('의무보유확약', ipo.lockupRatio, (i) => i.lockupRatio)
    return out
  }, [ipo, all])
  if (!rows.length) return null
  return (
    <div className="gauge">
      <div className="gauge-head">
        <span className="fw6 fs14">최근 공모주와 비교하면</span>
        <span className="t3 fs12">수집된 {all.filter((i) => !isSpac(i)).length}개 종목 기준</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="gauge-row">
          <div className="gauge-lbl">
            <span>{r.label}</span>
            <b className={r.top <= 20 ? 't-brand' : undefined}>상위 {r.top}%</b>
          </div>
          <div className="gauge-bar">
            <div className="gauge-fill" style={{ width: `${Math.max(3, r.pct)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// 일정 타임라인 — 수요예측 → 청약 → 환불(추정) → 상장
function Timeline({ ipo, today }: { ipo: Ipo; today: string }) {
  const steps: { date: string; label: string; est?: boolean }[] = []
  const push = (date: string | null | undefined, label: string, est = false) => {
    if (date) steps.push({ date, label, est })
  }
  push(ipo.demandForecastDate, '기관 수요예측')
  if (ipo.subscriptionStart && ipo.subscriptionEnd && ipo.subscriptionStart !== ipo.subscriptionEnd) {
    push(ipo.subscriptionStart, '청약 시작')
    push(ipo.subscriptionEnd, '청약 마감 · 증거금 납입')
  } else push(ipo.subscriptionEnd ?? ipo.subscriptionStart, '청약 · 증거금 납입')
  push(estRefundDate(ipo.subscriptionEnd), '배정 확인 · 환불', true)
  push(ipo.listingDate, '상장')
  if (!steps.length) return <p className="t3 fs14">아직 확정된 일정이 없어요.</p>
  // 현재 위치: 오늘 이후 첫 단계
  const nextIdx = steps.findIndex((s) => s.date >= today)
  return (
    <ol className="tl">
      {steps.map((s, i) => {
        const d = daysUntil(s.date, today)
        const state = s.date < today ? 'past' : i === nextIdx ? 'next' : 'future'
        return (
          <li key={`${s.date}-${s.label}`} className={`tl-item ${state}`}>
            <span className="tl-dot">{state === 'past' && <Check size={11} strokeWidth={3.4} />}</span>
            <div className="tl-main">
              <div className="tl-label">
                {s.label}
                {s.est && <span className="tl-est">예상</span>}
              </div>
              <div className="tl-date num">{fmtMDW(s.date)}</div>
            </div>
            <span className="tl-dday">{d === 0 ? <b className="t-brand">오늘</b> : d != null && d > 0 ? `D-${d}` : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

// ───────── 모의청약 탭 ─────────
function SimTab({ ipo, stage, mode, today, onHelp }: { ipo: Ipo; stage: Stage; mode: Mode; today: string; onHelp: (k: string[]) => void }) {
  const isDday = ipo.listingDate === today
  const seedMoney = useStore((s) => s.seedMoney)
  const escrowHeld = useStore((s) => s.escrow[ipo.id] ?? 0)
  const prediction = useStore((s) => s.predictions[ipo.id])
  const savedShares = useStore((s) => s.subscriptions[ipo.id])
  const setPrediction = useStore((s) => s.setPrediction)
  const draft = useDraft(ipo.id, savedShares ?? 10)
  const maxShares = maxAffordableShares(seedMoney + escrowHeld, ipo.offerPrice)
  const shares = Math.min(draft.shares, maxShares)

  if (mode === 'info') {
    const listed = stage === 'listed'
    return (
      <div className="d-body">
        <div className="sim-state">
          <Emoji e={listed ? '🏁' : '⏰'} size={72} />
          <div className="sim-state-title">{listed ? '이미 상장된 종목이에요' : '청약이 시작되면 참여할 수 있어요'}</div>
          <div className="sim-state-desc">
            {listed
              ? '모의청약은 청약 중이거나 상장 전인 종목에서 할 수 있어요.'
              : ipo.subscriptionStart
              ? `${fmtMDW(ipo.subscriptionStart)}부터 가상 머니로 청약하고 상장일 수익률을 예측해 보세요.`
              : '청약 일정이 정해지면 가상 머니로 청약해 볼 수 있어요.'}
          </div>
        </div>
        <SimIntro />
      </div>
    )
  }

  if (mode === 'settled' || mode === 'locked' || mode === 'settle') {
    const r = ipo.listingReturn
    return (
      <div className="d-body">
        <div className="sim-state">
          <Emoji e={mode === 'settled' ? '🧾' : mode === 'locked' ? '🔔' : '🎁'} size={72} />
          <div className="sim-state-title">
            {mode === 'settled'
              ? '정산이 끝났어요'
              : mode === 'locked'
              ? isDday
                ? '오늘 상장했어요'
                : '상장 결과를 기다리고 있어요'
              : '정산할 수 있어요'}
          </div>
          <div className="sim-state-desc">
            {mode === 'settled'
              ? '실제 상장 결과로 시즌 자산에 반영됐어요.'
              : mode === 'locked'
              ? isDday
                ? '상장일에는 수정할 수 없어요. 내일 실제 종가로 정산돼요.'
                : '상장 결과가 집계되면 바로 정산할 수 있어요.'
              : '실제 상장 결과로 배정과 수익을 확인해 보세요.'}
          </div>
        </div>
        <section className="d-sec">
          <h3 className="d-sec-title">내 모의청약</h3>
          <div className="kv">
            <KV
              label="청약 수량"
              value={savedShares != null ? `${savedShares.toLocaleString()}주` : '청약 안 함'}
              muted={savedShares == null}
            />
            {escrowHeld > 0 && <KV label="묶인 증거금" value={fmtWon(escrowHeld)} />}
            <KV label="상장일 예측" value={prediction ? OUTCOME_META[prediction].label : '예측 안 함'} muted={!prediction} />
            {r != null && mode !== 'locked' && (
              <KV
                label="실제 결과"
                value={
                  <span style={{ color: returnColor(r) }}>
                    {signedPct(r)} · {OUTCOME_META[outcomeFromReturn(r)].label}
                  </span>
                }
              />
            )}
          </div>
        </section>
      </div>
    )
  }

  // mode === 'bet'
  const deposit = depositFor(shares, ipo.offerPrice)
  const available = seedMoney + escrowHeld
  const expected = ipo.expectedPer10 != null ? (shares / 10) * ipo.expectedPer10 : null
  const quick = Array.from(new Set([10, 50, 100, maxShares].filter((n) => n <= maxShares)))

  return (
    <div className="d-body">
      <div className="sim-asset">
        <div>
          <div className="t3 fs13">사용할 수 있는 시즌 자산</div>
          <div className="fw7 fs18 num">{fmtWon(available)}</div>
        </div>
        <span className="pill tone-brand sm">가상 머니</span>
      </div>

      <section className="d-sec">
        <h3 className="d-sec-title">상장일에 어떻게 될까요?</h3>
        <p className="d-sec-desc">공모가 대비 상장일 종가를 예측해요. 맞히면 보상이 커져요.</p>
        <div className="opt-grid">
          {OUTCOMES.map((o) => {
            const m = OUTCOME_META[o]
            const on = prediction === o
            return (
              <button
                key={o}
                className={'opt press-scale' + (on ? ' on' : '')}
                aria-pressed={on}
                onClick={() => {
                  haptic(8)
                  setPrediction(ipo.id, o)
                }}
              >
                <Emoji e={m.emoji} size={30} />
                <span className="opt-label">{m.label}</span>
                <span className="opt-range num">{m.range}</span>
                {on && (
                  <span className="opt-check">
                    <Check size={13} strokeWidth={3.4} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <div className="band" />

      <section className="d-sec">
        <h3 className="d-sec-title">
          몇 주 청약할까요?{' '}
          <button className="help-btn" onClick={() => onHelp(['deposit', 'equal'])} aria-label="용어 설명">
            <CircleHelp size={15} strokeWidth={2.2} />
          </button>
        </h3>
        <div className="stepper">
          <button
            className="step-btn"
            aria-label="10주 줄이기"
            disabled={shares <= 10}
            onClick={() => draft.set(Math.max(10, shares - 10))}
          >
            <Minus size={22} strokeWidth={2.4} />
          </button>
          <div className="step-val">
            {shares.toLocaleString()}
            <small>주</small>
          </div>
          <button
            className="step-btn"
            aria-label="10주 늘리기"
            disabled={shares + 10 > maxShares}
            onClick={() => draft.set(Math.min(maxShares, shares + 10))}
          >
            <Plus size={22} strokeWidth={2.4} />
          </button>
        </div>
        <div className="quick-chips">
          {quick.map((n) => (
            <button key={n} className={'chip sm' + (shares === n ? ' on' : '')} onClick={() => draft.set(n)}>
              {n === maxShares ? '최대' : `${n}주`}
            </button>
          ))}
        </div>
        <div className="kv sim-sum">
          <KV label="필요한 증거금 (50%)" value={fmtWon(deposit)} />
          <KV label="청약 후 남는 자산" value={fmtWon(available - deposit)} muted />
          <div className="kv-sep" />
          <KV
            label="예상 배정"
            value={
              expected != null ? (
                <span className="t-brand">약 {expected < 10 ? expected.toFixed(2) : Math.round(expected)}주</span>
              ) : (
                '경쟁률 확정 후'
              )
            }
            muted={expected == null}
          />
        </div>
        {expected == null && <p className="t3 fs13 mt8">통합 경쟁률이 나오면 예상 배정 주수를 알려드려요.</p>}
      </section>

      <div className="callout mx">
        <Emoji e="💡" size={20} />
        <span>
          실제 청약이 아닌 <b>가상 모의청약</b>이에요. 상장 다음 날 실제 종가로 배정·수익이 정산되고, {fmtKrw(10_000_000)} 시즌 자산으로
          실력을 겨뤄요.
        </span>
      </div>
    </div>
  )
}

function SimIntro() {
  return (
    <section className="d-sec">
      <h3 className="d-sec-title">모의청약은 이렇게 진행돼요</h3>
      <ol className="howto">
        <li>
          <b>청약 기간에 가상 머니로 청약</b>
          <span>증거금 50%가 시즌 자산에서 잠시 묶여요</span>
        </li>
        <li>
          <b>상장일 수익률 예측</b>
          <span>따상·상승·공모가 근처·하락 중 하나를 골라요</span>
        </li>
        <li>
          <b>상장 다음 날 정산</b>
          <span>실제 경쟁률로 배정하고 실제 종가로 수익을 계산해요</span>
        </li>
      </ol>
    </section>
  )
}

// 청약 수량 초안 — 탭 전환·푸터 버튼과 공유하기 위해 모듈 범위에 보관 (종목별)
const drafts = new Map<string, number>()
export const clearDrafts = () => drafts.clear()
const draftListeners = new Set<() => void>()
function useDraft(id: string, initial: number) {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((x) => x + 1)
    draftListeners.add(fn)
    return () => {
      draftListeners.delete(fn)
    }
  }, [])
  return {
    shares: drafts.get(id) ?? initial,
    set(n: number) {
      drafts.set(id, n)
      haptic(5)
      draftListeners.forEach((f) => f())
    },
  }
}

// ───────── 하단 고정 버튼 (모의청약 탭) ─────────
function SimFooter({ ipo, mode }: { ipo: Ipo; mode: Mode }) {
  const seedMoney = useStore((s) => s.seedMoney)
  const escrowHeld = useStore((s) => s.escrow[ipo.id] ?? 0)
  const savedShares = useStore((s) => s.subscriptions[ipo.id])
  const prediction = useStore((s) => s.predictions[ipo.id])
  const setSubscription = useStore((s) => s.setSubscription)
  const cancel = useStore((s) => s.cancelSubscription)
  const settleReal = useStore((s) => s.settleReal)
  const draft = useDraft(ipo.id, savedShares ?? 10)
  const [confirm, setConfirm] = useState(false)
  const maxShares = maxAffordableShares(seedMoney + escrowHeld, ipo.offerPrice)
  const shares = Math.min(draft.shares, maxShares)

  if (mode === 'settle')
    return (
      <button
        className="btn btn-primary btn-lg"
        onClick={() => {
          haptic([10, 30, 10])
          settleReal(ipo)
        }}
      >
        결과 확인하고 정산하기
      </button>
    )
  if (mode !== 'bet') return null

  if (ipo.offerPrice <= 0)
    return (
      <button className="btn btn-primary btn-lg" disabled>
        공모가가 정해지면 참여할 수 있어요
      </button>
    )
  const editing = savedShares != null
  const unchanged = editing && savedShares === shares
  const deposit = depositFor(shares, ipo.offerPrice)
  return (
    <>
      {(editing || prediction) && (
        <button className="btn btn-secondary btn-lg cancel-btn" onClick={() => setConfirm(true)}>
          취소
        </button>
      )}
      <button
        className="btn btn-primary btn-lg"
        disabled={unchanged || deposit > seedMoney + escrowHeld}
        onClick={() => {
          setSubscription(ipo.id, shares, deposit)
          haptic([10, 40, 10])
          toast(editing ? `${shares.toLocaleString()}주로 수정했어요` : `${shares.toLocaleString()}주 모의청약을 완료했어요`, '🎉')
        }}
      >
        {unchanged ? '청약 완료' : editing ? '수정하기' : `${shares.toLocaleString()}주 청약하기`}
      </button>
      {confirm && (
        <Confirm
          title="모의청약을 취소할까요?"
          desc={
            escrowHeld > 0 ? `묶여 있던 증거금 ${fmtWon(escrowHeld)}은 시즌 자산으로 바로 돌아와요.` : '선택한 상장일 예측도 함께 지워져요.'
          }
          confirmLabel="취소하기"
          cancelLabel="닫기"
          danger
          onConfirm={() => {
            cancel(ipo.id)
            drafts.delete(ipo.id)
            toast('모의청약을 취소했어요')
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </>
  )
}
