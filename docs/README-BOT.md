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
Ganti tiga nilai di bawah, lalu buka URL ini di browser:

```
https://api.telegram.org/botTOKEN/setWebhook?url=https://NAMA-SITUS.netlify.app/.netlify/functions/telegram&secret_token=SECRET
```

Jawaban yang benar: `{"ok":true,"result":true,"description":"Webhook was set"}`.
Cek status kapan saja lewat `https://api.telegram.org/botTOKEN/getWebhookInfo`.

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
