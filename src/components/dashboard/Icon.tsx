import type { ReactNode } from 'react'

export type IconName = 'home' | 'list' | 'wallet' | 'income' | 'expense' | 'transfer' | 'left' | 'right' | 'refresh' | 'search' | 'telegram' | 'theme' | 'logout' | 'eye' | 'eyeoff' | 'check' | 'calendar' | 'food' | 'tag' | 'chart' | 'target' | 'plus' | 'edit' | 'trash' | 'close'

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-8h6v8" /></>,
  list: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  wallet: <><path d="M20 8V6a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v10H6a3 3 0 0 1-3-3V7" /><path d="M20 11h-5a2 2 0 0 0 0 4h5" /></>,
  income: <><path d="M7 17 17 7M7 7h10v10" /></>,
  expense: <><path d="m7 7 10 10M7 17h10V7" /></>,
  transfer: <><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></>,
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m10 6 6 6-6 6" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  telegram: <><path d="m3 10 18-7-4 18-6-6-4 3v-6Z" /><path d="m7 12 10-5-6 8" /></>,
  theme: <><path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z" /></>,
  logout: <><path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="m3 3 18 18M10 5c7-1 12 7 12 7a23 23 0 0 1-4 5M6 6a24 24 0 0 0-4 6s3.5 7 10 7a13 13 0 0 0 4-1" /><path d="M10 10a3 3 0 0 0 4 4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  food: <><path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 21V3c-5 2-5 9 0 9" /></>,
  tag: <><path d="M3 3h7l11 11-7 7L3 10Z" /><circle cx="7" cy="7" r="1" /></>,
  chart: <><path d="M4 20V10M12 20V4M20 20v-7" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></>,
  close: <path d="M5 5l14 14M19 5 5 19" />,
}

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>{paths[name]}</svg>
}
