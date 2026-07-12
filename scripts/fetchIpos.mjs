// 하이브리드 공모주 수집기 (공식 백본 + 38 보조)
//   DART(공모가·주식수·공모금액·일정 best-effort) + KIND(종목코드·상장일·업종) + 38(수요지표·수익률)
//   node scripts/fetchIpos.mjs   (또는 npm run data)  ·  DART 키: OpenAPIkey.txt
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { collect38, norm } from './lib/source38.mjs'
import { listedMap, recentListings } from './lib/kind.mjs'
import { corpMap, listFilings, pickRegistration, docText, parseBackbone } from './lib/dart.mjs'

const TODAY = new Date().toISOString().slice(0, 10)
const ARCHIVE_DAYS = 400 // 유니버스에서 빠진 과거 종목 보존 기간 (통계·기록용)
const MAX_ENTRIES = 300 // 번들 크기 상한

// 이전 산출물 로드 — 아카이브 머지 + id 영속화용 (없거나 깨졌으면 빈 배열)
function loadPrev() {
  try {
    const p = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'ipos.json'), 'utf-8'))
    return Array.isArray(p?.ipos) ? p.ipos : []
  } catch {
    return []
  }
}

// KIND market 표기 정규화
function marketOf(m) {
  if (!m) return null
  if (/코스닥/.test(m)) return '코스닥'
  if (/유가/.test(m)) return '코스피'
  if (/코넥스/.test(m)) return '코넥스'
  return m
}

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
  const prev = loadPrev()
  const prevByName = new Map(prev.map((p) => [norm(p.name), p]))
  const prevByTicker = new Map(prev.filter((p) => p.ticker).map((p) => [p.ticker, p]))
  console.log(`0) 이전 데이터 ${prev.length}건 로드 (id 영속화·아카이브 머지)`)

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
    // 이전 레코드: 소스가 일시적으로 값을 잃어도(38 목록 이탈, DART 실패) 이미 확보한 값은 보존.
    // 이름 매칭 실패 시 티커로 보조 매칭(상장 전후 개명 케이스의 id 단절 방지)
    const p = prevByName.get(norm(name)) ?? (k?.code ? prevByTicker.get(k.code) : null) ?? null

    // 가격: 확정가와 확정 플래그를 같은 소스에서 함께 선택 —
    // '확정' 라벨이 미확정 밴드가에 붙는 래칫(소스 일시 후퇴) 방지
    let offerPrice
    let priceConfirmed
    if (d?.b?.priceConfirmed && d?.b?.offerPrice) {
      offerPrice = d.b.offerPrice
      priceConfirmed = true
    } else if (f?.priceConfirmed && f?.offerPrice) {
      offerPrice = f.offerPrice
      priceConfirmed = true
    } else if (p?.priceConfirmed && p?.offerPrice) {
      offerPrice = p.offerPrice
      priceConfirmed = true
    } else {
      offerPrice = d?.b?.offerPrice ?? f?.offerPrice ?? (p?.offerPrice || null) ?? 0
      priceConfirmed = false
    }
    const priceLow = d?.b?.priceLow ?? f?.priceLow ?? p?.priceLow ?? null
    const priceHigh = d?.b?.priceHigh ?? f?.priceHigh ?? p?.priceHigh ?? null
    if (d?.b?.offerPrice != null) src.dartPrice++

    // 공모금액(억): 38 직접표기 우선(DART 계산값은 구주매출 누락 위험), DART는 폴백
    const offerAmount = f?.offerAmount38 ?? d?.b?.offerAmount ?? p?.offerAmount ?? null
    if (f?.offerAmount38 == null && d?.b?.offerAmount != null) src.dartAmount++

    // 일정: DART(시작·종료 모두 있을 때) 우선, 아니면 38, 아니면 이전 값
    let subscriptionStart = f?.subscriptionStart ?? p?.subscriptionStart ?? null
    let subscriptionEnd = f?.subscriptionEnd ?? p?.subscriptionEnd ?? null
    if (d?.b?.subscriptionStart && d?.b?.subscriptionEnd) {
      subscriptionStart = d.b.subscriptionStart
      subscriptionEnd = d.b.subscriptionEnd
      src.dartSched++
    }

    // 상장일: KIND(상장완료) 우선 → DART(예정) → 38 → 이전 값
    let listingDate = k?.listingDate ?? d?.b?.listingDate ?? f?.listingDate ?? p?.listingDate ?? null
    // 정합성 가드: 청약 종료 이전의 '상장일'은 모순(DART 오파싱·동명 기존상장 매칭) —
    // 청약 이후 날짜의 다른 후보로 대체, 없으면 미정(null)
    const subBound = subscriptionEnd ?? subscriptionStart
    if (listingDate && subBound && listingDate <= subBound) {
      listingDate =
        [k?.listingDate, d?.b?.listingDate, f?.listingDate, p?.listingDate].find((x) => x && x > subBound) ?? null
    }
    if (k?.listingDate) src.kindListing++
    const ticker = k?.code ?? p?.ticker ?? null
    if (ticker) src.kindTicker++

    // 수요지표 3종 + 수익률: 38 → 이전 값 (38 페이지에서 밀려나도 유실 방지)
    const competitionRate = f?.competitionRate ?? p?.competitionRate ?? null
    const institutionalRate = f?.institutionalRate ?? p?.institutionalRate ?? null
    const lockupRatio = f?.lockupRatio ?? p?.lockupRatio ?? null
    const listingReturn = f?.listingReturn ?? p?.listingReturn ?? null
    if (institutionalRate != null) src.demand38++
    if (listingReturn != null) src.return38++

    const ipo = {
      // id 영속화: 한번 부여된 id는 유지 (상장 시 n→k 전환으로 게임 기록이 끊기지 않게)
      id: p?.id ?? (ticker ? `k${ticker}` : f?.no ? `n${f.no}` : `x${norm(name).slice(0, 10)}`),
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
      underwriter: f?.underwriter ?? p?.underwriter ?? null,
      ticker,
      market: marketOf(k?.market) ?? p?.market ?? null,
      demandForecastDate: d?.b?.demandForecastDate ?? p?.demandForecastDate ?? null,
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

  // 아카이브 머지: 이번 유니버스에서 빠진 종목 보존 규칙 —
  //  ① 상장 완료(과거 listingDate, 400일 이내): KIND 확인(ticker) 시에만 (DART '예정일'로 철회 종목이 상장 완료로 박제되는 것 방지)
  //  ② 상장 대기(미래 listingDate) 또는 최근 7일 내 청약 일정 보유: 소스 일시 실패 시 예정 종목 통째 소멸 방지 (철회 종목은 7일 후 자연 정리)
  const seenNames = new Set(ipos.map((i) => norm(i.name)))
  const seenIds = new Set(ipos.map((i) => i.id))
  const cutoff = new Date(Date.now() - ARCHIVE_DAYS * 86400000).toISOString().slice(0, 10)
  const staleCutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const keepArchived = (pi) => {
    if (pi.listingDate && pi.listingDate <= TODAY) return pi.listingDate >= cutoff && !!pi.ticker
    if (pi.listingDate && pi.listingDate > TODAY) return true
    const sub = pi.subscriptionEnd ?? pi.subscriptionStart
    return !!sub && sub >= staleCutoff
  }
  const archived = prev
    .filter((pi) => !seenNames.has(norm(pi.name)) && !seenIds.has(pi.id))
    .filter(keepArchived)
    .sort((a, b) => (b.listingDate ?? '9999').localeCompare(a.listingDate ?? '9999'))
    .slice(0, Math.max(0, MAX_ENTRIES - ipos.length))
  if (archived.length) console.log(`   아카이브 보존 ${archived.length}건 (유니버스 밖 종목)`)
  ipos.push(...archived)

  // 내용이 이전과 동일하면 파일을 건드리지 않음 — cron의 '변경분만 커밋' 가드가 실제로 동작하도록
  const pubPath = join(process.cwd(), 'public', 'ipos.json')
  if (JSON.stringify(ipos) === JSON.stringify(prev) && existsSync(pubPath)) {
    console.log(`\n✓ 데이터 변경 없음 (${ipos.length}건) — 파일 유지`)
    return
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
