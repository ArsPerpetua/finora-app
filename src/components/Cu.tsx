import { useEffect, useRef } from 'react'

interface Props {
  value: number
  sign?: string
  suffix?: string
}

const nf = new Intl.NumberFormat('id-ID')

/** Angka yang menghitung naik sekali saat halaman dibuka (dilewati jika pengguna memilih mengurangi gerak). */
export function Cu({ value, sign = '', suffix = '' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const finalText = sign + nf.format(value) + suffix

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t0 = performance.now() + 750
    const dur = 1400
    let raf = 0
    el.textContent = sign + '0' + suffix
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur))
      const e = 1 - Math.pow(1 - p, 3)
      el.textContent = sign + nf.format(Math.round(value * e)) + suffix
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, sign, suffix])

  return <b ref={ref}>{finalText}</b>
}
