// Webhook bot Telegram Finora (Netlify Functions v2)
import { createClient } from '@supabase/supabase-js';
import { parseMessage, CAT_NAMES } from './lib/parser.mjs';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_URL } = process.env;

// Mencetak NAMA variabel yang kosong (bukan isinya) supaya mudah dilacak di log Netlify.
const missingEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET']
  .filter((k) => !process.env[k]);
if (missingEnv.length) console.error('ENV KOSONG:', missingEnv.join(', '));

const db = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_SERVICE_ROLE_KEY || 'kosong', { auth: { persistSession: false } });

const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const todayMakassar = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

const HELP = [
  'Cara mencatat:',
  '• makan siang 25000  → pengeluaran',
  '• gaji 5jt, +100rb  → pemasukan',
  '',
  'Perintah:',
  '/saldo  - total saldo',
  '/laporan  - ringkasan bulan ini',
  '/hapus  - batalkan catatan terakhir dari Telegram',
  '/bantuan  - tampilkan pesan ini',
].join('\n');

async function send(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function getState(userId) {
  const { data } = await db.from('user_state').select('data').eq('user_id', userId).maybeSingle();
  return data?.data || {};
}

function catName(state, id) {
  const c = (state.cats || []).find((x) => x.id === id);
  return c?.name || CAT_NAMES[id] || 'Lainnya';
}

async function cmdSaldo(chatId, profile) {
  const state = await getState(profile.id);
  const accounts = (state.accounts || []).filter((a) => a.type !== 'credit');
  const opening = accounts.reduce((s, a) => s + (+a.opening || 0), 0);
  const { data: tx, error } = await db.from('transactions').select('type, amount').eq('user_id', profile.id).limit(20000);
  if (error) return send(chatId, 'Maaf, terjadi kesalahan saat membaca data. Coba lagi sebentar.');
  let net = 0;
  for (const t of tx) net += t.type === 'income' ? +t.amount : t.type === 'expense' ? -t.amount : 0;
  return send(chatId, `Total saldo: ${rp(opening + net)}`);
}

async function cmdLaporan(chatId, profile) {
  const state = await getState(profile.id);
  const from = todayMakassar().slice(0, 7) + '-01';
  const { data: tx, error } = await db.from('transactions').select('type, amount, cat_id').eq('user_id', profile.id).gte('tx_date', from);
  if (error) return send(chatId, 'Maaf, terjadi kesalahan saat membaca data. Coba lagi sebentar.');
  let inc = 0, exp = 0;
  const byCat = {};
  for (const t of tx) {
    if (t.type === 'income') inc += +t.amount;
    else if (t.type === 'expense') { exp += +t.amount; byCat[t.cat_id] = (byCat[t.cat_id] || 0) + +t.amount; }
  }
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, v]) => `  • ${catName(state, id)}: ${rp(v)}`).join('\n');
  return send(chatId, [
    'Ringkasan bulan ini',
    `Pemasukan: ${rp(inc)}`,
    `Pengeluaran: ${rp(exp)}`,
    `Selisih: ${rp(inc - exp)}`,
    top ? `\nTerbesar:\n${top}` : '',
  ].join('\n').trim());
}

async function cmdHapus(chatId, profile) {
  const { data } = await db.from('transactions').select('id, type, amount, title')
    .eq('user_id', profile.id).eq('source', 'telegram')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data) return send(chatId, 'Tidak ada catatan dari Telegram yang bisa dibatalkan.');
  const { error } = await db.from('transactions').delete().eq('id', data.id);
  if (error) return send(chatId, 'Gagal membatalkan. Coba lagi sebentar.');
  return send(chatId, `Dibatalkan: ${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${rp(data.amount)}${data.title ? ' · ' + data.title : ''}`);
}

async function cmdRecord(chatId, profile, text) {
  const p = parseMessage(text);
  if (!p) return send(chatId, 'Saya belum menemukan nominal. Contoh: "makan siang 25000" atau "gaji 5jt".\nKetik /bantuan untuk panduan.');
  const state = await getState(profile.id);
  const accountId = state.defaultAccountId || state.accounts?.[0]?.id || null;
  const { error } = await db.from('transactions').insert({
    user_id: profile.id, type: p.type, amount: p.amount, account_id: accountId,
    cat_id: p.catId, title: p.title, source: 'telegram', tx_date: todayMakassar(),
  });
  if (error) return send(chatId, 'Maaf, catatan gagal disimpan. Coba lagi sebentar.');
  return send(chatId, `Tercatat: ${p.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${rp(p.amount)}\n${catName(state, p.catId)}${p.title ? ' · ' + p.title : ''}\n\nSalah? Ketik /hapus`);
}

async function handle(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!text) return;

  // Perintah /start boleh dipakai sebelum akun tertaut
  const [cmdRaw, ...args] = text.split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, '');

  if (cmd === '/start') {
    if (args[0]) {
      const { error } = await db.rpc('link_telegram', { p_code: args[0], p_chat_id: chatId });
      if (error) return send(chatId, 'Kode tautan tidak valid atau sudah kedaluwarsa. Ambil kode baru di dashboard Finora, lalu kirim: /start KODE');
      return send(chatId, 'Akun berhasil ditautkan.\n\n' + HELP);
    }
    return send(chatId, 'Selamat datang di Finora.\nUntuk menautkan akun, ambil kode tautan di dashboard lalu kirim: /start KODE');
  }

  const { data: profile } = await db.from('profiles').select('id, active_until').eq('telegram_chat_id', chatId).maybeSingle();
  if (!profile) {
    return send(chatId,
      'Akun Telegram ini belum tertaut ke Finora.\n\n' +
      '• Sudah punya akun? Login di dashboard, ambil kode tautan, lalu kirim: /start KODE\n' +
      '• Belum punya akun? Daftar di ' + (APP_URL || 'situs Finora'));
  }
  if (!profile.active_until || new Date(profile.active_until) <= new Date()) {
    return send(chatId, 'Masa aktif akun Anda sudah berakhir atau belum diaktifkan. Masukkan kode aktivasi di dashboard Finora.');
  }

  if (cmd === '/bantuan' || cmd === '/help') return send(chatId, HELP);
  if (cmd === '/saldo') return cmdSaldo(chatId, profile);
  if (cmd === '/laporan') return cmdLaporan(chatId, profile);
  if (cmd === '/hapus') return cmdHapus(chatId, profile);
  if (cmd.startsWith('/')) return send(chatId, 'Perintah tidak dikenal. Ketik /bantuan.');
  return cmdRecord(chatId, profile, text);
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  if (!TELEGRAM_WEBHOOK_SECRET || req.headers.get('x-telegram-bot-api-secret-token') !== TELEGRAM_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  try {
    const update = await req.json();
    if (update.message) await handle(update.message);
  } catch (e) {
    console.error('telegram handler error', e);
  }
  // Selalu 200 supaya Telegram tidak mengirim ulang pesan yang sama
  return new Response('ok');
};
