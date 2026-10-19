import { useState, type FormEvent } from 'react'
import {
  dateLabel, GOAL_ICONS, goalProgress, goalSavedAmount, newId, removeGoal, rupiah, todayMakassar, upsertGoal,
  type FinancialState, type Goal, type Transaction,
} from '../../lib/finance'
import { supabase } from '../../lib/supabase'
import { EmptyState } from './Dashboard'
import { Icon, type IconName } from './Icon'

type Updater = (updater: (state: FinancialState) => FinancialState) => Promise<void>

function parseAmount(value: string): number {
  const n = Number(value.replace(/[^\d]/g, '') || '0')
  return Number.isFinite(n) ? n : 0
}

function GoalForm({ initial, onSave, onCancel }: { initial: Goal | null; onSave: (goal: Goal) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? GOAL_ICONS[0])
  const [target, setTarget] = useState(initial ? String(initial.target) : '')
  const [saved, setSaved] = useState(initial ? String(initial.saved) : '0')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [monthly, setMonthly] = useState(initial?.monthly ? String(initial.monthly) : '')
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
      await onSave({
        id: initial?.id ?? newId('goal'), name: trimmed, icon, target: targetAmount, saved: parseAmount(saved),
        deadline: deadline || null, monthly: parseAmount(monthly),
      })
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Nama tujuan</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Dana darurat" maxLength={40} autoFocus /></label>
      <label className="dash-field"><span>Target</span><input inputMode="numeric" value={target} onChange={event => setTarget(event.target.value)} placeholder="Contoh: 10000000" /></label>
      <label className="dash-field"><span>Sudah terkumpul (awal)</span><input inputMode="numeric" value={saved} onChange={event => setSaved(event.target.value)} placeholder="0" /></label>
      <label className="dash-field"><span>Tenggat (opsional)</span><input type="date" value={deadline} onChange={event => setDeadline(event.target.value)} /></label>
      <label className="dash-field"><span>Rencana setoran per bulan (opsional)</span><input inputMode="numeric" value={monthly} onChange={event => setMonthly(event.target.value)} placeholder="Contoh: 500000" /></label>
    </div>
    <div className="dash-field">
      <span>Ikon</span>
      <div className="dash-row-actions" role="radiogroup" aria-label="Pilih ikon tujuan" style={{ flexWrap: 'wrap' }}>
        {GOAL_ICONS.map(item => (
          <button key={item} type="button" role="radio" aria-checked={icon === item} aria-label={item} onClick={() => setIcon(item)}
            style={icon === item ? { borderColor: 'var(--lime-ink)', color: 'var(--lime-ink)', backgroundColor: 'var(--lime-soft)' } : undefined}>
            <Icon name={item as IconName} size={15} />
          </button>
        ))}
      </div>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan tujuan'}</button>
      <button type="button" className="dash-button" onClick={onCancel} disabled={busy}>Batal</button>
    </div>
  </form>
}

function ContributeForm({ goal, state, userId, onDone, onSaved }: {
  goal: Goal; state: FinancialState; userId: string; onDone: () => void; onSaved: () => void
}) {
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? '')
  const [date, setDate] = useState(() => todayMakassar())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = parseAmount(amount)
    if (value <= 0) return setErr('Masukkan jumlah lebih dari 0.')
    if (!accountId) return setErr('Pilih akun untuk mencatat setoran atau tarikan ini.')
    setBusy(true)
    setErr('')
    const { error } = await supabase.from('transactions').insert({
      user_id: userId, type: 'transfer', amount: value, goal_id: goal.id, cat_id: null, fee: 0,
      account_id: direction === 'deposit' ? accountId : null,
      to_account_id: direction === 'withdraw' ? accountId : null,
      title: `${direction === 'deposit' ? 'Setoran' : 'Tarik tabungan'}: ${goal.name}`, note: '', tx_date: date, source: 'web',
    })
    setBusy(false)
    if (error) return setErr(/row-level security|permission/i.test(error.message) ? 'Akun Anda belum aktif. Aktivasi akses dulu di bagian bawah Beranda.' : 'Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
    onSaved()
    onDone()
  }

  return <form className="dash-form" onSubmit={submit}>
    <div className="dash-form-grid">
      <label className="dash-field"><span>Jenis</span>
        <select value={direction} onChange={event => setDirection(event.target.value as 'deposit' | 'withdraw')}>
          <option value="deposit">Setoran (menabung)</option>
          <option value="withdraw">Tarik tabungan</option>
        </select>
      </label>
      <label className="dash-field"><span>Jumlah</span><input inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Contoh: 200000" autoFocus /></label>
      {state.accounts.length
        ? <label className="dash-field"><span>{direction === 'deposit' ? 'Dari akun' : 'Ke akun'}</span>
          <select value={accountId} onChange={event => setAccountId(event.target.value)}>
            {state.accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </label>
        : <p className="hint">Belum ada akun. Tambah akun dulu di layar Akun supaya setoran bisa dicatat.</p>}
      <label className="dash-field"><span>Tanggal</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="dash-form-actions">
      <button type="submit" className="dash-button dash-button-primary" disabled={busy || !state.accounts.length}>{busy ? 'Menyimpan…' : direction === 'deposit' ? 'Tambah tabungan' : 'Tarik tabungan'}</button>
      <button type="button" className="dash-button" onClick={onDone} disabled={busy}>Batal</button>
    </div>
  </form>
}

export function GoalsScreen({ state, transactions, userId, onUpdate, onSaved }: {
  state: FinancialState; transactions: Transaction[]; userId: string; onUpdate: Updater; onSaved: () => void
}) {
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
          const saved = goalSavedAmount(goal, transactions)
          const progress = goalProgress({ ...goal, saved })
          return <article key={goal.id} className="dash-card dash-span-5" aria-label={goal.name}>
            {mode === goal.id
              ? <GoalForm initial={goal} onSave={save} onCancel={() => setMode('closed')} />
              : <>
                <div className="dash-card-heading">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="dash-category-icon" style={{ color: 'var(--lime-ink)', backgroundColor: 'var(--lime-soft)' }}><Icon name={goal.icon as IconName} size={17} /></span>
                    <div><h3 style={{ fontSize: 14 }}>{goal.name}</h3><span className="dash-muted">{progress.done ? 'Target tercapai' : `Kurang ${rupiah(progress.remaining)}`}</span></div>
                  </div>
                  <div className="dash-row-actions"><button type="button" aria-label={`Ubah ${goal.name}`} onClick={() => setMode(goal.id)}><Icon name="edit" size={15} /></button><button type="button" aria-label={`Hapus ${goal.name}`} onClick={() => void remove(goal.id)}><Icon name="trash" size={15} /></button></div>
                </div>
                <div className="dash-budget-summary"><strong>{rupiah(saved)}</strong><span className="dash-muted">dari {rupiah(goal.target)}</span></div>
                <div className={`dash-progress${progress.done ? ' is-done' : ''}`}><i style={{ width: `${progress.ratio * 100}%` }} /></div>
                {(goal.deadline || goal.monthly > 0) && <p className="dash-muted" style={{ fontSize: 11, marginTop: 10 }}>
                  {goal.deadline ? `Tenggat ${dateLabel(goal.deadline)}` : ''}{goal.deadline && goal.monthly > 0 ? ' · ' : ''}{goal.monthly > 0 ? `Rencana setoran ${rupiah(goal.monthly)}/bulan` : ''}
                </p>}
                {contributing === goal.id
                  ? <ContributeForm goal={goal} state={state} userId={userId} onDone={() => setContributing(null)} onSaved={onSaved} />
                  : <div className="dash-form-actions" style={{ marginTop: 14 }}><button type="button" className="dash-button dash-button-primary" onClick={() => setContributing(goal.id)}>Catat setoran</button></div>}
              </>}
          </article>
        })}</div>
        : mode === 'closed' && <EmptyState title="Belum ada tujuan menabung">Dana darurat, liburan, atau laptop baru. Tentukan target dan lihat progresnya di sini.</EmptyState>}
    </section>
  </div>
}
