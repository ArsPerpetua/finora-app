-- Migrasi 003: kolom tambahan di `transactions` untuk fitur Fase A/B di BACKLOG.md
-- (biaya admin transfer, tabungan sebagai transaksi, dan seterusnya) tanpa migrasi
-- data berulang nanti. Jalankan di Supabase > SQL Editor setelah schema.sql dan
-- 002_check_code.sql. Aman dijalankan ulang (IF NOT EXISTS).
--
-- Catatan: kolom-kolom ini belum semuanya dipakai kode sekarang — field dan query
-- di sisi aplikasi hanya ditambah saat fitur yang memakainya benar-benar dibangun
-- (mis. `fee` dipakai di A4, `goal_id` di A8), supaya tidak ada kode mati.

alter table public.transactions
  add column if not exists currency     text not null default 'IDR',
  add column if not exists fee          numeric(18,2) not null default 0 check (fee >= 0),
  add column if not exists to_amount    numeric(18,2),
  add column if not exists splits       jsonb,
  add column if not exists receipt_path text,
  add column if not exists bill_id      text,
  add column if not exists goal_id      text,
  add column if not exists recurring_id text;

-- Realtime: supaya catatan baru dari Telegram muncul di dashboard tanpa refresh (A2).
-- Aman dijalankan ulang; error "already member of publication" boleh diabaikan.
alter publication supabase_realtime add table public.transactions;
