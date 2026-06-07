import { useStore } from '../store'
import { DailyCheckIn } from './DailyCheckIn'
import { QuestCard } from './Quests'
import { PITY_PULLS, RELIC_COST, RELIC_COST_10, RELICS } from '../data/relics'
import { RANKS, nextRank, rankInfo } from '../data/ranks'
import { haptic, toast } from '../lib/juice'

export function Play({ onOpenCards }: { onOpenCards: () => void }) {
  const { level, xp, gold, ownedRelics, pullsSinceEpic, pullRelic, pullRelic10 } = useStore()
  const { rank, index: rankIdx, rankLevel } = rankInfo(level)
  const next = nextRank(level)
  const xpIn = xp % 100
  const uniqueOwned = new Set(ownedRelics).size
  const complete = uniqueOwned === RELICS.length

  return (
    <div className="play">
      {/* 투자자 등급 여정 */}
      <div className="rank-hero">
        <div className="rank-hero-emblem">{rank.emoji}</div>
        <div className="rank-hero-name">{rank.name}</div>
        <div className="rank-hero-lv">Lv.{rankLevel}</div>
        <div className="xpbar">
          <div className="xpbar-fill" style={{ width: `${xpIn}%` }} />
        </div>
        <div className="rank-hero-next muted">
          {next ? (
            <>
              다음 등급{' '}
              <b>
                {next.emoji} {next.name}
              </b>{' '}
              · {rank.name} Lv.10 달성 시
            </>
          ) : (
            '최고 등급 · 계속 성장 중'
          )}
        </div>
        <div className="rank-ladder">
          {RANKS.map((r, i) => (
            <div key={r.name} className={rankIdx >= i ? 'rank-tier on' : 'rank-tier'}>
              <span className="rt-emoji">{r.emoji}</span>
              <span className="rt-name">{r.name}</span>
            </div>
          ))}
        </div>
      </div>

      <DailyCheckIn />
      <QuestCard />

      {/* 투자 카드 (가챠 + 도감) */}
      <div className="shop-card">
        <div className="shop-head">
          <span className="tt-title">🃏 투자 카드 뽑기</span>
          <span className="gold-tag">🪙 {gold}</span>
        </div>
        <div className="shop-btns">
          <button
            className="cta shop-btn"
            disabled={complete || gold < RELIC_COST}
            onClick={() => {
              if (gold < RELIC_COST) return toast('골드가 부족해요', '🪙')
              pullRelic()
              haptic(12)
            }}
          >
            1회 뽑기
            <span>{RELIC_COST}🪙</span>
          </button>
          <button
            className="cta shop-btn ten"
            disabled={complete || gold < RELIC_COST_10}
            onClick={() => {
              if (gold < RELIC_COST_10) return toast('골드가 부족해요', '🪙')
              pullRelic10()
              haptic(12)
            }}
          >
            10연차
            <span>{RELIC_COST_10}🪙</span>
          </button>
        </div>
        <div className="shop-odds muted">
          {complete
            ? '🎉 도감 완성! 모든 투자 카드를 모았어요'
            : `레전더리 2% · 에픽 10% · 레어 28% · 커먼 60% · 신규 확정 ${pullsSinceEpic}/${PITY_PULLS}`}
        </div>
        <button className="nav-tile shop-dex" onClick={onOpenCards}>
          <span className="nav-ico">🗂️</span>
          <span className="nav-txt">투자 카드 도감</span>
          <span className="nav-cnt muted">
            {uniqueOwned}/{RELICS.length} ›
          </span>
        </button>
      </div>
    </div>
  )
}
