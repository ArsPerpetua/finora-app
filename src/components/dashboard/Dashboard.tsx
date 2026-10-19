import { useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, useLocation } from 'react-router-dom'
import { config } from '../../config'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useTheme } from '../../hooks/useTheme'
import {
  cashFlow, categoryFor, expenseCategories, filterTransactions, monthLabel, rupiah,
  shiftMonth, sortTransactions, summarize, todayMakassar, totalBalance,
  type FinancialState, type Transaction, type TransactionType,
} from '../../lib/finance'
import { AccountsScreen } from './Accounts'
import { BudgetScreen } from './Budget'
import { CashFlowChart } from './CashFlowChart'
import { GoalsScreen } from './Goals'
import { Icon } from './Icon'
import { ReportScreen } from './Report'
import { TransactionFormDialog } from './TransactionForm'
import { TransactionList } from './TransactionList'

interface Props {
  userId: string
  name: string
  activeUntil: string | null
  isActive: boolean
  telegramLinked: boolean
  onSignOut: () => Promise<void>
  children: ReactNode
}

const expiryFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' })
const timeFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })
const botUrl = config.telegramBot ? `https://t.me/${config.telegramBot.replace(/^@/, '')}` : ''

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return <nav className={mobile ? 'dash-bottom-nav' : 'dash-navigation'} aria-label={mobile ? 'Navigasi ponsel' : 'Dashboard'}>
    <NavLink end to="/app"><Icon name="home" /><span>Beranda</span></NavLink>
    <NavLink to="/app/transaksi"><Icon name="list" /><span>Transaksi</span></NavLink>
    <NavLink to="/app/akun"><Icon name="wallet" /><span>Akun</span></NavLink>
    <NavLink to="/app/anggaran"><Icon name="chart" /><span>Anggaran</span></NavLink>
    <NavLink to="/app/tabungan"><Icon name="target" /><span>Tabungan</span></NavLink>
    <NavLink to="/app/laporan"><Icon name="trend" /><span>Laporan</span></NavLink>
    {mobile && botUrl && <a href={botUrl} target="_blank" rel="noopener noreferrer"><Icon name="telegram" /><span>Catat</span></a>}
  </nav>
}

function TelegramAction({ className = 'dash-button dash-button-primary' }: { className?: string }) {
  return botUrl
    ? <a className={className} href={botUrl} target="_blank" rel="noopener noreferrer"><Icon name="telegram" size={18} />Catat lewat Telegram<span className="sr-only">, buka tab baru</span></a>
    : <a className={className} href="#telegram"><Icon name="telegram" size={18} />Tautkan Telegram</a>
}

function AddTransactionButton({ className = 'dash-button dash-button-primary dash-add-tx', onClick }: { className?: string; onClick: () => void }) {
  return <button type="button" className={className} onClick={onClick}><Icon name="plus" size={18} /><span>Catat transaksi</span></button>
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="dash-empty"><span className="dash-empty-icon"><Icon name="list" size={27} /></span><h3>{title}</h3><p>{children}</p></div>
}

function MonthPicker({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return <div className="dash-month-picker">
    <button type="button" className="dash-icon-button" aria-label="Bulan sebelumnya" disabled={month === '0001-01'} onClick={() => onChange(shiftMonth(month, -1))}><Icon name="left" size={17} /></button>
    <label>
      <span aria-hidden="true">{monthLabel(month)}</span><Icon name="calendar" size={14} />
      <input aria-label="Bulan ringkasan" type="month" min="0001-01" max="9999-12" value={month}
        onClick={event => { try { event.currentTarget.showPicker?.() } catch { /* Tetap mendukung input bulan bawaan browser. */ } }}
        onChange={event => {
          const next = event.target.value
          if (/^\d{4}-(0[1-9]|1[0-2])$/.test(next) && !next.startsWith('0000')) onChange(next)
        }} />
    </label>
    <button type="button" className="dash-icon-button" aria-label="Bulan berikutnya" disabled={month === '9999-12'} onClick={() => onChange(shiftMonth(month, 1))}><Icon name="right" size={17} /></button>
  </div>
}

function Categories({ transactions, state }: { transactions: Transaction[]; state: FinancialState }) {
  const categories = expenseCategories(transactions, state)
  const total = categories.reduce((sum, item) => sum + item.amount, 0)
  let cursor = 0
  const gradient = categories.map(item => {
    const start = cursor
    cursor += item.amount / total * 100
    return `${item.color} ${start}% ${cursor}%`
  }).join(', ')
  return <section className="dash-card dash-span-5" aria-labelledby="category-title">
    <div className="dash-card-heading"><h2 id="category-title">Pengeluaran per kategori</h2><span className="dash-muted">Bulan terpilih</span></div>
    {categories.length ? <><div className="dash-category-chart"><div className="dash-donut" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`Total pengeluaran ${rupiah(total)} dalam ${categories.length} kategori`}><div><strong>{categories.length}</strong><span>kategori</span></div></div><div><span className="dash-muted">Total pengeluaran</span><strong className="dash-category-total">{rupiah(total)}</strong><span className="dash-muted">Dari catatan Anda</span></div></div>
      <ul className="dash-category-legend">{categories.map(item => <li key={item.id}><span className="dash-color-dot" style={{ background: item.color }} /><span>{item.name}</span><strong>{rupiah(item.amount)}</strong><small>{Math.round(item.amount / total * 100)}%</small></li>)}</ul></>
      : <EmptyState title="Belum ada pengeluaran">Kategori akan tampil setelah Anda mencatat pengeluaran pada bulan ini.</EmptyState>}
  </section>
}

function Overview({ transactions, state, month, linked, active, onAddTransaction }: { transactions: Transaction[]; state: FinancialState; month: string; linked: boolean; active: boolean; onAddTransaction: () => void }) {
  const [hideBalance, setHideBalance] = useState(false)
  const selected = useMemo(() => sortTransactions(transactions.filter(tx => tx.tx_date.startsWith(month + '-'))), [transactions, month])
  const totals = summarize(selected)
  const flow = useMemo(() => cashFlow(transactions, month), [transactions, month])
  const categories = expenseCategories(selected, state)
  return <div className="dash-grid">
    <section className="dash-balance dash-span-7" aria-labelledby="balance-title">
      <svg className="dash-balance-decoration" viewBox="0 0 320 220" aria-hidden="true"><circle cx="250" cy="40" r="110" /><circle cx="250" cy="40" r="85" /><circle cx="250" cy="40" r="60" /><circle cx="250" cy="40" r="35" /></svg>
      <div className="dash-balance-label"><Icon name="wallet" size={18} /><h2 id="balance-title">Total saldo</h2><span className="dash-balance-badge">Rupiah</span></div>
      <div className="dash-balance-number"><strong>{hideBalance ? '••••••••' : rupiah(totalBalance(transactions, state))}</strong><button type="button" className="dash-icon-button" onClick={() => setHideBalance(value => !value)} aria-label={hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'} aria-pressed={hideBalance}><Icon name={hideBalance ? 'eyeoff' : 'eye'} /></button></div>
      <p className="dash-balance-caption">Saldo saat ini dari seluruh riwayat catatan Anda.</p>
      <div className="dash-balance-split"><div><span><Icon name="income" size={15} />Pemasukan</span><strong>{rupiah(totals.income)}</strong></div><div><span><Icon name="expense" size={15} />Pengeluaran</span><strong>{rupiah(totals.expense)}</strong></div></div>
      <div className="dash-balance-period"><span className="dash-status-dot" />Ringkasan pemasukan dan pengeluaran · {monthLabel(month)}</div>
    </section>

    <section className="dash-card dash-quick dash-span-5" aria-labelledby="quick-title">
      <span className="dash-eyebrow">CATATAN KECIL, LANGKAH BESAR</span><h2 id="quick-title">Kenali keuangan Anda,<br />satu catatan setiap hari.</h2>
      <p>Kirim <code>makan siang 25000</code> ke bot. Catatan Anda akan tersimpan dan tampil di dashboard.</p>
      <div className="dash-quick-links">
        {active && <button type="button" className="dash-quick-link" onClick={onAddTransaction}><span><Icon name="plus" />Catat transaksi</span><Icon name="right" size={17} /></button>}
        <Link to="/app/transaksi" className="dash-quick-link"><span><Icon name="list" />Lihat transaksi</span><Icon name="right" size={17} /></Link>
        <TelegramAction className="dash-quick-link" />
      </div>
      <span className={`dash-connection ${linked && active ? 'is-linked' : ''}`}><Icon name={linked && active ? 'check' : 'telegram'} size={15} />{!active ? 'Aktifkan akses untuk mulai mencatat' : linked ? 'Telegram Anda sudah terhubung' : 'Tautkan Telegram Anda di bawah'}</span>
    </section>

    <div className="dash-stats dash-span-12">
      <section className="dash-stat"><span className="dash-stat-icon"><Icon name="transfer" /></span><div><h2>Selisih bulan terpilih</h2><strong className={totals.net >= 0 ? 'dash-positive' : 'dash-negative'}>{rupiah(totals.net)}</strong><p>Pemasukan dikurangi pengeluaran</p></div></section>
      <section className="dash-stat"><span className="dash-stat-icon"><Icon name="list" /></span><div><h2>Transaksi tercatat</h2><strong>{totals.count}<small> transaksi</small></strong><p>Pada {monthLabel(month)}</p></div></section>
      <section className="dash-stat"><span className="dash-stat-icon"><Icon name="tag" /></span><div><h2>Pengeluaran terbesar</h2><strong className="dash-stat-category">{categories[0]?.name ?? '—'}</strong><p>{categories[0] ? rupiah(categories[0].amount) : 'Belum ada pengeluaran bulan ini'}</p></div></section>
    </div>

    <section className="dash-card dash-span-7" aria-labelledby="cash-flow-title"><div className="dash-card-heading"><h2 id="cash-flow-title">Arus kas 6 bulan</h2><div className="dash-chart-legend"><span><i className="is-income" />Pemasukan</span><span><i className="is-expense" />Pengeluaran</span></div></div>
      {flow.some(point => point.income || point.expense) ? <CashFlowChart flow={flow} /> : <EmptyState title="Grafik Anda dimulai di sini">Pemasukan dan pengeluaran dari enam bulan terakhir akan membentuk arus kas Anda.</EmptyState>}
    </section>
    <Categories transactions={selected} state={state} />

    <section className="dash-card dash-span-12" aria-labelledby="recent-title"><div className="dash-card-heading"><div><h2 id="recent-title">Transaksi terbaru</h2><p className="dash-muted">Catatan pada {monthLabel(month)}</p></div><Link className="dash-text-link" to="/app/transaksi">Lihat semua <Icon name="right" size={15} /></Link></div>
      {selected.length ? <TransactionList transactions={selected.slice(0, 6)} state={state} /> : <><EmptyState title="Belum ada transaksi bulan ini">Mulai dengan mencatat pemasukan atau pengeluaran lewat web atau Telegram.</EmptyState><div className="dash-empty-action">{active && <AddTransactionButton onClick={onAddTransaction} />}<TelegramAction /></div></>}
    </section>
  </div>
}

function Transactions({ transactions, state, month, active, onAddTransaction }: { transactions: Transaction[]; state: FinancialState; month: string; active: boolean; onAddTransaction: () => void }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [category, setCategory] = useState('all')
  const [allMonths, setAllMonths] = useState(false)
  const [pagination, setPagination] = useState({ key: '', limit: 30 })
  const filtered = useMemo(() => filterTransactions(transactions, state, { month, allMonths, type, category, query }), [transactions, state, month, allMonths, type, category, query])
  const filterKey = JSON.stringify([month, allMonths, type, category, query])
  const limit = pagination.key === filterKey ? pagination.limit : 30
  const totals = summarize(filtered)
  const categories = [...new Map(transactions.map(tx => { const item = categoryFor(tx, state); return [item.id, item] as const })).values()].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'))
  return <section className="dash-card" aria-labelledby="transactions-title">
    <div className="dash-card-heading"><div><h2 id="transactions-title">Semua catatan Anda</h2><p className="dash-muted">Telusuri pemasukan, pengeluaran, dan transfer.</p></div><div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><span className="dash-count">{filtered.length} transaksi</span>{active && <AddTransactionButton className="dash-card-add" onClick={onAddTransaction} />}</div></div>
    <div className="dash-filters"><div className="dash-search"><label className="sr-only" htmlFor="transaction-search">Cari transaksi</label><Icon name="search" size={18} /><input id="transaction-search" type="search" placeholder="Cari judul, catatan, kategori…" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <label className="dash-filter"><span>Jenis transaksi</span><select aria-label="Jenis transaksi" value={type} onChange={event => { setType(event.target.value as TransactionType | 'all'); setCategory('all') }}><option value="all">Semua jenis</option><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option><option value="transfer">Transfer</option></select></label>
      <label className="dash-filter"><span>Kategori</span><select aria-label="Kategori" value={category} onChange={event => setCategory(event.target.value)}><option value="all">Semua kategori</option>{categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="dash-all-months"><input type="checkbox" checked={allMonths} onChange={event => setAllMonths(event.target.checked)} />Semua bulan</label>
    </div>
    <div className="dash-filter-summary" aria-live="polite"><div><span>Pemasukan</span><strong className="dash-positive">{rupiah(totals.income)}</strong></div><div><span>Pengeluaran</span><strong className="dash-negative">{rupiah(totals.expense)}</strong></div><div><span>Selisih</span><strong>{rupiah(totals.net)}</strong></div></div>
    <p className="dash-result-label" role="status">{filtered.length} transaksi · {allMonths ? 'Semua bulan' : monthLabel(month)}{query ? ` · Pencarian “${query}”` : ''}</p>
    {filtered.length ? <TransactionList transactions={filtered.slice(0, limit)} state={state} /> : <EmptyState title={transactions.length ? 'Tidak ada transaksi yang cocok' : 'Catatan pertama Anda menunggu'}>{transactions.length ? 'Coba bulan lain atau ubah filter pencarian Anda.' : 'Kirim pemasukan atau pengeluaran lewat bot Telegram untuk mulai mencatat.'}</EmptyState>}
    {filtered.length > limit && <div className="dash-load-more"><button type="button" className="dash-button" onClick={() => setPagination({ key: filterKey, limit: limit + 30 })}>Muat lebih banyak <span>({filtered.length - limit} lagi)</span></button></div>}
  </section>
}

const PAGES = {
  beranda: { match: /^\/app\/?$/, title: 'Beranda', greeting: 'Mari lihat perjalanan keuangan Anda.' },
  transaksi: { match: /^\/app\/transaksi\/?$/, title: 'Transaksi', greeting: 'Setiap catatan punya cerita.' },
  akun: { match: /^\/app\/akun\/?$/, title: 'Akun & Dompet', greeting: 'Kelola akun dan kategori Anda.' },
  anggaran: { match: /^\/app\/anggaran\/?$/, title: 'Anggaran', greeting: 'Pantau rencana pengeluaran bulanan Anda.' },
  tabungan: { match: /^\/app\/tabungan\/?$/, title: 'Tabungan', greeting: 'Rencanakan dan kejar tujuan Anda.' },
  laporan: { match: /^\/app\/laporan\/?$/, title: 'Laporan', greeting: 'Tinjau performa keuangan bulanan Anda.' },
} as const

type PageKey = keyof typeof PAGES

export function Dashboard({ userId, name, activeUntil, isActive, telegramLinked, onSignOut, children }: Props) {
  const data = useDashboardData(userId)
  const toggleTheme = useTheme()
  const location = useLocation()
  const [month, setMonth] = useState(() => todayMakassar().slice(0, 7))
  const [txOpen, setTxOpen] = useState(false)
  const page = (Object.keys(PAGES) as PageKey[]).find(key => PAGES[key].match.test(location.pathname))
  const displayName = name.trim() || 'Anda'
  const initials = displayName.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
  const expiry = activeUntil ? expiryFormat.format(new Date(activeUntil)) : null
  if (!page) return <Navigate to="/app" replace />
  return <div className="finora-dashboard">
    <a className="skip" href="#dashboard-content">Lewati ke isi dashboard</a>
    <aside className="dash-sidebar"><Link to="/app" className="dash-brand" aria-label="Finora, Beranda"><span>F</span>Finora</Link><p className="dash-sidebar-label">KEUANGAN PRIBADI</p><Navigation />
      <div className="dash-sidebar-bottom"><div className="dash-sidebar-note"><span className="dash-small-spark">✦</span><strong>Selangkah lebih teratur.</strong><p>Kenali uang Anda.<br />Rencanakan hari esok.</p></div><div className="dash-user"><span className="dash-avatar">{initials}</span><div><strong>{displayName}</strong><span>{isActive ? 'Akses aktif' : 'Akses perlu diaktifkan'}</span></div></div><button type="button" className="dash-logout" onClick={() => void onSignOut()}><Icon name="logout" size={17} />Keluar</button></div>
    </aside>
    <main className="dash-main" id="dashboard-content" tabIndex={-1}>
      <header className="dash-topbar"><div><p className="dash-eyebrow">RUANG KEUANGAN ANDA</p><h1>{PAGES[page].title}</h1><p className="dash-greeting">Halo, {displayName}. {PAGES[page].greeting}</p></div><div className="dash-top-actions">{isActive && <AddTransactionButton onClick={() => setTxOpen(true)} />}<button className="dash-icon-button" type="button" onClick={toggleTheme} aria-label="Ganti tema terang atau gelap"><Icon name="theme" /></button><button className="dash-mobile-logout dash-icon-button" type="button" onClick={() => void onSignOut()} aria-label="Keluar dari akun"><Icon name="logout" /></button><span className="dash-desktop-action"><TelegramAction /></span></div></header>
      {(page === 'beranda' || page === 'transaksi' || page === 'anggaran' || page === 'laporan') && <div className="dash-period-row"><MonthPicker month={month} onChange={setMonth} /><div className="dash-update"><span className="dash-updated-label" role="status">{data.loading ? 'Memperbarui catatan…' : data.updatedAt ? `Diperbarui ${timeFormat.format(data.updatedAt)} WITA` : 'Belum ada data terbaru'}</span><button type="button" className="dash-button dash-refresh" disabled={data.loading} onClick={data.refresh}><Icon name="refresh" size={16} className={data.loading ? 'dash-spin' : ''} /><span>Perbarui</span></button></div></div>}
      {!isActive && <div className="dash-notice"><Icon name="calendar" /><div><strong>{expiry ? 'Masa aktif Anda telah berakhir.' : 'Aktifkan akun Anda.'}</strong><p>Riwayat tetap dapat dibaca. Masukkan kode lisensi pada bagian akses akun untuk melanjutkan pencatatan.</p><a href="#telegram">Aktivasi akses akun <span aria-hidden="true">→</span></a></div></div>}
      {data.error && <div className="dash-error" role="alert"><strong>{data.error}</strong>{data.hasData && <p>Ringkasan masih menampilkan pembaruan terakhir.</p>}<button type="button" className="dash-text-link" onClick={data.refresh}>Coba lagi</button></div>}
      <div aria-busy={data.loading}>
        {!data.hasData && data.loading ? <div className="dash-skeleton" role="status"><span className="sr-only">Memuat ringkasan dan transaksi Anda.</span><div /><div /><div /></div>
          : data.hasData ? (
            page === 'transaksi' ? <Transactions transactions={data.transactions} state={data.financialState} month={month} active={isActive} onAddTransaction={() => setTxOpen(true)} />
              : page === 'akun' ? <AccountsScreen state={data.financialState} onUpdate={data.updateState} />
                : page === 'anggaran' ? <BudgetScreen transactions={data.transactions} state={data.financialState} month={month} onUpdate={data.updateState} />
                  : page === 'tabungan' ? <GoalsScreen state={data.financialState} onUpdate={data.updateState} />
                    : page === 'laporan' ? <ReportScreen transactions={data.transactions} state={data.financialState} month={month} />
                      : <Overview transactions={data.transactions} state={data.financialState} month={month} linked={telegramLinked} active={isActive} onAddTransaction={() => setTxOpen(true)} />
          )
            : <section className="dash-card"><EmptyState title="Catatan belum dapat dimuat">Gunakan tombol Coba lagi untuk membaca ulang data Anda.</EmptyState></section>}
      </div>
      <section id="telegram" className="dash-account-section" aria-label="Akses akun dan Telegram"><details open={!telegramLinked || !isActive}><summary><span><Icon name="telegram" size={19} /><strong>Akses akun & Telegram</strong></span><span className="dash-muted">{isActive && expiry ? `Aktif sampai ${expiry}` : 'Aktivasi akses'}</span></summary><div className="dash-account-panel">{children}</div></details></section>
      <footer className="dash-footer"><span>Finora <span aria-hidden="true">·</span> Catatan hari ini, rencana esok hari.</span><span>Rupiah · WITA</span></footer>
    </main>
    <Navigation mobile />
    <TransactionFormDialog open={txOpen} onClose={() => setTxOpen(false)} userId={userId} state={data.financialState} onSaved={data.refresh} />
  </div>
}
