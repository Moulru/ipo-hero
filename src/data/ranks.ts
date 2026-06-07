// 투자자 등급(랭크) 사다리 — 랭크마다 10레벨, Lv.10 달성 시 다음 랭크 Lv.1로 승급(계단식)
// 개미 1~10 → 불개미 1~10 → 슈퍼개미 → 큰손 → 슈퍼큰손 → 공모왕 1~무한
export interface Rank {
  name: string
  emoji: string
}

export const RANKS: Rank[] = [
  { name: '개미', emoji: '🐜' },
  { name: '불개미', emoji: '🔥' },
  { name: '슈퍼개미', emoji: '⭐' },
  { name: '큰손', emoji: '🤑' },
  { name: '슈퍼큰손', emoji: '💰' },
  { name: '공모왕', emoji: '👑' },
]

export const LEVELS_PER_RANK = 10

// 전역 레벨(1~) → 랭크 + 랭크 내 레벨(1~10, 최종 랭크 공모왕은 1~무한)
export function rankInfo(level: number): { rank: Rank; index: number; rankLevel: number; isMaxRank: boolean } {
  const index = Math.min(RANKS.length - 1, Math.floor((level - 1) / LEVELS_PER_RANK))
  const rankLevel = level - index * LEVELS_PER_RANK
  return { rank: RANKS[index], index, rankLevel, isMaxRank: index === RANKS.length - 1 }
}

export function rankForLevel(level: number): Rank {
  return rankInfo(level).rank
}

export function nextRank(level: number): Rank | null {
  const { index } = rankInfo(level)
  return index < RANKS.length - 1 ? RANKS[index + 1] : null
}
