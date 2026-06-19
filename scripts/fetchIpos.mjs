// 하이브리드 공모주 수집기 (공식 백본 + 38 보조)
//   DART(공모가·주식수·공모금액·일정 best-effort) + KIND(종목코드·상장일·업종) + 38(수요지표·수익률)
//   node scripts/fetchIpos.mjs   (또는 npm run data)  ·  DART 키: OpenAPIkey.txt
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { collect38, norm } from './lib/source38.mjs'
import { listedMap, recentListings } from './lib/kind.mjs'
import { corpMap, listFilings, pickRegistration, docText, parseBackbone } from './lib/dart.mjs'

const TODAY = new Date().toISOString().slice(0, 10)

function guessSector(name) {
  if (/스팩|기업인수/.test(name)) return '스팩'
  if (/바이오|제약|팜|헬스|메디|셀|진단|선바이오/.test(name)) return '바이오'
  if (/로봇|로보/.test(name)) return '로봇'
  if (/에너지|전지|배터리|솔라|이차|2차/.test(name)) return '2차전지'
  if (/반도체|칩|소자|세미|반도/.test(name)) return '반도체'
  if (/비전|소프트|테크|데이터|클라우드|에이아이|AI/.test(name)) return 'AI/SW'
  if (/플랫폼|커머스|페이|핀테크|마케팅|애드|업/.test(name)) return '플랫폼'
  if (/푸드|식품|음료|뷰티|소비/.test(name)) return '소비재'
  return '기타'
}
function expectedPer10(c) {
  if (c == null || c <= 0) return null
  return Math.max(0.02, Math.round((10 / Math.sqrt(c)) * 100) / 100)
}
// 등급 v2 (Spearman 0.54, 단조↑) — 수요지표 핵심 + 규모 보조
function computeRarity(ipo) {
  let s = 0
  const ir = ipo.institutionalRate
  s += ir != null ? (ir >= 1300 ? 34 : ir >= 1000 ? 27 : ir >= 700 ? 18 : ir >= 400 ? 10 : ir >= 150 ? 4 : 1) : 6
  const c = ipo.competitionRate
  s += c != null ? (c >= 2000 ? 30 : c >= 1400 ? 24 : c >= 900 ? 17 : c >= 400 ? 9 : c >= 100 ? 3 : 1) : 5
  const lk = ipo.lockupRatio
  s += lk != null ? (lk >= 25 ? 16 : lk >= 18 ? 12 : lk >= 12 ? 8 : lk >= 6 ? 4 : lk >= 1 ? 1 : 0) : 4
  const a = ipo.offerAmount
  if (a != null) s += a >= 3000 ? -10 : a >= 1500 ? -4 : a >= 700 ? 0 : a >= 150 ? 5 : a >= 50 ? 3 : 1
  return s >= 66 ? 'legendary' : s >= 48 ? 'epic' : s >= 28 ? 'rare' : 'common'
}
async function pool(items, n, fn) {
  const out = new Array(items.length)
  let i = 0
  const worker = async () => {
    while (i < items.length) {
      const idx = i++
      try {
        out[idx] = await fn(items[idx], idx)
      } catch {
        out[idx] = null
      }
    }
  }
  await Promise.all(Array.from({ length: n }, worker))
  return out
}

async function main() {
  console.log('1) KIND 상장사 로딩...')
  const kind = await listedMap()
  const kindNorm = new Map([...kind.values()].map((r) => [norm(r.name), r]))
  const recent = await recentListings(150, TODAY)
  console.log(`   상장사 ${kind.size}개 / 최근150일 신규상장 ${recent.length}건`)

  console.log('2) 38 보조 수집...')
  const c38 = await collect38()
  console.log(`   38 레코드 ${c38.size}건`)

  console.log('3) DART corpCode 로딩...')
  let corps = {}
  try {
    corps = await corpMap()
  } catch (e) {
    console.warn(`   ⚠ DART corpCode 로딩 실패 — 38+KIND로만 진행: ${e?.message || e}`)
  }
  const corpsNorm = new Map(Object.entries(corps).map(([n, c]) => [norm(n), c]))
  console.log(`   기업 ${Object.keys(corps).length}개`)

  // 유니버스: 38 ∪ KIND 최근상장. "(구.…)/(전.…)" 별칭 제거 후 매칭
  const cleanName = (s) => (s || '').replace(/\s*\((?:구|전)[.\s][^)]*\)\s*/g, '').trim()
  const universe = new Map() // normName → {name, from38, kindRec}
  for (const rec of c38.values()) {
    const nm = cleanName(rec.name)
    universe.set(norm(nm), { name: nm, from38: rec, kindRec: kindNorm.get(norm(nm)) ?? null })
  }
  for (const r of recent) {
    const k = norm(r.name)
    if (!universe.has(k)) universe.set(k, { name: r.name, from38: null, kindRec: r })
  }
  console.log(`4) 유니버스 ${universe.size}개. DART 권위 보강 중...`)

  const members = [...universe.values()]
  // DART 보강은 활성 집합(예정 + 최근상장)만: 38에 있거나 최근150일 상장
  const src = { dartPrice: 0, dartAmount: 0, dartSched: 0, kindListing: 0, kindTicker: 0, demand38: 0, return38: 0 }
  const dartCache = await pool(members, 5, async (m) => {
    try {
      const corp = corps[m.name] || corpsNorm.get(norm(m.name))
      if (!corp) return null
      const filings = await listFilings(corp)
      const reg = pickRegistration(filings)
      if (!reg) return { corp }
      const b = parseBackbone(await docText(reg.rcept_no), reg.rcept_dt)
      return { corp, reg: { rcept_no: reg.rcept_no, rcept_dt: reg.rcept_dt, report_nm: reg.report_nm }, b }
    } catch {
      return null // 종목별 DART 실패는 무시(38 폴백)
    }
  })


  const ipos = members.map((m, idx) => {
    const d = dartCache[idx]
    const f = m.from38
    const k = m.kindRec
    const name = m.name
    const sector = guessSector(name)

    // 가격: DART 우선
    const offerPrice = d?.b?.offerPrice ?? f?.offerPrice ?? 0
    const priceLow = d?.b?.priceLow ?? f?.priceLow ?? null
    const priceHigh = d?.b?.priceHigh ?? f?.priceHigh ?? null
    const priceConfirmed = d?.b?.priceConfirmed || f?.priceConfirmed || false
    if (d?.b?.offerPrice != null) src.dartPrice++

    // 공모금액(억): 38 직접표기 우선(DART 계산값은 구주매출 누락 위험), DART는 폴백
    const offerAmount = f?.offerAmount38 ?? d?.b?.offerAmount ?? null
    if (f?.offerAmount38 == null && d?.b?.offerAmount != null) src.dartAmount++

    // 일정: DART(시작·종료 모두 있을 때) 우선, 아니면 38
    let subscriptionStart = f?.subscriptionStart ?? null
    let subscriptionEnd = f?.subscriptionEnd ?? null
    if (d?.b?.subscriptionStart && d?.b?.subscriptionEnd) {
      subscriptionStart = d.b.subscriptionStart
      subscriptionEnd = d.b.subscriptionEnd
      src.dartSched++
    }

    // 상장일: KIND(상장완료) 우선 → DART(예정) → 38
    const listingDate = k?.listingDate ?? d?.b?.listingDate ?? f?.listingDate ?? null
    if (k?.listingDate) src.kindListing++
    const ticker = k?.code ?? null
    if (ticker) src.kindTicker++

    // 수요지표 3종 + 수익률: 38
    const competitionRate = f?.competitionRate ?? null
    const institutionalRate = f?.institutionalRate ?? null
    const lockupRatio = f?.lockupRatio ?? null
    const listingReturn = f?.listingReturn ?? null
    if (institutionalRate != null) src.demand38++
    if (listingReturn != null) src.return38++

    const ipo = {
      id: ticker ? `k${ticker}` : f?.no ? `n${f.no}` : `x${norm(name).slice(0, 10)}`,
      name,
      sector,
      offerPrice,
      priceLow,
      priceHigh,
      priceConfirmed,
      subscriptionStart,
      subscriptionEnd,
      listingDate,
      competitionRate,
      institutionalRate,
      lockupRatio,
      offerAmount,
      listingReturn,
      expectedPer10: expectedPer10(competitionRate),
      underwriter: f?.underwriter ?? null,
      ticker,
      rarity: 'common',
      isReal: true,
    }
    ipo.rarity = sector === '스팩' ? 'common' : computeRarity(ipo)
    return ipo
  })

  if (!ipos.length) {
    console.error('수집 0건 — 종료')
    process.exit(1)
  }

  const dist = ipos.reduce((m, i) => ((m[i.rarity] = (m[i.rarity] || 0) + 1), m), {})
  const out = {
    generatedAt: new Date().toISOString(),
    count: ipos.length,
    ipos,
  }
  const json = JSON.stringify(out, null, 2)
  writeFileSync(join(process.cwd(), 'src', 'data', 'ipos.json'), json, 'utf-8')
  // 런타임 fetch용 정적 복사본 (public/ → 빌드 시 /ipos.json 으로 서빙, cron이 이 파일을 갱신)
  const pubDir = join(process.cwd(), 'public')
  if (!existsSync(pubDir)) mkdirSync(pubDir, { recursive: true })
  writeFileSync(join(pubDir, 'ipos.json'), json, 'utf-8')
  console.log(`\n✓ ${ipos.length}건 → src/data/ipos.json + public/ipos.json`)
  console.log('소스 기여:', src)
  console.log('등급 분포:', dist)
  console.log(
    '상위 등급 예시:',
    ipos.filter((i) => i.rarity === 'legendary' || i.rarity === 'epic').slice(0, 6).map((i) => `${i.name}(${i.rarity},기관 ${i.institutionalRate ?? '-'})`),
  )
}
main().catch((e) => {
  console.error('수집 실패:', e)
  process.exit(1)
})
