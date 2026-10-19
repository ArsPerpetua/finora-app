-- Migrasi 006 (A13): rate limit untuk check_code (dipanggil anon, sebelum akun ada — jadi
-- tidak ada auth.uid() untuk dijadikan kunci, dibatasi secara global) dan activate_code
-- (dipanggil pengguna yang sudah login, dibatasi per akun). Mencegah tebakan beruntun
-- kode lisensi lewat scripted brute force. Jalankan di Supabase > SQL Editor setelah 005.

create table if not exists public.rpc_rate_limit (
  bucket      text primary key,
  count       int not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rpc_rate_limit enable row level security; -- tanpa policy: tertutup untuk klien, hanya lewat fungsi di bawah

-- Naikkan hitungan `p_bucket`; reset kalau jendela waktu (`p_window`) sudah lewat.
-- Mengembalikan false kalau sudah melewati `p_max` dalam jendela berjalan (true = masih boleh).
-- Sengaja mengembalikan boolean, bukan melempar exception, supaya setiap pemanggil bebas
-- memetakannya ke kontraknya sendiri (check_code balas status teks, activate_code baru raise).
create or replace function public.check_rate_limit(p_bucket text, p_max int, p_window interval)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_row public.rpc_rate_limit%rowtype;
begin
  insert into public.rpc_rate_limit (bucket, count, window_start)
    values (p_bucket, 0, now())
    on conflict (bucket) do nothing;

  select * into v_row from public.rpc_rate_limit where bucket = p_bucket for update;

  if v_row.window_start <= now() - p_window then
    update public.rpc_rate_limit set count = 1, window_start = now() where bucket = p_bucket;
    return true;
  end if;

  update public.rpc_rate_limit set count = v_row.count + 1 where bucket = p_bucket
    returning count into v_row.count;
  return v_row.count <= p_max;
end $$;

-- check_code: dipanggil sebelum akun ada (anon), tidak ada identitas stabil untuk dijadikan
-- kunci per-pemanggil — dibatasi global supaya scripted brute force tidak bisa menebak
-- beruntun secepat mungkin. 30/menit cukup longgar untuk pemakaian normal (satu pengguna
-- paling banter mencoba beberapa kali kalau salah ketik).
create or replace function public.check_code(p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  r public.license_codes%rowtype;
begin
  if not public.check_rate_limit('check_code', 30, interval '1 minute') then
    return 'rate_limited';
  end if;

  select * into r from public.license_codes where code = upper(trim(p_code));
  if not found then return 'not_found'; end if;
  if r.used then return 'used'; end if;
  if r.expires_at is not null and r.expires_at <= now() then return 'revoked'; end if;
  return 'ok';
end $$;

-- activate_code: dipanggil pengguna yang sudah login, jadi dibatasi per akun (auth.uid()) —
-- lebih presisi daripada global karena identitasnya jelas, dan mahal untuk disalahgunakan
-- (butuh akun baru per percobaan kalau mau menghindari limit ini).
create or replace function public.activate_code(p_code text)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_days  int;
  v_until timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;

  if not public.check_rate_limit('activate_code:' || auth.uid()::text, 5, interval '10 minutes') then
    raise exception 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
  end if;

  update public.license_codes
     set used = true, used_by = auth.uid(), used_at = now()
   where code = upper(trim(p_code))
     and used = false
     and (expires_at is null or expires_at > now())
  returning plan_days into v_days;

  if v_days is null then
    raise exception 'Kode tidak valid atau sudah dipakai';
  end if;

  update public.profiles
     set active_until = greatest(coalesce(active_until, now()), now()) + make_interval(days => v_days)
   where id = auth.uid()
  returning active_until into v_until;

  return v_until;
end $$;

-- Hanya dipakai lewat fungsi security definer lain (check_code/activate_code); klien tidak
-- perlu dan tidak boleh memanggilnya langsung.
revoke execute on function public.check_rate_limit(text, int, interval) from public, anon, authenticated;
