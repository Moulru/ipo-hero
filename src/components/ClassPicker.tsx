import { useStore } from '../store'
import { CLASSES } from '../data/classes'
import { useBackClose } from '../lib/backStack'

export function ClassPicker({ onClose }: { onClose: () => void }) {
  useBackClose(onClose)
  const chosenClass = useStore((s) => s.chosenClass)
  const chooseClass = useStore((s) => s.chooseClass)

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <h2>투자 성향 선택</h2>
          </div>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="class-list">
          {CLASSES.map((c) => (
            <button
              key={c.id}
              className={chosenClass === c.id ? 'class-card sel' : 'class-card'}
              onClick={() => {
                chooseClass(c.id)
                onClose()
              }}
            >
              <div className="class-emoji">{c.emoji}</div>
              <div className="class-body">
                <div className="class-name">
                  {c.name}
                  {chosenClass === c.id ? ' ✓' : ''}
                </div>
                <div className="class-passive">{c.passive}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
