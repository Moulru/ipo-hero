// DART 오픈API 클라이언트 + 증권신고서 백본 파서 (하이브리드 공식 백본)
// 제공: corpMap(), listFilings(), docText(), parseBackbone()
import zlib from 'node:zlib'
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs'

const KEY = (process.env.DART_API_KEY || (existsSync('OpenAPIkey.txt') ? readFileSync('OpenAPIkey.txt', 'utf8') : '')).trim()
if (!KEY) throw new Error('DART 인증키 필요: OpenAPIkey.txt 또는 DART_API_KEY')

// ───────── ZIP/디코드 ─────────
export function unzip(buf) {
  const files = {}
  let eo = buf.length - 22
  while (eo >= 0 && buf.readUInt32LE(eo) !== 0x06054b50) eo--
  if (eo < 0) return files
  const cdCount = buf.readUInt16LE(eo + 10)
  let p = buf.readUInt32LE(eo + 16)
  for (let i = 0; i < cdCount; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const lho = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    const lNameLen = buf.readUInt16LE(lho + 26)
    const lExtraLen = buf.readUInt16LE(lho + 28)
    const ds = lho + 30 + lNameLen + lExtraLen
    const comp = buf.subarray(ds, ds + compSize)
    try {
      files[name] = method === 0 ? comp : zlib.inflateRawSync(comp)
    } catch {
      files[name] = Buffer.alloc(0)
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  return files
}
const getBuf = async (url) => Buffer.from(await (await fetch(url)).arrayBuffer())
export const decode = (b) => {
  const u = b.toString('utf8')
  if (!u.includes('�')) return u
  try {
    return new TextDecoder('euc-kr').decode(b)
  } catch {
    return u
  }
}

// ───────── corpCode 매핑 (디스크 캐시, 7일) ─────────
const CACHE_DIR = 'scripts/.cache'
const CORP_CACHE = `${CACHE_DIR}/dartCorp.json`
export async function corpMap() {
  if (existsSync(CORP_CACHE) && Date.now() - statSync(CORP_CACHE).mtimeMs < 7 * 86400000) {
    return JSON.parse(readFileSync(CORP_CACHE, 'utf8'))
  }
  const cc = unzip(await getBuf(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${KEY}`))
  const xml = decode(Object.values(cc)[0] || Buffer.alloc(0))
  const map = {}
  for (const m of xml.matchAll(/<corp_code>(\d+)<\/corp_code>\s*<corp_name>([^<]*)<\/corp_name>/g)) {
    const name = m[2].trim()
    if (name) map[name] = m[1]
  }
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(CORP_CACHE, JSON.stringify(map))
  return map
}

// ───────── 공시 목록 ─────────
export async function listFilings(corp, bgn = '20230101', end = '20261231') {
  const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${KEY}&corp_code=${corp}&bgn_de=${bgn}&end_de=${end}&pblntf_ty=C&page_count=100`
  const j = await (await fetch(url)).json()
  return (j.list || []).filter((x) => /증권신고서|투자설명서|증권발행실적/.test(x.report_nm))
}

// 최신 우선: 발행조건확정 > 기재정정 신고서 > 원신고서 > 투자설명서 (첨부 제외)
export function pickRegistration(filings) {
  const f = (re) => filings.find((x) => re.test(x.report_nm) && !/첨부/.test(x.report_nm))
  return (
    f(/발행조건확정.*증권신고서\(지분증권\)/) ||
    f(/기재정정.*증권신고서\(지분증권\)/) ||
    f(/증권신고서\(지분증권\)/) ||
    f(/투자설명서/) ||
    filings[0] ||
    null
  )
}

// ───────── 문서 평문 ─────────
export async function docText(rcept_no) {
  const buf = await getBuf(`https://opendart.fss.or.kr/api/document.xml?crtfc_key=${KEY}&rcept_no=${rcept_no}`)
  if (buf.subarray(0, 2).toString('hex') !== '504b') return '' // ZIP 아님
  const doc = unzip(buf)
  return Object.values(doc)
    .map(decode)
    .join('\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
}

// ───────── 백본 파서 ─────────
const num = (s) => (s == null ? null : Number(String(s).replace(/[,\s]/g, '')))

// 확정공모가: "확정공모가액을 15,000원으로 결정" 류 (정의문 boilerplate 회피 위해 '결정' 문맥 우선)
export function parseConfirmedPrice(text) {
  const m =
    text.match(/확정공모가액[을은]?\s*(?:1주당\s*)?([\d,]{3,})\s*원\s*으?로\s*(?:최종\s*)?(?:결정|확정)/) ||
    text.match(/1주당\s*확정공모가액[을은]\s*([\d,]{3,})\s*원/) ||
    text.match(/확정\s*공모가액[은는이]\s*([\d,]{3,})\s*원/)
  return m ? num(m[1]) : null
}

// 희망공모가 범위: "공모희망가액 12,400원 ~ 14,800원" (가장 그럴듯한 범위쌍)
export function parseBandPrice(text) {
  const cands = [...text.matchAll(/([\d,]{3,})\s*원\s*[~∼〜–\-]\s*([\d,]{3,})\s*원/g)]
    .map((m) => [num(m[1]), num(m[2]), m.index])
    .filter(([lo, hi]) => lo && hi && hi > lo && lo >= 500 && hi <= 2_000_000)
  if (!cands.length) return { low: null, high: null }
  // "희망" 키워드 근처 우선
  const hint = text.indexOf('희망가')
  const pick =
    (hint >= 0 && cands.slice().sort((a, b) => Math.abs(a[2] - hint) - Math.abs(b[2] - hint))[0]) || cands[0]
  return { low: pick[0], high: pick[1] }
}

// 공모 주식수: "공모주식수 1,234,567주" / "모집(매출)주식수"
export function parseShares(text) {
  const m =
    text.match(/(?:공모|모집(?:\(매출\))?)\s*주식\s*(?:총)?수[^0-9]{0,12}([\d,]{4,})\s*주/) ||
    text.match(/모집(?:\(매출\))?\s*주식의\s*수[^0-9]{0,12}([\d,]{4,})\s*주/)
  return m ? num(m[1]) : null
}

// 일정: 날짜 토큰을 키워드 버킷(수요예측/청약/상장)에 근접 매칭
const YMD_RE = /(20\d{2})\s*[.\-년]\s*(\d{1,2})\s*[.\-월]\s*(\d{1,2})\s*일?/g
const toYmd = (m) => `${m[1]}-${String(+m[2]).padStart(2, '0')}-${String(+m[3]).padStart(2, '0')}`
// filingYmd(YYYYMMDD) 기준 [-45일, +120일] 창 밖 날짜(법령 boilerplate)는 제거
export function parseSchedule(text, filingYmd) {
  const fAt = filingYmd ? Date.parse(`${filingYmd.slice(0, 4)}-${filingYmd.slice(4, 6)}-${filingYmd.slice(6, 8)}`) : null
  const inWindow = (ymd) => {
    if (!fAt) return true
    const t = Date.parse(ymd)
    return t >= fAt - 45 * 86400000 && t <= fAt + 120 * 86400000
  }
  const dates = [...text.matchAll(YMD_RE)].map((m) => ({ ymd: toYmd(m), at: m.index })).filter((d) => inWindow(d.ymd))
  const near = (kw, maxGap = 60) => {
    let best = null
    let idx = -1
    while ((idx = text.indexOf(kw, idx + 1)) >= 0) {
      for (const d of dates) {
        const gap = d.at - idx
        if (gap > -10 && gap < maxGap) {
          if (!best || d.at < best.at) best = d
          break
        }
      }
    }
    return best?.ymd ?? null
  }
  // 청약: 보통 시작~종료 2일. 청약 키워드 근처 첫/둘째 날짜
  const subStart = near('청약기간') || near('청약일') || near('청약')
  let subEnd = null
  if (subStart) {
    const startAt = dates.find((d) => d.ymd === subStart)?.at ?? -1
    const after = dates.find((d) => d.at > startAt && d.at < startAt + 40 && d.ymd !== subStart)
    subEnd = after?.ymd ?? subStart
  }
  return {
    demandForecastDate: near('수요예측'),
    subscriptionStart: subStart,
    subscriptionEnd: subEnd,
    listingDate: near('상장예정일') || near('상장일'),
  }
}

export function parseBackbone(text, filingYmd) {
  const offerPrice = parseConfirmedPrice(text)
  const band = parseBandPrice(text)
  const shares = parseShares(text)
  const sched = parseSchedule(text, filingYmd)
  const offerAmount =
    offerPrice && shares ? Math.round((offerPrice * shares) / 100_000_000) : null // 억원
  return {
    priceLow: band.low,
    priceHigh: band.high,
    offerPrice: offerPrice ?? band.high ?? null,
    priceConfirmed: offerPrice != null,
    shares,
    offerAmount, // 억원
    ...sched,
  }
}
