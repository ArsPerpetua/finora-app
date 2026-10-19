// A16: daftarkan (atau perbarui) webhook bot Telegram lewat POST, bukan menempel token dan
// secret di URL yang dibuka di browser (cara lama di docs/README-BOT.md — persis rawan
// soalnya URL dengan rahasia di dalamnya gampang tersalin ke tempat yang salah, misalnya
// riwayat browser atau chat saat minta bantuan debug). Baca TELEGRAM_BOT_TOKEN, APP_URL,
// TELEGRAM_WEBHOOK_SECRET dari .env lokal atau process.env (mis. saat dijalankan di CI).
//
// Jalankan: node scripts/set-telegram-webhook.mjs
// Cek status tanpa mengubah apa pun: node scripts/set-telegram-webhook.mjs --status
//
// Putar ulang (rotate) TELEGRAM_WEBHOOK_SECRET:
//   1. node scripts/set-telegram-webhook.mjs --new-secret   -> cetak satu nilai acak baru
//   2. Isi nilai itu sebagai TELEGRAM_WEBHOOK_SECRET di environment variable Netlify, deploy ulang
//   3. Perbarui juga TELEGRAM_WEBHOOK_SECRET di .env lokal, lalu jalankan ulang skrip ini
//      (tanpa flag) supaya Telegram memakai secret yang baru juga.

import { randomBytes } from 'node:crypto';
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
  } catch { /* .env opsional kalau env sudah diset lewat shell/CI */ }
  return map;
}

const env = loadEnv();
const TOKEN = env.TELEGRAM_BOT_TOKEN;
const APP_URL = env.APP_URL;
const SECRET = env.TELEGRAM_WEBHOOK_SECRET;
const statusOnly = process.argv.includes('--status');
const newSecretOnly = process.argv.includes('--new-secret');

if (newSecretOnly) {
  console.log(randomBytes(24).toString('base64url'));
  console.log('\nSimpan nilai di atas sebagai TELEGRAM_WEBHOOK_SECRET di Netlify, deploy ulang, lalu perbarui .env lokal dan jalankan ulang skrip ini (tanpa flag).');
  process.exit(0);
}

if (!TOKEN) {
  console.error('Isi TELEGRAM_BOT_TOKEN di .env dulu.');
  process.exit(1);
}

const api = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`;

// Nilai TOKEN tidak pernah dicetak ke konsol di skrip ini — hanya dipakai di header/URL request.
async function call(method, body) {
  const res = await fetch(api(method), body
    ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' });
  return res.json();
}

async function main() {
  if (statusOnly) {
    const info = await call('getWebhookInfo');
    console.log(JSON.stringify(info, null, 2));
    return;
  }

  if (!APP_URL) {
    console.error('Isi APP_URL di .env dulu (mis. https://nama-situs.netlify.app).');
    process.exit(1);
  }
  if (!SECRET) {
    console.error('Isi TELEGRAM_WEBHOOK_SECRET di .env dulu.');
    process.exit(1);
  }

  const url = `${APP_URL.replace(/\/$/, '')}/.netlify/functions/telegram`;
  // allowed_updates harus disebut eksplisit: webhook yang didaftarkan tanpa ini hanya
  // mengirim "message" (A12 butuh "edited_message" juga, dipakai untuk mendeteksi pesan yang
  // diedit dan memperbarui catatan lama alih-alih menduplikasi).
  const result = await call('setWebhook', { url, secret_token: SECRET, allowed_updates: ['message', 'edited_message'] });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    console.error('setWebhook gagal.');
    process.exit(1);
  }
  console.log(`\nWebhook terpasang ke: ${url}`);
  console.log('Cek status kapan saja: node scripts/set-telegram-webhook.mjs --status');
}

main();
