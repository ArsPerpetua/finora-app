-- Migrasi 005: kolom `tg_message_id` di `transactions` (A12 Bot v2) — dipakai bot untuk
-- mencocokkan `edited_message` Telegram dengan catatan yang sudah tersimpan, supaya pesan
-- yang diedit (mis. salah ketik nominal) memperbarui catatan lama, bukan membuat duplikat.
-- Jalankan di Supabase > SQL Editor setelah 004. Aman dijalankan ulang (IF NOT EXISTS).

alter table public.transactions
  add column if not exists tg_message_id bigint;

-- Dicari lewat (user_id, source, tg_message_id) saat edited_message masuk; user_id sudah
-- diindeks lewat transactions_user_date_idx, jadi cukup index tambahan untuk kolom ini saja.
create index if not exists transactions_tg_message_idx on public.transactions (tg_message_id) where tg_message_id is not null;
