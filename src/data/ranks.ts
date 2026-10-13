// 투자자 등급 — 방치형 RPG의 '최고 돌파 스테이지'로 결정 (2.0~: 경험치 레벨 대체)
// 개미 → 불개미(20) → 슈퍼개미(50) → 큰손(100) → 슈퍼큰손(150) → 공모왕(200)
export interface Rank {
  name: string
  emoji: string
  minStage: number // 이 스테이지를 돌파하면 승급
}

export const RANKS: Rank[] = [
  { name: '개미', emoji: '🐜', minStage: 0 },
  { name: '불개미', emoji: '🔥', minStage: 20 },
  { name: '슈퍼개미', emoji: '⭐', minStage: 50 },
  { name: '큰손', emoji: '🤑', minStage: 100 },
  { name: '슈퍼큰손', emoji: '💰', minStage: 150 },
  { name: '공모왕', emoji: '👑', minStage: 200 },
]

// 최고 돌파 스테이지 → 등급 + 다음 등급까지 진행률
export function rankInfo(bestCleared: number): {
  rank: Rank
  index: number
  next: Rank | null
  progress: number // 0–1 (현재 등급 구간 내)
  isMaxRank: boolean
} {
  let index = 0
  for (let i = 0; i < RANKS.length; i++) if (bestCleared >= RANKS[i].minStage) index = i
  const rank = RANKS[index]
  const next = RANKS[index + 1] ?? null
  const progress = next ? Math.min(1, (bestCleared - rank.minStage) / (next.minStage - rank.minStage)) : 1
  return { rank, index, next, progress, isMaxRank: !next }
}
