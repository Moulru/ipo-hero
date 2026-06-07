import type { Rarity, Relic } from '../types'

export const RELIC_COST = 200 // 1회 뽑기 골드 비용
export const RELIC_COST_10 = 1800 // 10연차 (할인)
export const PITY_PULLS = 10 // 천장: 누적 10회 안에 '미보유 카드' 확정 (등급 확률은 그대로 유지)

// 효과는 게임 레이어(정산 시 XP·골드 획득)만. 시즌 자산(배정·수익)엔 영향 없음 → 순수 실력.
// 핵심 재미는 수집(도감). 'none' 카드는 순수 수집용(효과 없음, 플레이버만).
export const RELICS: Relic[] = [
  // ===== common (18) =====
  { id: 'coin', name: '행운의 동전', emoji: '🪙', rarity: 'common', desc: '정산 골드 +10%', effect: { kind: 'goldMult', value: 0.1 } },
  { id: 'note', name: '분석 노트', emoji: '📓', rarity: 'common', desc: '정산 XP +10%', effect: { kind: 'xpMult', value: 0.1 } },
  { id: 'chart', name: '차트 보살', emoji: '📊', rarity: 'common', desc: '정산 XP +10%', effect: { kind: 'xpMult', value: 0.1 } },
  { id: 'pocket', name: '동전 주머니', emoji: '👝', rarity: 'common', desc: '정산 골드 +15%', effect: { kind: 'goldMult', value: 0.15 } },
  { id: 'calm', name: '차분한 멘탈', emoji: '🧘', rarity: 'common', desc: '흔들리지 않는 마음', effect: { kind: 'none', value: 0 } },
  { id: 'piggy', name: '돼지꿈 꾸는 날', emoji: '🐷', rarity: 'common', desc: '정산 골드 +10%', effect: { kind: 'goldMult', value: 0.1 } },
  { id: 'ledger', name: '거래 장부', emoji: '📒', rarity: 'common', desc: '정산 XP +10%', effect: { kind: 'xpMult', value: 0.1 } },
  { id: 'ticket', name: '공모주 줍줍', emoji: '🎫', rarity: 'common', desc: '정산 골드 +10%', effect: { kind: 'goldMult', value: 0.1 } },
  { id: 'bell', name: '상장 알림벨', emoji: '🔔', rarity: 'common', desc: '정산 XP +10%', effect: { kind: 'xpMult', value: 0.1 } },
  { id: 'clover', name: '네잎클로버', emoji: '🍀', rarity: 'common', desc: '행운을 부르는 네 잎', effect: { kind: 'none', value: 0 } },
  { id: 'newspaper', name: '경제 신문', emoji: '📰', rarity: 'common', desc: '정산 XP +8%', effect: { kind: 'xpMult', value: 0.08 } },
  { id: 'redpen', name: '빨간 펜', emoji: '🖊️', rarity: 'common', desc: '정산 XP +8%', effect: { kind: 'xpMult', value: 0.08 } },
  { id: 'coffee', name: '월급 루팡 커피', emoji: '☕', rarity: 'common', desc: '정산 골드 +8%', effect: { kind: 'goldMult', value: 0.08 } },
  { id: 'candle', name: '양봉 농장', emoji: '🕯️', rarity: 'common', desc: '양봉(陽棒)만 키우고 싶다', effect: { kind: 'none', value: 0 } },
  { id: 'abacus', name: '주판', emoji: '🧮', rarity: 'common', desc: '정산 XP +10%', effect: { kind: 'xpMult', value: 0.1 } },
  { id: 'magnet', name: '수급 자석', emoji: '🧲', rarity: 'common', desc: '정산 골드 +12%', effect: { kind: 'goldMult', value: 0.12 } },
  { id: 'umbrella', name: '비 올 때 물타기', emoji: '☂️', rarity: 'common', desc: '물렸을 땐 우산 쓰고', effect: { kind: 'none', value: 0 } },
  { id: 'balloon', name: '따상 가즈아', emoji: '🎈', rarity: 'common', desc: '정산 골드 +10%', effect: { kind: 'goldMult', value: 0.1 } },
  // ===== rare (15) =====
  { id: 'glass', name: '분석가의 돋보기', emoji: '🔍', rarity: 'rare', desc: '정산 XP +25%', effect: { kind: 'xpMult', value: 0.25 } },
  { id: 'seed', name: '균등의 씨앗', emoji: '🌱', rarity: 'rare', desc: '정산 골드 +20%', effect: { kind: 'goldMult', value: 0.2 } },
  { id: 'wallet', name: '두둑한 지갑', emoji: '👛', rarity: 'rare', desc: '정산 골드 +25%', effect: { kind: 'goldMult', value: 0.25 } },
  { id: 'focus', name: '집중의 안경', emoji: '🤓', rarity: 'rare', desc: '정산 XP +20%', effect: { kind: 'xpMult', value: 0.2 } },
  { id: 'briefcase', name: '서류 가방', emoji: '💼', rarity: 'rare', desc: '정산 골드 +20%', effect: { kind: 'goldMult', value: 0.2 } },
  { id: 'compass', name: '투자 나침반', emoji: '🧭', rarity: 'rare', desc: '정산 XP +20%', effect: { kind: 'xpMult', value: 0.2 } },
  { id: 'battery', name: '홀딩 배터리', emoji: '🔋', rarity: 'rare', desc: '정산 XP +22%', effect: { kind: 'xpMult', value: 0.22 } },
  { id: 'rocket', name: '초기 로켓', emoji: '🚀', rarity: 'rare', desc: '정산 골드 +22%', effect: { kind: 'goldMult', value: 0.22 } },
  { id: 'reqkey', name: '상장 열쇠', emoji: '🔑', rarity: 'rare', desc: '정산 XP +22%', effect: { kind: 'xpMult', value: 0.22 } },
  { id: 'scope', name: '무릎 매수각', emoji: '🎯', rarity: 'rare', desc: '정산 XP +25%', effect: { kind: 'xpMult', value: 0.25 } },
  { id: 'crystal', name: '수정 구슬', emoji: '🔮', rarity: 'rare', desc: '미래를 엿보는 구슬', effect: { kind: 'none', value: 0 } },
  { id: 'gears', name: '분석 엔진', emoji: '⚙️', rarity: 'rare', desc: '정산 XP +20%', effect: { kind: 'xpMult', value: 0.2 } },
  { id: 'moneybag', name: '보너스 주머니', emoji: '💰', rarity: 'rare', desc: '정산 골드 +25%', effect: { kind: 'goldMult', value: 0.25 } },
  { id: 'scale', name: '밸류 저울', emoji: '⚖️', rarity: 'rare', desc: '정산 XP +20%', effect: { kind: 'xpMult', value: 0.2 } },
  { id: 'lightning', name: '단타 번개', emoji: '⚡', rarity: 'rare', desc: '정산 골드 +20%', effect: { kind: 'goldMult', value: 0.2 } },
  // ===== epic (12) =====
  { id: 'receipt', name: '황금 영수증', emoji: '🧾', rarity: 'epic', desc: '정산 골드 +50%', effect: { kind: 'goldMult', value: 0.5 } },
  { id: 'charm', name: '행운의 부적', emoji: '🧧', rarity: 'epic', desc: '정산 골드 +35%', effect: { kind: 'goldMult', value: 0.35 } },
  { id: 'terminal', name: '분석가 단말기', emoji: '🖥️', rarity: 'epic', desc: '정산 XP +50%', effect: { kind: 'xpMult', value: 0.5 } },
  { id: 'shield', name: '강철 멘탈', emoji: '🛡️', rarity: 'epic', desc: '정산 XP +30%', effect: { kind: 'xpMult', value: 0.3 } },
  { id: 'crown', name: '청약 왕관', emoji: '👑', rarity: 'epic', desc: '정산 골드 +40%', effect: { kind: 'goldMult', value: 0.4 } },
  { id: 'trophy', name: '수익 트로피', emoji: '🏆', rarity: 'epic', desc: '정산 XP +40%', effect: { kind: 'xpMult', value: 0.4 } },
  { id: 'ring', name: '블루칩 반지', emoji: '💍', rarity: 'epic', desc: '정산 골드 +45%', effect: { kind: 'goldMult', value: 0.45 } },
  { id: 'telescope', name: '장기 망원경', emoji: '🔭', rarity: 'epic', desc: '정산 XP +50%', effect: { kind: 'xpMult', value: 0.5 } },
  { id: 'vault', name: '금고 열쇠', emoji: '🏦', rarity: 'epic', desc: '정산 골드 +50%', effect: { kind: 'goldMult', value: 0.5 } },
  { id: 'phoenix', name: '불사조 차트', emoji: '🔥', rarity: 'epic', desc: '정산 XP +45%', effect: { kind: 'xpMult', value: 0.45 } },
  { id: 'wand', name: '작전 지팡이', emoji: '🪄', rarity: 'epic', desc: '정산 골드 +40%', effect: { kind: 'goldMult', value: 0.4 } },
  { id: 'hourglass', name: '복리의 모래시계', emoji: '⏳', rarity: 'epic', desc: '정산 XP +40%', effect: { kind: 'xpMult', value: 0.4 } },
  // ===== legendary (5) =====
  { id: 'diamond', name: '다이아몬드 핸드', emoji: '💎', rarity: 'legendary', desc: '정산 골드 +60%', effect: { kind: 'goldMult', value: 0.6 } },
  { id: 'midas', name: '미다스의 손', emoji: '🤲', rarity: 'legendary', desc: '정산 골드 +100%', effect: { kind: 'goldMult', value: 1.0 } },
  { id: 'bull', name: '황소의 뿔', emoji: '🐂', rarity: 'legendary', desc: '정산 XP +50%', effect: { kind: 'xpMult', value: 0.5 } },
  { id: 'unicorn', name: '유니콘', emoji: '🦄', rarity: 'legendary', desc: '정산 XP +60%', effect: { kind: 'xpMult', value: 0.6 } },
  { id: 'goldenbull', name: '황금 황소상', emoji: '🐮', rarity: 'legendary', desc: '정산 골드 +80%', effect: { kind: 'goldMult', value: 0.8 } },

  // ===== 장식 카드 (효과 없음, 순수 수집용) =====
  // common 장식 (27)
  { id: 'd_redday', name: '상한가 도장', emoji: '🟥', rarity: 'common', desc: '짜릿한 상한가', effect: { kind: 'none', value: 0 } },
  { id: 'd_blueday', name: '하한가 도장', emoji: '🟦', rarity: 'common', desc: '시퍼런 하한가', effect: { kind: 'none', value: 0 } },
  { id: 'd_ramen', name: '라면 불기 전에', emoji: '🍜', rarity: 'common', desc: '버티는 밤의 한 끼', effect: { kind: 'none', value: 0 } },
  { id: 'd_gimbap', name: '오늘의 주식', emoji: '🍙', rarity: 'common', desc: '점심도 차트 앞에서', effect: { kind: 'none', value: 0 } },
  { id: 'd_energy', name: '에너지 드링크', emoji: '🥤', rarity: 'common', desc: '밤샘 매매 연료', effect: { kind: 'none', value: 0 } },
  { id: 'd_laptop', name: '트레이딩 노트북', emoji: '💻', rarity: 'common', desc: '24시간 차트', effect: { kind: 'none', value: 0 } },
  { id: 'd_bear', name: '곰탕 끓이는 날', emoji: '🐻', rarity: 'common', desc: '곰이 나타났다', effect: { kind: 'none', value: 0 } },
  { id: 'd_ox', name: '떡상 황소', emoji: '🐃', rarity: 'common', desc: '황소의 기운', effect: { kind: 'none', value: 0 } },
  { id: 'd_mosquito', name: '단타충', emoji: '🦟', rarity: 'common', desc: '샀다 팔았다', effect: { kind: 'none', value: 0 } },
  { id: 'd_dice', name: '한 방의 민족', emoji: '🎲', rarity: 'common', desc: '운에 맡긴다', effect: { kind: 'none', value: 0 } },
  { id: 'd_memo', name: '투자 메모', emoji: '📝', rarity: 'common', desc: '잊지 말자', effect: { kind: 'none', value: 0 } },
  { id: 'd_caldiv', name: '배당 캘린더', emoji: '📅', rarity: 'common', desc: '배당일 체크', effect: { kind: 'none', value: 0 } },
  { id: 'd_brick', name: '벽돌 한 장', emoji: '🧱', rarity: 'common', desc: '한 주씩 쌓기', effect: { kind: 'none', value: 0 } },
  { id: 'd_snail', name: '달팽이도 우상향', emoji: '🐌', rarity: 'common', desc: '천천히 부자', effect: { kind: 'none', value: 0 } },
  { id: 'd_turtle', name: '느림보 부자', emoji: '🐢', rarity: 'common', desc: '느려도 꾸준히', effect: { kind: 'none', value: 0 } },
  { id: 'd_cookie', name: '익절은 쿠키처럼', emoji: '🍪', rarity: 'common', desc: '달콤한 익절', effect: { kind: 'none', value: 0 } },
  { id: 'd_fireext', name: '손절 소화기', emoji: '🧯', rarity: 'common', desc: '불 나기 전에', effect: { kind: 'none', value: 0 } },
  { id: 'd_anchor', name: '장투의 닻', emoji: '⚓', rarity: 'common', desc: '흔들려도 버틴다', effect: { kind: 'none', value: 0 } },
  { id: 'd_fishing', name: '바닥 낚시', emoji: '🎣', rarity: 'common', desc: '저가 매수의 손맛', effect: { kind: 'none', value: 0 } },
  { id: 'd_pricetag', name: '공모가 택', emoji: '🏷️', rarity: 'common', desc: '오늘의 가격표', effect: { kind: 'none', value: 0 } },
  { id: 'd_hammer', name: '바닥 다지기', emoji: '🔨', rarity: 'common', desc: '바닥은 어디', effect: { kind: 'none', value: 0 } },
  { id: 'd_sprout', name: '새싹 종목', emoji: '🌿', rarity: 'common', desc: '떡잎부터 알아본다', effect: { kind: 'none', value: 0 } },
  { id: 'd_rainbow', name: '오버 더 우상향', emoji: '🌈', rarity: 'common', desc: '우상향의 꿈', effect: { kind: 'none', value: 0 } },
  { id: 'd_popcorn', name: '강 건너 떡상 구경', emoji: '🍿', rarity: 'common', desc: '남의 떡상 구경', effect: { kind: 'none', value: 0 } },
  { id: 'd_ice', name: '얼음! 손절!', emoji: '🧊', rarity: 'common', desc: '흔들리지 않아', effect: { kind: 'none', value: 0 } },
  { id: 'd_chill', name: '물려도 쿨하게', emoji: '😎', rarity: 'common', desc: '물려도 웃음', effect: { kind: 'none', value: 0 } },
  { id: 'd_sandglass', name: '기다림의 모래', emoji: '⌛', rarity: 'common', desc: '시간이 약', effect: { kind: 'none', value: 0 } },
  // rare 장식 (15)
  { id: 'd_egg', name: '한 바구니의 계란', emoji: '🥚', rarity: 'rare', desc: '계란을 한 바구니에... 담았다', effect: { kind: 'none', value: 0 } },
  { id: 'd_hwatu', name: '운의 패', emoji: '🎴', rarity: 'rare', desc: '운빨 한 끗', effect: { kind: 'none', value: 0 } },
  { id: 'd_map', name: '종목 보물지도', emoji: '🗺️', rarity: 'rare', desc: '보물찾기', effect: { kind: 'none', value: 0 } },
  { id: 'd_fireworks', name: '따상 불꽃', emoji: '🎆', rarity: 'rare', desc: '축포를 쏘다', effect: { kind: 'none', value: 0 } },
  { id: 'd_ufo', name: '급등 UFO', emoji: '🛸', rarity: 'rare', desc: '정체불명 급등주', effect: { kind: 'none', value: 0 } },
  { id: 'd_storm', name: '멘탈 가출', emoji: '🌩️', rarity: 'rare', desc: '출렁이는 장', effect: { kind: 'none', value: 0 } },
  { id: 'd_medal2', name: '수익 훈장', emoji: '🎖️', rarity: 'rare', desc: '전장의 훈장', effect: { kind: 'none', value: 0 } },
  { id: 'd_atm', name: '통장 꽂히는 날', emoji: '🏧', rarity: 'rare', desc: '수익 실현의 맛', effect: { kind: 'none', value: 0 } },
  { id: 'd_castle', name: '자산의 성', emoji: '🏰', rarity: 'rare', desc: '차곡차곡 쌓은', effect: { kind: 'none', value: 0 } },
  { id: 'd_ship', name: '수익이 배로', emoji: '🚢', rarity: 'rare', desc: '우상향 항해', effect: { kind: 'none', value: 0 } },
  { id: 'd_satellite', name: '위성 시야', emoji: '🛰️', rarity: 'rare', desc: '멀리 내다본다', effect: { kind: 'none', value: 0 } },
  { id: 'd_heart', name: '야수의 심장', emoji: '💙', rarity: 'rare', desc: '폭락에도 안 흔들려', effect: { kind: 'none', value: 0 } },
  { id: 'd_gift', name: '깜짝 상한가', emoji: '🎁', rarity: 'rare', desc: '깜짝 수익', effect: { kind: 'none', value: 0 } },
  { id: 'd_takeoff', name: '떡상 활주로', emoji: '🛫', rarity: 'rare', desc: '떡상 직전', effect: { kind: 'none', value: 0 } },
  { id: 'd_kite', name: '수익 연타', emoji: '🪁', rarity: 'rare', desc: '바람 타고 상승', effect: { kind: 'none', value: 0 } },
  // epic 장식 (6)
  { id: 'd_eagle', name: '독수리의 눈', emoji: '🦅', rarity: 'epic', desc: '먹잇감을 노린다', effect: { kind: 'none', value: 0 } },
  { id: 'd_trident', name: '시장의 삼지창', emoji: '🔱', rarity: 'epic', desc: '파도를 가른다', effect: { kind: 'none', value: 0 } },
  { id: 'd_galaxy', name: '은하 포트폴리오', emoji: '🌌', rarity: 'epic', desc: '우주적 분산투자', effect: { kind: 'none', value: 0 } },
  { id: 'd_lion', name: '투자의 제왕', emoji: '🦁', rarity: 'epic', desc: '정글의 왕', effect: { kind: 'none', value: 0 } },
  { id: 'd_dragon', name: '용 된 개미', emoji: '🐉', rarity: 'epic', desc: '개천에서 용 난다', effect: { kind: 'none', value: 0 } },
  { id: 'd_cheers', name: '익절 축배', emoji: '🥂', rarity: 'epic', desc: '건배!', effect: { kind: 'none', value: 0 } },
  // legendary 장식 (2)
  { id: 'd_halo', name: '투자의 신', emoji: '😇', rarity: 'legendary', desc: '시장을 초월한 자', effect: { kind: 'none', value: 0 } },
  { id: 'd_infinity', name: '무한 복리', emoji: '♾️', rarity: 'legendary', desc: '영원한 우상향', effect: { kind: 'none', value: 0 } },
]

const PULL_WEIGHTS: Record<Rarity, number> = { common: 60, rare: 28, epic: 10, legendary: 2 }
const TIERS: Rarity[] = ['legendary', 'epic', 'rare', 'common']

// 중복 시 등급별 골드 환불 (최대 100G)
const DUP_REFUND: Record<Rarity, number> = { common: 20, rare: 40, epic: 70, legendary: 100 }
export function dupRefund(rarity: Rarity): number {
  return DUP_REFUND[rarity]
}

// 가중 추첨으로 등급 선택 (등급별 확률 고정)
function rollRarity(tiers: Rarity[] = TIERS): Rarity {
  const total = tiers.reduce((s, r) => s + PULL_WEIGHTS[r], 0)
  let roll = Math.random() * total
  for (const r of tiers) {
    roll -= PULL_WEIGHTS[r]
    if (roll < 0) return r
  }
  return tiers[tiers.length - 1]
}
const pickOf = (rarity: Rarity, pool: Relic[] = RELICS) => {
  const cands = pool.filter((x) => x.rarity === rarity)
  return cands[Math.floor(Math.random() * cands.length)]
}

// 한 장 뽑기. forceUnowned면 '미보유 카드' 확정(천장) — 등급 확률은 미보유 풀 안에서 그대로 유지
export function pullCard(ownedIds: string[], forceUnowned: boolean): Relic {
  if (forceUnowned) {
    const owned = new Set(ownedIds)
    const unowned = RELICS.filter((x) => !owned.has(x.id))
    if (unowned.length) {
      const tiers = TIERS.filter((r) => unowned.some((x) => x.rarity === r))
      return pickOf(rollRarity(tiers), unowned)
    }
    // 전부 보유 → 일반 추첨
  }
  return pickOf(rollRarity())
}

export interface RelicEffects {
  xpMult: number
  goldMult: number
}

// 게임 레이어(XP·골드)만 합산. 배정·수익(시즌 자산)엔 카드 효과 없음.
export function aggregateEffects(ownedIds: string[]): RelicEffects {
  const sum = { xpMult: 0, goldMult: 0 }
  for (const id of new Set(ownedIds)) {
    // 카드별 1회만 합산 (중복은 효과 스택 안 됨)
    const r = RELICS.find((x) => x.id === id)
    if (!r || r.effect.kind === 'none') continue
    sum[r.effect.kind] += r.effect.value
  }
  return { xpMult: 1 + sum.xpMult, goldMult: 1 + sum.goldMult }
}

export function relicById(id: string): Relic | undefined {
  return RELICS.find((x) => x.id === id)
}
