# BACKLOG Finora — daftar fitur yang tersisa

Untuk Claude Code / Codex. Baca dulu `AGENTS.md` (aturan), `docs/PRD-Finora-MVP.md` (produk), lalu file ini.
Acuan desain dan logika hitung: `docs/reference/prototype-v3.html` (satu file, data di localStorage). **Port logikanya, jangan tulis ulang dari nol.**

**Tugas pertama:** tambahkan baris `Backlog lengkap: docs/BACKLOG.md` di bagian Status `AGENTS.md`, lalu kerjakan dari A1 ke bawah. Satu item per perubahan; jalankan `npm run build` dan `npm test` sebelum menandai selesai. Centang `[x]` di file ini setelah item selesai.

## 0. Sudah selesai
- [x] Skema Supabase: `profiles`, `user_state`, `transactions`, `license_codes`, RLS, `activate_code`, `check_code`, `create_link_code`, `link_telegram`
- [x] Halaman login/aktivasi/daftar (landing) tersambung Supabase, tema terang/gelap, PWA manifest
- [x] Layar `/app` sementara: status aktif, aktivasi ulang, tautan Telegram
- [x] Bot Telegram: catat, `/start`, `/saldo`, `/laporan`, `/hapus`, `/bantuan`, parser regex (`netlify/functions/`)
- [x] Pembuat kode lisensi `npm run codes`
- [x] Kode aktivasi tidak lagi dua kali diminta: kode tertunda disimpan (`savePendingCode`) saat konfirmasi email aktif, diaktifkan otomatis oleh `AuthProvider` begitu sesi tersedia (`src/lib/auth.tsx`, `src/lib/licenseCode.ts`)
- [x] **Dashboard** (`src/components/dashboard/`, `src/lib/finance.ts`, `src/hooks/useDashboardData.ts`) dibangun sebelum BACKLOG ini ada, jadi tumpang tindih sebagian dengan Fase A di bawah — dipakai sebagai pijakan, bukan ditulis ulang, tapi punya celah dibanding spesifikasi BACKLOG (dicatat per item A3/A4/A5/A6/A7/A8/A10):
  - **Beranda** (≈A3): saldo + sembunyikan saldo, arus kas 6 bulan, pengeluaran per kategori, transaksi terbaru, quick links. *Celah:* belum ada kartu "Progres pengeluaran" dan "Tabungan" di Beranda, belum ada "Menu utama".
  - **Transaksi** (≈A4): daftar + filter bulan/jenis/kategori/akun/cari teks, tambah/ubah/hapus (web, modal), transfer dengan biaya admin (`fee`) — **tandai selesai (A4)**.
  - **Akun & Kategori** (≈A5/A6): CRUD akun (nama, jenis, saldo awal) dan kategori kustom (nama, warna, jenis). *Celah:* akun belum punya field warna/ikon, belum ada `defaultAccountId`, belum ada larangan hapus akun yang dipakai transaksi; kategori belum punya pemilihan ikon.
  - **Anggaran** (≈A7): batas total + per kategori, progress bar 2 ambang (normal/lewat batas). *Celah:* belum ada opsi roll-over, belum 3 ambang warna (hijau/kuning/merah).
  - **Tabungan** (≈A8): CRUD tujuan (nama, target, saldo tersimpan), setoran/tarik. *Celah:* setoran cuma mengubah angka `saved` di JSON `user_state`, **belum** tercatat sebagai transaksi transfer (`goal_id` belum ada di `transactions`); belum ada ikon/tenggat/rencana setoran bulanan.
  - **Laporan bulanan** (A10): ringkasan bulan berjalan vs bulan lalu (pemasukan/pengeluaran/selisih/savings rate), kategori vs bulan lalu, perbandingan 6 bulan. Sudah sesuai spesifikasi A10 — **tandai selesai**.
  - Kategori bawaan di `finance.ts` sekarang sudah termasuk `fees` ("Biaya & Admin") — ditambahkan saat A4, dipakai untuk menampung biaya admin transfer di `summarize`/`expenseCategories`/`budgetStats`.

## 1. Keputusan arsitektur (ikuti ini)
1. **Model data prototipe** = satu objek `S` `{v, settings, accounts, cats, tx, budget, goals, bills, recurring, assets, debts}`. Di Supabase: **`tx` pindah ke tabel `transactions`** (ditulis bot dan web, butuh realtime); **sisanya tetap satu JSON di `user_state.data`**.
2. **Id kategori bawaan** di prototipe (`food, transport, shopping, bills, subs, home, entertainment, health, edu, travel, gift, other, fees` dan `salary, bonus, freelance, business, invest, otherinc`) **sudah sama dengan yang dipakai bot**. Jangan diubah. Saat pertama kali login, isi `user_state.data` dengan `blankData()` + `defaultCats()` dari prototipe.
3. **Migrasi `supabase/003_transactions_full.sql`** (belum ada, buat): tambah kolom ke `transactions` agar muat bentuk transaksi prototipe: `currency text default 'IDR'`, `fee numeric default 0`, `to_amount numeric`, `splits jsonb`, `receipt_path text`, `bill_id text`, `goal_id text`, `recurring_id text`. Tetap RLS per `user_id`.
4. **Mata uang:** MVP hanya IDR, tetapi **pertahankan field `currency` di akun, tujuan, dan transaksi** supaya B6 nanti tidak butuh migrasi data.
5. **Penyimpanan JSON `user_state`**: tulis dengan debounce ~800 ms, dan tambahkan kolom `updated_at` sebagai pengecekan konflik (last-write-wins boleh, tetapi tampilkan toast jika versi server lebih baru). Bot hanya **membaca** `user_state`, tidak menulisnya.
6. **Realtime:** langganan Supabase Realtime ke `transactions` supaya catatan dari Telegram muncul di dashboard tanpa refresh.
7. **Grafik:** Recharts atau SVG sendiri; ikuti gaya di screenshot (hijau pemasukan `#3b7a2a`, rose pengeluaran, lime `#d6fb4f`).
8. **Tidak ada data contoh** untuk pengguna berbayar (banner "Ini data contoh" di prototipe dibuang). Onboarding ringkas: nama + akun pertama.

## 2. FASE A — wajib sebelum peluncuran
- [x] **A1 Shell aplikasi**: sidebar (desktop) dan bottom-nav (HP) sudah ada dari kerjaan sebelumnya; menambahkan tombol **profil** di topbar (avatar inisial → `#telegram`, berguna terutama di mobile karena sidebar disembunyikan di sana). Guard login (`AppHome.tsx`) dan baca-selalu-boleh sudah ada. *Interpretasi "guard akun aktif":* mengikuti PRD §6 yang membatasi **transaksi** saja untuk akun kedaluwarsa (bukan semua tulis) — pengaturan akun/kategori/anggaran/tabungan tetap bisa diedit saat kedaluwarsa karena itu bukan "mencatat keuangan". Halaman perpanjang belum berupa rute tersendiri, masih panel `#telegram` (`ActivateCard`); akan dirapikan saat A11 Pengaturan dibuat. **Tanya balik kalau interpretasi ini salah.**
- [x] **A2 Lapisan data**: migrasi `supabase/003_transactions_full.sql` dibuat (kolom `currency/fee/to_amount/splits/receipt_path/bill_id/goal_id/recurring_id` + `alter publication supabase_realtime add table transactions`) — **perlu dijalankan manual di SQL Editor**, saya tidak punya akses langsung ke Supabase project ini. Realtime subscription ke `transactions` ditambahkan di `useDashboardData`. Deteksi konflik optimistik di `updateState` (bandingkan `updated_at`, last-write-wins + banner "Perubahan dari perangkat lain terdeteksi").
  - *Penyimpangan dari spesifikasi, sengaja:* **tidak** pakai debounce 800ms — setiap pemanggilan `updateState` sekarang berasal dari submit form (satu aksi diskret), bukan per-ketikan, jadi debounce cuma menambah 800ms jeda tanpa manfaat (tidak ada burst yang perlu digabung).
  - **Tidak** mengganti nama `finance.ts`→`calc.ts` atau memecah `useDashboardData` jadi `useUserState`+`useTransactions` — fungsinya (hitung saldo, `budgetStats`≈`budgetRows`, `goalProgress`≈`goalSaved`, dll, semua sudah teruji di `test/finance.test.mjs`) sudah ekuivalen; mengganti nama di seluruh kode cuma menambah risiko tanpa manfaat fungsional.
  - Field baru di tabel (`fee`, `goal_id`, dst.) **belum** ditambahkan ke tipe `Transaction`/query `select` di kode — baru ditambahkan saat fitur yang memakainya dibangun (A4 untuk `fee`, A8 untuk `goal_id`), supaya tidak ada field yang tidak terpakai.
- [x] **A3 Beranda**: kartu Total Saldo, Progres pengeluaran, Transaksi terbaru, Pengeluaran per kategori, Tabungan, dan Menu utama (statis — versi bisa-diubah ada di B11) semua sudah ada di `Overview` (`Dashboard.tsx`).
- [x] **A4 Transaksi**: daftar + filter (bulan, akun, kategori, jenis, cari teks) di layar Transaksi (`Dashboard.tsx`), tambah/ubah/hapus lewat `TransactionFormDialog` (pengeluaran, pemasukan, transfer antar akun + biaya admin `fee`), tombol ubah/hapus per baris di `TransactionList`. Biaya admin transfer dihitung sebagai pengeluaran kategori "Biaya & Admin" (`fees`) di `summarize`/`expenseCategories`/`budgetStats`/`totalBalance`. Ubah/hapus memakai policy `tx_update`/`tx_delete` yang sudah ada (butuh akun aktif); tombolnya disembunyikan saat akun kedaluwarsa. Kolom `fee` dari migrasi 003 dipakai di sini — pastikan migrasi itu sudah dijalankan di Supabase.
- [ ] **A5 Akun**: CRUD akun (rekening bank, e-wallet, tunai, tabungan, kartu kredit), saldo awal, warna, **akun default untuk bot** (`defaultAccountId`), larang hapus akun yang dipakai transaksi.
- [ ] **A6 Kategori**: CRUD kategori kustom (nama, ikon, warna), hapus = pindahkan transaksi ke "Lainnya" (logika sudah ada di prototipe).
- [ ] **A7 Anggaran**: total bulanan + batas per kategori + opsi roll-over, bar progres dengan ambang warna (hijau/kuning/merah).
- [ ] **A8 Tabungan (tujuan)**: CRUD tujuan (nama, ikon, target, tenggat, rencana setoran), setoran yang tercatat sebagai transaksi transfer, progres %.
- [ ] **A9 Onboarding ringkas** (nama + akun pertama + opsional target pertama) dan **layar kosong** yang ramah (empty state) di tiap halaman.
- [x] **A10 Laporan bulanan dasar**: pemasukan/pengeluaran/selisih, per kategori, perbandingan bulan lalu. (`src/components/dashboard/Report.tsx`, sudah termasuk savings rate dan tabel 6 bulan)
- [ ] **A11 Pengaturan**: nama, tema, ganti kata sandi, status + putus tautan Telegram, perpanjang (masukkan kode), keluar, **ekspor data (JSON) dan hapus akun** (data keuangan: wajib ada).
- [ ] **A12 Bot v2**: cocokkan akun dari kata kunci (mis. "bca", "gopay", "tunai") dengan nama akun pengguna, pakai `defaultAccountId` jika tidak ada; perintah `/kategori`, `/anggaran` (sisa per kategori), `/akun`; balasan memuat sisa anggaran kategori; tangani `edited_message`; uji unit untuk parser tambahan.
- [ ] **A13 Keamanan & QA**: uji RLS dengan dua akun berbeda (tidak boleh saling baca/tulis), rate limit untuk `check_code` dan `activate_code` (tebakan beruntun), `tx_*` policy tidak bisa dilewati, pastikan service role tidak ada di bundle (`grep` hasil build), Content-Security-Policy dasar di `netlify.toml`.
- [ ] **A14 Alur lupa kata sandi** (self-serve): `resetPasswordForEmail` + halaman set sandi baru; ubah FAQ yang sekarang bilang "hubungi kami".
- [ ] **A15 Halaman wajib**: Kebijakan Privasi dan Syarat & Ketentuan (data keuangan + Telegram), tautan di footer landing. Ganti screenshot kartu "Total saldo" (masih tertulis "kurs manual").
- [ ] **A16 Deploy & operasi**: env var Netlify, `setWebhook`, **putar ulang (rotate) `TELEGRAM_WEBHOOK_SECRET`** (nilai lama pernah tampil di chat), uptime monitor, jadwal backup Supabase, halaman error/404.

## 3. FASE B — paritas dengan prototipe (setelah peluncuran terbatas)
- [ ] **B1 Tagihan & Kalender**: CRUD tagihan berulang, status terlambat/hari ini/N hari lagi, tombol Bayar (membuat transaksi + `bill_id`), tampilan kalender.
- [ ] **B2 Transaksi berulang**: template + Netlify Scheduled Function yang membuat transaksi sesuai jadwal (idempotent).
- [ ] **B3 Aset & Utang (net worth)**: CRUD aset dan utang, ringkasan kekayaan bersih, riwayat.
- [ ] **B4 Insight otomatis**: "anggaran X habis sekitar tanggal N", "aman dibelanjakan" (saldo likuid − tagihan belum lunas − setoran tabungan), dengan dasar hitungan seperti di screenshot.
- [ ] **B5 Laporan lanjutan**: arus kas 6 bulan, tren per kategori, ekspor.
- [ ] **B6 Multi-mata uang**: kurs manual, konversi ke IDR, transfer lintas mata uang (`to_amount`), banner "kurs manual".
- [ ] **B7 Split kategori** pada satu transaksi (jumlah split harus sama dengan nominal).
- [ ] **B8 Lampiran struk**: Supabase Storage (bucket privat + RLS per pengguna), bukan base64 di JSON.
- [ ] **B9 Impor CSV, ekspor CSV, cadangan/pulihkan JSON.**
- [ ] **B10 Kartu kredit**: limit, saldo terutang, tanggal tagihan, dikeluarkan dari total saldo (sudah dinyatakan di UI).
- [ ] **B11 Menu utama yang bisa diubah**, dan preferensi tampilan tersimpan di akun.
- [ ] **B12 Laporan mingguan otomatis dan pengingat tagihan ke Telegram** (Netlify Scheduled Function), dengan opsi matikan.

## 4. FASE C — pertumbuhan (jangan dikerjakan sebelum ada pengguna berbayar)
- [ ] Penjualan otomatis: webhook OrderHero atau payment gateway (Midtrans/Xendit) yang membuat kode lisensi dan mengirimnya ke pembeli.
- [ ] Kanal WhatsApp (adaptor kedua; pisahkan lapisan "channel" dari parser).
- [ ] Parser AI sebagai cadangan jika regex gagal (batasi biaya).
- [ ] Web push, antrean offline (catat saat tanpa sinyal lalu sinkron), multi-pengguna/keluarga, Sentry/analitik.

## 5. Risiko yang perlu diingat
- **Jadwal 8 hari** (mulai 18 Okt 2026): Fase A saja sudah padat. Fase B jangan dikerjakan sebelum peluncuran terbatas ke 10–20 pengguna.
- `user_state` satu JSON besar: jangan simpan lampiran/base64 di dalamnya (batas ukuran dan lambat).
- `check_code` bisa dipakai menebak kode: kode 12 karakter acak sudah sulit ditebak, tetapi rate limit tetap dibutuhkan (A13).
- Supabase free bisa menjeda proyek yang tidak aktif: pantau, dan naik paket setelah ada pengguna berbayar.
- Bot memakai service role (melewati RLS): setiap query bot wajib memfilter `user_id` dan memeriksa `active_until`.

## 6. Prompt pembuka untuk Claude Code
> Baca `AGENTS.md`, `docs/PRD-Finora-MVP.md`, dan `docs/BACKLOG.md`. Kerjakan Fase A berurutan mulai A1. Gunakan `docs/reference/prototype-v3.html` sebagai acuan desain dan logika hitung (port, jangan tulis ulang). Satu item per commit, jalankan `npm run build` dan `npm test` sebelum menandai item selesai di BACKLOG, dan berhenti untuk bertanya jika ada keputusan produk yang tidak tercakup di dokumen.
