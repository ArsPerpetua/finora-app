// A13: uji RLS dengan dua akun berbeda — pastikan tidak saling baca/tulis, dan policy
// tx_* (terutama "harus aktif untuk insert/update/delete") tidak bisa dilewati.
//
// PERINGATAN: skrip ini membuat DUA akun uji sungguhan di project Supabase yang ditarget
// (lewat Admin API, pakai SUPABASE_SERVICE_ROLE_KEY), mengaktifkan salah satunya lewat kode
// lisensi sekali pakai, menyisipkan satu baris transaksi, lalu MENGHAPUS semuanya di akhir
// (akun, kode lisensi, transaksi) lewat admin.auth.admin.deleteUser (cascade FK membersihkan
// profiles/user_state/transactions). Jalankan hanya kalau Anda sadar ini menulis ke project
// yang dikonfigurasi di .env — jangan jalankan sembarangan ke project produksi berisi data
// pengguna asli tanpa yakin cascade-nya aman.
//
// Jalankan: node scripts/test-rls.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

function loadEnv() {
  const map = { ...process.env };
  try {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      if (!(key in map)) map[key] = t.slice(eq + 1).trim();
    }
  } catch { /* .env opsional kalau env sudah diset lewat shell */ }
  return map;
}

const env = loadEnv();
const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY di .env dulu.');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
const stamp = Date.now();
const PASSWORD = 'Test-RLS-' + stamp + '!Aa';
const results = [];
let fail = 0;

function check(label, condition) {
  results.push({ label, pass: Boolean(condition) });
  if (!condition) fail++;
  console.log((condition ? 'OK  ' : 'GAGAL') + ' - ' + label);
}

async function createTestUser(tag) {
  const email = `rls-test-${tag}-${stamp}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw new Error(`Gagal membuat user uji ${tag}: ${error.message}`);
  return data.user;
}

async function signIn(email) {
  const client = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`Gagal login user uji: ${error.message}`);
  return client;
}

async function main() {
  console.log(`Membuat dua akun uji sementara (stamp ${stamp})...`);
  const userA = await createTestUser('a');
  const userB = await createTestUser('b');
  const clientA = await signIn(userA.email);
  const clientB = await signIn(userB.email);
  let testCode = null;
  let testTxId = null;

  try {
    // --- profiles: baca/tulis lintas akun harus kosong/gagal ---
    const ownProfileA = await clientA.from('profiles').select('id').eq('id', userA.id).maybeSingle();
    check('A bisa baca profil sendiri', !ownProfileA.error && ownProfileA.data?.id === userA.id);

    const crossProfileA = await clientA.from('profiles').select('id').eq('id', userB.id).maybeSingle();
    check('A TIDAK bisa baca profil B (RLS select)', !crossProfileA.error && crossProfileA.data === null);

    const crossUpdateA = await clientA.from('profiles').update({ name: 'diubah-paksa' }).eq('id', userB.id).select('id');
    check('A TIDAK bisa menulis profil B (RLS update)', !crossUpdateA.data?.length);

    // --- user_state: sama ---
    const crossStateA = await clientA.from('user_state').select('user_id').eq('user_id', userB.id).maybeSingle();
    check('A TIDAK bisa baca user_state B', !crossStateA.error && crossStateA.data === null);

    const crossStateWriteA = await clientA.from('user_state').update({ data: {} }).eq('user_id', userB.id).select('user_id');
    check('A TIDAK bisa menulis user_state B', !crossStateWriteA.data?.length);

    // --- transactions: tx_insert harus menolak akun belum aktif ---
    const insertWhileInactive = await clientA.from('transactions')
      .insert({ user_id: userA.id, type: 'expense', amount: 1000, title: 'uji RLS', source: 'web' });
    check('tx_insert menolak akun yang belum aktif (policy tidak bisa dilewati)', Boolean(insertWhileInactive.error));

    // Aktifkan A lewat kode lisensi sekali pakai supaya bisa uji insert yang SAH + baca lintas akun.
    testCode = `RLSTEST-${stamp}`;
    const { error: codeInsertError } = await admin.from('license_codes').insert({ code: testCode, plan_days: 1 });
    if (codeInsertError) throw new Error('Gagal membuat kode lisensi uji: ' + codeInsertError.message);
    const activate = await clientA.rpc('activate_code', { p_code: testCode });
    check('Kode lisensi uji berhasil mengaktifkan A', !activate.error);

    const insertWhileActive = await clientA.from('transactions')
      .insert({ user_id: userA.id, type: 'expense', amount: 25000, title: 'uji RLS aktif', source: 'web' })
      .select('id').maybeSingle();
    check('tx_insert berhasil untuk akun yang sudah aktif', !insertWhileActive.error && Boolean(insertWhileActive.data?.id));
    testTxId = insertWhileActive.data?.id ?? null;

    if (testTxId) {
      const crossReadB = await clientB.from('transactions').select('id').eq('id', testTxId).maybeSingle();
      check('B TIDAK bisa baca transaksi A (tx_select)', !crossReadB.error && crossReadB.data === null);

      const crossUpdateB = await clientB.from('transactions').update({ title: 'diubah-paksa' }).eq('id', testTxId).select('id');
      check('B TIDAK bisa mengubah transaksi A (tx_update)', !crossUpdateB.data?.length);

      const crossDeleteB = await clientB.from('transactions').delete().eq('id', testTxId).select('id');
      check('B TIDAK bisa menghapus transaksi A (tx_delete)', !crossDeleteB.data?.length);

      const ownReadA = await clientA.from('transactions').select('id').eq('id', testTxId).maybeSingle();
      check('A tetap bisa baca transaksi sendiri', !ownReadA.error && ownReadA.data?.id === testTxId);
    }
  } finally {
    console.log('Membersihkan data uji...');
    if (testTxId) await admin.from('transactions').delete().eq('id', testTxId);
    if (testCode) await admin.from('license_codes').delete().eq('code', testCode);
    await admin.auth.admin.deleteUser(userA.id);
    await admin.auth.admin.deleteUser(userB.id);
    console.log('Akun uji dan sisa datanya sudah dihapus.');
  }

  console.log('\n' + (fail ? `${fail} dari ${results.length} pemeriksaan GAGAL` : `Semua ${results.length} pemeriksaan RLS lolos`));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('Skrip uji RLS gagal jalan:', e.message);
  process.exit(1);
});
