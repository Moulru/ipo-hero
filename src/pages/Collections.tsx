import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useIpos } from '../data/loadIpos'
import { RELICS } from '../data/relics'
import { ACHIEVEMENTS } from '../data/achievements'
import type { Ipo, Rarity, Relic } from '../types'
import { GRADE_META, RARITY_META, computeStage, returnColor, signedPct } from '../lib/calc'
import { fmtMD, notSpac } from '../lib/format'
import { useToday } from '../lib/useToday'
import { openIpo } from '../nav'
import { Page } from '../ui/Page'
import { Sheet } from '../ui/Sheet'
import { Card, ChipTabs, Empty, Progress, StockLogo } from '../ui/kit'
import { Emoji } from '../ui/Emoji'
import { Lock } from '../ui/icons'
import { RARITY_STAT_PCT, fmtBig, rewardScale } from '../game/balance'
import { IpoRow } from '../components/IpoRow'
import { betRight } from '../screens/Home'

const ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'common']

// ───────── 공모주 도감 (정산한 종목) ─────────
export function IpoDexPage() {
  const ALL = useIpos()
  const dex = useStore((s) => s.dex)
  const collected = ALL.filter((i) => dex.includes(i.id))
  return (
    <Page title="공모주 도감">
      <div className="page-hero">
        <div className="page-hero-num num">{collected.length}종</div>
        <div className="t3 fs14">모의청약을 정산한 공모주가 여기에 모여요</div>
      </div>
      {!collected.length ? (
        <Card>
          <Empty emoji="📒" title="아직 모은 공모주가 없어요" desc="청약 중인 종목에 모의청약하고, 상장 다음 날 정산하면 도감에 기록돼요" />
        </Card>
      ) : (
        ORDER.map((r) => {
          const items = collected.filter((i) => i.rarity === r)
          if (!items.length) return null
          const g = GRADE_META[r]
          return (
            <Card key={r}>
              <div className="card-head">
                <div className="card-head-txt">
                  <h2 className="card-title">
                    <span className={`grade grade-${g.grade.toLowerCase()} lg`}>{g.grade}</span> 수요 {g.label}
                  </h2>
                </div>
                <span className="t3 fs14 num">{items.length}종</span>
              </div>
              <div className="dex-grid">
                {items.map((ipo) => (
                  <button key={ipo.id} className="dex-tile press-scale" onClick={() => openIpo(ipo.id)}>
                    <StockLogo ipo={ipo} size={40} />
                    <span className="dex-name">{ipo.name}</span>
                    <span className="dex-ret num" style={{ color: returnColor(ipo.listingReturn ?? 0) }}>
                      {ipo.listingReturn != null ? signedPct(ipo.listingReturn) : '-'}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )
        })
      )}
    </Page>
  )
}

// ───────── 투자 카드 도감 ─────────
export function CardDexPage() {
  const owned = useStore((s) => s.ownedRelics)
  const ownedSet = useMemo(() => new Set(owned), [owned])
  const [filter, setFilter] = useState<'all' | Rarity>('all')
  const [sel, setSel] = useState<Relic | null>(null)
  const list = RELICS.filter((r) => filter === 'all' || r.rarity === filter)
  const pct = Math.round((ownedSet.size / RELICS.length) * 100)

  return (
    <Page title="투자 카드 도감">
      <div className="page-hero">
        <div className="page-hero-num num">
          {ownedSet.size}
          <span className="t3"> / {RELICS.length}</span>
        </div>
        <div className="page-hero-prog">
          <Progress value={ownedSet.size} max={RELICS.length} height={8} />
          <span className="t3 fs13 num">{pct}%</span>
        </div>
      </div>
      <ChipTabs<'all' | Rarity>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: '전체' },
          ...ORDER.map((r) => ({
            value: r,
            label: RARITY_META[r].label,
            count: RELICS.filter((x) => x.rarity === r && ownedSet.has(x.id)).length,
          })),
        ]}
      />
      <div className="card-grid">
        {list.map((r) => {
          const has = ownedSet.has(r.id)
          return (
            <button
              key={r.id}
              className={`relic-tile press-scale r-${r.rarity}` + (has ? '' : ' locked')}
              onClick={() => has && setSel(r)}
              disabled={!has}
              aria-label={has ? r.name : '미보유 카드'}
            >
              {has ? <Emoji e={r.emoji} size={38} /> : <Lock size={18} strokeWidth={2} />}
              <span className="relic-tile-name">{has ? r.name : '???'}</span>
            </button>
          )
        })}
      </div>
      {sel && (
        <Sheet onClose={() => setSel(null)}>
          <div className={`relic-detail r-${sel.rarity}`}>
            <div className="relic-detail-art">
              <Emoji e={sel.emoji} size={96} />
            </div>
            <span className="rarity-label">{RARITY_META[sel.rarity].label}</span>
            <div className="relic-detail-name">{sel.name}</div>
            {sel.effect.kind === 'none' && <div className="relic-detail-desc">“{sel.desc}”</div>}
            <div className="callout brand mt16">
              <Emoji e="✨" size={20} />
              <span>
                도감 보너스 · 전체 능력치 +{RARITY_STAT_PCT[sel.rarity]}%
                {sel.effect.kind !== 'none' && (
                  <>
                    <br />
                    카드 효과 · {sel.desc}
                  </>
                )}
              </span>
            </div>
          </div>
        </Sheet>
      )}
    </Page>
  )
}

// ───────── 업적 ─────────
export function AchievementsPage() {
  const achievements = useStore((s) => s.achievements)
  const best = useStore((s) => s.rpg.best)
  const got = ACHIEVEMENTS.filter((a) => achievements.includes(a.id))
  const locked = ACHIEVEMENTS.filter((a) => !achievements.includes(a.id))
  return (
    <Page title="업적">
      <div className="page-hero">
        <div className="page-hero-num num">
          {got.length}
          <span className="t3"> / {ACHIEVEMENTS.length}</span>
        </div>
        <div className="t3 fs14">업적을 달성하면 골드와 칭호를 받아요</div>
      </div>
      <Card pad={false}>
        {[...got, ...locked].map((a) => {
          const has = achievements.includes(a.id)
          return (
            <div key={a.id} className={'ach' + (has ? ' got' : '')}>
              <span className="ach-ic">{has ? <Emoji e={a.emoji} size={36} /> : <Lock size={20} strokeWidth={2} />}</span>
              <span className="ach-main">
                <span className="ach-name">{a.name}</span>
                <span className="ach-desc">{a.desc}</span>
              </span>
              <span className="ach-rew">
                <span className="num">{fmtBig(a.gold * rewardScale(best))}골드</span>
                {a.title && <span className="t4 fs12">칭호 ‘{a.title}’</span>}
              </span>
            </div>
          )
        })}
      </Card>
    </Page>
  )
}

// ───────── 모의청약 내역 ─────────
export function MyBetsPage() {
  const ALL = useIpos()
  const today = useToday()
  const subscriptions = useStore((s) => s.subscriptions)
  const predictions = useStore((s) => s.predictions)
  const settledIds = useStore((s) => s.settledIds)
  const ids = new Set([...Object.keys(subscriptions), ...Object.keys(predictions)])
  const active = ALL.filter((i) => ids.has(i.id) && !settledIds.includes(i.id))
  const done = ALL.filter((i) => settledIds.includes(i.id)).sort((a, b) => (b.listingDate ?? '').localeCompare(a.listingDate ?? ''))

  return (
    <Page title="모의청약 내역">
      {!active.length && !done.length ? (
        <Card>
          <Empty emoji="🧾" title="아직 모의청약 내역이 없어요" desc="청약 중인 종목의 모의청약 탭에서 가상 머니로 참여해 보세요" />
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <Card>
              <div className="card-head">
                <h2 className="card-title">진행 중 {active.length}</h2>
              </div>
              <div className="card-list">
                {active.map((i) => (
                  <IpoRow
                    key={i.id}
                    ipo={i}
                    stage={computeStage(i, today)}
                    today={today}
                    right={betRight(i, today, subscriptions[i.id])}
                    onClick={() => openIpo(i.id, 'sim')}
                  />
                ))}
              </div>
            </Card>
          )}
          {done.length > 0 && (
            <Card>
              <div className="card-head">
                <h2 className="card-title">정산 완료 {done.length}</h2>
              </div>
              <div className="card-list">
                {done.map((i) => (
                  <IpoRow key={i.id} ipo={i} stage="listed" today={today} onClick={() => openIpo(i.id, 'sim')} />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </Page>
  )
}

// ───────── 최근 상장 결과 전체 ─────────
export function ListedPage() {
  const ALL = useIpos()
  const today = useToday()
  const list = ALL.filter((i) => notSpac(i) && i.listingReturn != null && i.listingDate).sort((a, b) =>
    (b.listingDate ?? '').localeCompare(a.listingDate ?? '')
  )
  const stats = useMemo(() => summary(list), [list])
  return (
    <Page title="상장 결과">
      {stats && (
        <Card className="listed-stats">
          <div className="ls-cell">
            <span className="t3 fs13">상장일 상승 종목</span>
            <span className="ls-val num">
              {stats.ups}
              <span className="t3 fs15"> / {stats.n}</span>
            </span>
          </div>
          <div className="ls-cell">
            <span className="t3 fs13">수익률 중앙값</span>
            <span className="ls-val num" style={{ color: returnColor(stats.median) }}>
              {signedPct(stats.median)}
            </span>
          </div>
          <p className="ls-note">
            몇몇 급등 종목에 평균이 끌려가지 않도록 중앙값으로 보여 드려요. {fmtMD(stats.from)}–{fmtMD(stats.to)} 상장 종목 기준이에요.
          </p>
        </Card>
      )}
      <Card>
        <div className="card-list pt8">
          {list.map((i) => (
            <IpoRow key={i.id} ipo={i} stage="listed" today={today} />
          ))}
        </div>
      </Card>
    </Page>
  )
}

function summary(list: Ipo[]) {
  if (!list.length) return null
  const rs = list.map((i) => i.listingReturn!).sort((a, b) => a - b)
  const mid = Math.floor(rs.length / 2)
  const median = rs.length % 2 ? rs[mid] : (rs[mid - 1] + rs[mid]) / 2
  return {
    n: rs.length,
    ups: rs.filter((r) => r > 0).length,
    median: Math.round(median * 10) / 10,
    from: list[list.length - 1].listingDate!,
    to: list[0].listingDate!,
  }
}
