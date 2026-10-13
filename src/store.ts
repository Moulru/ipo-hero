import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClassId, Ipo, PredictionChoice } from './types'
import { SEED_MONEY, comboMult, outcomeFromReturn, rollAllocation, todayYmd } from './lib/calc'
import { PITY_PULLS, aggregateEffects, dupRefund, pullCard, relicCost, relicCost10 } from './data/relics'
import { FARM_RETRY_KILLS, type StatKind, isBoss, rewardScale, upgradeCostN } from './game/balance'
import { type QuestState, type QuestType, questById, rollDailyQuests } from './data/quests'
import { ACHIEVEMENTS, type AchStats } from './data/achievements'

const XP_PER_LEVEL = 100
const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1
// 순수 실력: 모든 클래스 동일 시드. 성향·카드는 게임 레이어(라운지 RPG·골드)에만 영향. 게임은 시즌 자산을 읽기만 함(배율).

export type ThemeMode = 'system' | 'light' | 'dark'

// 라운지 방치형 RPG 진행 상태
export interface RpgState {
  lv: Record<StatKind, number>
  stage: number // 현재 싸우는 스테이지
  best: number // 최고 돌파(클리어) 스테이지 — 투자자 등급 기준
  kills: number
  bosses: number
  farming: boolean // 패배 후 이전 스테이지에서 골드 파밍 중
  farmCount: number
  auto: boolean // 파밍 N마리 후 자동 재도전
  lastSeen: number // ms — 방치 보상 계산 기준
  intro: boolean // 2.0 소개 시트 표시 여부
  legacy: number // 1.x 등급(경험치) 이전 보상 골드
}

export const RPG_DEFAULT: RpgState = {
  lv: { atk: 1, def: 1, hp: 1 },
  stage: 1,
  best: 0,
  kills: 0,
  bosses: 0,
  farming: false,
  farmCount: 0,
  auto: true,
  lastSeen: 0,
  intro: true,
  legacy: 0,
}

// 출석 보상: 연속일수(최대 7일) × 최고 스테이지 스케일
export const checkinReward = (streak: number, best: number) => Math.round((50 + Math.min(streak, 7) * 20) * rewardScale(best))

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
  relicReveal: { ids: string[]; refund: number; fresh?: boolean[] } | null // fresh[i]: i번째 카드가 이번에 새로 얻은 카드인지
  lastUnlocks: string[]
  theme: ThemeMode // 화면 테마: 시스템 설정 따름(기본) · 라이트 · 다크
  haptics: boolean // 진동(햅틱) 효과 on/off
  watchlist: string[] // 관심 종목(ipo id)
  recentSearches: string[] // 최근 검색어(최신순, 최대 10)
  rpg: RpgState

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
  setTheme: (v: ThemeMode) => void
  toggleWatch: (ipoId: string) => boolean
  cancelSubscription: (ipoId: string) => void
  addRecentSearch: (q: string) => void
  removeRecentSearch: (q: string) => void
  clearRecentSearches: () => void
  resetSeason: () => void
  rpgWin: (gold: number) => void
  rpgLose: () => void
  rpgUpgrade: (kind: StatKind, n: number) => boolean
  rpgChallenge: () => void
  rpgSetAuto: (v: boolean) => void
  rpgOffline: (gold: number, kills: number) => void
  rpgSeen: () => void
  rpgCloseIntro: () => void
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
    bestStage: cand.rpg.best,
    bosses: cand.rpg.bosses,
  }
  const newly: string[] = []
  let bonus = 0
  for (const a of ACHIEVEMENTS) {
    if (!cand.achievements.includes(a.id) && a.check(stats)) {
      newly.push(a.id)
      bonus += Math.round(a.gold * rewardScale(cand.rpg.best))
    }
  }
  if (!newly.length) return {}
  return { achievements: [...cand.achievements, ...newly], gold: cand.gold + bonus, lastUnlocks: newly }
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
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
      theme: 'system',
      haptics: true,
      watchlist: [],
      recentSearches: [],
      rpg: RPG_DEFAULT,

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
          const reward = checkinReward(s.streak, s.rpg.best)
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
          // 정산 골드는 최고 스테이지 스케일 적용(후반에도 모의청약 참여가 의미 있게) — 시즌 자산 손익과는 별개
          const goldGain = Math.round(
            (120 + (correct ? 150 : 0) + Math.max(0, Math.round(profit / 80000))) * fx.goldMult * cm * rewardScale(s.rpg.best)
          )
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
          const cost = relicCost(s.rpg.best)
          if (s.gold < cost) return s
          let pity = s.pullsSinceEpic + 1
          const card = pullCard(s.ownedRelics, pity >= PITY_PULLS)
          const isNew = !s.ownedRelics.includes(card.id)
          const refund = isNew ? 0 : dupRefund(card.rarity, s.rpg.best)
          if (isNew) pity = 0
          const patch: Partial<Store> = {
            gold: s.gold - cost + refund,
            ownedRelics: isNew ? [...s.ownedRelics, card.id] : s.ownedRelics, // 중복은 스택 안 쌓음(환불만)
            pulls: s.pulls + 1,
            pullsSinceEpic: pity,
            quests: { ...s.quests, items: bump(s.quests.items, 'pull') },
            relicReveal: { ids: [card.id], refund, fresh: [isNew] },
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      pullRelic10: () =>
        set((s) => {
          const cost = relicCost10(s.rpg.best)
          if (s.gold < cost) return s
          let pity = s.pullsSinceEpic
          const owned = [...s.ownedRelics]
          const ids: string[] = []
          const fresh: boolean[] = []
          let refund = 0
          for (let i = 0; i < 10; i++) {
            pity++
            const card = pullCard(owned, pity >= PITY_PULLS)
            fresh.push(!owned.includes(card.id))
            if (owned.includes(card.id)) {
              refund += dupRefund(card.rarity, s.rpg.best) // 중복: 환불만, 스택 안 쌓음
            } else {
              pity = 0
              owned.push(card.id) // 신규만 도감에 추가
            }
            ids.push(card.id)
          }
          const patch: Partial<Store> = {
            gold: s.gold - cost + refund,
            ownedRelics: owned,
            pulls: s.pulls + 10,
            pullsSinceEpic: pity,
            quests: { ...s.quests, items: bump(s.quests.items, 'pull') },
            relicReveal: { ids, refund, fresh },
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
          const gold = Math.round(def.gold * rewardScale(s.rpg.best))
          const patch: Partial<Store> = { gold: s.gold + gold, xp, level: levelOf(xp), quests: { ...s.quests, items } }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),

      equipTitle: (id) => set({ equippedTitle: id }),
      clearUnlocks: () => set({ lastUnlocks: [] }),
      setHaptics: (v) => set({ haptics: v }),
      setTheme: (v) => set({ theme: v }),

      // 관심 종목 토글 — 반환값: 추가됐으면 true
      toggleWatch: (ipoId) => {
        const has = get().watchlist.includes(ipoId)
        set((s) => ({ watchlist: has ? s.watchlist.filter((x) => x !== ipoId) : [ipoId, ...s.watchlist] }))
        return !has
      },

      // 모의청약 취소: 보관 중인 증거금을 시즌 자산으로 반환하고 청약·예측 기록 삭제 (상장 당일 이후·정산 후 불가)
      cancelSubscription: (ipoId) =>
        set((s) => {
          if (s.settledIds.includes(ipoId)) return s
          const deposit = s.escrow[ipoId] ?? 0
          const subscriptions = { ...s.subscriptions }
          const predictions = { ...s.predictions }
          const escrow = { ...s.escrow }
          delete subscriptions[ipoId]
          delete predictions[ipoId]
          delete escrow[ipoId]
          return { subscriptions, predictions, escrow, seedMoney: s.seedMoney + deposit }
        }),

      addRecentSearch: (q) =>
        set((s) => {
          const t = q.trim()
          if (!t) return s
          return { recentSearches: [t, ...s.recentSearches.filter((x) => x !== t)].slice(0, 10) }
        }),
      removeRecentSearch: (q) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) })),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // ── 라운지 RPG ──
      // 몬스터 처치: 골드 지급 + 스테이지 진행(파밍 중이면 N마리 후 자동 재도전)
      rpgWin: (gold) =>
        set((s) => {
          const r = s.rpg
          const boss = isBoss(r.stage)
          let { stage, best, farming, farmCount } = r
          let newBest = false
          // 파밍 중이라도 아직 깬 적 없는 스테이지(예: 첫 스테이지에서 패배 후)를 이기면 정상 진행으로 복귀
          if (farming && stage > best) {
            farming = false
            farmCount = 0
          }
          if (!farming) {
            if (stage > best) {
              best = stage
              newBest = true
            }
            stage = stage + 1
          } else {
            farmCount++
            if (r.auto && farmCount >= FARM_RETRY_KILLS) {
              farming = false
              farmCount = 0
              stage = best + 1
            }
          }
          let items = bump(s.quests.items, 'kill')
          if (newBest) items = bump(items, 'stage')
          const patch: Partial<Store> = {
            gold: s.gold + Math.max(0, Math.round(gold)),
            rpg: {
              ...r,
              stage,
              best,
              farming,
              farmCount,
              kills: r.kills + 1,
              bosses: r.bosses + (boss && newBest ? 1 : 0) /* 파밍 중 보스 재처치는 업적 집계 제외 */,
              lastSeen: Date.now(),
            },
            quests: { ...s.quests, items },
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),
      // 패배: 이전 스테이지로 물러나 파밍
      rpgLose: () =>
        set((s) => ({
          rpg: { ...s.rpg, farming: true, farmCount: 0, stage: Math.max(1, Math.min(s.rpg.stage - 1, s.rpg.best)), lastSeen: Date.now() },
        })),
      rpgUpgrade: (kind, n) => {
        const s = get()
        if (n <= 0) return false
        const cost = upgradeCostN(kind, s.rpg.lv[kind], n)
        if (s.gold < cost) return false
        set((st) => {
          const patch: Partial<Store> = {
            gold: st.gold - cost,
            rpg: { ...st.rpg, lv: { ...st.rpg.lv, [kind]: st.rpg.lv[kind] + n } },
            quests: { ...st.quests, items: bump(st.quests.items, 'upgrade', n) },
          }
          return { ...patch, ...withAchievements({ ...st, ...patch }) }
        })
        return true
      },
      rpgChallenge: () => set((s) => ({ rpg: { ...s.rpg, farming: false, farmCount: 0, stage: s.rpg.best + 1 } })),
      rpgSetAuto: (v) => set((s) => ({ rpg: { ...s.rpg, auto: v } })),
      rpgOffline: (gold, kills) =>
        set((s) => {
          const patch: Partial<Store> = {
            gold: s.gold + Math.max(0, Math.round(gold)),
            rpg: { ...s.rpg, kills: s.rpg.kills + kills, lastSeen: Date.now() },
            quests: { ...s.quests, items: bump(s.quests.items, 'kill', kills) },
          }
          return { ...patch, ...withAchievements({ ...s, ...patch }) }
        }),
      rpgSeen: () => set((s) => ({ rpg: { ...s.rpg, lastSeen: Date.now() } })),
      rpgCloseIntro: () => set((s) => ({ rpg: { ...s.rpg, intro: false } })),

      resetSeason: () => set({ seedMoney: SEED_MONEY, subscriptions: {}, predictions: {}, settledIds: [], escrow: {} }),
    }),
    {
      name: 'ct-save-v6',
      version: 4,
      partialize: (s) => ({ ...s, lastResult: null, relicReveal: null, lastUnlocks: [] }),
      // v2 → v3: darkMode(boolean) → theme. 기존 사용자는 쓰던 테마를 그대로 유지(신규 사용자만 시스템 따름).
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        if (version < 3) {
          p.theme = p.darkMode ? 'dark' : 'light'
          delete p.darkMode
        }
        if (version < 4) {
          // 2.0: 경험치 등급 → 스테이지 등급. 기존 레벨만큼 시작 골드로 보상하고 소개 시트를 띄움
          const legacy = Math.max(0, ((p.level as number) ?? 1) - 1) * 150
          p.gold = ((p.gold as number) ?? 0) + legacy
          p.rpg = { ...RPG_DEFAULT, legacy }
        }
        return p as unknown as Store
      },
    }
  )
)
