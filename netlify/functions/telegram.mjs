// Webhook bot Telegram Finora (Netlify Functions v2)
import { createClient } from '@supabase/supabase-js';
import { matchAccount, parseMessage, stripToken, CAT_NAMES } from './lib/parser.mjs';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_URL } = process.env;

// Mencetak NAMA variabel yang kosong (bukan isinya) supaya mudah dilacak di log Netlify.
const missingEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET']
  .filter((k) => !process.env[k]);
if (missingEnv.length) console.error('ENV KOSONG:', missingEnv.join(', '));

const db = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_SERVICE_ROLE_KEY || 'kosong', { auth: { persistSession: false } });

const EXPENSE_CAT_IDS = ['food', 'transport', 'shopping', 'bills', 'subs', 'home', 'entertainment', 'health', 'edu', 'travel', 'gift', 'other'];
const INCOME_CAT_IDS = ['salary', 'bonus', 'freelance', 'business', 'invest', 'otherinc'];

const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const todayMakassar = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

/** '2026-03' -> '2026-02'; dipakai untuk roll-over anggaran (lihat finance.ts budgetStats, logika sama). */
function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Batas kategori tersimpan sebagai angka polos (data lama) atau {limit, roll} (sejak A7). */
function readLimit(raw) {
  if (raw && typeof raw === 'object') return { limit: Number(raw.limit) || 0, roll: Boolean(raw.roll) };
  return { limit: Number(raw) || 0, roll: false };
}

const HELP = [
  'Cara mencatat:',
  '• makan siang 25000  → pengeluaran',
  '• gaji 5jt, +100rb  → pemasukan',
  '• tambahkan nama akun kalau punya lebih dari satu, mis. "makan siang 25000 bca"',
  '',
  'Perintah:',
  '/saldo  - total saldo',
  '/akun  - saldo per akun',
  '/kategori  - daftar kategori',
  '/anggaran  - sisa anggaran per kategori bulan ini',
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
  const { data: tx, error } = await db.from('transactions').select('type, amount, fee').eq('user_id', profile.id).limit(20000);
  if (error) return send(chatId, 'Maaf, terjadi kesalahan saat membaca data. Coba lagi sebentar.');
  let net = 0;
  for (const t of tx) {
    if (t.type === 'income') net += +t.amount;
    else if (t.type === 'expense') net -= +t.amount;
    if (t.type === 'transfer') net -= +t.fee || 0;
  }
  return send(chatId, `Total saldo: ${rp(opening + net)}`);
}

async function cmdAkun(chatId, profile) {
  const state = await getState(profile.id);
  const accounts = state.accounts || [];
  if (!accounts.length) return send(chatId, 'Belum ada akun. Tambahkan di dashboard Finora > Akun.');
  const { data: tx, error } = await db.from('transactions').select('type, amount, account_id, to_account_id, fee').eq('user_id', profile.id).limit(20000);
  if (error) return send(chatId, 'Maaf, terjadi kesalahan saat membaca data. Coba lagi sebentar.');
  const bal = {};
  for (const a of accounts) bal[a.id] = +a.opening || 0;
  for (const t of tx) {
    const amount = +t.amount || 0;
    if (t.type === 'income') { if (t.account_id in bal) bal[t.account_id] += amount; }
    else if (t.type === 'expense') { if (t.account_id in bal) bal[t.account_id] -= amount; }
    else if (t.type === 'transfer') {
      const fee = +t.fee || 0;
      if (t.account_id in bal) bal[t.account_id] -= amount + fee;
      if (t.to_account_id in bal) bal[t.to_account_id] += amount;
    }
  }
  const lines = accounts.map((a) => `${a.id === state.defaultAccountId ? '⭐' : '•'} ${a.name}: ${rp(bal[a.id])}`);
  return send(chatId, ['Saldo per akun:', ...lines, '', '⭐ akun default pencatatan Telegram'].join('\n'));
}

function cmdKategori(chatId, state) {
  const custom = state.cats || [];
  const expense = [...EXPENSE_CAT_IDS.map((id) => catName(state, id)), ...custom.filter((c) => c.type !== 'income').map((c) => c.name)];
  const income = [...INCOME_CAT_IDS.map((id) => catName(state, id)), ...custom.filter((c) => c.type === 'income').map((c) => c.name)];
  return send(chatId, [
    'Kategori pengeluaran:', expense.join(', '), '',
    'Kategori pemasukan:', income.join(', '),
  ].join('\n'));
}

async function cmdAnggaran(chatId, profile) {
  const state = await getState(profile.id);
  const limitIds = Object.keys(state.budget?.cats || {});
  if (!limitIds.length) return send(chatId, 'Belum ada anggaran diatur. Atur di dashboard Finora > Anggaran.');
  const month = todayMakassar().slice(0, 7);
  const from = month + '-01';
  const prevFrom = prevMonth(month) + '-01';
  const { data: tx, error } = await db.from('transactions').select('cat_id, amount, tx_date').eq('user_id', profile.id).eq('type', 'expense').gte('tx_date', prevFrom);
  if (error) return send(chatId, 'Maaf, terjadi kesalahan saat membaca data. Coba lagi sebentar.');
  const spent = {}, prevSpent = {};
  for (const t of tx) {
    const bucket = t.tx_date >= from ? spent : prevSpent;
    bucket[t.cat_id] = (bucket[t.cat_id] || 0) + +t.amount;
  }
  const rows = limitIds.map((id) => {
    const { limit, roll } = readLimit(state.budget.cats[id]);
    const carry = roll ? Math.max(0, limit - (prevSpent[id] || 0)) : 0;
    return { name: catName(state, id), limit: limit + carry, spent: spent[id] || 0 };
  }).filter((r) => r.limit > 0).sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  if (!rows.length) return send(chatId, 'Belum ada anggaran diatur. Atur di dashboard Finora > Anggaran.');
  const lines = rows.map((r) => `• ${r.name}: ${rp(r.spent)} dari ${rp(r.limit)} (sisa ${rp(Math.max(0, r.limit - r.spent))})`);
  return send(chatId, ['Anggaran bulan ini:', ...lines].join('\n'));
}

/** Baris tambahan "Sisa anggaran: ..." untuk balasan catat transaksi, kosong jika kategori tidak punya batas. */
async function budgetLineFor(userId, state, catId) {
  const raw = state.budget?.cats?.[catId];
  if (!raw) return '';
  const { limit, roll } = readLimit(raw);
  if (!(limit > 0)) return '';
  const month = todayMakassar().slice(0, 7);
  const from = month + '-01';
  let carry = 0;
  if (roll) {
    const prevFrom = prevMonth(month) + '-01';
    const { data: prevTx } = await db.from('transactions').select('amount').eq('user_id', userId).eq('type', 'expense').eq('cat_id', catId).gte('tx_date', prevFrom).lt('tx_date', from);
    carry = Math.max(0, limit - (prevTx || []).reduce((s, t) => s + +t.amount, 0));
  }
  const { data: curTx } = await db.from('transactions').select('amount').eq('user_id', userId).eq('type', 'expense').eq('cat_id', catId).gte('tx_date', from);
  const spent = (curTx || []).reduce((s, t) => s + +t.amount, 0);
  const effective = limit + carry;
  return `\nSisa anggaran ${catName(state, catId)}: ${rp(Math.max(0, effective - spent))} dari ${rp(effective)}`;
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

/**
 * Catat transaksi baru, atau perbarui catatan yang sudah ada (edited_message) kalau
 * `messageId` cocok dengan `tg_message_id` yang tersimpan. Mencocokkan nama akun dari
 * kata kunci di teks (mis. "bca", "gopay"), jatuh ke defaultAccountId lalu akun pertama.
 */
async function upsertRecord(chatId, profile, text, messageId) {
  const p = parseMessage(text);
  if (!p) return send(chatId, 'Saya belum menemukan nominal. Contoh: "makan siang 25000" atau "gaji 5jt".\nKetik /bantuan untuk panduan.');
  const state = await getState(profile.id);
  const matched = matchAccount(text, state.accounts || []);
  const title = matched ? stripToken(p.title, matched.name) : p.title;
  const accountId = matched?.id ?? state.defaultAccountId ?? state.accounts?.[0]?.id ?? null;

  const existing = messageId
    ? (await db.from('transactions').select('id').eq('user_id', profile.id).eq('source', 'telegram').eq('tg_message_id', messageId).maybeSingle()).data
    : null;

  const payload = {
    user_id: profile.id, type: p.type, amount: p.amount, account_id: accountId,
    cat_id: p.catId, title, source: 'telegram', tx_date: todayMakassar(), tg_message_id: messageId ?? null,
  };
  const { error } = existing
    ? await db.from('transactions').update(payload).eq('id', existing.id)
    : await db.from('transactions').insert(payload);
  if (error) return send(chatId, 'Maaf, catatan gagal disimpan. Coba lagi sebentar.');

  const budgetLine = p.type === 'expense' ? await budgetLineFor(profile.id, state, p.catId) : '';
  const verb = existing ? 'Diperbarui' : 'Tercatat';
  return send(chatId, `${verb}: ${p.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${rp(p.amount)}\n${catName(state, p.catId)}${title ? ' · ' + title : ''}${budgetLine}\n\nSalah? Ketik /hapus`);
}

async function resolveProfile(chatId) {
  const { data: profile } = await db.from('profiles').select('id, active_until').eq('telegram_chat_id', chatId).maybeSingle();
  if (!profile) {
    await send(chatId,
      'Akun Telegram ini belum tertaut ke Finora.\n\n' +
      '• Sudah punya akun? Login di dashboard, ambil kode tautan, lalu kirim: /start KODE\n' +
      '• Belum punya akun? Daftar di ' + (APP_URL || 'situs Finora'));
    return null;
  }
  if (!profile.active_until || new Date(profile.active_until) <= new Date()) {
    await send(chatId, 'Masa aktif akun Anda sudah berakhir atau belum diaktifkan. Masukkan kode aktivasi di dashboard Finora.');
    return null;
  }
  return profile;
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

  const profile = await resolveProfile(chatId);
  if (!profile) return;

  if (cmd === '/bantuan' || cmd === '/help') return send(chatId, HELP);
  if (cmd === '/saldo') return cmdSaldo(chatId, profile);
  if (cmd === '/akun') return cmdAkun(chatId, profile);
  if (cmd === '/kategori') return cmdKategori(chatId, await getState(profile.id));
  if (cmd === '/anggaran') return cmdAnggaran(chatId, profile);
  if (cmd === '/laporan') return cmdLaporan(chatId, profile);
  if (cmd === '/hapus') return cmdHapus(chatId, profile);
  if (cmd.startsWith('/')) return send(chatId, 'Perintah tidak dikenal. Ketik /bantuan.');
  return upsertRecord(chatId, profile, text, msg.message_id);
}

/** Pesan yang diedit: perintah diabaikan (tidak masuk akal diedit ulang), teks biasa memperbarui catatan lama lewat upsertRecord. */
async function handleEdit(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!text || text.startsWith('/')) return;
  const profile = await resolveProfile(chatId);
  if (!profile) return;
  return upsertRecord(chatId, profile, text, msg.message_id);
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  if (!TELEGRAM_WEBHOOK_SECRET || req.headers.get('x-telegram-bot-api-secret-token') !== TELEGRAM_WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  try {
    const update = await req.json();
    if (update.message) await handle(update.message);
    else if (update.edited_message) await handleEdit(update.edited_message);
  } catch (e) {
    console.error('telegram handler error', e);
  }
  // Selalu 200 supaya Telegram tidak mengirim ulang pesan yang sama
  return new Response('ok');
};
