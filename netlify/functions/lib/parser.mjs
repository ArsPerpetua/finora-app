// Parser pesan Telegram -> transaksi. Tanpa AI, murni aturan sederhana.

const SUFFIX = { jt: 1e6, juta: 1e6, rb: 1e3, ribu: 1e3, k: 1e3 };
const AMOUNT_RE = /(\d+(?:[.,]\d+)*)\s*(juta|jt|ribu|rb|k)?(?![a-z\d])/gi;

export const CAT_NAMES = {
  food: 'Makan & Minum', transport: 'Transportasi', shopping: 'Belanja',
  bills: 'Tagihan & Utilitas', subs: 'Langganan', home: 'Rumah & Sewa',
  entertainment: 'Hiburan', health: 'Kesehatan', edu: 'Pendidikan',
  travel: 'Liburan', gift: 'Hadiah & Donasi', other: 'Lainnya',
  salary: 'Gaji', bonus: 'Bonus', freelance: 'Freelance', business: 'Bisnis',
  invest: 'Investasi', otherinc: 'Pemasukan lain',
};

const EXPENSE_RULES = [
  ['food', /\b(makan|minum|kopi|sarapan|nasi|bakso|mie|ayam|gofood|grabfood|shopeefood|warung|snack|jajan|boba|resto|cafe|kafe|lunch|dinner)\b/i],
  ['transport', /\b(bensin|pertamax|pertalite|gojek|grab|parkir|tol|ojek|angkot|bus|kereta|krl|taksi|ongkir)\b/i],
  ['bills', /\b(listrik|pln|internet|wifi|pulsa|paket data|pdam|air|token|bpjs)\b/i],
  ['subs', /\b(netflix|spotify|youtube|langganan|icloud|disney|canva)\b/i],
  ['home', /\b(sewa|kos|kost|kontrakan|cicilan rumah)\b/i],
  ['entertainment', /\b(bioskop|nonton|game|konser|hiburan|karaoke)\b/i],
  ['health', /\b(obat|apotek|dokter|rs|klinik|vitamin)\b/i],
  ['edu', /\b(buku|kuliah|kursus|spp|ukt|les|sekolah)\b/i],
  ['travel', /\b(hotel|tiket|pesawat|liburan|wisata|villa)\b/i],
  ['gift', /\b(hadiah|donasi|sedekah|zakat|kado|infak)\b/i],
  ['shopping', /\b(belanja|beli|tokopedia|shopee|lazada|baju|sepatu|indomaret|alfamart)\b/i],
];

const INCOME_RULES = [
  ['salary', /\b(gaji|salary)\b/i],
  ['bonus', /\b(bonus|thr)\b/i],
  ['freelance', /\b(freelance|proyek|project|fee)\b/i],
  ['business', /\b(jualan|usaha|omzet|penjualan)\b/i],
  ['invest', /\b(dividen|bunga|investasi|cashback)\b/i],
];

const INCOME_WORDS = /\b(gaji|salary|bonus|thr|terima|diterima|dapat|masuk|pemasukan|income|dividen|cashback|omzet|penjualan)\b/i;

function toNumber(raw, hasSuffix) {
  if (hasSuffix) return parseFloat(raw.replace(',', '.'));
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return parseInt(raw.replace(/[.,]/g, ''), 10);
  if (/^\d+[.,]\d{1,2}$/.test(raw)) return parseFloat(raw.replace(',', '.'));
  return parseInt(raw.replace(/[.,]/g, ''), 10);
}

function guess(rules, text, fallback) {
  for (const [id, re] of rules) if (re.test(text)) return id;
  return fallback;
}

/** Mengembalikan { type, amount, title, catId } atau null jika tidak ada nominal. */
export function parseMessage(text) {
  const t = String(text || '').trim();
  const matches = [...t.matchAll(AMOUNT_RE)];
  if (!matches.length) return null;

  // Utamakan angka yang punya satuan (rb/jt/k), jika tidak ada pakai angka terakhir
  const m = matches.find((x) => x[2]) || matches[matches.length - 1];
  const mult = m[2] ? SUFFIX[m[2].toLowerCase()] : 1;
  const amount = Math.round(toNumber(m[1], !!m[2]) * mult);
  if (!(amount >= 1)) return null;

  const rest = (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
  const title = rest.replace(/^[+\-]\s*/, '').trim();
  const isIncome = t.startsWith('+') || INCOME_WORDS.test(title);
  const type = isIncome ? 'income' : 'expense';
  const catId = isIncome ? guess(INCOME_RULES, title, 'otherinc') : guess(EXPENSE_RULES, title, 'other');

  return { type, amount, title: title ? title[0].toUpperCase() + title.slice(1) : '', catId };
}
