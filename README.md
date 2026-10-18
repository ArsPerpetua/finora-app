# Finora

Pencatat keuangan via Telegram + dashboard PWA. Lihat `AGENTS.md` untuk panduan pengembangan dan `docs/PRD-Finora-MVP.md` untuk lingkup.

## Mulai lokal (VS Code)

Gunakan Node.js **22.12.0 atau lebih baru**. Jalankan perintah dari folder proyek.
`npm ci` memasang versi dependensi sesuai `package-lock.json`; `.npmrc` memastikan
paket native yang ditandai sebagai optional ikut dipasang.

```bash
npm ci
cp .env.example .env        # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev                 # http://localhost:5173
```

Jika `.env` sudah ada dan terisi, lewati perintah penyalinan tersebut.

### Jika dev/build gagal karena native binding

Pesan `Cannot find native binding` (Rolldown) atau
`Unable to resolve @typescript/typescript-win32-x64` berarti paket native untuk
komputer Anda belum terpasang. Pasang kembali dependensi optional:

```bash
npm install --include=optional
npm run dev
```

Jika masih gagal, hentikan dev server lalu jalankan `npm ci --include=optional`
untuk memasang ulang dependensi dari lockfile. Jangan menyalin `node_modules`
dari komputer atau OS lain. Lihat juga [laporan npm tentang dependensi optional](https://github.com/npm/cli/issues/4828).

## Siapkan Supabase (sekali)
1. SQL Editor: jalankan `supabase/schema.sql`, lalu `supabase/002_check_code.sql`.
2. Authentication → Providers → Email: untuk uji coba matikan "Confirm email".
3. Buat kode lisensi: `npm run codes -- 20 30`, lalu tempel `scripts/out/insert-30d.sql` ke SQL Editor.

## Deploy (Netlify)
Build command `npm run build`, publish `dist` (sudah di `netlify.toml`). Isi environment variable:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CHECKOUT_URL`, `VITE_SUPPORT_URL`, `VITE_TELEGRAM_BOT_USERNAME`,
dan untuk bot: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (rahasia), `TELEGRAM_BOT_TOKEN` (rahasia), `TELEGRAM_WEBHOOK_SECRET` (rahasia), `APP_URL`.
Setelah mengubah variabel, deploy ulang. Pasang webhook bot: lihat `docs/README-BOT.md`.

Catatan: `VITE_*` ikut tertanam di hasil build, jadi **jangan** menandainya sebagai secret di Netlify (build akan gagal karena pemindai rahasia).
