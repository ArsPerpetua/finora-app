import { useId, useState, type FormEvent } from 'react'
import { CloseButton, Modal } from '../Modal'
import {
  ACCOUNT_COLORS, newId, upsertAccount, upsertGoal,
  type Account, type FinancialState,
} from '../../lib/finance'
import { supabase } from '../../lib/supabase'
import { ACCOUNT_TYPES } from './Accounts'

type Updater = (updater: (state: FinancialState) => FinancialState) => Promise<void>

function parseAmount(value: string): number {
  const n = Number(value.replace(/[^\d-]/g, '') || '0')
  return Number.isFinite(n) ? n : 0
}

/** Onboarding ringkas untuk pengguna baru (belum punya akun): nama panggilan, akun pertama, dan opsional tujuan tabungan pertama. */
export function OnboardingDialog({ userId, name, onUpdate, onProfileUpdated, onDone }: {
  userId: string; name: string; onUpdate: Updater; onProfileUpdated: () => Promise<void>; onDone: () => void
}) {
  const titleId = useId()
  const [displayName, setDisplayName] = useState(name)
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState('cash')
  const [opening, setOpening] = useState('')
  const [goalEnabled, setGoalEnabled] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = displayName.trim()
    const trimmedAccount = accountName.trim()
    if (!trimmedAccount) return setErr('Nama akun wajib diisi.')
    if (goalEnabled && !goalName.trim()) return setErr('Nama tujuan wajib diisi.')
    if (goalEnabled && parseAmount(goalTarget) <= 0) return setErr('Target tabungan harus lebih dari 0.')
    setBusy(true)
    setErr('')
    try {
      if (trimmedName && trimmedName !== name) {
        const { error } = await supabase.from('profiles').update({ name: trimmedName }).eq('id', userId)
        if (error) throw error
        await onProfileUpdated()
      }
      const account: Account = {
        id: newId('acc'), name: trimmedAccount, type: accountType, opening: parseAmount(opening), color: ACCOUNT_COLORS[0],
      }
      await onUpdate(current => {
        let next = upsertAccount(current, account)
        if (goalEnabled) next = upsertGoal(next, {
          id: newId('goal'), name: goalName.trim(), icon: 'target', target: parseAmount(goalTarget), saved: 0, deadline: null, monthly: 0,
        })
        return next
      })
      onDone()
    } catch {
      setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
      setBusy(false)
    }
  }

  return <Modal open onClose={onDone} labelledBy={titleId}>
    <div className="dlg">
      <div className="dlg-head"><h2 id={titleId}>Selamat datang di Finora</h2><CloseButton onClick={onDone} /></div>
      <p className="hint" style={{ marginTop: -4, marginBottom: 14 }}>Isi sedikit informasi ini agar dashboard Anda langsung terasa milik Anda.</p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="ob-name">Nama panggilan</label>
          <input id="ob-name" value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="ob-account">Akun pertama</label>
          <input id="ob-account" value={accountName} onChange={event => setAccountName(event.target.value)} placeholder="Contoh: BCA, Tunai, GoPay" maxLength={40} required />
        </div>
        <div className="field">
          <label htmlFor="ob-account-type">Jenis akun</label>
          <select id="ob-account-type" value={accountType} onChange={event => setAccountType(event.target.value)}>
            {ACCOUNT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ob-opening">Saldo awal (opsional)</label>
          <input id="ob-opening" inputMode="numeric" value={opening} onChange={event => setOpening(event.target.value)} placeholder="0" />
        </div>
        <label className="dash-all-months" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={goalEnabled} onChange={event => setGoalEnabled(event.target.checked)} />
          Buat juga tujuan tabungan pertama
        </label>
        {goalEnabled && <>
          <div className="field">
            <label htmlFor="ob-goal-name">Nama tujuan</label>
            <input id="ob-goal-name" value={goalName} onChange={event => setGoalName(event.target.value)} placeholder="Contoh: Dana darurat" maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="ob-goal-target">Target</label>
            <input id="ob-goal-target" inputMode="numeric" value={goalTarget} onChange={event => setGoalTarget(event.target.value)} placeholder="Contoh: 10000000" />
          </div>
        </>}
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-ink btn-block" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Mulai pakai Finora'}</button>
        <button className="btn btn-block" type="button" onClick={onDone} disabled={busy} style={{ marginTop: 8 }}>Lewati dulu</button>
      </form>
    </div>
  </Modal>
}
