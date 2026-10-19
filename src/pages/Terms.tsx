import { LegalLayout } from '../components/legal/LegalLayout'
import { config } from '../config'

export default function Terms() {
  return (
    <LegalLayout title="Syarat & Ketentuan" updated="19 Oktober 2026">
      <p>
        Syarat ini berlaku saat Anda memakai Finora — aplikasi pencatat keuangan pribadi berbasis web dan bot
        Telegram. Dengan membuat akun, Anda setuju dengan ketentuan di bawah.
      </p>

      <h2>1. Tentang layanan</h2>
      <p>
        Finora membantu Anda mencatat transaksi, mengatur anggaran, dan memantau tujuan tabungan dalam Rupiah.
        Akses diberikan lewat kode lisensi berjangka waktu (bukan langganan otomatis berulang) — satu kode
        mengaktifkan akun Anda untuk jumlah hari tertentu sesuai yang Anda beli, dan bisa diperpanjang dengan kode
        baru kapan saja.
      </p>
      <p>
        Finora adalah alat pencatatan, bukan nasihat keuangan, pajak, atau investasi. Keputusan keuangan tetap
        menjadi tanggung jawab Anda sepenuhnya.
      </p>

      <h2>2. Akun Anda</h2>
      <ul>
        <li>Anda bertanggung jawab menjaga kerahasiaan kata sandi akun Anda.</li>
        <li>Satu kode lisensi dipakai untuk satu akun; kode yang sudah dipakai tidak berlaku lagi untuk akun lain.</li>
        <li>Isi data pendaftaran (nama, email) dengan benar supaya kami bisa menghubungi Anda bila perlu.</li>
      </ul>

      <h2>3. Bot Telegram</h2>
      <p>
        Menautkan akun Telegram ke Finora bersifat opsional. Saat tertaut, pesan yang Anda kirim ke bot diproses
        untuk dicatat sebagai transaksi di akun Anda. Jangan bagikan kode tautan Telegram Anda ke orang lain —
        siapa pun yang memegangnya bisa menautkan akun mereka ke obrolan itu.
      </p>

      <h2>4. Pemakaian yang wajar</h2>
      <p>Anda setuju untuk tidak:</p>
      <ul>
        <li>Mencoba menebak atau membobol kode lisensi milik orang lain.</li>
        <li>Menyalahgunakan bot Telegram atau API Finora secara otomatis/berlebihan di luar pemakaian wajar seorang individu.</li>
        <li>Memakai Finora untuk aktivitas yang melanggar hukum yang berlaku.</li>
      </ul>
      <p>Kami berhak membatasi atau menonaktifkan akun yang melanggar ketentuan ini.</p>

      <h2>5. Data Anda</h2>
      <p>
        Data keuangan yang Anda catat adalah milik Anda. Anda bisa mengekspornya sebagai berkas JSON atau
        menghapus akun Anda beserta seluruh datanya kapan saja lewat halaman Pengaturan — lihat{' '}
        <a href="/privasi">Kebijakan Privasi</a> untuk detail bagaimana data Anda diperlakukan.
      </p>

      <h2>6. Pembelian dan pengembalian dana</h2>
      <p>
        Pembelian kode lisensi diproses lewat penyedia checkout eksternal, bukan langsung oleh Finora. Ketentuan
        pengembalian dana mengikuti yang tercantum di halaman pembelian tersebut saat Anda bertransaksi. Hubungi
        kami jika Anda butuh bantuan terkait pembelian.
      </p>

      <h2>7. Jaminan dan batasan tanggung jawab</h2>
      <p>
        Finora disediakan "sebagaimana adanya". Kami berusaha menjaga layanan tetap berjalan dan data Anda aman,
        tapi tidak menjamin layanan selalu bebas gangguan atau bebas kesalahan. Sejauh diizinkan hukum yang
        berlaku, Finora tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari pemakaian atau
        ketidaktersediaan layanan.
      </p>

      <h2>8. Perubahan ketentuan</h2>
      <p>
        Kami bisa memperbarui ketentuan ini dari waktu ke waktu. Perubahan berlaku sejak tanggal yang tercantum
        di halaman ini.
      </p>

      <h2>9. Hukum yang berlaku</h2>
      <p>Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.</p>

      <h2>10. Hubungi kami</h2>
      <p>
        Ada pertanyaan soal ketentuan ini? <a href={config.supportUrl} target="_blank" rel="noopener">Hubungi kami</a>.
      </p>

      <p style={{ marginTop: 32, fontSize: '.85rem', color: 'var(--muted)' }}>
        Catatan: dokumen ini disusun agar jelas dan akurat sesuai cara Finora bekerja saat ini, bukan sebagai
        pengganti nasihat hukum. Sebelum peluncuran komersial lebih luas, sebaiknya ditinjau oleh konsultan hukum
        yang relevan di yurisdiksi Anda.
      </p>
    </LegalLayout>
  )
}
