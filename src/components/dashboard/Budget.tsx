import { useState, type FormEvent } from 'react'
import {
  budgetStats, budgetTier, expenseCategoryOptions, monthLabel, rupiah, setBudgetTotal, setCategoryBudget, shiftMonth,
  type FinancialState, type Transaction,
} from '../../lib/finance'
import { EmptyState } from './Dashboard'
import { Icon, type IconName } from './Icon'

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
  const [roll, setRoll] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!categoryId) return setErr('Pilih kategori terlebih dahulu.')
    setBusy(true)
    setErr('')
    try {
      await onUpdate(current => setCategoryBudget(current, categoryId, parseAmount(limit), roll))
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
    <label className="dash-all-months"><input type="checkbox" checked={roll} onChange={event => setRoll(event.target.checked)} />Bawa sisa batas yang tidak terpakai ke bulan berikutnya</label>
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
  const previousMonth = transactions.filter(tx => tx.tx_date.startsWith(shiftMonth(month, -1) + '-'))
  const stats = budgetStats(selected, previousMonth, state)
  const totalRatio = stats.total.limit > 0 ? Math.min(1, stats.total.spent / stats.total.limit) : 0
  const totalTier = stats.total.limit > 0 ? budgetTier(stats.total.spent / stats.total.limit) : 'ok'

  async function removeLimit(categoryId: string) {
    await onUpdate(current => setCategoryBudget(current, categoryId, 0))
  }

  return <div className="dash-grid">
    <section className="dash-card dash-span-12" aria-labelledby="budget-total-title">
      <div className="dash-card-heading"><div><h2 id="budget-total-title">Anggaran bulan {monthLabel(month)}</h2><p className="dash-muted">Bandingkan rencana pengeluaran dengan catatan transaksi Anda.</p></div></div>
      {stats.total.limit > 0
        ? <>
          <div className="dash-budget-summary"><span>Terpakai</span><strong className={totalTier === 'bad' ? 'dash-negative' : ''}>{rupiah(stats.total.spent)}</strong><span className="dash-muted">dari {rupiah(stats.total.limit)}</span></div>
          <div className={`dash-progress${totalTier !== 'ok' ? ` is-${totalTier === 'bad' ? 'over' : 'warn'}` : ''}`}><i style={{ width: `${totalRatio * 100}%` }} /></div>
          {totalTier === 'bad' && <p className="dash-muted" style={{ color: 'var(--err)', fontSize: 11, marginTop: 8 }}>Pengeluaran sudah melewati batas bulan ini.</p>}
          {totalTier === 'warn' && <p className="dash-muted" style={{ color: 'var(--warn-bar)', fontSize: 11, marginTop: 8 }}>Pengeluaran sudah lebih dari 80% batas bulan ini.</p>}
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
          const tier = category.limit > 0 ? budgetTier(category.spent / category.limit) : 'ok'
          return <li key={category.id} className="dash-row dash-row-stacked">
            <div className="dash-row" style={{ border: 0, padding: 0 }}>
              <span className="dash-category-icon" style={{ color: category.color, backgroundColor: category.color + '18' }}><Icon name={category.icon as IconName} size={17} /></span>
              <div className="dash-row-main">
                <strong>{category.name}</strong>
                <span>{rupiah(category.spent)}{category.limit > 0 ? ` dari ${rupiah(category.limit)}` : ' · belum ada batas'}{category.roll && category.carry > 0 ? ` (termasuk sisa ${rupiah(category.carry)} bulan lalu)` : ''}</span>
              </div>
              {category.limit > 0 && <div className="dash-row-actions"><button type="button" aria-label={`Hapus batas ${category.name}`} onClick={() => void removeLimit(category.id)}><Icon name="trash" size={15} /></button></div>}
            </div>
            {category.limit > 0 && <div className={`dash-progress${tier !== 'ok' ? ` is-${tier === 'bad' ? 'over' : 'warn'}` : ''}`}><i style={{ width: `${ratio * 100}%` }} /></div>}
          </li>
        })}</ul>
        : <p className="dash-muted" style={{ marginTop: 14 }}>Belum ada pengeluaran atau batas kategori bulan ini.</p>}
    </section>
  </div>
}
