export type QuestType = 'checkin' | 'view' | 'pull'

export interface QuestDef {
  id: string
  label: string
  type: QuestType
  target: number
  gold: number
  xp: number
}

export interface QuestState {
  id: string
  progress: number
  claimed: boolean
}

export const QUEST_POOL: QuestDef[] = [
  { id: 'q_checkin', label: '오늘 출석하기', type: 'checkin', target: 1, gold: 80, xp: 20 },
  { id: 'q_view3', label: '공모주 3종목 살펴보기', type: 'view', target: 3, gold: 120, xp: 30 },
  { id: 'q_view5', label: '공모주 5종목 살펴보기', type: 'view', target: 5, gold: 200, xp: 50 },
  { id: 'q_pull1', label: '카드 1회 뽑기', type: 'pull', target: 1, gold: 100, xp: 20 },
]

export function questById(id: string): QuestDef | undefined {
  return QUEST_POOL.find((q) => q.id === id)
}

// 날짜 시드로 3개 선택 (하루 동안 고정)
export function rollDailyQuests(seed: number): QuestState[] {
  const pool = [...QUEST_POOL]
  const picked: QuestDef[] = []
  let s = seed
  while (picked.length < 3 && pool.length) {
    s = (s * 9301 + 49297) % 233280
    const idx = Math.floor((s / 233280) * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked.map((q) => ({ id: q.id, progress: 0, claimed: false }))
}
