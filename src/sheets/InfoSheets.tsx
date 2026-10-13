import { Sheet } from '../ui/Sheet'
import { Emoji } from '../ui/Emoji'
import { GRADE_META, RARITY_META } from '../lib/calc'
import { PITY_PULLS, RELICS } from '../data/relics'
import { RANKS } from '../data/ranks'
import type { Rarity } from '../types'

const okBtn = (close: () => void) => (
  <button className="btn btn-primary btn-lg" onClick={close}>
    확인
  </button>
)

// 수요 등급 설명
export function GradeSheet({ onClose }: { onClose: () => void }) {
  const order: Rarity[] = ['legendary', 'epic', 'rare', 'common']
  return (
    <Sheet title="수요 등급 안내" onClose={onClose} footer={okBtn}>
      <p className="sheet-lead">
        기관 수요예측 경쟁률, 통합 청약 경쟁률, 의무보유확약 비율을 중심으로 보고 공모 규모도 함께 따져요. 스팩은 등급을 매기지 않아요.
      </p>
      <div className="grade-table">
        {order.map((r) => {
          const g = GRADE_META[r]
          return (
            <div key={r} className="grade-tr">
              <span className={`grade grade-${g.grade.toLowerCase()} lg`}>{g.grade}</span>
              <div>
                <div className="fw6">수요 {g.label}</div>
                <div className="t3 fs13">{g.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="callout">
        <Emoji e="💡" size={20} />
        <span>등급은 공개 지표로 계산한 참고용이에요. 상장 후 수익을 보장하지 않아요.</span>
      </div>
    </Sheet>
  )
}

// 공모주 용어 사전
export const GLOSSARY: Record<string, { title: string; emoji: string; body: string }> = {
  demand: {
    title: '수요예측',
    emoji: '🏛️',
    body: '기관투자자들이 희망 공모가 범위 안에서 사고 싶은 가격과 수량을 써내는 절차예요. 이 결과를 바탕으로 공모가가 확정돼요.',
  },
  instRate: {
    title: '기관 경쟁률',
    emoji: '📊',
    body: '수요예측에 참여한 기관들의 신청 수량을 기관 배정 물량으로 나눈 값이에요. 높을수록 기관의 관심이 컸다는 뜻이에요.',
  },
  lockup: {
    title: '의무보유확약',
    emoji: '🔒',
    body: '기관이 배정받은 주식을 일정 기간(15일·1개월·3개월·6개월 등) 팔지 않겠다고 약속한 비율이에요. 높을수록 상장 직후 쏟아질 수 있는 물량이 적어요.',
  },
  compRate: {
    title: '통합 경쟁률',
    emoji: '👥',
    body: '일반 청약자들의 경쟁률을 모든 증권사를 합쳐 계산한 값이에요. 청약이 끝나야 확정돼요.',
  },
  deposit: {
    title: '증거금',
    emoji: '💰',
    body: '청약할 때 미리 내는 돈이에요. 보통 청약 금액의 50%이고, 배정받지 못한 금액은 환불일에 돌려받아요.',
  },
  equal: {
    title: '균등 배정',
    emoji: '⚖️',
    body: '최소 청약 수량 이상을 청약한 모든 사람에게 똑같이 나눠 주는 방식이에요. 청약자가 많으면 추첨으로 1주씩 배정되기도 해요.',
  },
  refund: {
    title: '환불일',
    emoji: '↩️',
    body: '배정되지 않은 증거금을 돌려받는 날이에요. 보통 청약 마감일로부터 2영업일 뒤예요.',
  },
}

export function GlossarySheet({ keys, onClose }: { keys?: string[]; onClose: () => void }) {
  const list = (keys ?? Object.keys(GLOSSARY)).map((k) => GLOSSARY[k]).filter(Boolean)
  return (
    <Sheet title={list.length === 1 ? list[0].title : '공모주 용어 설명'} onClose={onClose} footer={okBtn}>
      <div className="glossary">
        {list.map((g) => (
          <div key={g.title} className="gl-item">
            {list.length > 1 && (
              <div className="gl-title">
                <Emoji e={g.emoji} size={22} />
                {g.title}
              </div>
            )}
            <p className="gl-body">{g.body}</p>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

// 투자 카드 확률 정보
export function OddsSheet({ onClose }: { onClose: () => void }) {
  const rows: { r: Rarity; p: number }[] = [
    { r: 'legendary', p: 2 },
    { r: 'epic', p: 10 },
    { r: 'rare', p: 28 },
    { r: 'common', p: 60 },
  ]
  return (
    <Sheet title="확률 정보" onClose={onClose} footer={okBtn}>
      <div className="odds">
        {rows.map(({ r, p }) => {
          const n = RELICS.filter((x) => x.rarity === r).length
          return (
            <div key={r} className="odds-row">
              <span className="odds-dot" style={{ background: RARITY_META[r].color }} />
              <span className="fw6">{RARITY_META[r].label}</span>
              <span className="t3 fs13">{n}종</span>
              <span className="odds-p num">{p}%</span>
            </div>
          )
        })}
      </div>
      <ul className="bullets">
        <li>{PITY_PULLS}회 안에 아직 없는 카드가 반드시 나와요. 등급별 확률은 바뀌지 않아요.</li>
        <li>이미 가진 카드가 나오면 등급에 따라 골드로 돌려드려요. 뽑기 비용과 환불은 최고 스테이지에 맞춰 함께 커져요.</li>
        <li>카드는 라운지 전투(도감 보너스·공격력·골드)에만 영향을 주고, 모의청약 수익에는 영향이 없어요.</li>
        <li>골드는 앱 안에서만 쓰는 가상 재화예요. 현금으로 구매하거나 바꿀 수 없어요.</li>
      </ul>
    </Sheet>
  )
}

// 투자자 등급 사다리
export function RankSheet({ index, onClose }: { index: number; onClose: () => void }) {
  return (
    <Sheet title="투자자 등급" onClose={onClose} footer={okBtn}>
      <p className="sheet-lead">라운지에서 깬 최고 스테이지로 등급이 정해져요.</p>
      <div className="rank-ladder">
        {RANKS.map((r, i) => (
          <div key={r.name} className={'rank-step' + (i === index ? ' cur' : i < index ? ' done' : '')}>
            <Emoji e={r.emoji} size={36} />
            <div className="rank-step-txt">
              <div className="fw6">{r.name}</div>
              <div className="t3 fs13">{r.minStage === 0 ? '시작 등급' : `스테이지 ${r.minStage} 돌파`}</div>
            </div>
            {i === index && <span className="pill tone-brand sm">현재</span>}
            {i < index && <span className="pill tone-muted sm">달성</span>}
          </div>
        ))}
      </div>
    </Sheet>
  )
}
