import { useEffect, useRef, useState, type CSSProperties } from 'react'

export function Compare() {
  const [pos, setPos] = useState(50)
  const boxRef = useRef<HTMLDivElement>(null)

  // Saat terlihat, penggeser bergerak sekali dari kanan ke tengah sebagai petunjuk.
  useEffect(() => {
    const box = boxRef.current
    if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const dur = 1300
        const from = 92
        const to = 50
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur)
          setPos(from + (to - from) * (1 - Math.pow(1 - p, 3)))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.45 },
    )
    io.observe(box)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="sec wrap" aria-labelledby="t-tema" style={{ paddingTop: 0 }}>
      <h2 className="h2" id="t-tema">Terang untuk siang, gelap untuk malam.</h2>
      <p className="sub">Geser untuk membandingkan. Datanya sama, hanya suasananya yang berbeda.</p>
      <div className="compare" ref={boxRef} style={{ '--pos': pos + '%' } as CSSProperties}>
        <img className="cmp-light" src="/assets/finora-beranda.webp" alt="Beranda Finora dalam tampilan terang." width={1800} height={1021} loading="lazy" />
        <img className="cmp-dark" src="/assets/finora-gelap.webp" alt="Beranda Finora dalam tampilan gelap." width={1800} height={1035} loading="lazy" />
        <span className="chip chip-l">Terang</span>
        <span className="chip chip-r">Gelap</span>
        <div className="cmp-handle" aria-hidden="true">
          <span className="cmp-knob">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
            </svg>
          </span>
        </div>
        <input
          className="cmp-range"
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Geser untuk membandingkan tampilan terang dan gelap"
        />
      </div>
    </section>
  )
}
