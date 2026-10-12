import type { Ipo } from '../types'

// 화면 표기용 날짜·숫자 포맷 (모두 기기 로컬 시간대 기준)

const WD = ['일', '월', '화', '수', '목', '금', '토']

function parse(ymd: string): Date {
  return new Date(ymd + 'T00:00:00')
}

export function weekdayKo(ymd: string): string {
  return WD[parse(ymd).getDay()]
}

// '2026-10-13' → '10.13'
export function fmtMD(ymd: string | null | undefined): string {
  return ymd ? `${+ymd.slice(5, 7)}.${+ymd.slice(8, 10)}` : '-'
}

// '2026-10-13' → '10.13(화)'
export function fmtMDW(ymd: string | null | undefined): string {
  return ymd ? `${fmtMD(ymd)}(${weekdayKo(ymd)})` : '-'
}

// '2026-10-13' → '10월 13일'
export function fmtMonthDay(ymd: string): string {
  return `${+ymd.slice(5, 7)}월 ${+ymd.slice(8, 10)}일`
}

// '2026-10-13' → '10월 13일 화요일'
export function fmtLongDate(ymd: string): string {
  return `${fmtMonthDay(ymd)} ${weekdayKo(ymd)}요일`
}

// 청약 기간 '10.13 – 10.14'
export function fmtRange(a: string | null, b: string | null): string {
  if (a && b) return a === b ? fmtMD(a) : `${fmtMD(a)} – ${fmtMD(b)}`
  return a ? fmtMD(a) : b ? fmtMD(b) : '미정'
}

export function fmtNum(n: number, digits = 0): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

export function fmtWon(n: number): string {
  return `${fmtNum(Math.round(n))}원`
}

// 경쟁률 '1,096.56 : 1' — 100 이상은 소수 버림(가독성), 미만은 소수 2자리
export function fmtRate(n: number | null | undefined): string {
  if (n == null) return '-'
  return `${fmtNum(n >= 100 ? Math.round(n) : n, 2)}:1`
}

// 큰 금액 한국식 축약: 12,345,678 → '1,234만원', 1.2억 이상 → '1.2억원'
export function fmtKrw(won: number): string {
  const abs = Math.abs(won)
  const sign = won < 0 ? '-' : ''
  if (abs >= 100_000_000) return `${sign}${fmtNum(abs / 100_000_000, 2)}억원`
  if (abs >= 10_000) return `${sign}${fmtNum(Math.round(abs / 10_000))}만원`
  return `${sign}${fmtNum(abs)}원`
}

// 공모가 표기: 확정='7,800원', 밴드='15,000~17,800원'
export function priceLabel(ipo: Ipo): string {
  if (ipo.priceConfirmed && ipo.offerPrice > 0) return fmtWon(ipo.offerPrice)
  if (ipo.priceLow && ipo.priceHigh) return `${fmtNum(ipo.priceLow)}~${fmtNum(ipo.priceHigh)}원`
  return ipo.offerPrice > 0 ? fmtWon(ipo.offerPrice) : '미정'
}

// 목록용 짧은 공모가: 확정가 또는 희망 상단
export function priceShort(ipo: Ipo): string {
  return ipo.offerPrice > 0 ? fmtWon(ipo.offerPrice) : '미정'
}

// 대표 증권사(첫 번째) + '외 N'
export function underwriterShort(ipo: Ipo): string | null {
  if (!ipo.underwriter) return null
  const list = ipo.underwriter
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  if (!list.length) return null
  return list.length > 1 ? `${list[0]} 외 ${list.length - 1}` : list[0]
}

export function underwriters(ipo: Ipo): string[] {
  return (ipo.underwriter ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

// 상대 시각: '방금 전' · 'N분 전' · 'N시간 전' · '어제' · 'M월 D일'
export function relTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime()
  if (!iso || isNaN(t)) return '-'
  const diff = Math.max(0, now - t)
  const m = Math.floor(diff / 60_000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = new Date(t)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// 'M월 D일 HH:mm'
export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (!iso || isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const isSpac = (i: Ipo) => i.sector === '스팩'
export const notSpac = (i: Ipo) => i.sector !== '스팩'

// 업종 '기타'는 정보가 없으므로 숨김
export function sectorLabel(i: Ipo): string | null {
  return i.sector && i.sector !== '기타' ? i.sector : null
}
