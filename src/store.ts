import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClassId, Ipo, PredictionChoice } from './types'
import { SEED_MONEY, comboMult, outcomeFromReturn, rollAllocation, todayYmd } from './lib/calc'
import { PITY_PULLS, RELIC_COST, RELIC_COST_10, aggregateEffects, dupRefund, pullCard } from './data/relics'
import { type QuestState, type QuestType, questById, rollDailyQuests } from './data/quests'
import { ACHIEVEMENTS, type AchStats } from './data/achievements'

const XP_PER_LEVEL = 100
const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1
// 순수 실력: 모든 클래스 동일 시드. 클래스는 XP에만, 카드는 게임 레이어(XP·골드)에만 영향.

export interface PlayResult {
  kind: 'real'
  ipo: Ipo
  prediction: PredictionChoice | null
  realOutcome: PredictionChoice
  predictionCorrect: boolean | null
  allocatedShares: number
  subscribedShares: number
  listingReturn: number
  profit: number
  deposit: number // 정산 시 반환된 증거금
  goldGain: number
  xpGain: number
  combo: number
  comboMult: number
  leveledUp: boolean
  newLevel: number
}

interface Store {
  chosenClass: ClassId | null
  level: number
  xp: number
  gold: number
  seedMoney: number
  streak: number
  lastCheckIn: string | null
  lastRewardClaim: string | null
  comboCount: number
  predictions: Record<string, PredictionChoice>
  subscriptions: Record<string, number>
  escrow: Record<string, number> // 가상청약 증거금(시즌 자산에서 차감해 보관, 정산 시 반환)
  dex: string[]
  settledIds: string[]
  hits: number
  totalPredictions: number
  viewed: string[]
  ownedRelics: string[]
  pullsSinceEpic: number
  pulls: number
  quests: { date: string | null; items: QuestState[] }
  achievements: string[]
  equippedTitle: string | null
  lastResult: PlayResult | null
  relicReveal: { ids: string[]; refund: number } | null
  lastUnlocks: string[]
  darkMode: boolean // 다크 모드 on/off (기본 라이트)
  haptics: boolean // 진동(햅틱) 효과 on/off
  welcomed: boolean // 첫 실행 웰컴(정체성·면책) 확인 여부

  chooseClass: (c: ClassId) => void
  tick: () => void
  claimDailyReward: () => void
  setPrediction: (ipoId: string, choice: PredictionChoice) => void
  setSubscription: (ipoId: string, shares: number, deposit: number) => void
  viewIpo: (ipoId: string) => void
  settleReal: (ipo: Ipo) => void
  clearResult: () => void
  pullRelic: () => void
  pullRelic10: () => void
  clearRelicReveal: () => void
  claimQuest: (id: string) => void
  equipTitle: (id: string | null) => void
  clearUnlocks: () => void
  setHaptics: (v: boolean) => void
  setDark: (v: boolean) => void
  setWelcomed: () => void
  resetSeason: () => void
}

function bump(items: QuestState[], type: QuestType, n = 1): QuestState[] {
  return items.map((q) => {
    const def = questById(q.id)
    if (def && def.type === type && !q.claimed) return { ...q, progress: Math.min(def.target, q.progress + n) }
    return q
  })
}

function withAchievements(cand: Store): Partial<Store> {
  const stats: AchStats = {
    level: cand.level,
    views: cand.viewed.length,
    pulls: cand.pulls,
    ownedRelics: cand.ownedRelics,
    seedMoney: cand.seedMoney,
    streak: cand.streak,
    hits: cand.hits,
  }
  const newly: string[] = []
  let bonus = 0
  for (const a of ACHIEVEMENTS) {
    if (!cand.achievements.includes(a.id) && a.check(stats)) {
      newly.push(a.id)
      bonus += a.gold
    }
  }
  if (!newly.length) return {}
  return { achievements: [...cand.achievements, ...newly], gold: cand.gold + bonus, lastUnlocks: newly }
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      chosenClass: 'farmer',
      level: 1,
      xp: 0,
      gold: 0,
      seedMoney: SEED_MONEY,
      streak: 1,
      lastCheckIn: null,
      lastRewardClaim: null,
      comboCount: 0,
      predictions: {},
      subscriptions: {},
      escrow: {},
      dex: [],
      settledIds: [],
      hits: 0,
      totalPredictions: 0,
      viewed: [],
      ownedRelics: [],
      pullsSinceEpic: 0,
      pulls: 0,
      quests: { date: null, items: [] },
      achievements: [],
      equippedTitle: null,
      lastResult: null,
      relicReveal: null,
      lastUnlocks: [],
      darkMode: false,
      haptics: true,
      welcomed: false,

      chooseClass: (c) => set({ chosenClass: c }),

      // 앱 진입: 일일 출석(스트릭·XP) + 일일 퀘스트 갱신
      tick: () =>
        set((s) => {
          const now = Date.now()
          const t = todayYmd()
          let items = s.quests.items
          let questsDate = s.quests.date
          if (s.quests.date !== t) {
            items = rollDailyQuests(parseInt(t.replace(/-/g, ''), 10))
            questsDate = t
          }
          let checkPatch: Partial<Store> = {}
          if (s.lastCheckIn !== t) {
            const yesterday = todayYmd(new Date(now - 86_400_000))
            const streak = s.lastCheckIn === yesterday ? s.streak + 1 : 1
            const xp = s.xp + 10
            items = bump(items, 'checkin')
            checkPatch = { streak, lastCheckIn: t, xp, level: levelOf(xp) }
          }
          const patch: Partial<Store> = { ...checkPatch, quests: { date: questsDate, items } }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      claimDailyReward: () =>
        set((s) => {
          const t = todayYmd()
          if (s.lastRewardClaim === t) return s
          const reward = 50 + Math.min(s.streak, 7) * 20
          const patch: Partial<Store> = { gold: s.gold + reward, lastRewardClaim: t }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      setPrediction: (ipoId, choice) => set((s) => ({ predictions: { ...s.predictions, [ipoId]: choice } })),
      // 가상청약: 증거금을 시즌 자산에서 차감(보관). 수정 시 기존 증거금 반환 후 신규 차감(차액만 이동).
      setSubscription: (ipoId, shares, deposit) =>
        set((s) => {
          const prev = s.escrow[ipoId] ?? 0
          const newSeed = s.seedMoney + prev - deposit
          if (newSeed < 0) return s // 시즌 자산 부족(컴포넌트에서 캡하지만 방어)
          return {
            subscriptions: { ...s.subscriptions, [ipoId]: shares },
            escrow: { ...s.escrow, [ipoId]: deposit },
            seedMoney: newSeed,
          }
        }),

      // 공모주 상세 열람 → 살펴본 종목 기록(중복 제외) + 퀘스트/업적
      viewIpo: (ipoId) =>
        set((s) => {
          if (s.viewed.includes(ipoId)) return s
          const patch: Partial<Store> = {
            viewed: [...s.viewed, ipoId],
            quests: { ...s.quests, items: bump(s.quests.items, 'view') },
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      // 실전 정산: 상장일+1일부터(D-Day 제외) 실제 결과로 → 증거금 반환 + 손익(순수: 카드·클래스 무관)
      settleReal: (ipo) =>
        set((s) => {
          if (s.settledIds.includes(ipo.id) || ipo.listingReturn == null) return s
          if (ipo.listingDate && todayYmd() <= ipo.listingDate) return s // 상장 당일까지 정산 불가(상장일+1부터)

          const shares = s.subscriptions[ipo.id] ?? 0
          const deposit = s.escrow[ipo.id] ?? 0
          const allocated = rollAllocation(shares, ipo.expectedPer10) // 순수: 카드/클래스 영향 없음
          const ret = ipo.listingReturn
          const realOutcome = outcomeFromReturn(ret)
          const profit = Math.round(allocated * ipo.offerPrice * (ret / 100)) // 시즌 자산 손익(순수)

          const prediction = s.predictions[ipo.id] ?? null
          const correct = prediction ? prediction === realOutcome : null
          const combo = correct ? s.comboCount + 1 : correct === false ? 0 : s.comboCount
          const cm = comboMult(combo)

          // 클래스 보너스는 XP에만 (시즌 자산엔 영향 없음 — 순수 실력)
          let classXpMult = 1
          if (s.chosenClass === 'farmer') classXpMult = 1.2
          else if (s.chosenClass === 'hunter' && correct && realOutcome === 'ttassang') classXpMult = 4
          else if (s.chosenClass === 'value' && correct) classXpMult = 1.5

          // 카드 효과도 게임 레이어(골드·XP)에만
          const fx = aggregateEffects(s.ownedRelics)
          const goldGain = Math.round((120 + (correct ? 150 : 0) + Math.max(0, Math.round(profit / 80000))) * fx.goldMult)
          const xpGain = Math.round((30 + (shares > 0 ? 15 : 0) + (correct ? 50 : 0)) * fx.xpMult * classXpMult)
          const newXp = s.xp + xpGain
          const newLevel = levelOf(newXp)

          const result: PlayResult = {
            kind: 'real',
            ipo,
            prediction,
            realOutcome,
            predictionCorrect: correct,
            allocatedShares: allocated,
            subscribedShares: shares,
            listingReturn: ret,
            profit,
            deposit,
            goldGain,
            xpGain,
            combo,
            comboMult: cm,
            leveledUp: newLevel > s.level,
            newLevel,
          }
          const restEscrow = { ...s.escrow }
          delete restEscrow[ipo.id]
          const patch: Partial<Store> = {
            seedMoney: s.seedMoney + deposit + profit, // 증거금 반환 + 손익 실현
            escrow: restEscrow,
            gold: s.gold + goldGain,
            xp: newXp,
            level: newLevel,
            comboCount: combo,
            dex: s.dex.includes(ipo.id) ? s.dex : [...s.dex, ipo.id],
            settledIds: [...s.settledIds, ipo.id],
            hits: s.hits + (correct ? 1 : 0),
            totalPredictions: s.totalPredictions + (prediction ? 1 : 0),
            lastResult: result,
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      clearResult: () => set({ lastResult: null }),

      // 1회 뽑기: 천장(누적 PITY_PULLS) 시 미보유 확정. 중복이면 등급별 골드 환불.
      pullRelic: () =>
        set((s) => {
          if (s.gold < RELIC_COST) return s
          let pity = s.pullsSinceEpic + 1
          const card = pullCard(s.ownedRelics, pity >= PITY_PULLS)
          const isNew = !s.ownedRelics.includes(card.id)
          const refund = isNew ? 0 : dupRefund(card.rarity)
          if (isNew) pity = 0
          const patch: Partial<Store> = {
            gold: s.gold - RELIC_COST + refund,
            ownedRelics: isNew ? [...s.ownedRelics, card.id] : s.ownedRelics, // 중복은 스택 안 쌓음(환불만)
            pulls: s.pulls + 1,
            pullsSinceEpic: pity,
            quests: { ...s.quests, items: bump(s.quests.items, 'pull') },
            relicReveal: { ids: [card.id], refund },
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      pullRelic10: () =>
        set((s) => {
          if (s.gold < RELIC_COST_10) return s
          let pity = s.pullsSinceEpic
          const owned = [...s.ownedRelics]
          const ids: string[] = []
          let refund = 0
          for (let i = 0; i < 10; i++) {
            pity++
            const card = pullCard(owned, pity >= PITY_PULLS)
            if (owned.includes(card.id)) {
              refund += dupRefund(card.rarity) // 중복: 환불만, 스택 안 쌓음
            } else {
              pity = 0
              owned.push(card.id) // 신규만 도감에 추가
            }
            ids.push(card.id)
          }
          const patch: Partial<Store> = {
            gold: s.gold - RELIC_COST_10 + refund,
            ownedRelics: owned,
            pulls: s.pulls + 10,
            pullsSinceEpic: pity,
            quests: { ...s.quests, items: bump(s.quests.items, 'pull') },
            relicReveal: { ids, refund },
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      clearRelicReveal: () => set({ relicReveal: null }),

      claimQuest: (id) =>
        set((s) => {
          const def = questById(id)
          const q = s.quests.items.find((x) => x.id === id)
          if (!def || !q || q.claimed || q.progress < def.target) return s
          const items = s.quests.items.map((x) => (x.id === id ? { ...x, claimed: true } : x))
          const xp = s.xp + def.xp
          const patch: Partial<Store> = { gold: s.gold + def.gold, xp, level: levelOf(xp), quests: { ...s.quests, items } }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      equipTitle: (id) => set({ equippedTitle: id }),
      clearUnlocks: () => set({ lastUnlocks: [] }),
      setHaptics: (v) => set({ haptics: v }),
      setDark: (v) => set({ darkMode: v }),
      setWelcomed: () => set({ welcomed: true }),

      resetSeason: () => set({ seedMoney: SEED_MONEY, subscriptions: {}, predictions: {}, settledIds: [], escrow: {} }),
    }),
    {
      name: 'ct-save-v6',
      version: 2,
      partialize: (s) => ({ ...s, lastResult: null, relicReveal: null, lastUnlocks: [] }),
    },
  ),
)
