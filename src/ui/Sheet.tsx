import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useBackClose } from '../lib/backStack'
import { X } from './icons'

const EXIT_MS = 220

// 바텀 시트 — 조건부 렌더링으로 열고, 닫힘은 애니메이션 후 onClose 호출.
// 손잡이/헤더를 아래로 끌어 닫기 · 배경 탭 닫기 · 하드웨어 뒤로가기 닫기
export function Sheet({
  title,
  onClose,
  children,
  footer,
  closeButton = false,
}: {
  title?: ReactNode
  onClose: () => void
  children: ReactNode | ((close: () => void) => ReactNode)
  footer?: ReactNode | ((close: () => void) => ReactNode)
  closeButton?: boolean
}) {
  const [closing, setClosing] = useState(false)
  const [drag, setDrag] = useState(0)
  const start = useRef<{ y: number; t: number } | null>(null)
  const done = useRef(false)

  const close = () => {
    if (done.current) return
    done.current = true
    setClosing(true)
    setTimeout(onClose, EXIT_MS)
  }
  useBackClose(close)

  // 열려 있는 동안 배경 스크롤 잠금은 오버레이가 전체를 덮으므로 불필요 — 포커스만 시트로
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  const onDown = (e: PointerEvent) => {
    start.current = { y: e.clientY, t: Date.now() }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: PointerEvent) => {
    if (!start.current) return
    setDrag(Math.max(0, e.clientY - start.current.y))
  }
  const onUp = (e: PointerEvent) => {
    if (!start.current) return
    const dy = e.clientY - start.current.y
    const v = dy / Math.max(1, Date.now() - start.current.t)
    start.current = null
    if (dy > 110 || (dy > 30 && v > 0.6)) close()
    else setDrag(0)
  }

  return createPortal(
    <div className={'sheet-root' + (closing ? ' closing' : '')}>
      <div className="scrim" onClick={close} />
      <div
        ref={ref}
        tabIndex={-1}
        className="sheet"
        role="dialog"
        aria-modal="true"
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <div className="sheet-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span className="sheet-handle" />
          {(title || closeButton) && (
            <div className="sheet-head">
              <div className="sheet-title">{title}</div>
              {closeButton && (
                <button className="icon-btn sm" onClick={close} aria-label="닫기" onPointerDown={(e) => e.stopPropagation()}>
                  <X size={22} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="sheet-body">{typeof children === 'function' ? children(close) : children}</div>
        {footer && <div className="sheet-footer">{typeof footer === 'function' ? footer(close) : footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// 확인 다이얼로그 (파괴적 동작 전 확인)
export function Confirm({
  title,
  desc,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
  onConfirm,
  onClose,
}: {
  title: string
  desc?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const [closing, setClosing] = useState(false)
  const done = useRef(false)
  const close = (after?: () => void) => {
    if (done.current) return
    done.current = true
    setClosing(true)
    setTimeout(() => {
      onClose()
      after?.()
    }, 160)
  }
  useBackClose(() => close())
  return createPortal(
    <div className={'dialog-root' + (closing ? ' closing' : '')}>
      <div className="scrim" onClick={() => close()} />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="dialog-title">{title}</div>
        {desc && <div className="dialog-desc">{desc}</div>}
        <div className="dialog-btns">
          <button className="btn btn-secondary btn-lg" onClick={() => close()}>
            {cancelLabel}
          </button>
          <button className={'btn btn-lg ' + (danger ? 'btn-danger' : 'btn-primary')} onClick={() => close(onConfirm)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
