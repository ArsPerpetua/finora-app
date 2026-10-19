import { LegalLayout } from '../components/legal/LegalLayout'
import { config } from '../config'

export default function Privacy() {
  return (
    <LegalLayout title="Kebijakan Privasi" updated="19 Oktober 2026">
      <p>
        Finora membantu Anda mencatat transaksi, anggaran, dan tabungan dalam Rupiah. Halaman ini menjelaskan data
        apa yang kami simpan, untuk apa, dan hak Anda atas data itu.
      </p>

      <h2>1. Data yang kami simpan</h2>
      <p>Saat Anda membuat akun dan memakai Finora, kami menyimpan:</p>
      <ul>
        <li><strong>Akun</strong>: nama panggilan, alamat email, dan kata sandi (disimpan dalam bentuk ter-hash oleh penyedia autentikasi kami, bukan teks biasa).</li>
        <li><strong>Status lisensi</strong>: kode aktivasi yang Anda pakai dan masa aktif akun.</li>
        <li><strong>Data keuangan</strong>: akun/dompet yang Anda buat (nama, jenis, saldo awal), kategori, anggaran, tujuan tabungan, dan setiap transaksi (jumlah, kategori, akun, judul, catatan, tanggal) yang Anda catat lewat dashboard web atau bot Telegram.</li>
        <li><strong>Tautan Telegram</strong>: ID obrolan (chat ID) Telegram Anda, kalau Anda memilih menautkannya. Pesan yang Anda kirim ke bot diproses untuk mengenali jumlah dan kategori transaksi; teks pesan itu sendiri tidak kami simpan terpisah, hanya hasil pengenalannya (judul transaksi boleh jadi memuat sebagian teks asli yang Anda ketik).</li>
        <li><strong>Preferensi perangkat</strong>: pilihan tema terang/gelap dan status "sudah lihat onboarding", tersimpan di perangkat Anda sendiri (localStorage), tidak kami kirim ke server.</li>
      </ul>
      <p>
        Kami tidak memakai cookie pelacakan pihak ketiga, piksel iklan, atau alat analitik pada aplikasi Finora saat
        dokumen ini ditulis.
      </p>

      <h2>2. Untuk apa data ini dipakai</h2>
      <ul>
        <li>Menjalankan fitur Finora: menghitung saldo, anggaran, progres tabungan, dan laporan Anda.</li>
        <li>Memverifikasi status aktivasi/lisensi Anda.</li>
        <li>Mencatat transaksi yang Anda kirim lewat bot Telegram ke akun Finora Anda.</li>
        <li>Membalas pesan atau permintaan dukungan yang Anda kirim ke kami.</li>
      </ul>
      <p>Kami tidak menjual atau menyewakan data Anda ke pihak ketiga mana pun untuk kepentingan iklan.</p>

      <h2>3. Berbagi data dengan pihak ketiga</h2>
      <p>Finora berjalan di atas beberapa layanan infrastruktur. Mereka memproses data atas nama kami, bukan untuk kepentingan mereka sendiri:</p>
      <ul>
        <li><strong>Supabase</strong> — basis data dan autentikasi tempat seluruh data di atas disimpan.</li>
        <li><strong>Netlify</strong> — hosting aplikasi web dan fungsi server yang menjalankan bot Telegram.</li>
        <li><strong>Telegram</strong> — kalau Anda menautkan bot, pesan Anda melewati infrastruktur Telegram sesuai kebijakan privasi mereka sendiri sebelum sampai ke bot kami.</li>
      </ul>
      <p>
        Proses pembelian/aktivasi lisensi ditangani penyedia checkout eksternal (tautan "Daftar" di situs ini);
        Finora tidak pernah menerima atau menyimpan data kartu pembayaran Anda.
      </p>

      <h2>4. Keamanan</h2>
      <p>
        Setiap baris data keuangan dibatasi lewat kebijakan Row Level Security di database — secara teknis, akun
        Anda hanya bisa membaca dan menulis datanya sendiri, bukan milik pengguna lain. Lalu lintas ke aplikasi
        memakai HTTPS, dan kami membatasi jumlah percobaan pada langkah aktivasi kode untuk mencegah penebakan
        otomatis.
      </p>

      <h2>5. Hak Anda atas data</h2>
      <ul>
        <li><strong>Lihat dan ubah</strong>: nama, kata sandi, akun, kategori, anggaran, dan tujuan tabungan bisa diubah kapan saja di dashboard.</li>
        <li><strong>Ekspor</strong>: unduh seluruh data keuangan Anda sebagai satu berkas JSON lewat Pengaturan.</li>
        <li><strong>Putus tautan Telegram</strong>: kapan saja lewat Pengaturan, tanpa menghapus riwayat transaksi yang sudah tercatat.</li>
        <li><strong>Hapus akun</strong>: lewat Pengaturan, menghapus profil dan seluruh data keuangan Anda secara permanen. Tindakan ini tidak dapat dibatalkan.</li>
      </ul>

      <h2>6. Penyimpanan data</h2>
      <p>
        Data Anda kami simpan selama akun Anda ada. Saat Anda menghapus akun, data keuangan, profil, dan tautan
        Telegram dihapus permanen. Catatan bahwa sebuah kode lisensi pernah dipakai tetap kami simpan untuk
        keperluan audit, tapi tautannya ke identitas Anda dilepas.
      </p>

      <h2>7. Anak-anak</h2>
      <p>Finora ditujukan untuk pengguna dewasa yang mengelola keuangan pribadinya sendiri, bukan untuk anak-anak.</p>

      <h2>8. Perubahan kebijakan ini</h2>
      <p>Kalau kebijakan ini berubah, kami perbarui tanggal di atas dan tampilkan di halaman ini.</p>

      <h2>9. Hubungi kami</h2>
      <p>
        Ada pertanyaan soal privasi atau ingin mengajukan permintaan terkait data Anda?{' '}
        <a href={config.supportUrl} target="_blank" rel="noopener">Hubungi kami</a>.
      </p>

      <p style={{ marginTop: 32, fontSize: '.85rem', color: 'var(--muted)' }}>
        Catatan: dokumen ini disusun agar jelas dan akurat sesuai cara Finora bekerja saat ini, bukan sebagai
        pengganti nasihat hukum. Sebelum peluncuran komersial lebih luas, sebaiknya ditinjau oleh konsultan
        hukum/kepatuhan data yang relevan di yurisdiksi Anda.
      </p>
    </LegalLayout>
  )
}
