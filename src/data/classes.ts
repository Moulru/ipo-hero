import type { PlayerClass } from '../types'
import { CLASS_PASSIVE } from '../game/balance'

// 투자 성향 — 라운지 RPG 전투 패시브 (게임 레이어 전용, 시즌 자산·모의청약과 무관)
export const CLASSES: PlayerClass[] = [
  { id: 'farmer', name: '농부 개미', emoji: '🌾', passive: CLASS_PASSIVE.farmer },
  { id: 'hunter', name: '전문투기꾼', emoji: '🎲', passive: CLASS_PASSIVE.hunter },
  { id: 'value', name: '가치투자자', emoji: '📈', passive: CLASS_PASSIVE.value },
]
