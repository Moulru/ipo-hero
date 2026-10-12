import { useEffect, useRef, useState, type ReactNode } from 'react'

// 탭 화면 공통 틀: 고정 헤더(스크롤 시 헤어라인) + 독립 스크롤(탭 전환해도 위치 유지)
// 'tab-reselect' 이벤트(같은 탭 재탭)를 받으면 맨 위로 부드럽게 스크롤
export function TabScreen({
  id,
  header,
  children,
  scrollRef,
  onScroll,
}: {
  id: string
  header: ReactNode
  children: ReactNode
  scrollRef?: React.MutableRefObject<HTMLDivElement | null>
  onScroll?: (top: number) => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent).detail === id) ref.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('tab-reselect', on)
    return () => window.removeEventListener('tab-reselect', on)
  }, [id])

  return (
    <div
      className="tab-scroll"
      ref={(el) => {
        ref.current = el
        if (scrollRef) scrollRef.current = el
      }}
      onScroll={(e) => {
        const top = e.currentTarget.scrollTop
        setScrolled(top > 4)
        onScroll?.(top)
      }}
    >
      <header className={'tab-header' + (scrolled ? ' scrolled' : '')}>{header}</header>
      {children}
    </div>
  )
}
