// KRX KIND(상장공시시스템) 클라이언트 — 전체 상장사 종목코드·상장일·업종 (EUC-KR)
// data.krx(헤드리스 차단)와 달리 corpList.do는 공개 접근 가능
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const CACHE_DIR = 'scripts/.cache'
const CACHE = `${CACHE_DIR}/kindCorp.json`

const stripTags = (s) => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()

// 전체 상장사: [{name, market, code, sector, product, listingDate}]
export async function listedCompanies() {
  if (existsSync(CACHE) && Date.now() - statSync(CACHE).mtimeMs < 86400000) {
    return JSON.parse(readFileSync(CACHE, 'utf8'))
  }
  const res = await fetch('https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13', {
    headers: { 'User-Agent': UA, Referer: 'https://kind.krx.co.kr/corpgeneral/corpList.do' },
  })
  const txt = new TextDecoder('euc-kr').decode(new Uint8Array(Buffer.from(await res.arrayBuffer())))
  const rows = []
  for (const tr of txt.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => stripTags(m[1]))
    if (cells.length < 6) continue // 헤더(th) 행 스킵
    const [name, market, code, sector, product, listingDate] = cells
    if (!/^\d{6}$/.test(code)) continue
    rows.push({ name, market, code, sector, product, listingDate })
  }
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(CACHE, JSON.stringify(rows))
  return rows
}

// 이름→레코드 맵 (정확 일치)
export async function listedMap() {
  const rows = await listedCompanies()
  const m = new Map()
  for (const r of rows) m.set(r.name, r)
  return m
}

// 최근 N일 내 신규상장 (갓 상장한 IPO 후보)
export async function recentListings(days = 120, today = null) {
  const rows = await listedCompanies()
  const now = today ? Date.parse(today) : Date.now()
  return rows
    .filter((r) => {
      const t = Date.parse(r.listingDate)
      return !Number.isNaN(t) && now - t <= days * 86400000 && now - t >= -3 * 86400000
    })
    .sort((a, b) => b.listingDate.localeCompare(a.listingDate))
}
