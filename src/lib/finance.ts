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
  fee?: number | string
}

export interface Account {
  id: string
  name: string
  type: string
  opening: number
  color: string
}

export const ACCOUNT_COLORS = ['#4f8cff', '#2bb892', '#f2a93b', '#e8625f', '#9b7bff', '#36b8d8', '#d96ba8', '#8a96ad']

export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  color: string
  type: CategoryType
  icon: string
}

/** Ikon yang bisa dipilih untuk kategori kustom. "receipt" dipakai khusus kategori sistem "Biaya & Admin", tidak ditawarkan di pemilih. */
export const CATEGORY_ICONS = [
  'utensils', 'car', 'bag', 'bolt', 'home', 'film', 'heart', 'book', 'plane', 'gift',
  'repeat', 'coffee', 'briefcase', 'trend', 'coin', 'phone', 'tv', 'music', 'cloud', 'dots',
]

export interface Budget {
  total: number
  cats: Record<string, number>
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
}

export interface FinancialState {
  accounts: Account[]
  cats: Category[]
  budget: Budget
  goals: Goal[]
  defaultAccountId: string | null
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Makan & Minum', color: '#88a93c', type: 'expense', icon: 'utensils' },
  { id: 'transport', name: 'Transportasi', color: '#508bd5', type: 'expense', icon: 'car' },
  { id: 'shopping', name: 'Belanja', color: '#ae78cd', type: 'expense', icon: 'bag' },
  { id: 'bills', name: 'Tagihan & Utilitas', color: '#df9a40', type: 'expense', icon: 'bolt' },
  { id: 'subs', name: 'Langganan', color: '#718acb', type: 'expense', icon: 'repeat' },
  { id: 'home', name: 'Rumah & Sewa', color: '#c28e65', type: 'expense', icon: 'home' },
  { id: 'entertainment', name: 'Hiburan', color: '#d56a99', type: 'expense', icon: 'film' },
  { id: 'health', name: 'Kesehatan', color: '#4aab9b', type: 'expense', icon: 'heart' },
  { id: 'edu', name: 'Pendidikan', color: '#a38a53', type: 'expense', icon: 'book' },
  { id: 'travel', name: 'Liburan', color: '#40a1b5', type: 'expense', icon: 'plane' },
  { id: 'gift', name: 'Hadiah & Donasi', color: '#bf7e9f', type: 'expense', icon: 'gift' },
  { id: 'other', name: 'Lainnya', color: '#8a9484', type: 'expense', icon: 'dots' },
  { id: 'fees', name: 'Biaya & Admin', color: '#8a96ad', type: 'expense', icon: 'receipt' },
  { id: 'salary', name: 'Gaji', color: '#88a93c', type: 'income', icon: 'briefcase' },
  { id: 'bonus', name: 'Bonus', color: '#cf9f38', type: 'income', icon: 'gift' },
  { id: 'freelance', name: 'Freelance', color: '#508bd5', type: 'income', icon: 'coffee' },
  { id: 'business', name: 'Bisnis', color: '#4aab9b', type: 'income', icon: 'bag' },
  { id: 'invest', name: 'Investasi', color: '#ae78cd', type: 'income', icon: 'trend' },
  { id: 'otherinc', name: 'Pemasukan lain', color: '#8a9484', type: 'income', icon: 'coin' },
]

export function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `${prefix}_${random.replace(/-/g, '').slice(0, 10)}`
}

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
  const goals: Goal[] = []
  if (Array.isArray(root.accounts)) for (const item of root.accounts) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string') continue
    const opening = Number(item.opening ?? 0)
    accounts.push({
      id: item.id, name: item.name, type: String(item.type ?? 'cash'), opening: Number.isFinite(opening) ? opening : 0,
      color: typeof item.color === 'string' && /^#[a-f\d]{6}$/i.test(item.color) ? item.color : ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
    })
  }
  if (Array.isArray(root.cats)) for (const item of root.cats) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string') continue
    cats.push({
      id: item.id, name: item.name,
      color: typeof item.color === 'string' && /^#[a-f\d]{6}$/i.test(item.color) ? item.color : '#8a9484',
      type: item.type === 'income' ? 'income' : 'expense',
      icon: typeof item.icon === 'string' && CATEGORY_ICONS.includes(item.icon) ? item.icon : 'dots',
    })
  }
  if (Array.isArray(root.goals)) for (const item of root.goals) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string') continue
    const target = Number(item.target ?? 0)
    const saved = Number(item.saved ?? 0)
    goals.push({ id: item.id, name: item.name, target: Number.isFinite(target) && target > 0 ? target : 0, saved: Number.isFinite(saved) ? saved : 0 })
  }
  const budgetRoot = root.budget && typeof root.budget === 'object' ? root.budget as Record<string, unknown> : {}
  const total = Number(budgetRoot.total ?? 0)
  const budgetCats: Record<string, number> = {}
  if (budgetRoot.cats && typeof budgetRoot.cats === 'object') {
    for (const [key, raw] of Object.entries(budgetRoot.cats as Record<string, unknown>)) {
      const limit = Number(raw)
      if (Number.isFinite(limit) && limit > 0) budgetCats[key] = limit
    }
  }
  const defaultAccountId = typeof root.defaultAccountId === 'string' && accounts.some(account => account.id === root.defaultAccountId) ? root.defaultAccountId : null
  return { accounts, cats, goals, defaultAccountId, budget: { total: Number.isFinite(total) && total > 0 ? total : 0, cats: budgetCats } }
}

export function categoryFor(tx: Transaction, state: FinancialState): Category {
  if (tx.type === 'transfer') return { id: 'transfer', name: 'Transfer antar akun', color: '#8a9484', type: 'expense', icon: 'transfer' }
  return state.cats.find(category => category.id === tx.cat_id)
    ?? DEFAULT_CATEGORIES.find(category => category.id === tx.cat_id)
    ?? { id: tx.cat_id ?? (tx.type === 'income' ? 'otherinc' : 'other'), name: tx.type === 'income' ? 'Pemasukan lain' : 'Lainnya', color: '#8a9484', type: tx.type === 'income' ? 'income' : 'expense', icon: 'dots' }
}

/** Kategori "Biaya & Admin" untuk biaya transfer — dipisah dari categoryFor karena biaya menumpang pada transaksi transfer, bukan kategori baris itu sendiri. */
function feesCategory(state: FinancialState): Category {
  return state.cats.find(category => category.id === 'fees')
    ?? DEFAULT_CATEGORIES.find(category => category.id === 'fees')!
}

/** Biaya admin transfer: 0 untuk transaksi bukan transfer. */
export function transferFee(tx: Transaction): number {
  return tx.type === 'transfer' ? Number(tx.fee ?? 0) : 0
}

function categoryOptions(state: FinancialState, type: CategoryType): Category[] {
  const map = new Map<string, Category>()
  for (const category of DEFAULT_CATEGORIES) if (category.type === type) map.set(category.id, category)
  for (const category of state.cats) if (category.type === type) map.set(category.id, category)
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'))
}

/** Kategori pengeluaran yang bisa dipilih pengguna: bawaan + kustom, tanpa duplikat id. */
export function expenseCategoryOptions(state: FinancialState): Category[] {
  return categoryOptions(state, 'expense')
}

/** Kategori pemasukan yang bisa dipilih pengguna: bawaan + kustom, tanpa duplikat id. */
export function incomeCategoryOptions(state: FinancialState): Category[] {
  return categoryOptions(state, 'income')
}

export function upsertAccount(state: FinancialState, account: Account): FinancialState {
  const exists = state.accounts.some(item => item.id === account.id)
  return { ...state, accounts: exists ? state.accounts.map(item => item.id === account.id ? account : item) : [...state.accounts, account] }
}

export function removeAccount(state: FinancialState, id: string): FinancialState {
  return {
    ...state,
    accounts: state.accounts.filter(item => item.id !== id),
    defaultAccountId: state.defaultAccountId === id ? null : state.defaultAccountId,
  }
}

export function setDefaultAccount(state: FinancialState, id: string | null): FinancialState {
  return { ...state, defaultAccountId: id }
}

/** Akun yang masih dipakai transaksi tidak boleh dihapus, supaya riwayat tidak kehilangan rujukan akunnya. */
export function isAccountInUse(accountId: string, transactions: readonly Transaction[]): boolean {
  return transactions.some(tx => tx.account_id === accountId || tx.to_account_id === accountId)
}

export function upsertCategory(state: FinancialState, category: Category): FinancialState {
  const exists = state.cats.some(item => item.id === category.id)
  return { ...state, cats: exists ? state.cats.map(item => item.id === category.id ? category : item) : [...state.cats, category] }
}

export function removeCategory(state: FinancialState, id: string): FinancialState {
  const cats = { ...state.budget.cats }
  delete cats[id]
  return { ...state, cats: state.cats.filter(item => item.id !== id), budget: { ...state.budget, cats } }
}

export function upsertGoal(state: FinancialState, goal: Goal): FinancialState {
  const exists = state.goals.some(item => item.id === goal.id)
  return { ...state, goals: exists ? state.goals.map(item => item.id === goal.id ? goal : item) : [...state.goals, goal] }
}

export function removeGoal(state: FinancialState, id: string): FinancialState {
  return { ...state, goals: state.goals.filter(item => item.id !== id) }
}

export function contributeToGoal(state: FinancialState, id: string, amount: number): FinancialState {
  return { ...state, goals: state.goals.map(goal => goal.id === id ? { ...goal, saved: Math.max(0, goal.saved + amount) } : goal) }
}

export function goalProgress(goal: Goal) {
  const ratio = goal.target > 0 ? Math.min(1, Math.max(0, goal.saved / goal.target)) : 0
  return { ratio, remaining: Math.max(0, goal.target - goal.saved), done: goal.target > 0 && goal.saved >= goal.target }
}

export function setBudgetTotal(state: FinancialState, total: number): FinancialState {
  return { ...state, budget: { ...state.budget, total: Math.max(0, total) } }
}

export function setCategoryBudget(state: FinancialState, categoryId: string, limit: number): FinancialState {
  const cats = { ...state.budget.cats }
  if (limit > 0) cats[categoryId] = limit
  else delete cats[categoryId]
  return { ...state, budget: { ...state.budget, cats } }
}

export interface BudgetCategoryStat extends Category {
  limit: number
  spent: number
}

/** Ringkasan anggaran bulanan sederhana: batas total dan per kategori dibandingkan pengeluaran nyata. */
export function budgetStats(transactionsForMonth: readonly Transaction[], state: FinancialState) {
  const spentByCategory = new Map<string, number>()
  let totalSpent = 0
  for (const tx of transactionsForMonth) {
    if (tx.type === 'expense') {
      const amount = Number(tx.amount)
      totalSpent += amount
      const category = categoryFor(tx, state)
      spentByCategory.set(category.id, (spentByCategory.get(category.id) ?? 0) + amount)
    }
    const fee = transferFee(tx)
    if (fee > 0) {
      totalSpent += fee
      const category = feesCategory(state)
      spentByCategory.set(category.id, (spentByCategory.get(category.id) ?? 0) + fee)
    }
  }
  const limitedIds = Object.keys(state.budget.cats)
  const categoryIds = new Set([...limitedIds, ...spentByCategory.keys()])
  const categories: BudgetCategoryStat[] = [...categoryIds].map(id => {
    const category = state.cats.find(item => item.id === id) ?? DEFAULT_CATEGORIES.find(item => item.id === id)
      ?? { id, name: id, color: '#8a9484', type: 'expense' as const, icon: 'dots' }
    return { ...category, limit: state.budget.cats[id] ?? 0, spent: spentByCategory.get(id) ?? 0 }
  }).sort((a, b) => b.spent - a.spent || b.limit - a.limit)
  const totalLimit = state.budget.total > 0 ? state.budget.total : limitedIds.reduce((sum, id) => sum + state.budget.cats[id], 0)
  return { total: { limit: totalLimit, spent: totalSpent }, categories }
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
    expense += transferFee(tx)
  }
  const net = income - expense
  return { income, expense, net, count: transactions.length, rate: income > 0 ? net / income : null }
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
  account?: string
  query: string
}

export function filterTransactions(transactions: readonly Transaction[], state: FinancialState, filters: TransactionFilters): Transaction[] {
  const query = filters.query.trim().toLocaleLowerCase('id-ID')
  return sortTransactions(transactions.filter(tx => {
    if (!filters.allMonths && !tx.tx_date.startsWith(filters.month + '-')) return false
    if (filters.type !== 'all' && tx.type !== filters.type) return false
    if (filters.category !== 'all' && categoryFor(tx, state).id !== filters.category) return false
    if (filters.account && filters.account !== 'all' && tx.account_id !== filters.account && tx.to_account_id !== filters.account) return false
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
  const add = (category: Category, amount: number) => {
    const prior = totals.get(category.id)
    totals.set(category.id, { ...category, amount: (prior?.amount ?? 0) + amount })
  }
  for (const tx of transactions) {
    if (tx.type === 'expense') add(categoryFor(tx, state), Number(tx.amount))
    const fee = transferFee(tx)
    if (fee > 0) add(feesCategory(state), fee)
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount)
}

export interface CategoryComparison extends Category {
  amount: number
  previousAmount: number
  share: number
  changePercent: number | null
}

/** Pengeluaran per kategori bulan terpilih dibandingkan bulan sebelumnya, untuk laporan bulanan. */
export function categoryComparison(current: readonly Transaction[], previous: readonly Transaction[], state: FinancialState): CategoryComparison[] {
  const currentCategories = expenseCategories(current, state)
  const previousAmounts = new Map(expenseCategories(previous, state).map(item => [item.id, item.amount]))
  const total = currentCategories.reduce((sum, item) => sum + item.amount, 0)
  return currentCategories.map(item => {
    const previousAmount = previousAmounts.get(item.id) ?? 0
    return {
      ...item,
      previousAmount,
      share: total > 0 ? item.amount / total : 0,
      changePercent: previousAmount > 0 ? Math.round((item.amount - previousAmount) / previousAmount * 100) : null,
    }
  })
}
