// Fluent Emoji 3D(Microsoft, MIT · npm @lobehub/fluent-emoji-3d) 중 앱에서 실제 쓰는 이모지만
// public/emoji/<codepoint>.webp 로 복사하고 src/data/emojiSet.ts(보유 목록)를 생성한다.
// 사용: npm run emoji  (src 안의 이모지를 자동 수집 — 새 이모지를 쓰면 다시 실행)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src')
const pkgAssets = join(root, 'node_modules/@lobehub/fluent-emoji-3d/assets')
const outDir = join(root, 'public/emoji')

if (!existsSync(pkgAssets)) {
  console.error('[emoji] @lobehub/fluent-emoji-3d 미설치 — npm install 후 다시 실행')
  process.exit(1)
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|json)$/.test(f) && !p.endsWith('emojiSet.ts') ? [p] : []
  })
}

// 이모지 시퀀스(ZWJ·변형선택자·피부톤 포함) 추출
const RE = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|\p{Emoji_Modifier}|‍(?:\p{Extended_Pictographic})️?)*/gu
const found = new Set()
for (const f of walk(srcDir)) {
  if (f.endsWith('ipos.json')) continue
  for (const m of readFileSync(f, 'utf8').matchAll(RE)) found.add(m[0])
}

// 파일명 규칙: 코드포인트 hex를 '-'로 연결. 키는 FE0F 제거본(컴포넌트와 동일 규칙)
const code = (s, keepFE0F) =>
  [...s]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((h) => keepFE0F || h !== 'fe0f')
    .join('-')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
const have = []
const miss = []
for (const e of found) {
  const key = code(e, false)
  const cands = [code(e, true), key, `${key}-fe0f`]
  const hit = cands.find((c) => existsSync(join(pkgAssets, `${c}.webp`)))
  if (hit) {
    copyFileSync(join(pkgAssets, `${hit}.webp`), join(outDir, `${key}.webp`))
    have.push(key)
  } else miss.push(e)
}
have.sort()
writeFileSync(
  join(root, 'src/data/emojiSet.ts'),
  `// 자동 생성(scripts/syncEmoji.mjs) — 직접 수정 금지\nexport const EMOJI_SET = new Set<string>(${JSON.stringify(have)})\n`
)
console.log(`[emoji] ${have.length}개 복사${miss.length ? ` · 없음: ${miss.join(' ')}` : ''}`)
