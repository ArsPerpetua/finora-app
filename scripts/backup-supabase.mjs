// A16: cadangan data mentah (bukan pengganti backup bawaan Supabase, pelengkap untuk paket
// free yang belum punya Point-in-Time Recovery). Mengekspor profiles, user_state,
// transactions, dan license_codes ke berkas JSON di backups/<stempel-waktu>/, pakai
// SUPABASE_SERVICE_ROLE_KEY (lewat semua baris, melewati RLS).
//
// PERINGATAN: berkas yang dihasilkan berisi DATA KEUANGAN ASLI PENGGUNA. Folder backups/
// sudah di .gitignore — jangan pernah di-commit atau diunggah ke tempat tidak terenkripsi.
// Hapus berkas lama yang tidak diperlukan lagi.
//
// Jalankan: node scripts/backup-supabase.mjs
// Jadwalkan (mis. cron harian di mesin Anda sendiri, atau Netlify Scheduled Function terpisah
// kalau mau otomatis) — skrip ini sendiri tidak dijadwalkan, hanya dijalankan sesuai kebutuhan.

import { createClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

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
  } catch { /* .env opsional */ }
  return map;
}

const env = loadEnv();
const URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE_KEY) {
  console.error('Isi VITE_SUPABASE_URL (atau SUPABASE_URL) dan SUPABASE_SERVICE_ROLE_KEY di .env dulu.');
  process.exit(1);
}
const db = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

/** Ambil semua baris sebuah tabel lewat cursor id, supaya tabel besar (transactions) tidak terpotong batas halaman API. */
async function dumpAll(table, orderColumn = 'id') {
  const rows = [];
  let cursor = null;
  for (;;) {
    let query = db.from(table).select('*').order(orderColumn, { ascending: true }).limit(1000);
    if (cursor) query = query.gt(orderColumn, cursor);
    const { data, error } = await query;
    if (error) throw new Error(`Gagal membaca ${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    const next = data[data.length - 1][orderColumn];
    if (next === cursor) throw new Error(`Cursor ${table} tidak berubah, berhenti supaya tidak jadi loop tak berhenti.`);
    cursor = next;
  }
  return rows;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = `backups/${stamp}`;
  mkdirSync(dir, { recursive: true });

  const tables = [
    ['profiles', 'id'],
    ['user_state', 'user_id'],
    ['transactions', 'id'],
    ['license_codes', 'code'],
  ];

  let total = 0;
  for (const [table, orderColumn] of tables) {
    const rows = await dumpAll(table, orderColumn);
    writeFileSync(`${dir}/${table}.json`, JSON.stringify(rows, null, 2));
    console.log(`${table}: ${rows.length} baris -> ${dir}/${table}.json`);
    total += rows.length;
  }
  console.log(`\nSelesai. ${total} baris total dicadangkan ke ${dir}/`);
  console.log('Ingat: folder ini berisi data pengguna asli. Simpan di tempat aman, hapus kalau sudah tidak perlu.');
}

main().catch((e) => {
  console.error('Backup gagal:', e.message);
  process.exit(1);
});
