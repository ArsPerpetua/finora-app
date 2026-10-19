import { useState, type FormEvent } from 'react'
import {
  budgetStats, expenseCategoryOptions, monthLabel, rupiah, setBudgetTotal, setCategoryBudget,
  type FinancialState, type Transaction,
} from '../../lib/finance'
import { EmptyState } from './Dashboard'
import { Icon } from './Icon'

type Updater = (updater: (state: FinancialState) => FinancialState) => Promise<void>

function parseAmount(value: string): number {
  const n = Number(value.replace(/[^\d]/g, '') || '0')
  return Number.isFinite(n) ? n : 0
}

function TotalBudgetForm({ total, onUpdate }: { total: number; onUpdate: Updater }) {
  const [value, setValue] = useState(String(total))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await onUpdate(current => setBudgetTotal(current, parseAmount(value)))
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Batas pengeluaran per bulan</span><input inputMode="numeric" value={value} onChange={event => setValue(event.target.value)} placeholder="Contoh: 3000000" /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan batas'}</button>
      <p className="dash-muted" style={{ fontSize: 10 }}>Kosongkan atau isi 0 untuk memakai jumlah dari batas per kategori di bawah.</p>
    </div>
  </form>
}

function CategoryLimitForm({ state, onUpdate, onDone }: { state: FinancialState; onUpdate: Updater; onDone: () => void }) {
  const options = expenseCategoryOptions(state)
  const [categoryId, setCategoryId] = useState(options[0]?.id ?? '')
  const [limit, setLimit] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!categoryId) return setErr('Pilih kategori terlebih dahulu.')
    setBusy(true)
    setErr('')
    try {
      await onUpdate(current => setCategoryBudget(current, categoryId, parseAmount(limit)))
      onDone()
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Kategori</span><select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{options.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="dash-field"><span>Batas per bulan</span><input inputMode="numeric" value={limit} onChange={event => setLimit(event.target.value)} placeholder="Contoh: 500000" autoFocus /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan batas kategori'}</button>
      <button type="button" className="dash-button" onClick={onDone} disabled={busy}>Batal</button>
    </div>
  </form>
}

export function BudgetScreen({ transactions, state, month, onUpdate }: { transactions: Transaction[]; state: FinancialState; month: string; onUpdate: Updater }) {
  const [addingLimit, setAddingLimit] = useState(false)
  const selected = transactions.filter(tx => tx.tx_date.startsWith(month + '-'))
  const stats = budgetStats(selected, state)
  const totalRatio = stats.total.limit > 0 ? Math.min(1, stats.total.spent / stats.total.limit) : 0
  const totalOver = stats.total.limit > 0 && stats.total.spent > stats.total.limit

  async function removeLimit(categoryId: string) {
    await onUpdate(current => setCategoryBudget(current, categoryId, 0))
  }

  return <div className="dash-grid">
    <section className="dash-card dash-span-12" aria-labelledby="budget-total-title">
      <div className="dash-card-heading"><div><h2 id="budget-total-title">Anggaran bulan {monthLabel(month)}</h2><p className="dash-muted">Bandingkan rencana pengeluaran dengan catatan transaksi Anda.</p></div></div>
      {stats.total.limit > 0
        ? <>
          <div className="dash-budget-summary"><span>Terpakai</span><strong className={totalOver ? 'dash-negative' : ''}>{rupiah(stats.total.spent)}</strong><span className="dash-muted">dari {rupiah(stats.total.limit)}</span></div>
          <div className={`dash-progress${totalOver ? ' is-over' : ''}`}><i style={{ width: `${totalRatio * 100}%` }} /></div>
          {totalOver && <p className="dash-muted" style={{ color: 'var(--err)', fontSize: 11, marginTop: 8 }}>Pengeluaran sudah melewati batas bulan ini.</p>}
        </>
        : <EmptyState title="Belum ada batas anggaran">Tentukan batas pengeluaran per bulan supaya Finora bisa membantu memantau.</EmptyState>}
      <TotalBudgetForm total={state.budget.total} onUpdate={onUpdate} />
    </section>

    <section className="dash-card dash-span-12" aria-labelledby="budget-cats-title">
      <div className="dash-card-heading">
        <div><h2 id="budget-cats-title">Batas per kategori</h2><p className="dash-muted">Opsional. Pantau kategori yang sering membengkak.</p></div>
        {!addingLimit && <button type="button" className="dash-card-add" onClick={() => setAddingLimit(true)}><Icon name="plus" size={15} />Tambah batas kategori</button>}
      </div>
      {addingLimit && <CategoryLimitForm state={state} onUpdate={onUpdate} onDone={() => setAddingLimit(false)} />}
      {stats.categories.length
        ? <ul className="dash-list">{stats.categories.map(category => {
          const ratio = category.limit > 0 ? Math.min(1, category.spent / category.limit) : 0
          const over = category.limit > 0 && category.spent > category.limit
          return <li key={category.id} className="dash-row dash-row-stacked">
            <div className="dash-row" style={{ border: 0, padding: 0 }}>
              <span className="dash-color-dot" style={{ background: category.color, width: 14, height: 14 }} />
              <div className="dash-row-main"><strong>{category.name}</strong><span>{rupiah(category.spent)}{category.limit > 0 ? ` dari ${rupiah(category.limit)}` : ' · belum ada batas'}</span></div>
              {category.limit > 0 && <div className="dash-row-actions"><button type="button" aria-label={`Hapus batas ${category.name}`} onClick={() => void removeLimit(category.id)}><Icon name="trash" size={15} /></button></div>}
            </div>
            {category.limit > 0 && <div className={`dash-progress${over ? ' is-over' : ''}`}><i style={{ width: `${ratio * 100}%` }} /></div>}
          </li>
        })}</ul>
        : <p className="dash-muted" style={{ marginTop: 14 }}>Belum ada pengeluaran atau batas kategori bulan ini.</p>}
    </section>
  </div>
}
