export type QuestType = 'checkin' | 'view' | 'pull' | 'kill' | 'stage' | 'upgrade'

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
  { id: 'q_kill30', label: '몬스터 30마리 처치', type: 'kill', target: 30, gold: 150, xp: 0 },
  { id: 'q_kill100', label: '몬스터 100마리 처치', type: 'kill', target: 100, gold: 300, xp: 0 },
  { id: 'q_stage3', label: '새 스테이지 3번 돌파', type: 'stage', target: 3, gold: 200, xp: 0 },
  { id: 'q_upg5', label: '능력치 5번 강화', type: 'upgrade', target: 5, gold: 150, xp: 0 },
]

export function questById(id: string): QuestDef | undefined {
  return QUEST_POOL.find((q) => q.id === id)
}

// 날짜 시드로 3개 선택 (하루 동안 고정). 보상 골드는 수령 시 최고 스테이지 스케일 적용
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
