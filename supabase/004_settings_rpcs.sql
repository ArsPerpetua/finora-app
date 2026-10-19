-- Migrasi 004: fungsi RPC untuk layar Pengaturan (A11) — putus tautan Telegram dan
-- hapus akun sendiri. Keduanya butuh security definer karena kolom yang disentuh
-- (profiles.telegram_chat_id, baris auth.users) tidak bisa diubah langsung oleh klien
-- lewat RLS/grant kolom biasa. Jalankan di Supabase > SQL Editor setelah 003.

-- Putus tautan Telegram milik sendiri (profiles.telegram_chat_id hanya bisa diubah lewat
-- fungsi ini — grant kolom klien cuma mengizinkan update `name`, lihat schema.sql).
create or replace function public.unlink_telegram()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;

  update public.profiles
     set telegram_chat_id = null
   where id = auth.uid();
end $$;

-- Hapus akun sendiri beserta seluruh data keuangan (profiles/user_state/transactions
-- cascade lewat FK ke auth.users). license_codes.used_by dilepas dulu (bukan cascade)
-- supaya baris kode lisensi yang pernah dipakai tidak memblokir penghapusan.
create or replace function public.delete_own_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;

  update public.license_codes set used_by = null where used_by = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.unlink_telegram()     from public, anon;
revoke execute on function public.delete_own_account()  from public, anon;

grant execute on function public.unlink_telegram()      to authenticated;
grant execute on function public.delete_own_account()   to authenticated;
