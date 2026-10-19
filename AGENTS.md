# AGENTS.md — Finora

Panduan untuk Codex dan kontributor. Baca ini sebelum mengubah kode.

## Produk
Finora adalah pencatat keuangan pribadi dalam rupiah. Pengguna mencatat lewat chat Telegram ("makan siang 25000") dan melihat saldo, anggaran, tabungan, tagihan, dan laporan di dashboard web (PWA). Dijual lewat OrderHero dengan **kode lisensi sekali pakai** (format `FNRA-XXXX-XXXX-XXXX`) yang memberi N hari akses.

Dokumen acuan: `docs/PRD-Finora-MVP.md` (lingkup MVP), `docs/reference/prototype-v3.html` (desain dan logika hitung dashboard, data masih di localStorage), `docs/reference/landing-original.html` (desain awal halaman login).

## Stack
- Vite + React 19 + TypeScript (strict), React Router
- Supabase: Postgres, Auth (email + kata sandi), RLS — skema di `supabase/`
- Netlify: hosting statis + Functions (`netlify/functions/telegram.mjs` = webhook bot)
- PWA: `vite-plugin-pwa`
- Tailwind v4 terpasang **tanpa preflight** (`src/styles/index.css`). Halaman landing memakai `src/styles/landing.css` (CSS biasa dengan variabel). Jangan mengaktifkan preflight: akan merusak landing.

## Perintah
- `npm run dev` — jalankan lokal (butuh `.env`, lihat `.env.example`)
- `npm run build` — typecheck + build produksi
- `npm test` — uji parser pesan bot dan fungsi hitung dashboard (`src/lib/finance.ts`)
- `npm run codes -- 100 30` — buat 100 kode lisensi 30 hari (hasil di `scripts/out/`, jangan di-commit)

## Struktur
```
src/pages/          Landing (login/aktivasi), AppHome (guard sesi + aktif, merender Dashboard)
src/components/     komponen UI; landing/ = halaman login, dashboard/ = layar /app
src/lib/            supabase.ts, auth.tsx (AuthProvider), licenseCode.ts, finance.ts (model data + hitung)
src/hooks/          useDashboardData.ts (baca transaksi + user_state, updateState untuk simpan)
netlify/functions/  telegram.mjs (webhook), lib/parser.mjs (parser regex)
supabase/           schema.sql, 002_check_code.sql, 003_transactions_full.sql (jalankan berurutan di SQL Editor)
```

## Aturan
1. **Rahasia**: `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` hanya dipakai di `netlify/functions/`. Jangan pernah mengimpornya atau memakai `service_role` di `src/`. Klien hanya memakai anon key.
2. **Keamanan data**: semua tabel memakai RLS. Tabel baru wajib `enable row level security` + policy per `user_id = auth.uid()`. Tulis ke `transactions` hanya untuk akun aktif (`public.is_active()`).
3. **Fungsi bot memakai service role (melewati RLS)**, jadi pengecekan `active_until` wajib ada di kode bot.
4. **Kode lisensi** dibakar hanya lewat `activate_code()` (atomik). Jangan membuat jalur lain yang menulis ke `license_codes` dari klien.
5. **Bahasa UI**: Indonesia, sapaan "Anda". Uang: `Intl.NumberFormat('id-ID')`, awalan `Rp`, simpan sebagai angka bulat rupiah (bukan string). Zona waktu `Asia/Makassar`.
6. **Aksesibilitas**: pertahankan label, `aria-*`, fokus terlihat, dan dukungan `prefers-reduced-motion` seperti di desain.
7. Kerjakan **satu fitur/layar per perubahan**, jalankan `npm run build` dan `npm test` sebelum selesai. Jangan menambah dependensi besar tanpa alasan.
8. Jangan commit `.env`, `scripts/out/`, atau kunci apa pun.

## Status
Backlog lengkap dan progres detail: `docs/BACKLOG.md` (satu-satunya sumber kebenaran untuk status — perbarui di sana, bukan di sini). Kerjakan Fase A dari A1; bagian "0. Sudah selesai" di file itu mencatat apa yang sudah ada termasuk celahnya dibanding spesifikasi tiap item.
