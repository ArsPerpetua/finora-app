# Operasional Finora (A16)

Panduan singkat untuk menjaga Finora tetap hidup dan datanya aman setelah deploy. Untuk
pasang awal/variabel lingkungan lihat `README.md`; untuk bot Telegram lihat `README-BOT.md`.

## 1. Uptime monitor

Daftarkan dua URL ke layanan pemantau pilihan Anda (mis. [UptimeRobot](https://uptimerobot.com),
[Better Stack](https://betterstack.com/uptime), atau [Checkly](https://checklyhq.com) — semua
punya paket gratis untuk beberapa monitor):

| URL | Yang diperiksa |
|---|---|
| `https://NAMA-SITUS.netlify.app/` | Situs statis hidup (landing page termuat) |
| `https://NAMA-SITUS.netlify.app/.netlify/functions/health` | Database Supabase terjangkau dari fungsi Netlify |

Endpoint `health` (`netlify/functions/health.mjs`) balas `200 {"status":"ok","db":true,...}` kalau
sehat, `503 {"status":"degraded","db":false,...}` kalau query ke database gagal. Publik, tanpa
secret, tidak membocorkan data — aman dipanggil sesering yang dibutuhkan monitor (disarankan
tiap 5 menit).

Atur notifikasi (email/WhatsApp/Telegram pribadi Anda) di layanan monitor itu supaya Anda tahu
begitu salah satu URL di atas gagal, bukan menunggu laporan pengguna.

## 2. Cadangan data (backup)

Supabase paket gratis **tidak** punya Point-in-Time Recovery otomatis (fitur itu mulai dari
paket Pro). Sebagai pelengkap sebelum naik paket:

```
node scripts/backup-supabase.mjs
```

Mengekspor `profiles`, `user_state`, `transactions`, `license_codes` ke
`backups/<stempel-waktu>/*.json` (folder ini di `.gitignore`, **jangan pernah** ikut ter-commit
atau diunggah ke tempat tidak terenkripsi — isinya data keuangan pengguna asli).

**Jadwal yang disarankan**: jalankan manual sebelum perubahan besar (migrasi SQL, rilis fitur
besar), dan idealnya sekali per minggu selama belum ada volume pengguna besar. Kalau mau
otomatis, jadwalkan lewat Task Scheduler (Windows)/cron (mac/Linux) di mesin yang tetap
menyala, atau pindahkan skrip ini jadi Netlify Scheduled Function (lihat `netlify/functions/`,
butuh paket Netlify yang mendukung scheduled functions).

Setelah backup, pindahkan foldernya ke penyimpanan terenkripsi (mis. terenkripsi di disk atau
cloud storage privat), lalu hapus salinan lokal yang tidak perlu lagi.

Begitu ada pengguna berbayar dalam jumlah berarti, pertimbangkan naik ke Supabase paket
berbayar untuk Point-in-Time Recovery otomatis — jauh lebih andal daripada dump manual ini.

## 3. Webhook Telegram & rotasi secret

Lihat `README-BOT.md` bagian 4 — pendaftaran webhook dan prosedur rotasi
`TELEGRAM_WEBHOOK_SECRET` kalau nilainya pernah ikut tersalin ke tempat yang tidak seharusnya.

## 4. Kalau sesuatu error

- Halaman tidak ditemukan (URL salah ketik/tautan lama): halaman 404 khusus (`src/pages/NotFound.tsx`).
- Error JavaScript tak terduga di klien: `ErrorBoundary` (`src/components/ErrorBoundary.tsx`)
  menampilkan halaman "Terjadi kesalahan" dengan tombol muat ulang, menggantikan layar putih kosong.
- Error di fungsi bot Telegram: dicatat ke log Netlify Functions (Netlify dashboard > Functions > telegram > Logs).
- Rahasia server tidak sengaja ikut ke bundle klien: dicegah otomatis tiap build lewat `scripts/check-bundle-secrets.mjs` (`npm run build` gagal kalau ketemu).
