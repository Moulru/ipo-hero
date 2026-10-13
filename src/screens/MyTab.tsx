import { useState } from 'react'
import { useStore } from '../store'
import { ACHIEVEMENTS, achById } from '../data/achievements'
import { CLASSES } from '../data/classes'
import { RELICS } from '../data/relics'
import { rankInfo } from '../data/ranks'
import { SEED_MONEY, returnColor } from '../lib/calc'
import { fmtWon } from '../lib/format'
import { nav } from '../nav'
import { TabScreen } from '../ui/TabScreen'
import { Card, CountUp, MenuRow } from '../ui/kit'
import { Emoji } from '../ui/Emoji'
import { ChevronRight, Settings } from '../ui/icons'
import { ClassSheet, TitleSheet } from '../sheets/ProfileSheets'

export function MyTab() {
  const s = useStore()
  const [sheet, setSheet] = useState<'class' | 'title' | null>(null)
  const cls = CLASSES.find((c) => c.id === s.chosenClass) ?? CLASSES[0]
  const { rank } = rankInfo(s.rpg.best)
  const title = s.equippedTitle ? achById(s.equippedTitle)?.title : null
  const escrowTotal = Object.values(s.escrow).reduce((a, b) => a + b, 0)
  const total = s.seedMoney + escrowTotal
  const pnl = total - SEED_MONEY
  const pnlPct = (pnl / SEED_MONEY) * 100
  const acc = s.totalPredictions > 0 ? Math.round((s.hits / s.totalPredictions) * 100) : null
  const activeBets = Object.keys(s.subscriptions).filter((id) => !s.settledIds.includes(id)).length
  const titlesOwned = ACHIEVEMENTS.filter((a) => a.title && s.achievements.includes(a.id)).length

  return (
    <TabScreen
      id="my"
      header={
        <>
          <div className="tab-title">MY</div>
          <button className="icon-btn" aria-label="설정" onClick={() => nav.push({ k: 'settings' })}>
            <Settings size={24} strokeWidth={2} />
          </button>
        </>
      }
    >
      <button className="profile pressable" onClick={() => setSheet('class')}>
        <span className="profile-av">
          <Emoji e={cls.emoji} size={40} />
        </span>
        <span className="profile-txt">
          <span className="profile-name">
            {title && <span className="title-chip">{title}</span>}
            {cls.name}
          </span>
          <span className="profile-sub">
            <Emoji e={rank.emoji} size={16} /> {rank.name} · 최고 스테이지 {s.rpg.best}
          </span>
        </span>
        <span className="text-btn">
          투자 성향 <ChevronRight size={16} />
        </span>
      </button>

      <Card className="asset-card">
        <div className="t3 fs14 fw6">시즌 자산</div>
        <div className="asset-val num">
          <CountUp value={total} format={(n) => n.toLocaleString('ko-KR')} />
          <span className="asset-unit">원</span>
        </div>
        <div className="asset-pnl num" style={{ color: returnColor(pnl) }}>
          {pnl === 0 ? '시작 자산과 같아요' : `${pnl > 0 ? '+' : ''}${fmtWon(pnl)} (${pnl > 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`}
        </div>
        <div className="asset-split">
          <div>
            <span className="t3 fs13">바로 쓸 수 있는 돈</span>
            <span className="fw6 num">{fmtWon(s.seedMoney)}</span>
          </div>
          <div>
            <span className="t3 fs13">청약 증거금</span>
            <span className="fw6 num">{fmtWon(escrowTotal)}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-block asset-btn" onClick={() => nav.push({ k: 'myBets' })}>
          모의청약 내역 {activeBets > 0 && <span className="t-brand">{activeBets}</span>}
        </button>
      </Card>

      <Card className="stats-card">
        <Stat label="예측 적중률" value={acc != null ? `${acc}%` : '-'} sub={`${s.hits}/${s.totalPredictions}회`} />
        <Stat label="살펴본 종목" value={`${s.viewed.length}개`} />
        <Stat label="연속 출석" value={`${s.streak}일`} />
      </Card>

      <Card pad={false}>
        <div className="menu-group-title">컬렉션</div>
        <MenuRow
          icon={<Emoji e="📒" size={24} />}
          label="공모주 도감"
          value={`${s.dex.length}종`}
          onClick={() => nav.push({ k: 'ipoDex' })}
        />
        <MenuRow
          icon={<Emoji e="🃏" size={24} />}
          label="투자 카드 도감"
          value={`${new Set(s.ownedRelics).size}/${RELICS.length}`}
          onClick={() => nav.push({ k: 'cardDex' })}
        />
        <MenuRow
          icon={<Emoji e="🏆" size={24} />}
          label="업적"
          value={`${s.achievements.length}/${ACHIEVEMENTS.length}`}
          onClick={() => nav.push({ k: 'achievements' })}
        />
        <MenuRow
          icon={<Emoji e="🏷️" size={24} />}
          label="칭호"
          value={title ?? (titlesOwned ? '선택 안 함' : '아직 없음')}
          onClick={() => setSheet('title')}
        />
      </Card>

      <Card pad={false}>
        <MenuRow icon={<Settings size={22} strokeWidth={2} />} label="설정" onClick={() => nav.push({ k: 'settings' })} />
      </Card>

      {sheet === 'class' && <ClassSheet onClose={() => setSheet(null)} />}
      {sheet === 'title' && <TitleSheet onClose={() => setSheet(null)} />}
    </TabScreen>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="t3 fs13">{label}</span>
      <span className="stat-val num">{value}</span>
      {sub && <span className="t4 fs12 num">{sub}</span>}
    </div>
  )
}
