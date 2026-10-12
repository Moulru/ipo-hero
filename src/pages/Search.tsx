import { useEffect, useMemo, useRef, useState } from 'react'
import { useIpos } from '../data/loadIpos'
import { useStore } from '../store'
import type { Ipo, Stage } from '../types'
import { computeStage } from '../lib/calc'
import { underwriters } from '../lib/format'
import { useToday } from '../lib/useToday'
import { useBackCloseWhen } from '../lib/backStack'
import { usePageClose, usePageClosing } from '../ui/Page'
import { ChevronLeft, CircleX, X } from '../ui/icons'
import { Empty } from '../ui/kit'
import { IpoRow } from '../components/IpoRow'

const STAGE_ORDER: Record<Stage, number> = { subscription: 0, upcoming: 1, pending: 2, listed: 3 }

// 초성 검색 지원: '엠에스' / 'ㅇㅇㅅ' 모두 매칭
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
function choseong(s: string): string {
  return [...s]
    .map((c) => {
      const code = c.charCodeAt(0) - 0xac00
      return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : c
    })
    .join('')
}
const isChoOnly = (q: string) => /^[ㄱ-ㅎ]+$/.test(q)

export function SearchPage() {
  const ALL = useIpos()
  const today = useToday()
  const close = usePageClose()
  const closing = usePageClosing()
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const recent = useStore((s) => s.recentSearches)
  const addRecent = useStore((s) => s.addRecentSearch)
  const removeRecent = useStore((s) => s.removeRecentSearch)
  const clearRecent = useStore((s) => s.clearRecentSearches)

  // 검색 페이지는 자체 헤더(입력창)를 쓰므로 뒤로가기 등록을 직접
  useBackCloseWhen(!closing, close)

  useEffect(() => {
    // 페이지 진입 애니메이션 후 포커스(키보드가 전환 중 올라와 덜컹이는 것 방지)
    const t = setTimeout(() => input.current?.focus(), 320)
    return () => clearTimeout(t)
  }, [])

  const term = q.trim().toLowerCase()
  const results = useMemo(() => {
    if (!term) return []
    const cho = isChoOnly(term)
    return ALL.map((ipo) => ({ ipo, stage: computeStage(ipo, today) }))
      .filter(({ ipo }) => {
        const hay = [ipo.name, ipo.sector, ...underwriters(ipo), ipo.market ?? ''].join(' ').toLowerCase()
        return cho ? choseong(ipo.name).includes(term) : hay.includes(term)
      })
      .sort(
        (a, b) =>
          STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || (b.ipo.subscriptionStart ?? '').localeCompare(a.ipo.subscriptionStart ?? '')
      )
  }, [ALL, term, today])

  // 추천 키워드: 데이터에 실제로 있는 업종·증권사
  const suggestions = useMemo(() => {
    const sectors = new Map<string, number>()
    const uws = new Map<string, number>()
    for (const i of ALL) {
      if (i.sector && i.sector !== '기타') sectors.set(i.sector, (sectors.get(i.sector) ?? 0) + 1)
      for (const u of underwriters(i)) uws.set(u, (uws.get(u) ?? 0) + 1)
    }
    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map((x) => x[0])
    return { sectors: top(sectors, 6), uws: top(uws, 6) }
  }, [ALL])

  const pick = (s: string) => {
    setQ(s)
    addRecent(s)
    input.current?.blur()
  }

  return (
    <div className={'page white search-page' + (closing ? ' closing' : '')} role="dialog" aria-modal="true" aria-label="검색">
      <header className="appbar search-bar">
        <button className="icon-btn" onClick={close} aria-label="뒤로 가기">
          <ChevronLeft size={26} strokeWidth={2.1} />
        </button>
        <form
          className="search-field"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (term) addRecent(q)
            input.current?.blur()
          }}
        >
          <input
            ref={input}
            type="search"
            enterKeyHint="search"
            placeholder="종목명, 업종, 증권사 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="검색어"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {q && (
            <button
              type="button"
              className="search-clear"
              aria-label="검색어 지우기"
              onClick={() => {
                setQ('')
                input.current?.focus()
              }}
            >
              <CircleX size={18} fill="currentColor" stroke="var(--surface)" />
            </button>
          )}
        </form>
      </header>

      <div className="page-body" onScroll={() => input.current?.blur()}>
        {!term ? (
          <div className="search-idle">
            {recent.length > 0 && (
              <section className="search-sec">
                <div className="search-sec-head">
                  <span>최근 검색어</span>
                  <button className="text-btn" onClick={clearRecent}>
                    전체 삭제
                  </button>
                </div>
                <div className="chip-wrap">
                  {recent.map((r) => (
                    <span key={r} className="chip sm recent-chip">
                      <button onClick={() => pick(r)}>{r}</button>
                      <button className="x" onClick={() => removeRecent(r)} aria-label={`${r} 삭제`}>
                        <X size={14} strokeWidth={2.4} />
                      </button>
                    </span>
                  ))}
                </div>
              </section>
            )}
            {suggestions.sectors.length > 0 && (
              <section className="search-sec">
                <div className="search-sec-head">
                  <span>업종으로 찾기</span>
                </div>
                <div className="chip-wrap">
                  {suggestions.sectors.map((s) => (
                    <button key={s} className="chip sm" onClick={() => pick(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="search-sec">
              <div className="search-sec-head">
                <span>증권사로 찾기</span>
              </div>
              <div className="chip-wrap">
                {suggestions.uws.map((s) => (
                  <button key={s} className="chip sm" onClick={() => pick(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
            <p className="search-tip">초성으로도 찾을 수 있어요 · 예) ㅋㅇㅇ</p>
          </div>
        ) : results.length ? (
          <>
            <div className="list-label">검색 결과 {results.length}개</div>
            {results.map(({ ipo, stage }) => (
              <ResultRow key={ipo.id} ipo={ipo} stage={stage} today={today} onOpen={() => addRecent(q)} />
            ))}
          </>
        ) : (
          <Empty emoji="🔍" title={`'${q.trim()}' 검색 결과가 없어요`} desc="종목명이나 증권사 이름을 다시 확인해 주세요" />
        )}
      </div>
    </div>
  )
}

function ResultRow({ ipo, stage, today, onOpen }: { ipo: Ipo; stage: Stage; today: string; onOpen: () => void }) {
  return (
    <div onClickCapture={onOpen}>
      <IpoRow ipo={ipo} stage={stage} today={today} />
    </div>
  )
}
