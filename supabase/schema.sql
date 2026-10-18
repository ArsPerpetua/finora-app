-- Finora MVP: skema Supabase (PostgreSQL)
-- Jalankan seluruh file ini di Supabase > SQL Editor.

-- =========================================================
-- 1. TABEL
-- =========================================================
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text not null default '',
  telegram_chat_id  bigint unique,
  link_code         text unique,
  link_code_expires timestamptz,
  active_until      timestamptz,            -- null = belum pernah aktivasi
  created_at        timestamptz not null default now()
);

-- Akun, kategori, anggaran, dan tujuan disimpan sebagai satu JSON per pengguna
create table public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null check (type in ('income','expense','transfer')),
  amount        numeric(18,2) not null check (amount > 0),
  account_id    text,                       -- id akun di user_state.data
  to_account_id text,
  cat_id        text,
  title         text not null default '',
  note          text not null default '',
  tx_date       date not null default ((now() at time zone 'Asia/Makassar')::date),
  source        text not null default 'web' check (source in ('web','telegram')),
  created_at    timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, tx_date desc);

create table public.license_codes (
  code       text primary key,
  plan_days  int  not null check (plan_days > 0),
  used       boolean not null default false,
  used_by    uuid references auth.users(id),
  used_at    timestamptz,
  expires_at timestamptz,                   -- batas aktivasi kode (opsional)
  created_at timestamptz not null default now()
);

-- =========================================================
-- 2. FUNGSI
-- =========================================================

-- Apakah pengguna yang sedang login masih aktif
create or replace function public.is_active()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select active_until > now() from public.profiles where id = auth.uid()), false)
$$;

-- Buat profil dan state kosong saat pengguna mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  insert into public.user_state (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Aktivasi kode sekali pakai (atomik) lalu tambah masa aktif
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

-- Kode tautan Telegram (6 karakter, berlaku 15 menit)
create or replace function public.create_link_code()
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Harus login';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  update public.profiles
     set link_code = v_code,
         link_code_expires = now() + interval '15 minutes'
   where id = auth.uid();

  return v_code;
end $$;

-- Dipanggil bot (service role) saat pengguna mengirim /start KODE
create or replace function public.link_telegram(p_code text, p_chat_id bigint)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  update public.profiles
     set telegram_chat_id = p_chat_id,
         link_code = null,
         link_code_expires = null
   where link_code = upper(trim(p_code))
     and link_code_expires > now()
  returning id into v_user;

  if v_user is null then
    raise exception 'Kode tautan tidak valid atau kedaluwarsa';
  end if;
  return v_user;
end $$;

-- Hak eksekusi fungsi
revoke execute on function public.is_active()                   from public, anon;
revoke execute on function public.activate_code(text)           from public, anon;
revoke execute on function public.create_link_code()            from public, anon;
revoke execute on function public.link_telegram(text, bigint)   from public, anon, authenticated;

grant execute on function public.is_active()                    to authenticated;
grant execute on function public.activate_code(text)            to authenticated;
grant execute on function public.create_link_code()             to authenticated;
grant execute on function public.link_telegram(text, bigint)    to service_role;

-- =========================================================
-- 3. ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles      enable row level security;
alter table public.user_state    enable row level security;
alter table public.transactions  enable row level security;
alter table public.license_codes enable row level security;  -- tanpa policy: tertutup untuk klien

-- profiles: baca milik sendiri, hanya kolom name yang boleh diubah dari klien
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant  update (name) on public.profiles to authenticated;

-- user_state
create policy state_select on public.user_state
  for select using (user_id = auth.uid());
create policy state_insert on public.user_state
  for insert with check (user_id = auth.uid());
create policy state_update on public.user_state
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- transactions: baca selalu boleh, tulis hanya jika akun aktif
create policy tx_select on public.transactions
  for select using (user_id = auth.uid());
create policy tx_insert on public.transactions
  for insert with check (user_id = auth.uid() and public.is_active());
create policy tx_update on public.transactions
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_active());
create policy tx_delete on public.transactions
  for delete using (user_id = auth.uid() and public.is_active());

-- =========================================================
-- 4. CONTOH KODE LISENSI (ganti dengan hasil generate.js)
-- =========================================================
-- insert into public.license_codes (code, plan_days) values
--   ('FIN-7K2P-9XQM', 30),
--   ('FIN-4H8D-2WTR', 365);

-- Catatan untuk bot (Netlify Function, memakai service role key):
-- 1. /start KODE  -> rpc('link_telegram', { p_code, p_chat_id })
-- 2. Setiap pesan -> cari profiles.telegram_chat_id = chat id,
--                    tolak jika active_until null atau sudah lewat,
--                    lalu insert ke transactions dengan source = 'telegram'.
-- Service role melewati RLS, jadi pengecekan active_until WAJIB dilakukan di kode bot.
