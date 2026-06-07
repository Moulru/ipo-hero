import { useStore } from '../store'
import { questById } from '../data/quests'
import { haptic, toast } from '../lib/juice'

export function QuestCard() {
  const quests = useStore((s) => s.quests)
  const claimQuest = useStore((s) => s.claimQuest)
  if (!quests.items.length) return null

  return (
    <div className="quest-card">
      <div className="block-title">📋 오늘의 퀘스트</div>
      {quests.items.map((q) => {
        const def = questById(q.id)
        if (!def) return null
        const done = q.progress >= def.target
        return (
          <div key={q.id} className="quest-row">
            <div className="quest-info">
              <div className="quest-label">{def.label}</div>
              <div className="quest-bar">
                <div className="quest-bar-fill" style={{ width: `${Math.min(100, (q.progress / def.target) * 100)}%` }} />
              </div>
              <div className="quest-prog muted">
                {Math.min(q.progress, def.target)}/{def.target} · 🪙{def.gold} ⭐{def.xp}
              </div>
            </div>
            <button
              className={q.claimed ? 'quest-claim done' : done ? 'quest-claim ready' : 'quest-claim'}
              disabled={!done || q.claimed}
              onClick={() => {
                claimQuest(q.id)
                haptic(12)
                toast(`퀘스트 완료! +${def.gold}🪙`, '📋')
              }}
            >
              {q.claimed ? '완료' : done ? '받기' : '진행'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
