import { useEffect, useRef, useState } from 'react'

const ITEMS = [
  {
    img: 'saldo', w: 1100, h: 529,
    alt: 'Kartu total saldo dengan pemasukan, pengeluaran, dan sisa anggaran.',
    title: 'Semua saldo jadi satu angka',
    text: 'Saldo dari semua akun dijumlahkan dalam rupiah. Di bawahnya ada pemasukan, pengeluaran, dan berapa anggaran yang tersisa bulan ini.',
  },
  {
    img: 'transaksi', w: 1100, h: 757,
    alt: 'Daftar transaksi terbaru dengan kategori dan akun.',
    title: 'Mencatat secepat membayar',
    text: 'Ketik “sarapan 25000” di Telegram atau catat langsung di dashboard. Kategori ditebak otomatis, dan bisa dibatalkan dengan /hapus.',
  },
  {
    img: 'insight', w: 916, h: 620,
    alt: 'Dua peringatan insight bahwa anggaran Belanja dan Transportasi bisa habis sekitar tanggal 23.',
    title: 'Diingatkan sebelum anggaran habis',
    text: 'Finora menghitung laju belanja Anda dan memberi tahu kategori mana yang diperkirakan habis sebelum akhir bulan, lengkap dengan dasar hitungannya.',
  },
  {
    img: 'tagihan', w: 724, h: 802,
    alt: 'Daftar tagihan mendatang dengan sisa hari menuju jatuh tempo.',
    title: 'Tagihan tidak lagi terlewat',
    text: 'Internet, langganan, dan cicilan berurutan sesuai jatuh tempo. Yang sudah terlambat ditandai jelas.',
  },
  {
    img: 'tabungan', w: 914, h: 635,
    alt: 'Tiga target tabungan beserta persentase pencapaiannya.',
    title: 'Menabung punya tujuan',
    text: 'Dana darurat, liburan, atau laptop baru. Lihat sudah berapa persen tercapai dan berapa lagi yang dibutuhkan.',
  },
  {
    img: 'aruskas', w: 1100, h: 538,
    alt: 'Grafik arus kas enam bulan, pemasukan dan pengeluaran.',
    title: 'Pola enam bulan terakhir',
    text: 'Pemasukan dan pengeluaran berdampingan, supaya kelihatan bulan mana yang paling boros.',
  },
] as const

export function Tour() {
  const [active, setActive] = useState(0)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(itemRefs.current.indexOf(en.target as HTMLElement))
        })
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    itemRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="sec wrap" id="fitur" aria-labelledby="t-fitur" style={{ paddingTop: 0 }}>
      <h2 className="h2" id="t-fitur">Yang Anda lihat setiap hari di Finora</h2>
      <p className="sub">Potongan layar dari aplikasinya. Gulir untuk melihat satu per satu.</p>

      <div className="tour">
        <div className="tour-stage">
          {ITEMS.map((it, i) => (
            <img
              key={it.img}
              className={'shot' + (i === active ? ' on' : '')}
              src={`/assets/crops/${it.img}.webp`}
              alt={it.alt}
              width={it.w}
              height={it.h}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        <div className="tour-list">
          {ITEMS.map((it, i) => (
            <article
              key={it.img}
              ref={(el) => { itemRefs.current[i] = el }}
              className={'tour-item' + (i === active ? ' on' : '')}
            >
              <figure className="inline-shot">
                <img src={`/assets/crops/${it.img}.webp`} alt={it.alt} width={it.w} height={it.h} loading="lazy" />
              </figure>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
