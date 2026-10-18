# PRD Finora MVP (versi 8 hari)

## 1. Ringkasan
Finora adalah pencatat keuangan yang dipakai lewat chat Telegram. Pengguna mengetik "makan siang 25000", transaksi tercatat otomatis, dan hasilnya bisa dilihat di dashboard web (PWA). Dijual sebagai langganan berbasis kode aktivasi lewat OrderHero.

## 2. Pengguna dan masalah
- **Pengguna awal:** mahasiswa, freelancer, dan pekerja kantoran muda yang sudah memakai Telegram.
- **Masalah:** orang berhenti mencatat keuangan karena malas membuka aplikasi. Mencatat lewat chat hanya 5 detik.

## 3. Alur utama (satu-satunya yang wajib jadi)
1. Pembeli bayar di OrderHero, menerima link aplikasi dan kode aktivasi.
2. Daftar dengan email dan password, lalu memasukkan kode aktivasi.
3. Menautkan Telegram: di dashboard ambil kode tautan, kirim `/start KODE` ke bot.
4. Mencatat transaksi lewat Telegram.
5. Melihat saldo, transaksi, anggaran, dan laporan di dashboard.

## 4. Lingkup MVP
**Masuk:** login email+password, akun/dompet, transaksi, kategori, anggaran bulanan sederhana, tabungan, beranda, laporan bulanan dasar, bot Telegram, aktivasi kode, PWA.

**Ditunda:** multi-mata uang dan kurs, split kategori, lampiran struk, aset/utang/net worth, kalender tagihan, transaksi berulang, insight otomatis, impor/ekspor CSV, onboarding 7 langkah, laporan mingguan otomatis, parser AI, WhatsApp.

## 5. Perintah bot
| Perintah | Fungsi |
|---|---|
| `/start KODE` | Menautkan akun Telegram ke akun Finora |
| `makan siang 25000` | Pengeluaran (kategori ditebak dari kata kunci, default "Lainnya") |
| `gaji 5jt`, `+100rb` | Pemasukan |
| `/saldo` | Total saldo |
| `/laporan` | Ringkasan bulan berjalan |
| `/hapus` | Membatalkan transaksi terakhir dari Telegram |

Format angka: `25000`, `25.000`, `25rb`, `25k`, `1,5jt`.

## 6. Model akses dan harga
- Satu kode aktivasi memberi N hari akses (30 atau 365), sekali pakai, tersimpan di tabel `license_codes`.
- Akun tanpa masa aktif tidak bisa menambah transaksi (diblokir di database lewat RLS dan di bot).
- Kode ditambahkan ke masa aktif yang masih berjalan, jadi perpanjangan tidak menghanguskan sisa hari.
- Harga awal: tentukan setelah menghitung biaya per pengguna (Telegram gratis, Supabase dan Netlify free tier).

## 7. Keamanan
- RLS aktif di semua tabel, data tiap pengguna terpisah.
- Token bot dan service role key hanya di environment variable Netlify, tidak pernah di kode klien.
- Webhook Telegram diverifikasi dengan secret header.
- `active_until` dan `telegram_chat_id` tidak bisa diubah dari klien.
- Aktivasi kode lewat fungsi atomik, kode tidak bisa dipakai dua kali.

## 8. Metrik sukses (14 hari setelah peluncuran)
- 20 pengguna mendaftar, minimal 10 mencatat 3 transaksi atau lebih.
- Minimal 5 pembelian berbayar.
- Median waktu dari bayar sampai transaksi pertama di bawah 10 menit.

## 9. Risiko
- Menyambungkan prototipe satu file ke Supabase memakan waktu lebih dari perkiraan, jadi kurangi layar yang disambung.
- Parser regex salah menebak kategori, jadi sediakan `/hapus` dan koreksi di dashboard.
- Percobaan tebak kode aktivasi: pertimbangkan pembatasan percobaan setelah MVP.
- Free tier Supabase bisa menjeda proyek yang tidak aktif, jadi buat cadangan sendiri setelah ada pengguna berbayar.

## 10. Jadwal 8 hari
1. PRD, Supabase (tabel, RLS, login)
2. Bot Telegram: webhook, parser, `/start`
3. Perintah `/saldo`, `/laporan`, `/hapus`, pesan error
4. Sambungkan prototipe ke Supabase (login, beranda, transaksi)
5. Aktivasi kode, produk di OrderHero, PWA manifest
6. Landing page, uji dengan 5 orang
7. Perbaikan bug, cek keamanan
8. Peluncuran terbatas 10-20 pengguna
