// A13: pastikan service role key dan rahasia bot Telegram tidak pernah ikut ke bundle
// klien. Dijalankan otomatis setelah `npm run build` (lihat "postbuild" di package.json).
// Semua variabel TANPA prefiks VITE_ dianggap rahasia sisi server — nilainya di-grep ke
// seluruh isi dist/. Vite sendiri sudah hanya membaca import.meta.env.VITE_*, jadi ini
// adalah pengaman tambahan supaya regresi (mis. rahasia baru ditulis tanpa sadar ke kode
// klien) terdeteksi otomatis di build, bukan baru ketahuan saat sudah live.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

function loadDotenv(path) {
  const map = {};
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return map;
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    map[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return map;
}

function collectSecrets() {
  const sources = { ...loadDotenv('.env'), ...process.env };
  const secrets = [];
  for (const [key, value] of Object.entries(sources)) {
    if (!value || key.startsWith('VITE_')) continue;
    // Hanya variabel yang memang kita pakai untuk rahasia server (bukan seluruh process.env
    // bawaan OS, yang akan menghasilkan banyak false positive tidak relevan).
    if (/^(SUPABASE_SERVICE_ROLE_KEY|TELEGRAM_BOT_TOKEN|TELEGRAM_WEBHOOK_SECRET)$/.test(key)) secrets.push({ key, value });
  }
  return secrets;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function main() {
  const secrets = collectSecrets();
  if (!secrets.length) {
    console.log('check-bundle-secrets: tidak ada rahasia server untuk diperiksa (env kosong), dilewati.');
    return;
  }
  let files;
  try {
    files = walk(DIST);
  } catch {
    console.log(`check-bundle-secrets: folder "${DIST}" tidak ada, dilewati (jalankan setelah build).`);
    return;
  }
  const leaks = [];
  for (const file of files) {
    let content;
    try { content = readFileSync(file, 'utf8'); } catch { continue; }
    for (const { key, value } of secrets) {
      if (content.includes(value)) leaks.push(`${file} (mengandung nilai ${key})`);
    }
  }
  if (leaks.length) {
    console.error('check-bundle-secrets: BOCOR! Rahasia server ditemukan di bundle klien:');
    for (const line of leaks) console.error('  - ' + line);
    process.exit(1);
  }
  console.log(`check-bundle-secrets: aman, ${secrets.length} rahasia server diperiksa, tidak ditemukan di ${DIST}/.`);
}

main()
