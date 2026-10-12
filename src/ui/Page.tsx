import { createContext, useContext, useRef, useState, type ReactNode, type UIEvent } from 'react'
import { useBackCloseWhen } from '../lib/backStack'
import { nav } from '../nav'
import { ChevronLeft } from './icons'

// 스택 페이지 컨텍스트 — 각 페이지가 자기 자신을 (애니메이션과 함께) 닫을 수 있게
const PageCtx = createContext<{ key: number; closing: boolean }>({ key: 0, closing: false })
export const PageProvider = PageCtx.Provider

export function usePageClosing(): boolean {
  return useContext(PageCtx).closing
}

export function usePageClose(): () => void {
  const { key } = useContext(PageCtx)
  return () => nav.close(key)
}

interface Props {
  title?: string
  // 'always': 제목 항상 표시 · 'scroll': 스크롤이 revealAt(px)을 넘으면 제목 페이드인(상세 화면 히어로와 중복 방지)
  titleMode?: 'always' | 'scroll'
  revealAt?: number
  right?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  onScroll?: (top: number) => void
}

export function Page({ title, titleMode = 'always', revealAt = 56, right, footer, children, className, bodyClassName, onScroll }: Props) {
  const { closing } = useContext(PageCtx)
  const close = usePageClose()
  useBackCloseWhen(!closing, close) // 닫힘 애니메이션 중엔 스택에서 빠져 다음 뒤로가기가 아래 화면으로 감
  const [scrolled, setScrolled] = useState(false)
  const [reveal, setReveal] = useState(titleMode === 'always')
  const raf = useRef(0)

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      setScrolled(top > 2)
      if (titleMode === 'scroll') setReveal(top > revealAt)
      onScroll?.(top)
    })
  }

  return (
    <div
      className={'page' + (closing ? ' closing' : '') + (className ? ` ${className}` : '')}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className={'appbar' + (scrolled ? ' scrolled' : '')}>
        <button className="icon-btn" onClick={close} aria-label="뒤로 가기">
          <ChevronLeft size={26} strokeWidth={2.1} />
        </button>
        <div className={'appbar-title' + (reveal ? ' on' : '')}>{title}</div>
        <div className="appbar-right">{right}</div>
      </header>
      <div className={'page-body' + (footer ? ' has-footer' : '') + (bodyClassName ? ` ${bodyClassName}` : '')} onScroll={handleScroll}>
        {children}
      </div>
      {footer && <div className="page-footer">{footer}</div>}
    </div>
  )
}
