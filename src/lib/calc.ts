import type { Ipo, PredictionChoice, Rarity, Stage } from '../types'

export const SEED_MONEY = 10_000_000 // 시즌 시드 1,000만원

export function todayYmd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 실제 날짜 기준으로 IPO 단계를 동적으로 계산 (시장이 곧 게임 시계)
export function computeStage(ipo: Ipo, today = todayYmd()): Stage {
  if (ipo.listingReturn != null) return 'listed'
  if (ipo.listingDate && today > ipo.listingDate) return 'listed' // 상장일 다음날부터는 수익률 없어도 상장 완료(D-Day는 대기 유지)
  if (!ipo.subscriptionStart || !ipo.subscriptionEnd) return ipo.listingDate ? 'pending' : 'upcoming'
  if (today < ipo.subscriptionStart) return 'upcoming'
  if (today <= ipo.subscriptionEnd) return 'subscription'
  return 'pending'
}

export function daysUntil(dateYmd: string | null, today = todayYmd()): number | null {
  if (!dateYmd) return null
  const a = new Date(today + 'T00:00:00').getTime()
  const b = new Date(dateYmd + 'T00:00:00').getTime()
  return Math.round((b - a) / 86_400_000)
}

export const STAGE_META: Record<Stage, { label: string; cls: string }> = {
  subscription: { label: '청약 중', cls: 'stage-subscription' },
  pending: { label: '상장 대기', cls: 'stage-pending' },
  upcoming: { label: '곧 시작', cls: 'stage-upcoming' },
  listed: { label: '상장 완료', cls: 'stage-listed' },
}

// 가챠: 기대 배정(경쟁률 기반)에 운(±)을 곱해 실제 배정 결정 — 카드/클래스 영향 없음(순수)
export function rollAllocation(shares: number, expectedPer10: number | null): number {
  if (shares <= 0) return 0
  const expected = (shares / 10) * (expectedPer10 ?? 0.5)
  const factor = 0.45 + Math.random() * 1.3
  return Math.max(0, Math.round(expected * factor))
}

export function depositFor(shares: number, offerPrice: number): number {
  return Math.round(shares * offerPrice * 0.5) // 증거금 50%
}

export function maxAffordableShares(seed: number, offerPrice: number): number {
  if (offerPrice <= 0) return 100
  const raw = Math.floor(seed / (offerPrice * 0.5))
  return Math.max(10, Math.floor(raw / 10) * 10)
}

export function outcomeFromReturn(r: number): PredictionChoice {
  if (r >= 100) return 'ttassang'
  if (r >= 10) return 'up'
  if (r > -10) return 'flat'
  return 'down'
}

export const OUTCOME_META: Record<PredictionChoice, { label: string; range: string; color: string }> = {
  ttassang: { label: '따상', range: '+100% 이상', color: '#ff5c8a' },
  up: { label: '상승', range: '+10–100%', color: '#ff9f43' },
  flat: { label: '공모가 근처', range: '-10–+10%', color: '#7d8aa0' },
  down: { label: '하락', range: '-10% 이하', color: '#4aa3ff' },
}

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common: { label: '커먼', color: '#8a93a6' },
  rare: { label: '레어', color: '#4aa3ff' },
  epic: { label: '에픽', color: '#b06bff' },
  legendary: { label: '레전더리', color: '#ffb01f' },
}

export function formatMan(won: number): string {
  return `${Math.round(won / 10000).toLocaleString('ko-KR')}만원`
}

export function formatWon(won: number): string {
  return `${Math.round(won).toLocaleString('ko-KR')}원`
}

export function signedPct(r: number): string {
  return `${r >= 0 ? '+' : ''}${r}%`
}

export function formatEok(eok: number | null): string {
  if (eok == null) return '미정'
  if (eok >= 10000) return `${(eok / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조`
  return `${eok.toLocaleString('ko-KR')}억`
}

// 연승 콤보 배수: 0연승 ×1 → 5연승 이상 ×2 (실전 예측 연속 적중)
export function comboMult(combo: number): number {
  return 1 + Math.min(combo, 5) * 0.2
}
