export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number | string
  account_id: string | null
  to_account_id: string | null
  cat_id: string | null
  title: string
  note: string
  tx_date: string
  created_at: string
  source: 'web' | 'telegram'
}

export interface Account {
  id: string
  name: string
  type: string
  opening: number
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface FinancialState {
  accounts: Account[]
  cats: Category[]
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Makan & Minum', color: '#88a93c' },
  { id: 'transport', name: 'Transportasi', color: '#508bd5' },
  { id: 'shopping', name: 'Belanja', color: '#ae78cd' },
  { id: 'bills', name: 'Tagihan & Utilitas', color: '#df9a40' },
  { id: 'subs', name: 'Langganan', color: '#718acb' },
  { id: 'home', name: 'Rumah & Sewa', color: '#c28e65' },
  { id: 'entertainment', name: 'Hiburan', color: '#d56a99' },
  { id: 'health', name: 'Kesehatan', color: '#4aab9b' },
  { id: 'edu', name: 'Pendidikan', color: '#a38a53' },
  { id: 'travel', name: 'Liburan', color: '#40a1b5' },
  { id: 'gift', name: 'Hadiah & Donasi', color: '#bf7e9f' },
  { id: 'other', name: 'Lainnya', color: '#8a9484' },
  { id: 'salary', name: 'Gaji', color: '#88a93c' },
  { id: 'bonus', name: 'Bonus', color: '#cf9f38' },
  { id: 'freelance', name: 'Freelance', color: '#508bd5' },
  { id: 'business', name: 'Bisnis', color: '#4aab9b' },
  { id: 'invest', name: 'Investasi', color: '#ae78cd' },
  { id: 'otherinc', name: 'Pemasukan lain', color: '#8a9484' },
]

const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const dateParts = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit',
})

export const rupiah = (value: number) => 'Rp ' + numberFormat.format(value)

export function todayMakassar(now = new Date()): string {
  const parts = dateParts.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function shiftMonth(month: string, change: number): string {
  const [year, index] = month.split('-').map(Number)
  const total = Math.min(9999 * 12 + 11, Math.max(12, year * 12 + index - 1 + change))
  return `${String(Math.floor(total / 12)).padStart(4, '0')}-${String(total % 12 + 1).padStart(2, '0')}`
}

export function monthLabel(month: string, short = false): string {
  return new Intl.DateTimeFormat('id-ID', {
    month: short ? 'short' : 'long', ...(short ? {} : { year: 'numeric' }), timeZone: 'Asia/Makassar',
  }).format(new Date(month + '-01T12:00:00+08:00'))
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar',
  }).format(new Date(date + 'T12:00:00+08:00'))
}

export function readFinancialState(value: unknown): FinancialState {
  const root = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const accounts: Account[] = []
  const cats: Category[] = []
  if (Array.isArray(root.accounts)) for (const item of root.accounts) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string') continue
    const opening = Number(item.opening ?? 0)
    accounts.push({ id: item.id, name: item.name, type: String(item.type ?? 'cash'), opening: Number.isFinite(opening) ? opening : 0 })
  }
  if (Array.isArray(root.cats)) for (const item of root.cats) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string') continue
    cats.push({ id: item.id, name: item.name, color: typeof item.color === 'string' && /^#[a-f\d]{6}$/i.test(item.color) ? item.color : '#8a9484' })
  }
  return { accounts, cats }
}

export function categoryFor(tx: Transaction, state: FinancialState): Category {
  if (tx.type === 'transfer') return { id: 'transfer', name: 'Transfer antar akun', color: '#8a9484' }
  return state.cats.find(category => category.id === tx.cat_id)
    ?? DEFAULT_CATEGORIES.find(category => category.id === tx.cat_id)
    ?? { id: tx.cat_id ?? (tx.type === 'income' ? 'otherinc' : 'other'), name: tx.type === 'income' ? 'Pemasukan lain' : 'Lainnya', color: '#8a9484' }
}

export function accountLabel(tx: Transaction, state: FinancialState): string {
  const account = state.accounts.find(item => item.id === tx.account_id)?.name
  if (tx.type === 'transfer') {
    const target = state.accounts.find(item => item.id === tx.to_account_id)?.name
    return `${account ?? 'Akun asal'} → ${target ?? 'Akun tujuan'}`
  }
  return account ?? (tx.source === 'telegram' ? 'Telegram' : 'Web')
}

export function summarize(transactions: readonly Transaction[]) {
  let income = 0
  let expense = 0
  for (const tx of transactions) {
    const amount = Number(tx.amount)
    if (tx.type === 'income') income += amount
    if (tx.type === 'expense') expense += amount
  }
  return { income, expense, net: income - expense, count: transactions.length }
}

export function totalBalance(transactions: readonly Transaction[], state: FinancialState): number {
  const opening = state.accounts.filter(account => account.type !== 'credit').reduce((sum, account) => sum + account.opening, 0)
  return opening + summarize(transactions).net
}

export function sortTransactions(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.tx_date.localeCompare(a.tx_date) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))
}

export interface TransactionFilters {
  month: string
  allMonths: boolean
  type: TransactionType | 'all'
  category: string
  query: string
}

export function filterTransactions(transactions: readonly Transaction[], state: FinancialState, filters: TransactionFilters): Transaction[] {
  const query = filters.query.trim().toLocaleLowerCase('id-ID')
  return sortTransactions(transactions.filter(tx => {
    if (!filters.allMonths && !tx.tx_date.startsWith(filters.month + '-')) return false
    if (filters.type !== 'all' && tx.type !== filters.type) return false
    if (filters.category !== 'all' && categoryFor(tx, state).id !== filters.category) return false
    const text = [tx.title, tx.note, categoryFor(tx, state).name, accountLabel(tx, state)].join(' ').toLocaleLowerCase('id-ID')
    return !query || text.includes(query)
  }))
}

export function cashFlow(transactions: readonly Transaction[], month: string) {
  return Array.from({ length: 6 }, (_, index) => {
    const current = shiftMonth(month, index - 5)
    return { month: current, ...summarize(transactions.filter(tx => tx.tx_date.startsWith(current + '-'))) }
  })
}

export function expenseCategories(transactions: readonly Transaction[], state: FinancialState) {
  const totals = new Map<string, Category & { amount: number }>()
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    const category = categoryFor(tx, state)
    const prior = totals.get(category.id)
    totals.set(category.id, { ...category, amount: (prior?.amount ?? 0) + Number(tx.amount) })
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount)
}
