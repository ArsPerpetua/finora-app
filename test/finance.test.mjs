import assert from 'node:assert/strict'
import test from 'node:test'
import {
  budgetStats, cashFlow, categoryFor, contributeToGoal, expenseCategories, expenseCategoryOptions,
  filterTransactions, goalProgress, readFinancialState, removeAccount, removeCategory, removeGoal,
  setBudgetTotal, setCategoryBudget, shiftMonth, sortTransactions, summarize, todayMakassar,
  totalBalance, upsertAccount, upsertCategory, upsertGoal,
} from '../src/lib/finance.ts'

const state = readFinancialState({
  accounts: [{ id: 'cash', name: 'Tunai', type: 'cash', opening: 100000 }, { id: 'card', name: 'Kartu', type: 'credit', opening: -900000 }],
  cats: [{ id: 'food', name: 'Makan di luar', color: '#123456' }],
})
const tx = (overrides = {}) => ({
  id: '1', type: 'expense', amount: 25000, account_id: 'cash', to_account_id: null,
  cat_id: 'food', title: 'Makan siang', note: '', tx_date: '2026-10-18',
  created_at: '2026-10-18T04:00:00Z', source: 'telegram', ...overrides,
})
const transactions = [
  tx(),
  tx({ id: '2', type: 'income', amount: '5000000', cat_id: 'salary', title: 'Gaji' }),
  tx({ id: '3', type: 'transfer', amount: 2000000, cat_id: null, to_account_id: 'bank' }),
  tx({ id: '4', amount: 50000, cat_id: 'transport', title: 'Bensin', tx_date: '2026-09-30' }),
]

test('saldo menghitung riwayat penuh dan saldo awal; transfer tidak menggandakan uang', () => {
  assert.deepEqual(summarize(transactions), { income: 5000000, expense: 75000, net: 4925000, count: 4 })
  assert.equal(totalBalance(transactions, state), 5025000)
  assert.equal(totalBalance([], { accounts: [], cats: [] }), 0)
  assert.equal(totalBalance([tx({ amount: 150000 })], state), -50000)
})

test('tanggal memakai Asia/Makassar meskipun tanggal UTC masih bulan sebelumnya', () => {
  assert.equal(todayMakassar(new Date('2026-10-31T15:59:00Z')), '2026-10-31')
  assert.equal(todayMakassar(new Date('2026-10-31T16:01:00Z')), '2026-11-01')
  assert.equal(shiftMonth('2026-01', -1), '2025-12')
  assert.equal(shiftMonth('2026-12', 1), '2027-01')
})

test('filter bulanan, jenis, kategori, dan pencarian tidak memasukkan periode lain', () => {
  const filter = { month: '2026-10', allMonths: false, type: 'all', category: 'all', query: '' }
  assert.equal(filterTransactions(transactions, state, filter).length, 3)
  assert.deepEqual(filterTransactions(transactions, state, { ...filter, type: 'expense' }).map(item => item.id), ['1'])
  assert.deepEqual(filterTransactions(transactions, state, { ...filter, query: 'MAKAN DI LUAR' }).map(item => item.id), ['1'])
  assert.deepEqual(filterTransactions(transactions, state, { ...filter, query: ' tunai ', category: 'salary' }).map(item => item.id), ['2'])
  assert.equal(filterTransactions(transactions, state, { ...filter, allMonths: true }).length, 4)
  assert.equal(filterTransactions(transactions, state, { ...filter, query: 'tidak ada' }).length, 0)
})

test('arus kas enam bulan dan pengeluaran kategori mengecualikan transfer', () => {
  const flow = cashFlow(transactions, '2026-10')
  assert.equal(flow.length, 6)
  assert.equal(flow[0].month, '2026-05')
  assert.equal(flow[4].expense, 50000)
  assert.equal(flow[5].expense, 25000)
  assert.equal(flow[5].income, 5000000)
  const categories = expenseCategories(transactions, state)
  assert.equal(categories.length, 2)
  assert.equal(categories[0].id, 'transport')
  assert.equal(categories[1].name, 'Makan di luar')
  assert.equal(categories.reduce((sum, item) => sum + item.amount, 0), 75000)
})

test('kategori bawaan bot dan metadata kosong ditangani tanpa data contoh', () => {
  assert.deepEqual(readFinancialState(null), { accounts: [], cats: [], goals: [], budget: { total: 0, cats: {} } })
  assert.equal(categoryFor(tx(), { accounts: [], cats: [] }).name, 'Makan & Minum')
  assert.equal(categoryFor(tx({ cat_id: 'deleted' }), state).name, 'Lainnya')
  assert.equal(readFinancialState({ cats: [{ id: 'x', name: 'X', color: 'url(https://invalid)' }] }).cats[0].color, '#8a9484')
})

test('akun, kategori, dan tujuan tabungan bisa ditambah, diubah, dan dihapus di state JSON', () => {
  let s = { accounts: [], cats: [], goals: [], budget: { total: 0, cats: {} } }
  s = upsertAccount(s, { id: 'a1', name: 'Tunai', type: 'cash', opening: 100000 })
  assert.deepEqual(s.accounts, [{ id: 'a1', name: 'Tunai', type: 'cash', opening: 100000 }])
  s = upsertAccount(s, { id: 'a1', name: 'Dompet Tunai', type: 'cash', opening: 50000 })
  assert.equal(s.accounts.length, 1)
  assert.equal(s.accounts[0].name, 'Dompet Tunai')
  s = removeAccount(s, 'a1')
  assert.equal(s.accounts.length, 0)

  s = upsertCategory(s, { id: 'c1', name: 'Olahraga', color: '#111111', type: 'expense' })
  assert.equal(expenseCategoryOptions(s).some(item => item.id === 'c1'), true)
  s = setCategoryBudget(s, 'c1', 200000)
  assert.equal(s.budget.cats.c1, 200000)
  s = removeCategory(s, 'c1')
  assert.equal(s.cats.length, 0)
  assert.equal(s.budget.cats.c1, undefined)

  s = upsertGoal(s, { id: 'g1', name: 'Dana darurat', target: 1000000, saved: 0 })
  s = contributeToGoal(s, 'g1', 300000)
  assert.equal(s.goals[0].saved, 300000)
  s = contributeToGoal(s, 'g1', -1000000)
  assert.equal(s.goals[0].saved, 0, 'saldo tabungan tidak boleh negatif')
  assert.deepEqual(goalProgress(s.goals[0]), { ratio: 0, remaining: 1000000, done: false })
  s = removeGoal(s, 'g1')
  assert.equal(s.goals.length, 0)
})

test('anggaran bulanan membandingkan batas dengan pengeluaran nyata per kategori', () => {
  let s = setBudgetTotal({ accounts: [], cats: [], goals: [], budget: { total: 0, cats: {} } }, 100000)
  s = setCategoryBudget(s, 'food', 60000)
  const month = [tx({ id: '1', amount: 25000, cat_id: 'food' }), tx({ id: '2', amount: 50000, cat_id: 'transport' })]
  const stats = budgetStats(month, s)
  assert.deepEqual(stats.total, { limit: 100000, spent: 75000 })
  const food = stats.categories.find(item => item.id === 'food')
  assert.deepEqual({ limit: food.limit, spent: food.spent }, { limit: 60000, spent: 25000 })
  const transport = stats.categories.find(item => item.id === 'transport')
  assert.deepEqual({ limit: transport.limit, spent: transport.spent }, { limit: 0, spent: 50000 })

  const noTotal = setCategoryBudget({ accounts: [], cats: [], goals: [], budget: { total: 0, cats: {} } }, 'food', 60000)
  assert.equal(budgetStats([], noTotal).total.limit, 60000, 'tanpa batas total, jumlahkan batas per kategori')
})

test('transaksi terbaru diurutkan stabil berdasarkan tanggal dan waktu pencatatan', () => {
  const rows = [tx({ id: 'a', created_at: '2026-10-18T01:00:00Z' }), tx({ id: 'b', created_at: '2026-10-18T03:00:00Z' }), tx({ id: 'c', tx_date: '2026-10-17' })]
  assert.deepEqual(sortTransactions(rows).map(item => item.id), ['b', 'a', 'c'])
  assert.deepEqual(rows.map(item => item.id), ['a', 'b', 'c'])
})
