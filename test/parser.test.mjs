import { parseMessage } from '../netlify/functions/lib/parser.mjs';
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
console.log(fail ? `${fail} gagal` : 'semua lolos');
