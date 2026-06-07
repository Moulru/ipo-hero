// 38커뮤니케이션 수집 (보조 소스): 수요지표 3종 + 청약일정 폴백 + 수익률
// 하이브리드에서 38은 '수요지표/수익률' 보조 + 유니버스 일부로만 사용 (가격/상장일/업종은 DART·KIND 권위)
const SCHEDULE_URL = 'http://www.38.co.kr/html/fund/index.htm?o=k'
const LISTING_URL = 'http://www.38.co.kr/html/fund/index.htm?o=nw'
const DETAIL_URL = (no) => `http://www.38.co.kr/html/fund/?o=v&no=${no}`

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ttasangroad/1.0)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return new TextDecoder('euc-kr').decode(new Uint8Array(await res.arrayBuffer()))
}
const strip = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
const num = (s) => {
  const m = strip(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}
function tableBySummary(html, summary) {
  const i = html.indexOf(`summary="${summary}"`)
  if (i < 0) return null
  return html.slice(html.lastIndexOf('<table', i), html.indexOf('</table>', i))
}
function rows(table) {
  if (!table) return []
  return table
    .split(/<tr[^>]*>/i)
    .filter((r) => /o=v&amp;no=\d+/.test(r))
    .map((r) => ({
      no: (r.match(/o=v&amp;no=(\d+)/) || [])[1],
      name: strip((r.match(/<font[^>]*>([\s\S]*?)<\/font>/i) || [])[1]),
      tds: [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1])),
    }))
    .filter((r) => r.name)
}
function parseSchedule(s) {
  const m = strip(s).match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{2})\.(\d{2})/)
  return m ? { start: `${m[1]}-${m[2]}-${m[3]}`, end: `${m[1]}-${m[4]}-${m[5]}` } : { start: null, end: null }
}
function parseYmd(s) {
  const m = strip(s).match(/(\d{4})\/(\d{2})\/(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}
// 상세: 기관 수요예측 경쟁률·의무보유확약·공모금액(억)
function parseDetail(html) {
  const t = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  const inst = (t.match(/기관경쟁률\s*([\d,]+\.?\d*)\s*:\s*1/) || [])[1]
  const instRate = inst ? parseFloat(inst.replace(/,/g, '')) : null
  const lockM = (t.match(/의무보유확약\s*([\d.]+)\s*%/) || [])[1]
  let lockup = lockM != null ? parseFloat(lockM) : null
  if (instRate == null) lockup = null // 수요예측 전 0.00%는 미정
  const amtM = (t.match(/공모금액\s*([\d,]+)\s*\(백만원\)/) || [])[1]
  const offerAmount = amtM ? Math.round(parseFloat(amtM.replace(/,/g, '')) / 100) : null
  return { instRate, lockup, offerAmount }
}
async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  const worker = async () => {
    while (i < items.length) {
      const idx = i++
      try {
        out[idx] = await fn(items[idx])
      } catch {
        out[idx] = null
      }
    }
  }
  await Promise.all(Array.from({ length: n }, worker))
  return out
}

export const norm = (s) => (s || '').replace(/[㈜（）()주식회사\s]/g, '').replace(/[·.]/g, '').toLowerCase()

// 38 전체 수집 → Map(normName → 레코드). 실패 시 빈 Map (graceful).
export async function collect38() {
  const map = new Map()
  // 신규상장(상장일·수익률)
  const nwMap = new Map()
  try {
    const nw = rows(tableBySummary(await fetchHtml(LISTING_URL), '신규상장종목'))
    for (const r of nw) {
      const offer = num(r.tds[4])
      const close = num(r.tds[8])
      const listingReturn = offer && close ? Math.round(((close - offer) / offer) * 1000) / 10 : null
      nwMap.set(r.name, { no: r.no, listingDate: parseYmd(r.tds[1]), offer, listingReturn })
    }
    console.log(`  [38 o=nw] ${nw.length}건`)
  } catch (e) {
    console.warn('  [38 o=nw] 실패:', e.message)
  }
  // 청약일정(예정/진행 IPO)
  const list = []
  try {
    const sched = rows(tableBySummary(await fetchHtml(SCHEDULE_URL), '공모주 청약일정'))
    for (const r of sched) {
      const { start, end } = parseSchedule(r.tds[1])
      const confirmed = num(r.tds[2])
      const hope = r.tds[3]
      const hopeHigh = hope.includes('~') ? num(hope.split('~').pop()) : num(hope)
      const competition = num((r.tds[4].match(/([\d,]+\.?\d*)\s*:/) || [])[1])
      const nwInfo = nwMap.get(r.name) || {}
      const rec = {
        no: r.no,
        name: r.name,
        subscriptionStart: start,
        subscriptionEnd: end,
        offerPrice: confirmed || hopeHigh || null,
        priceLow: hope.includes('~') ? num(hope.split('~')[0]) : null,
        priceHigh: hopeHigh,
        priceConfirmed: !!confirmed,
        competitionRate: competition,
        listingDate: nwInfo.listingDate ?? null,
        listingReturn: nwInfo.listingReturn ?? null,
        underwriter: r.tds[5] || null,
      }
      list.push(rec)
      map.set(norm(r.name), rec)
    }
    console.log(`  [38 o=k] ${sched.length}건`)
  } catch (e) {
    console.warn('  [38 o=k] 실패:', e.message)
  }
  // 청약목록에 없는 기상장 종목 (정산/도감)
  for (const [name, info] of nwMap) {
    if (map.has(norm(name)) || info.listingReturn == null || !info.offer) continue
    const rec = {
      no: info.no,
      name,
      subscriptionStart: null,
      subscriptionEnd: null,
      offerPrice: info.offer,
      priceLow: null,
      priceHigh: null,
      priceConfirmed: true,
      competitionRate: null,
      listingDate: info.listingDate,
      listingReturn: info.listingReturn,
      underwriter: null,
    }
    list.push(rec)
    map.set(norm(name), rec)
  }
  // 상세 보강 (수요지표 3종 + 공모금액)
  const details = await pool(list, 6, async (r) => (r.no ? parseDetail(await fetchHtml(DETAIL_URL(r.no))) : null))
  list.forEach((r, idx) => {
    const d = details[idx]
    r.institutionalRate = d?.instRate ?? null
    r.lockupRatio = d?.lockup ?? null
    r.offerAmount38 = d?.offerAmount ?? null
  })
  return map
}
