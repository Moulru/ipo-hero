import { RELICS } from './relics'

export interface AchStats {
  level: number
  views: number
  pulls: number
  ownedRelics: string[]
  seedMoney: number
  streak: number
  hits: number
}

export interface Achievement {
  id: string
  name: string
  emoji: string
  desc: string
  gold: number
  title?: string
  check: (s: AchStats) => boolean
}

const rarityOf = (id: string) => RELICS.find((x) => x.id === id)?.rarity
const epicCount = (ids: string[]) => ids.filter((id) => rarityOf(id) === 'epic' || rarityOf(id) === 'legendary').length
const legendCount = (ids: string[]) => ids.filter((id) => rarityOf(id) === 'legendary').length

// '업적'인 만큼 전부 도전적인 목표 (쉬운 항목 없음)
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'explore20', name: '공시 정독러', emoji: '📑', desc: '공모주 20종목 살펴보기', gold: 500, title: '정독러', check: (s) => s.views >= 20 },
  { id: 'hit5', name: '신통한 촉', emoji: '🔮', desc: '상장일 예측 5회 적중', gold: 700, title: '예측가', check: (s) => s.hits >= 5 },
  { id: 'hit15', name: '족집게', emoji: '🎯', desc: '상장일 예측 15회 적중', gold: 1500, title: '족집게', check: (s) => s.hits >= 15 },
  { id: 'pull30', name: '카드 수집가', emoji: '🃏', desc: '투자 카드 30회 뽑기', gold: 600, title: '수집가', check: (s) => s.pulls >= 30 },
  { id: 'pull80', name: '가챠 고인물', emoji: '🎰', desc: '투자 카드 80회 뽑기', gold: 1500, title: '고인물', check: (s) => s.pulls >= 80 },
  { id: 'epic5', name: '블루칩 컬렉터', emoji: '💠', desc: '에픽+ 카드 5장 보유', gold: 800, check: (s) => epicCount(s.ownedRelics) >= 5 },
  { id: 'legend2', name: '레전드 핸드', emoji: '🌟', desc: '레전더리 카드 2장 보유', gold: 2000, title: '레전드', check: (s) => legendCount(s.ownedRelics) >= 2 },
  { id: 'streak30', name: '홀딩 30일', emoji: '🔥', desc: '30일 연속 출석', gold: 1000, title: '홀더', check: (s) => s.streak >= 30 },
  { id: 'streak100', name: '백일 홀딩', emoji: '💎', desc: '100일 연속 출석', gold: 3000, title: '홀더왕', check: (s) => s.streak >= 100 },
  { id: 'rich', name: '우상향', emoji: '📈', desc: '시즌 자산 5,000만원 돌파', gold: 1200, title: '우상향', check: (s) => s.seedMoney >= 50_000_000 },
  { id: 'king', name: '공모왕', emoji: '👑', desc: '공모왕 등극 (Lv.51)', gold: 2500, title: '공모왕', check: (s) => s.level >= 51 },
]

export function achById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
