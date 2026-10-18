// Pembuat kode lisensi massal.
// Pemakaian: npm run codes -- <jumlah> <hari>
//   contoh:  npm run codes -- 100 30     (100 kode, masing-masing 30 hari)
// Hasil (di scripts/out/, tidak ikut di-commit):
//   codes-<hari>d.txt   -> daftar kode untuk diunggah/dikirim lewat OrderHero
//   insert-<hari>d.sql  -> tempel ke Supabase SQL Editor
import crypto from 'node:crypto'
import fs from 'node:fs'

const count = Number(process.argv[2] ?? 50)
const days = Number(process.argv[3] ?? 30)
if (!Number.isInteger(count) || count < 1 || count > 5000 || !Number.isInteger(days) || days < 1) {
  console.error('Pemakaian: npm run codes -- <jumlah 1-5000> <hari>')
  process.exit(1)
}

// Tanpa huruf/angka yang mirip (0/O, 1/I). 32 karakter, tepat 5 bit per karakter.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const group = () => Array.from(crypto.randomBytes(4), (b) => CHARS[b % 32]).join('')

const codes = new Set()
while (codes.size < count) codes.add(`FNRA-${group()}-${group()}-${group()}`)

fs.mkdirSync('scripts/out', { recursive: true })
const list = [...codes]
fs.writeFileSync(`scripts/out/codes-${days}d.txt`, list.join('\n') + '\n')
fs.writeFileSync(
  `scripts/out/insert-${days}d.sql`,
  'insert into public.license_codes (code, plan_days) values\n' +
    list.map((c) => `  ('${c}', ${days})`).join(',\n') + ';\n',
)
console.log(`${count} kode (${days} hari) dibuat di scripts/out/`)
