import { EMOJI_SET } from '../data/emojiSet'

// 3D 이모지(Fluent Emoji 3D, MIT) — 번들된 이미지가 없으면 시스템 이모지 글리프로 폴백
const BASE = import.meta.env.BASE_URL

function keyOf(e: string): string {
  return [...e]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((h) => h !== 'fe0f')
    .join('-')
}

export function Emoji({ e, size = 24, className, label }: { e: string; size?: number; className?: string; label?: string }) {
  const k = keyOf(e)
  if (!EMOJI_SET.has(k)) {
    return (
      <span
        className={'emoji-glyph' + (className ? ` ${className}` : '')}
        style={{ fontSize: size * 0.86, width: size, height: size }}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        {e}
      </span>
    )
  }
  return (
    <img
      className={'emoji' + (className ? ` ${className}` : '')}
      src={`${BASE}emoji/${k}.webp`}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      decoding="async"
    />
  )
}

// 연출(정산·카드 뽑기)에 쓰이는 이모지를 유휴 시간에 미리 디코딩 — 처음 열 때 깜빡임 방지
export function preloadEmoji(list: string[]): void {
  const run = () =>
    list.forEach((e) => {
      const k = keyOf(e)
      if (!EMOJI_SET.has(k)) return
      const img = new Image()
      img.decoding = 'async'
      img.src = `${BASE}emoji/${k}.webp`
    })
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(run)
  else setTimeout(run, 1200)
}
