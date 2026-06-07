export type Stage = 'upcoming' | 'subscription' | 'pending' | 'listed'
// upcoming: 청약 전 · subscription: 청약 중 · pending: 청약 끝·상장 대기(열린 루프) · listed: 상장 완료

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

// 따상 / 상승 / 공모가 근처 / 하락
export type PredictionChoice = 'ttassang' | 'up' | 'flat' | 'down'

export interface Ipo {
  id: string
  name: string
  sector: string
  offerPrice: number // 확정 공모가 또는 희망 상단
  priceLow: number | null
  priceHigh: number | null
  priceConfirmed: boolean
  subscriptionStart: string | null // YYYY-MM-DD
  subscriptionEnd: string | null
  listingDate: string | null
  competitionRate: number | null // 통합 청약경쟁률 (:1), 청약 전엔 null
  institutionalRate: number | null // 기관 수요예측 경쟁률
  lockupRatio: number | null // 의무보유확약 비율(%)
  offerAmount: number | null // 공모금액(억) = 공모 규모
  listingReturn: number | null // 공모가 대비 첫날 종가 수익률(%), 상장 전엔 null
  expectedPer10: number | null // 10주 청약 시 예상 배정주수(경쟁률 기반 추정)
  underwriter: string | null
  rarity: Rarity
  isReal: boolean
}

export type ClassId = 'farmer' | 'hunter' | 'value'

export interface PlayerClass {
  id: ClassId
  name: string
  emoji: string
  passive: string
}

// 투자카드 효과는 게임 레이어(XP·골드 획득)만 — 시즌 자산(배정·수익)엔 영향 없음(순수 실력)
export type RelicEffectKind = 'xpMult' | 'goldMult' | 'none'

export interface Relic {
  id: string
  name: string
  emoji: string
  rarity: Rarity
  desc: string
  effect: { kind: RelicEffectKind; value: number }
}
