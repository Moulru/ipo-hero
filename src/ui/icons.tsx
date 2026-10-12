// 아이콘: 범용은 Lucide(ISC 라이선스), 하단 탭·브랜드 마크는 자체 제작 SVG
export {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Share2,
  Star,
  Settings,
  RefreshCw,
  X,
  Check,
  Info,
  Plus,
  Minus,
  Lock,
  ExternalLink,
  Mail,
  CircleHelp,
  Trash2,
  Clock,
  Sparkles,
  CircleX,
  History,
  FileText,
  Sun,
  Moon,
  RotateCcw,
  WifiOff,
  Bell,
} from 'lucide-react'

type P = { active?: boolean; size?: number }

// 하단 탭 아이콘 — 비활성: 라인, 활성: 채움 (같은 실루엣 유지)
export function TabHome({ active, size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M3.5 10.2 12 3.6l8.5 6.6V19a1.9 1.9 0 0 1-1.9 1.9h-3.7v-5.6a1 1 0 0 0-1-1h-3.8a1 1 0 0 0-1 1v5.6H5.4A1.9 1.9 0 0 1 3.5 19z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.9}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TabCalendar({ active, size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="3"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.9}
      />
      <path d="M8 3.2v3.4M16 3.2v3.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3.8 9.6h16.4" stroke={active ? 'var(--surface)' : 'currentColor'} strokeWidth="1.6" />
      <circle cx="8.3" cy="13.7" r="1.25" fill={active ? 'var(--surface)' : 'currentColor'} />
      <circle cx="12" cy="13.7" r="1.25" fill={active ? 'var(--surface)' : 'currentColor'} />
      <circle cx="15.7" cy="13.7" r="1.25" fill={active ? 'var(--surface)' : 'currentColor'} />
      <circle cx="8.3" cy="17.1" r="1.25" fill={active ? 'var(--surface)' : 'currentColor'} />
      <circle cx="12" cy="17.1" r="1.25" fill={active ? 'var(--surface)' : 'currentColor'} />
    </svg>
  )
}

export function TabLounge({ active, size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect
        x="3.6"
        y="9"
        width="16.8"
        height="11.6"
        rx="2.4"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.9}
      />
      <rect
        x="2.6"
        y="6.4"
        width="18.8"
        height="4.2"
        rx="1.6"
        fill={active ? 'currentColor' : 'var(--surface)'}
        stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.9}
      />
      <path d="M12 6.6v14" stroke={active ? 'var(--surface)' : 'currentColor'} strokeWidth="1.8" />
      <path
        d="M12 6.4c-1.2-2.5-4.6-3.3-5.2-1.5-.5 1.6 2.4 1.9 5.2 1.5zm0 0c1.2-2.5 4.6-3.3 5.2-1.5.5 1.6-2.4 1.9-5.2 1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TabMy({ active, size = 26 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8.2" r="4.2" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.4 : 1.9} />
      <path
        d="M4.2 20.2c.6-3.9 3.9-6.3 7.8-6.3s7.2 2.4 7.8 6.3"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 1.4 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 브랜드 마크 — 앱 아이콘(그라데이션 + 상승 라인)과 동일 모티프
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="bm-g" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4a5ff2" />
          <stop offset="1" stopColor="#8a5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#bm-g)" />
      <g fill="none" stroke="#fff" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16.4,40.5 26.3,30.8 35.4,35.4 46.8,20.6" />
        <polyline points="39.8,20.6 46.8,20.6 46.8,27.8" />
      </g>
    </svg>
  )
}
