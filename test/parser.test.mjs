import { matchAccount, parseMessage, stripToken } from '../netlify/functions/lib/parser.mjs';
const cases = [
  ['makan siang 25000', 'expense', 25000, 'food'],
  ['makan siang 25.000', 'expense', 25000, 'food'],
  ['Kopi 18rb', 'expense', 18000, 'food'],
  ['bensin 30k', 'expense', 30000, 'transport'],
  ['gaji 5jt', 'income', 5000000, 'salary'],
  ['gaji 1,5jt', 'income', 1500000, 'salary'],
  ['+100rb', 'income', 100000, 'otherinc'],
  ['uang masuk 100.000', 'income', 100000, 'otherinc'],
  ['netflix 186000', 'expense', 186000, 'subs'],
  ['beli sepatu 450.000', 'expense', 450000, 'shopping'],
  ['25000 makan siang', 'expense', 25000, 'food'],
  ['halo apa kabar', null],
  ['', null],
];
let fail = 0;
for (const [txt, type, amount, cat] of cases) {
  const r = parseMessage(txt);
  const ok = type === null ? r === null : r && r.type === type && r.amount === amount && r.catId === cat;
  if (!ok) { fail++; console.log('GAGAL:', JSON.stringify(txt), '->', JSON.stringify(r)); }
}

// A12: cocokkan akun dari kata kunci di teks (mis. "bca", "gopay", "tunai").
const accounts = [{ id: 'a1', name: 'BCA' }, { id: 'a2', name: 'GoPay' }, { id: 'a3', name: 'Tunai' }];
const accountCases = [
  ['makan siang 25000 bca', 'a1'],
  ['topup gopay 50000', 'a2'],
  ['tarik tunai 20000', 'a3'],
  ['bensin 30000', null],
  ['bcafe 10000', null], // bukan kata utuh "bca", jangan cocok sebagian kata
];
for (const [txt, expectedId] of accountCases) {
  const m = matchAccount(txt, accounts);
  const ok = expectedId === null ? m === null : m?.id === expectedId;
  if (!ok) { fail++; console.log('GAGAL matchAccount:', JSON.stringify(txt), '->', JSON.stringify(m)); }
}
const strip = stripToken('Makan siang bca', 'BCA');
if (strip !== 'Makan siang') { fail++; console.log('GAGAL stripToken:', JSON.stringify(strip)); }

console.log(fail ? `${fail} gagal` : 'semua lolos');
if (fail) process.exit(1);
