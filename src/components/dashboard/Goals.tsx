import { useState, type FormEvent } from 'react'
import {
  contributeToGoal, goalProgress, newId, removeGoal, rupiah, upsertGoal,
  type FinancialState, type Goal,
} from '../../lib/finance'
import { EmptyState } from './Dashboard'
import { Icon } from './Icon'

type Updater = (updater: (state: FinancialState) => FinancialState) => Promise<void>

function parseAmount(value: string): number {
  const n = Number(value.replace(/[^\d]/g, '') || '0')
  return Number.isFinite(n) ? n : 0
}

function GoalForm({ initial, onSave, onCancel }: { initial: Goal | null; onSave: (goal: Goal) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? String(initial.target) : '')
  const [saved, setSaved] = useState(initial ? String(initial.saved) : '0')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    const targetAmount = parseAmount(target)
    if (!trimmed) return setErr('Nama tujuan wajib diisi.')
    if (targetAmount <= 0) return setErr('Target tabungan harus lebih dari 0.')
    setBusy(true)
    setErr('')
    try {
      await onSave({ id: initial?.id ?? newId('goal'), name: trimmed, target: targetAmount, saved: parseAmount(saved) })
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Nama tujuan</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Dana darurat" maxLength={40} autoFocus /></label>
      <label className="dash-field"><span>Target</span><input inputMode="numeric" value={target} onChange={event => setTarget(event.target.value)} placeholder="Contoh: 10000000" /></label>
      <label className="dash-field"><span>Sudah terkumpul</span><input inputMode="numeric" value={saved} onChange={event => setSaved(event.target.value)} placeholder="0" /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan tujuan'}</button>
      <button type="button" className="dash-button" onClick={onCancel} disabled={busy}>Batal</button>
    </div>
  </form>
}

function ContributeForm({ goal, onDone, onUpdate }: { goal: Goal; onDone: () => void; onUpdate: Updater }) {
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(direction: 1 | -1, event: FormEvent) {
    event.preventDefault()
    const value = parseAmount(amount)
    if (value <= 0) return setErr('Masukkan jumlah lebih dari 0.')
    setBusy(true)
    setErr('')
    try {
      await onUpdate(current => contributeToGoal(current, goal.id, value * direction))
      onDone()
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={event => void submit(1, event)}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Jumlah</span><input inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Contoh: 200000" autoFocus /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Tambah tabungan'}</button>
      <button type="button" className="dash-button" disabled={busy} onClick={event => void submit(-1, event)}>Tarik tabungan</button>
      <button type="button" className="dash-button" onClick={onDone} disabled={busy}>Batal</button>
    </div>
  </form>
}

export function GoalsScreen({ state, onUpdate }: { state: FinancialState; onUpdate: Updater }) {
  const [mode, setMode] = useState<'closed' | 'new' | string>('closed')
  const [contributing, setContributing] = useState<string | null>(null)

  async function save(goal: Goal) {
    await onUpdate(current => upsertGoal(current, goal))
    setMode('closed')
  }

  async function remove(id: string) {
    if (!window.confirm('Hapus tujuan tabungan ini?')) return
    await onUpdate(current => removeGoal(current, id))
  }

  return <div className="dash-grid">
    <section className="dash-card dash-span-12" aria-labelledby="goals-title">
      <div className="dash-card-heading">
        <div><h2 id="goals-title">Tabungan & tujuan</h2><p className="dash-muted">Catat target dana darurat, liburan, atau barang impian Anda.</p></div>
        {mode === 'closed' && <button type="button" className="dash-card-add" onClick={() => setMode('new')}><Icon name="plus" size={15} />Tujuan baru</button>}
      </div>
      {mode === 'new' && <GoalForm initial={null} onSave={save} onCancel={() => setMode('closed')} />}
      {state.goals.length
        ? <div className="dash-grid" style={{ marginTop: 16 }}>{state.goals.map(goal => {
          const progress = goalProgress(goal)
          return <article key={goal.id} className="dash-card dash-span-5" aria-label={goal.name}>
            {mode === goal.id
              ? <GoalForm initial={goal} onSave={save} onCancel={() => setMode('closed')} />
              : <>
                <div className="dash-card-heading"><div><h3 style={{ fontSize: 14 }}>{goal.name}</h3><span className="dash-muted">{progress.done ? 'Target tercapai' : `Kurang ${rupiah(progress.remaining)}`}</span></div>
                  <div className="dash-row-actions"><button type="button" aria-label={`Ubah ${goal.name}`} onClick={() => setMode(goal.id)}><Icon name="edit" size={15} /></button><button type="button" aria-label={`Hapus ${goal.name}`} onClick={() => void remove(goal.id)}><Icon name="trash" size={15} /></button></div>
                </div>
                <div className="dash-budget-summary"><strong>{rupiah(goal.saved)}</strong><span className="dash-muted">dari {rupiah(goal.target)}</span></div>
                <div className={`dash-progress${progress.done ? ' is-done' : ''}`}><i style={{ width: `${progress.ratio * 100}%` }} /></div>
                {contributing === goal.id
                  ? <ContributeForm goal={goal} onDone={() => setContributing(null)} onUpdate={onUpdate} />
                  : <div className="dash-form-actions" style={{ marginTop: 14 }}><button type="button" className="dash-button dash-button-primary" onClick={() => setContributing(goal.id)}>Catat tabungan</button></div>}
              </>}
          </article>
        })}</div>
        : mode === 'closed' && <EmptyState title="Belum ada tujuan menabung">Dana darurat, liburan, atau laptop baru. Tentukan target dan lihat progresnya di sini.</EmptyState>}
    </section>
  </div>
}
