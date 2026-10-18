-- Migrasi 002: pengecekan kode lisensi SEBELUM pengguna membuat akun.
-- Jalankan di Supabase > SQL Editor setelah schema.sql.
--
-- Fungsi ini hanya melaporkan status kode ('ok', 'used', 'revoked', 'not_found'),
-- tidak membakar kode. Pembakaran tetap lewat activate_code() setelah akun dibuat.
-- Kode berformat FNRA-XXXX-XXXX-XXXX (12 karakter acak), jadi tidak praktis ditebak.

create or replace function public.check_code(p_code text)
returns text
language plpgsql stable security definer set search_path = public as $$
declare
  r public.license_codes%rowtype;
begin
  select * into r from public.license_codes where code = upper(trim(p_code));
  if not found then return 'not_found'; end if;
  if r.used then return 'used'; end if;
  if r.expires_at is not null and r.expires_at <= now() then return 'revoked'; end if;
  return 'ok';
end $$;

revoke execute on function public.check_code(text) from public;
grant  execute on function public.check_code(text) to anon, authenticated;
