export function Flow() {
  return (
    <section className="sec wrap" id="cara-kerja" aria-labelledby="t-alur" style={{ paddingTop: 0 }}>
      <h2 className="h2" id="t-alur">Dari beli sampai masuk.</h2>
      <p className="sub">Kode lisensi dipakai satu kali untuk membuat akun. Setelah itu Anda cukup login.</p>
      <ol className="flow">
        <li><h3>Daftar</h3><p>Pilih paket di Order Hero dan selesaikan pembayaran.</p></li>
        <li><h3>Terima kode</h3><p>Link Finora dan kode lisensi dikirim ke email atau WhatsApp Anda.</p></li>
        <li>
          <h3>Aktivasi</h3>
          <p>Buka link, masukkan kode, lalu buat akun dengan email dan kata sandi.</p>
          <span className="burn">Kode hangus setelah akun jadi</span>
        </li>
        <li><h3>Login</h3><p>Berikutnya cukup tekan Login. Tautkan Telegram sekali, lalu mulai mencatat lewat chat.</p></li>
      </ol>
    </section>
  )
}
