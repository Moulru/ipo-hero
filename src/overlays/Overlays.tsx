import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store'
import { relicById } from '../data/relics'
import { rankInfo } from '../data/ranks'
import type { Relic } from '../types'
import { OUTCOME_META, RARITY_META, returnColor, signedPct } from '../lib/calc'
import { fmtWon } from '../lib/format'
import { confetti, haptic } from '../lib/juice'
import { useBackClose } from '../lib/backStack'
import { Emoji } from '../ui/Emoji'
import { StockLogo } from '../ui/kit'

// ───────── 모의청약 정산 결과 (단계적 공개) ─────────
export function SettleResult() {
  const r = useStore((s) => s.lastResult)!
  const clear = useStore((s) => s.clearResult)
  const [phase, setPhase] = useState(0) // 0 확인 중 · 1 배정 · 2 수익 · 3 보상
  const [leaving, setLeaving] = useState(false)
  const close = () => {
    if (phase < 3) return setPhase(3) // 연출 중 뒤로가기/탭 = 건너뛰기
    setLeaving(true)
    setTimeout(clear, 200)
  }
  useBackClose(close)

  useEffect(() => {
    const t = [setTimeout(() => setPhase(1), 1100), setTimeout(() => setPhase(2), 2000), setTimeout(() => setPhase(3), 2800)]
    return () => t.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (phase === 1) haptic(12)
    if (phase === 2) haptic(r.predictionCorrect ? [15, 40, 15] : 20)
    if (phase === 3 && (r.profit > 0 || r.predictionCorrect)) confetti()
  }, [phase, r])

  const pos = r.profit > 0
  const emoji = phase < 1 ? '🎰' : r.allocatedShares === 0 ? '😅' : phase < 2 ? '📦' : pos ? '🎉' : r.profit < 0 ? '😢' : '🙂'
  const lv = rankInfo(r.newLevel)

  return createPortal(
    <div className={'result-root' + (leaving ? ' leaving' : '')} role="dialog" aria-modal="true" aria-label="정산 결과">
      <div className="result-body">
        <div className="result-ipo">
          <StockLogo ipo={r.ipo} size={28} />
          <span>{r.ipo.name}</span>
        </div>
        <div className="result-emoji" key={emoji}>
          <Emoji e={emoji} size={112} />
        </div>
        <h2 className="result-title">
          {phase < 1 ? (
            <>
              배정 결과를
              <br />
              확인하고 있어요
            </>
          ) : r.allocatedShares === 0 ? (
            <>
              아쉽게도
              <br />
              배정받지 못했어요
            </>
          ) : (
            <>
              <span className="num">{r.allocatedShares.toLocaleString()}주</span>를
              <br />
              배정받았어요
            </>
          )}
        </h2>
        {phase >= 1 && <p className="result-sub num">{r.subscribedShares.toLocaleString()}주 청약 · 실제 경쟁률 기준</p>}

        <div className="result-cards">
          {phase >= 2 && (
            <div className="result-card">
              <div className="rc-row">
                <span className="t3">상장일 수익률</span>
                <b className="num" style={{ color: returnColor(r.listingReturn) }}>
                  {signedPct(r.listingReturn)}
                </b>
              </div>
              <div className="rc-row">
                <span className="t3">모의청약 손익</span>
                <b className="num" style={{ color: returnColor(r.profit) }}>
                  {r.profit > 0 ? '+' : ''}
                  {fmtWon(r.profit)}
                </b>
              </div>
              {r.deposit > 0 && (
                <div className="rc-row">
                  <span className="t3">돌려받은 증거금</span>
                  <span className="num">{fmtWon(r.deposit)}</span>
                </div>
              )}
              {r.prediction && (
                <div className={'verdict' + (r.predictionCorrect ? ' hit' : '')}>
                  <Emoji e={r.predictionCorrect ? '🎯' : '💨'} size={22} />
                  <span>
                    예측 ‘{OUTCOME_META[r.prediction].label}’{' '}
                    {r.predictionCorrect ? '적중했어요!' : `→ 실제 ‘${OUTCOME_META[r.realOutcome].label}’`}
                  </span>
                  {r.predictionCorrect && r.combo > 1 && <span className="pill tone-up sm">{r.combo}연속</span>}
                </div>
              )}
            </div>
          )}
          {phase >= 3 && (
            <div className="result-card rewards">
              <div className="rew">
                <Emoji e="🪙" size={28} />
                <span>골드</span>
                <b className="num">+{r.goldGain.toLocaleString()}</b>
              </div>
              <div className="rew">
                <Emoji e="⭐" size={28} />
                <span>경험치</span>
                <b className="num">+{r.xpGain.toLocaleString()}</b>
              </div>
              {r.leveledUp && (
                <div className="rew lvup">
                  <Emoji e={lv.rank.emoji} size={28} />
                  <span>
                    {lv.rank.name} Lv.{lv.rankLevel} 달성
                  </span>
                  <b>레벨 업!</b>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="result-foot">
        <button className="btn btn-primary btn-lg" onClick={close}>
          {phase < 3 ? '건너뛰기' : '확인'}
        </button>
      </div>
    </div>,
    document.body
  )
}

// ───────── 투자 카드 뽑기 연출 ─────────
export function CardReveal() {
  const reveal = useStore((s) => s.relicReveal)!
  const clear = useStore((s) => s.clearRelicReveal)
  const relics = reveal.ids.map((id) => relicById(id)).filter(Boolean) as Relic[]
  // 데이터 변경 등으로 카드를 하나도 찾지 못하면 연출 없이 닫음
  useEffect(() => {
    if (!relics.length) clear()
  }, [relics.length, clear])
  if (!relics.length) return null
  return <CardRevealView relics={relics} fresh={reveal.fresh} refund={reveal.refund} clear={clear} />
}

function CardRevealView({ relics, fresh, refund, clear }: { relics: Relic[]; fresh?: boolean[]; refund: number; clear: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const multi = relics.length > 1
  const best = relics.reduce((b, r) => (rank(r) > rank(b) ? r : b), relics[0])
  const close = () => {
    setLeaving(true)
    setTimeout(clear, 200)
  }
  useBackClose(close)

  useEffect(() => {
    haptic(15)
    const t = setTimeout(
      () => {
        if (best.rarity === 'legendary') confetti(['#ffbb33', '#ffd666', '#ffffff', '#8a5cf6'])
        else if (best.rarity === 'epic') confetti(['#ad80ff', '#7b6dff', '#ffffff'])
        if (rank(best) >= 2) haptic([20, 40, 20])
      },
      multi ? 900 : 650
    )
    return () => clearTimeout(t)
  }, [best, multi])

  const isNew = (i: number) => fresh?.[i] ?? false

  return createPortal(
    <div className={'reveal-root r-' + best.rarity + (leaving ? ' leaving' : '')} role="dialog" aria-modal="true" aria-label="카드 획득">
      <div className="reveal-glow" />
      <div className="reveal-body">
        <div className="reveal-kicker">
          {multi ? `카드 ${relics.length}장을 뽑았어요` : isNew(0) ? '새로운 카드를 얻었어요' : '이미 가진 카드가 나왔어요'}
        </div>
        {!multi ? (
          <div className={`reveal-card r-${best.rarity}`}>
            <div className="reveal-card-inner">
              <div className="reveal-face back" />
              <div className="reveal-face front">
                <span className="rarity-label">{RARITY_META[best.rarity].label}</span>
                <Emoji e={best.emoji} size={104} />
                <div className="reveal-name">{best.name}</div>
                <div className="reveal-desc">{best.desc}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="reveal-grid">
            {relics.map((r, i) => (
              <div key={i} className={`mini-card r-${r.rarity}`} style={{ animationDelay: `${i * 70}ms` }}>
                <Emoji e={r.emoji} size={40} />
                <span className="mini-name">{r.name}</span>
                {isNew(i) && <span className="new-tag">NEW</span>}
              </div>
            ))}
          </div>
        )}
        {refund > 0 && (
          <div className="reveal-refund">
            <Emoji e="🪙" size={20} />
            이미 가진 카드는 {refund.toLocaleString()}골드로 돌려드렸어요
          </div>
        )}
      </div>
      <div className="reveal-foot">
        <button className="btn btn-lg reveal-btn" onClick={close}>
          확인
        </button>
      </div>
    </div>,
    document.body
  )
}

const rank = (r: Relic) => ['common', 'rare', 'epic', 'legendary'].indexOf(r.rarity)
