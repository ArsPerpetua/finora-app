import { config } from '../../config'

function Support({ children }: { children: string }) {
  return <a href={config.supportUrl} target="_blank" rel="noopener">{children}</a>
}

export function Faq() {
  return (
    <section className="sec wrap" id="faq" aria-labelledby="t-faq" style={{ paddingTop: 0 }}>
      <div className="faq-grid">
        <div>
          <h2 className="h2" id="t-faq">Pertanyaan yang sering muncul</h2>
          <p className="sub">
            Tidak ketemu jawabannya?{' '}
            <a href={config.supportUrl} target="_blank" rel="noopener" style={{ fontWeight: 700 }}>Hubungi kami</a>.
          </p>
        </div>
        <div className="faq">
          <details>
            <summary>Apa yang terjadi pada kode lisensi setelah akun dibuat?</summary>
            <div className="ans">Kode itu tidak berlaku lagi dan tidak bisa dipakai orang lain. Anda masuk berikutnya dengan email dan kata sandi lewat tombol Login.</div>
          </details>
          <details>
            <summary>Saya sudah punya akun. Apakah perlu memasukkan kode lagi?</summary>
            <div className="ans">Tidak perlu, kecuali masa aktif Anda sudah habis dan Anda memperpanjang dengan kode baru. Untuk masuk biasa, tekan Login, isi email dan kata sandi, selesai.</div>
          </details>
          <details>
            <summary>Di mana data keuangan saya disimpan?</summary>
            <div className="ans">Di akun Finora Anda di server kami, terpisah dari pengguna lain. Karena itu catatan Anda bisa dibuka dari perangkat mana pun dan bisa ditambah lewat Telegram.</div>
          </details>
          <details>
            <summary>Apakah Finora bisa dipakai tanpa internet?</summary>
            <div className="ans">Aplikasinya bisa dibuka lagi saat sinyal lemah setelah Anda masuk, tetapi mencatat transaksi dan melihat data terbaru memerlukan internet.</div>
          </details>
          <details>
            <summary>Kode lisensi saya hilang atau tidak diterima.</summary>
            <div className="ans">Cek email dan WhatsApp yang Anda pakai saat membeli, termasuk folder spam. Jika tetap tidak ada, <Support>hubungi kami</Support> dengan nomor pesanan Anda.</div>
          </details>
          <details>
            <summary>Saya lupa kata sandi.</summary>
            <div className="ans">Tekan Login, lalu "Lupa kata sandi?". Masukkan email akun Anda dan kami kirim tautan untuk membuat kata sandi baru — tidak perlu menunggu balasan kami.</div>
          </details>
          <details>
            <summary>Bagaimana jika saya ingin mengembalikan pembelian?</summary>
            <div className="ans">Ketentuan pengembalian dana tercantum di halaman pembelian. Hubungi kami jika Anda butuh bantuan.</div>
          </details>
        </div>
      </div>
    </section>
  )
}
