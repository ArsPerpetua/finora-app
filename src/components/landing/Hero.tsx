import { Cu } from '../Cu'

const Tick = () => (
  <span className="tick" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </span>
)

export function Hero() {
  return (
    <section className="hero wrap" aria-labelledby="judul">
      <div>
        <h1 id="judul">Tahu ke mana uang Anda pergi.</h1>
        <p className="lede">
          Finora mencatat transaksi, anggaran, tabungan, dan tagihan Anda dalam rupiah, lalu memberi tahu sebelum uangnya habis.
        </p>
        <ul className="points">
          <li><Tick />Catat lewat chat Telegram: cukup ketik “makan siang 25000”</li>
          <li><Tick />Dashboard bisa dipasang di layar utama dan dibuka dari HP mana pun</li>
          <li><Tick />Peringatan saat anggaran satu kategori hampir habis</li>
        </ul>
        <a className="to-pass" href="#masuk">Sudah punya kode atau akun? Masuk di sini</a>
      </div>

      <div
        className="stage"
        role="img"
        aria-label="Cuplikan Finora: total saldo, uang yang aman dibelanjakan, progres anggaran, dan struk ringkasan bulan Oktober 2026."
      >
        <div className="disc" />
        <img className="piece p-saldo" src="/assets/crops/saldo.webp" alt="" width={1100} height={529} />
        <img className="piece p-aman" src="/assets/crops/aman.webp" alt="" width={725} height={540} />
        <img className="piece p-progres" src="/assets/crops/progres.webp" alt="" width={914} height={700} />
        <div className="piece receipt" aria-hidden="true">
          <div className="paper">
            <div className="head"><b>Finora</b><span>Okt 2026</span></div>
            <div className="rule" />
            <div className="row"><span>Masuk</span><Cu value={2500000} /></div>
            <div className="row neg"><span>Keluar</span><Cu value={4678900} sign="-" /></div>
            <div className="row"><span>Terpakai</span><Cu value={78} suffix="%" /></div>
            <div className="row"><span>Sisa anggaran</span><Cu value={1321100} /></div>
            <div className="rule" />
            <div className="row total"><span>Aman belanja</span><Cu value={12655111} /></div>
            <div className="barcode" />
            <div className="thanks">Terima kasih sudah mencatat</div>
          </div>
        </div>
        <div className="piece seal" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="58" fill="#121311" />
            <g className="spin">
              <path id="ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" fill="none" />
              <text fontFamily="Bricolage Grotesque, Plus Jakarta Sans, sans-serif" fontWeight={600} fontSize={11.5} fill="#d6fb4f">
                <textPath href="#ring" textLength={272} lengthAdjust="spacing">Catat • Atur • Tabung • Pantau •</textPath>
              </text>
            </g>
            <circle cx="60" cy="60" r="24" fill="#d6fb4f" />
            <text x="60" y="68" textAnchor="middle" fontFamily="Bricolage Grotesque, Plus Jakarta Sans, sans-serif" fontWeight={700} fontSize={22} fill="#121311">Rp</text>
          </svg>
        </div>
      </div>
    </section>
  )
}
