import { useCallback, useEffect } from 'react'

const KEY = 'finora.theme'

function read(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

/** Menerapkan tema tersimpan saat mulai, dan menyediakan tombol ganti tema. */
export function useTheme() {
  useEffect(() => {
    const saved = read()
    if (saved) document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return useCallback(() => {
    const cur = document.documentElement.getAttribute('data-theme')
    const isDark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    const next = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* penyimpanan diblokir: tema tetap berlaku untuk sesi ini */
    }
  }, [])
}
