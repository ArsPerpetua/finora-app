# Bot Telegram Finora: panduan pasang

## 1. Buat bot
1. Di Telegram buka @BotFather, kirim `/newbot`, ikuti langkahnya.
2. Salin **token** bot (bentuknya `123456:ABC...`). Jangan dibagikan.

## 2. Environment variable di Netlify
Site configuration > Environment variables, tambahkan:

| Nama | Isi |
|---|---|
| `SUPABASE_URL` | Project URL dari Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (rahasia, hanya untuk fungsi ini) |
| `TELEGRAM_BOT_TOKEN` | token dari BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | string acak panjang buatan Anda, misalnya 32 karakter huruf dan angka |

## 3. Deploy
Folder `finora` ini di-deploy ke Netlify (lewat GitHub atau drag-and-drop). Buat folder `public` berisi `index.html` sementara
(misalnya salin prototipe) agar build berhasil. Fungsi bot akan tersedia di:
`https://NAMA-SITUS.netlify.app/.netlify/functions/telegram`

## 4. Daftarkan webhook ke Telegram
Isi `TELEGRAM_BOT_TOKEN`, `APP_URL`, dan `TELEGRAM_WEBHOOK_SECRET` di `.env` lokal (nilai yang sama dengan yang
diisi di Netlify), lalu jalankan:

```
node scripts/set-telegram-webhook.mjs
```

**Jangan** mendaftarkan webhook dengan menempel token dan secret langsung ke URL yang dibuka di browser — URL
begitu gampang tersalin tanpa sadar ke riwayat browser, log proxy, atau (pernah terjadi) ke obrolan saat minta
bantuan debug. Skrip di atas mengirim token dan secret lewat POST request, tidak pernah lewat URL, dan tidak
pernah mencetak token ke konsol.

Jawaban yang benar: `{"ok":true,"result":true,"description":"Webhook was set"}`.
Cek status kapan saja: `node scripts/set-telegram-webhook.mjs --status`.

### Putar ulang (rotate) `TELEGRAM_WEBHOOK_SECRET`
Lakukan ini kalau nilai lama pernah ikut tersalin ke tempat yang tidak seharusnya (chat, screenshot, log) —
nilai lama tidak otomatis berhenti berlaku sampai diganti di kedua sisi (Netlify **dan** Telegram):

1. `node scripts/set-telegram-webhook.mjs --new-secret` — cetak satu nilai acak baru.
2. Isi nilai itu sebagai `TELEGRAM_WEBHOOK_SECRET` di Netlify (Site configuration > Environment variables), lalu **deploy ulang**.
3. Perbarui juga `TELEGRAM_WEBHOOK_SECRET` di `.env` lokal, lalu jalankan `node scripts/set-telegram-webhook.mjs` supaya Telegram memakai secret yang baru.
4. Pastikan dengan `node scripts/set-telegram-webhook.mjs --status` — nilai secret tidak ditampilkan Telegram, tapi kirim pesan uji ke bot untuk memastikan masih berfungsi.

## 5. Uji end-to-end
1. Buat akun di Supabase (Authentication > Users > Add user) dan jalankan `select activate_code('KODE')` dari akun itu,
   atau untuk uji cepat ubah `active_until` langsung di tabel `profiles` lewat SQL Editor.
2. Isi kode tautan: jalankan `update profiles set link_code='TEST01', link_code_expires=now()+interval '15 minutes' where id='ID_USER';`
3. Kirim `/start TEST01` ke bot. Harus dibalas "Akun berhasil ditautkan".
4. Kirim `makan siang 25000`. Cek tabel `transactions`: harus ada satu baris dengan `source = 'telegram'`.

## 6. Uji parser lokal
```
npm install
npm test
```
