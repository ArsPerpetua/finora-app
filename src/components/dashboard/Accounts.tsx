import { useState, type FormEvent } from 'react'
import {
  newId, removeAccount, removeCategory, rupiah, upsertAccount, upsertCategory,
  type Account, type Category, type CategoryType, type FinancialState,
} from '../../lib/finance'
import { EmptyState } from './Dashboard'
import { Icon } from './Icon'

type Updater = (updater: (state: FinancialState) => FinancialState) => Promise<void>

const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: 'cash', label: 'Tunai' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'Dompet digital' },
  { value: 'credit', label: 'Kartu kredit' },
]

function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPES.find(item => item.value === type)?.label ?? type
}

function AccountForm({ initial, onSave, onCancel }: { initial: Account | null; onSave: (account: Account) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'cash')
  const [opening, setOpening] = useState(String(initial?.opening ?? 0))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setErr('Nama akun wajib diisi.')
    const amount = Number(opening.replace(/[^\d-]/g, '') || '0')
    if (!Number.isFinite(amount)) return setErr('Saldo awal tidak valid.')
    setBusy(true)
    setErr('')
    try {
      await onSave({ id: initial?.id ?? newId('acc'), name: trimmed, type, opening: amount })
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Nama akun</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: BCA, GoPay, Tunai" maxLength={40} autoFocus /></label>
      <label className="dash-field"><span>Jenis</span><select value={type} onChange={event => setType(event.target.value)}>{ACCOUNT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="dash-field"><span>Saldo awal</span><input inputMode="numeric" value={opening} onChange={event => setOpening(event.target.value)} placeholder="0" /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan akun'}</button>
      <button type="button" className="dash-button" onClick={onCancel} disabled={busy}>Batal</button>
    </div>
  </form>
}

function AccountsCard({ state, onUpdate }: { state: FinancialState; onUpdate: Updater }) {
  const [mode, setMode] = useState<'closed' | 'new' | string>('closed')

  async function save(account: Account) {
    await onUpdate(current => upsertAccount(current, account))
    setMode('closed')
  }

  async function remove(id: string) {
    if (!window.confirm('Hapus akun ini? Transaksi yang sudah tercatat tidak akan terhapus.')) return
    await onUpdate(current => removeAccount(current, id))
  }

  return <section className="dash-card dash-span-12" aria-labelledby="accounts-title">
    <div className="dash-card-heading">
      <div><h2 id="accounts-title">Akun & dompet</h2><p className="dash-muted">Saldo awal setiap akun dipakai untuk menghitung total saldo Anda.</p></div>
      {mode === 'closed' && <button type="button" className="dash-card-add" onClick={() => setMode('new')}><Icon name="plus" size={15} />Tambah akun</button>}
    </div>
    {mode === 'new' && <AccountForm initial={null} onSave={save} onCancel={() => setMode('closed')} />}
    {state.accounts.length
      ? <ul className="dash-list">{state.accounts.map(account => (
        <li key={account.id} className="dash-row">
          {mode === account.id
            ? <AccountForm initial={account} onSave={save} onCancel={() => setMode('closed')} />
            : <>
              <span className="dash-category-icon" style={{ color: 'var(--lime-ink)', backgroundColor: 'var(--lime-soft)' }}><Icon name="wallet" size={17} /></span>
              <div className="dash-row-main"><strong>{account.name}</strong><span>{accountTypeLabel(account.type)}</span></div>
              <strong className="dash-row-amount">{rupiah(account.opening)}</strong>
              <div className="dash-row-actions">
                <button type="button" aria-label={`Ubah ${account.name}`} onClick={() => setMode(account.id)}><Icon name="edit" size={15} /></button>
                <button type="button" aria-label={`Hapus ${account.name}`} onClick={() => void remove(account.id)}><Icon name="trash" size={15} /></button>
              </div>
            </>}
        </li>
      ))}</ul>
      : mode === 'closed' && <EmptyState title="Belum ada akun">Tambahkan akun seperti Tunai, Bank, atau GoPay untuk mulai menghitung saldo.</EmptyState>}
  </section>
}

function CategoryForm({ initial, defaultType, onSave, onCancel }: { initial: Category | null; defaultType: CategoryType; onSave: (category: Category) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<CategoryType>(initial?.type ?? defaultType)
  const [color, setColor] = useState(initial?.color ?? '#8a9484')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setErr('Nama kategori wajib diisi.')
    setBusy(true)
    setErr('')
    try {
      await onSave({ id: initial?.id ?? newId('cat'), name: trimmed, type, color })
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Nama kategori</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Olahraga" maxLength={30} autoFocus /></label>
      <label className="dash-field"><span>Jenis</span><select value={type} onChange={event => setType(event.target.value as CategoryType)}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>
      <label className="dash-field"><span>Warna</span><input type="color" value={color} onChange={event => setColor(event.target.value)} /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kategori'}</button>
      <button type="button" className="dash-button" onClick={onCancel} disabled={busy}>Batal</button>
    </div>
  </form>
}

function CategoriesCard({ state, onUpdate }: { state: FinancialState; onUpdate: Updater }) {
  const [mode, setMode] = useState<'closed' | 'new' | string>('closed')

  async function save(category: Category) {
    await onUpdate(current => upsertCategory(current, category))
    setMode('closed')
  }

  async function remove(id: string) {
    if (!window.confirm('Hapus kategori ini? Transaksi lama akan tampil sebagai "Lainnya".')) return
    await onUpdate(current => removeCategory(current, id))
  }

  return <section className="dash-card dash-span-12" aria-labelledby="categories-title">
    <div className="dash-card-heading">
      <div><h2 id="categories-title">Kategori kustom</h2><p className="dash-muted">Finora sudah menyediakan kategori bawaan. Tambahkan kategori Anda sendiri di sini.</p></div>
      {mode === 'closed' && <button type="button" className="dash-card-add" onClick={() => setMode('new')}><Icon name="plus" size={15} />Tambah kategori</button>}
    </div>
    {mode === 'new' && <CategoryForm initial={null} defaultType="expense" onSave={save} onCancel={() => setMode('closed')} />}
    {state.cats.length
      ? <ul className="dash-list">{state.cats.map(category => (
        <li key={category.id} className="dash-row">
          {mode === category.id
            ? <CategoryForm initial={category} defaultType={category.type} onSave={save} onCancel={() => setMode('closed')} />
            : <>
              <span className="dash-color-dot" style={{ background: category.color, width: 14, height: 14 }} />
              <div className="dash-row-main"><strong>{category.name}</strong><span>{category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span></div>
              <div className="dash-row-actions">
                <button type="button" aria-label={`Ubah ${category.name}`} onClick={() => setMode(category.id)}><Icon name="edit" size={15} /></button>
                <button type="button" aria-label={`Hapus ${category.name}`} onClick={() => void remove(category.id)}><Icon name="trash" size={15} /></button>
              </div>
            </>}
        </li>
      ))}</ul>
      : mode === 'closed' && <EmptyState title="Belum ada kategori kustom">Kategori bawaan seperti Makan &amp; Minum sudah bisa langsung dipakai lewat Telegram.</EmptyState>}
  </section>
}

export function AccountsScreen({ state, onUpdate }: { state: FinancialState; onUpdate: Updater }) {
  return <div className="dash-grid">
    <AccountsCard state={state} onUpdate={onUpdate} />
    <CategoriesCard state={state} onUpdate={onUpdate} />
  </div>
}
