import { useStore } from '../store'
import { CLASSES } from '../data/classes'
import { ACHIEVEMENTS } from '../data/achievements'
import { haptic, toast } from '../lib/juice'
import { nav } from '../nav'
import { Sheet } from '../ui/Sheet'
import { Emoji } from '../ui/Emoji'
import { Check } from '../ui/icons'

// 투자 성향 — 경험치 보너스에만 영향 (시즌 자산과 무관)
export function ClassSheet({ onClose }: { onClose: () => void }) {
  const chosen = useStore((s) => s.chosenClass)
  const choose = useStore((s) => s.chooseClass)
  return (
    <Sheet title="투자 성향" onClose={onClose}>
      {(close) => (
        <>
          <p className="sheet-lead">성향에 따라 정산 때 받는 경험치 보너스가 달라져요. 모의청약 수익에는 영향이 없어요.</p>
          <div className="choice-list">
            {CLASSES.map((c) => {
              const on = chosen === c.id
              return (
                <button
                  key={c.id}
                  className={'choice press-scale' + (on ? ' on' : '')}
                  aria-pressed={on}
                  onClick={() => {
                    if (!on) {
                      choose(c.id)
                      haptic(10)
                      toast(`${c.name} 성향으로 바꿨어요`, c.emoji)
                    }
                    close()
                  }}
                >
                  <Emoji e={c.emoji} size={40} />
                  <span className="choice-txt">
                    <span className="choice-name">{c.name}</span>
                    <span className="choice-desc">{c.passive}</span>
                  </span>
                  <span className="choice-check">{on && <Check size={16} strokeWidth={3} />}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </Sheet>
  )
}

// 칭호 선택
export function TitleSheet({ onClose }: { onClose: () => void }) {
  const achievements = useStore((s) => s.achievements)
  const equipped = useStore((s) => s.equippedTitle)
  const equip = useStore((s) => s.equipTitle)
  const titles = ACHIEVEMENTS.filter((a) => a.title && achievements.includes(a.id))
  const locked = ACHIEVEMENTS.filter((a) => a.title && !achievements.includes(a.id))

  return (
    <Sheet title="칭호" onClose={onClose}>
      {(close) => (
        <>
          <p className="sheet-lead">업적을 달성하면 이름 앞에 붙일 수 있는 칭호를 얻어요.</p>
          <div className="title-grid">
            <button
              className={'title-opt' + (!equipped ? ' on' : '')}
              onClick={() => {
                equip(null)
                haptic(8)
              }}
            >
              선택 안 함
            </button>
            {titles.map((t) => (
              <button
                key={t.id}
                className={'title-opt' + (equipped === t.id ? ' on' : '')}
                onClick={() => {
                  equip(t.id)
                  haptic(8)
                }}
              >
                {t.title}
              </button>
            ))}
            {locked.map((t) => (
              <span key={t.id} className="title-opt locked" title={t.desc}>
                {t.title}
              </span>
            ))}
          </div>
          {!titles.length && (
            <button
              className="btn btn-weak btn-block mt16"
              onClick={() => {
                close()
                nav.push({ k: 'achievements' })
              }}
            >
              업적 보러 가기
            </button>
          )}
        </>
      )}
    </Sheet>
  )
}
