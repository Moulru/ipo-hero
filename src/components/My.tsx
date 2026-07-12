import { ACHIEVEMENTS, achById } from '../data/achievements'
import { CLASSES } from '../data/classes'
import { RELICS } from '../data/relics'
import { rankInfo } from '../data/ranks'
import { useStore } from '../store'
import { formatMan } from '../lib/calc'

export function My({
  onPickClass,
  onOpenDex,
  onOpenAch,
  onOpenSystem,
}: {
  onPickClass: () => void
  onOpenDex: () => void
  onOpenAch: () => void
  onOpenSystem: () => void
}) {
  const s = useStore()
  const cls = CLASSES.find((c) => c.id === s.chosenClass)
  const acc = s.totalPredictions > 0 ? Math.round((s.hits / s.totalPredictions) * 100) : 0
  const titles = ACHIEVEMENTS.filter((a) => a.title && s.achievements.includes(a.id))
  const equippedTitle = s.equippedTitle ? achById(s.equippedTitle)?.title : null
  const { rank, rankLevel } = rankInfo(s.level)
  const uniqueCards = new Set(s.ownedRelics).size

  return (
    <div className="my">
      {/* 프로필 (성향 · 등급 · 전적) */}
      <div className="profile-card">
        <div className="pc-head">
          <div className="avatar xl">{cls?.emoji ?? '🧑‍💼'}</div>
          <div className="pc-id">
            {equippedTitle && <span className="title-chip">{equippedTitle}</span>}
            <div className="pc-name">{cls?.name ?? '분석가'}</div>
            <div className="pc-rank">
              {rank.emoji} {rank.name} · Lv.{rankLevel}
            </div>
          </div>
        </div>
        {cls && <div className="pc-passive muted">{cls.passive}</div>}
        <div className="analyst-stats">
          <Stat label="시즌 자산" value={formatMan(s.seedMoney)} />
          <Stat label="예측 적중률" value={`${acc}% · ${s.hits}/${s.totalPredictions}`} />
          <Stat label="살펴본 종목" value={`${s.viewed.length}개`} />
          <Stat label="보유 카드" value={`${uniqueCards}/${RELICS.length}`} />
        </div>
        <button className="class-pick-btn" onClick={onPickClass}>
          투자 성향 변경
        </button>
      </div>

      {/* 컬렉션 · 기록 */}
      <div className="panel">
        <div className="block-title">📚 컬렉션 · 기록</div>
        <div className="nav-list">
          <NavTile ico="📒" label="공모주 도감" count={`${s.dex.length}종`} onClick={onOpenDex} />
          <NavTile ico="🏆" label="업적" count={`${s.achievements.length}/${ACHIEVEMENTS.length}`} onClick={onOpenAch} />
        </div>
      </div>

      {/* 칭호 */}
      {titles.length > 0 && (
        <div className="panel">
          <div className="block-title">🏷️ 칭호</div>
          <div className="title-list">
            <button className={!s.equippedTitle ? 'title-pill sel' : 'title-pill'} onClick={() => s.equipTitle(null)}>
              없음
            </button>
            {titles.map((t) => (
              <button
                key={t.id}
                className={s.equippedTitle === t.id ? 'title-pill sel' : 'title-pill'}
                onClick={() => s.equipTitle(t.id)}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 시스템 설정 */}
      <button className="sys-btn" onClick={onOpenSystem}>
        <span>⚙️ 시스템 설정</span>
        <span className="muted">다크 모드 · 진동 · 정보 ›</span>
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-cell">
      <span className="stat-num">{value}</span>
      <span className="stat-lbl">{label}</span>
    </div>
  )
}

function NavTile({ ico, label, count, onClick }: { ico: string; label: string; count: string; onClick: () => void }) {
  return (
    <button className="nav-tile" onClick={onClick}>
      <span className="nav-ico">{ico}</span>
      <span className="nav-txt">{label}</span>
      <span className="nav-cnt muted">{count} ›</span>
    </button>
  )
}
