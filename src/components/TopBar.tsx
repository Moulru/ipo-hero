import { useStore } from '../store'
import { CLASSES } from '../data/classes'
import { formatMan } from '../lib/calc'
import { rankInfo } from '../data/ranks'
import { achById } from '../data/achievements'
import { CountUp } from './CountUp'

export function TopBar() {
  const { chosenClass, level, xp, gold, seedMoney, streak, comboCount, equippedTitle } = useStore()
  const cls = CLASSES.find((c) => c.id === chosenClass)
  const { rank, rankLevel } = rankInfo(level)
  const xpIn = xp % 100
  const title = equippedTitle ? achById(equippedTitle)?.title : null

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="avatar">{cls?.emoji ?? '🧑‍💼'}</div>
        <div className="topbar-main">
          <div className="topbar-line">
            {title && <span className="title-chip">{title}</span>}
            <span className="cls-name">
              {rank.emoji} {rank.name}
            </span>
            <span className="lv">Lv.{rankLevel}</span>
          </div>
          <div className="xpbar">
            <div className="xpbar-fill" style={{ width: `${xpIn}%` }} />
          </div>
        </div>
        <div className="topbar-stats">
          <div className="stat-gold">
            🪙 <CountUp value={gold} />
          </div>
          <div className="stat-streak">🔥 {streak}일</div>
        </div>
      </div>
      <div className="seed-row">
        <span className="seed-label">
          시즌 자산 {comboCount > 1 && <b className="combo-mini">🔥 {comboCount}연승</b>}
        </span>
        <span className="seed-val">{formatMan(seedMoney)}</span>
      </div>
    </header>
  )
}
