import { useState, type FormEvent, type ReactNode } from 'react'
import { todayMakassar, type FinancialState, type Transaction } from '../../lib/finance'
import { supabase } from '../../lib/supabase'
import { Icon } from './Icon'

function NameCard({ userId, name, onProfileUpdated }: { userId: string; name: string; onProfileUpdated: () => Promise<void> }) {
  const [value, setValue] = useState(name)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return setErr('Nama tidak boleh kosong.')
    setBusy(true)
    setErr('')
    setSaved(false)
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', userId)
    setBusy(false)
    if (error) return setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
    await onProfileUpdated()
    setSaved(true)
  }

  return <section className="dash-card dash-span-6" aria-labelledby="settings-name-title">
    <div className="dash-card-heading"><h2 id="settings-name-title">Profil</h2></div>
    <form className="dash-form" onSubmit={submit}>
      <div className="dash-form-grid">
        <label className="dash-field"><span>Nama panggilan</span><input value={value} onChange={event => { setValue(event.target.value); setSaved(false) }} maxLength={40} /></label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="dash-form-actions">
        <button type="submit" className="dash-button dash-button-primary" disabled={busy || value.trim() === name}>{busy ? 'Menyimpan…' : 'Simpan nama'}</button>
        {saved && <span className="dash-muted" style={{ fontSize: 11 }}>Tersimpan.</span>}
      </div>
    </form>
  </section>
}

function ThemeCard({ onToggleTheme }: { onToggleTheme: () => void }) {
  return <section className="dash-card dash-span-6" aria-labelledby="settings-theme-title">
    <div className="dash-card-heading"><h2 id="settings-theme-title">Tampilan</h2></div>
    <p className="dash-muted" style={{ marginBottom: 12 }}>Ganti antara tema terang dan gelap. Pilihan Anda tersimpan di perangkat ini.</p>
    <button type="button" className="dash-button" onClick={onToggleTheme}><Icon name="theme" size={16} />Ganti tema terang/gelap</button>
  </section>
}

function PasswordCard() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 6) return setErr('Kata sandi minimal 6 karakter.')
    if (password !== confirm) return setErr('Konfirmasi kata sandi tidak cocok.')
    setBusy(true)
    setErr('')
    setSaved(false)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setErr('Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
    setPassword('')
    setConfirm('')
    setSaved(true)
  }

  return <section className="dash-card dash-span-6" aria-labelledby="settings-password-title">
    <div className="dash-card-heading"><h2 id="settings-password-title">Ganti kata sandi</h2></div>
    <form className="dash-form" onSubmit={submit}>
      <div className="dash-form-grid">
        <label className="dash-field"><span>Kata sandi baru</span><input type="password" value={password} onChange={event => { setPassword(event.target.value); setSaved(false) }} autoComplete="new-password" /></label>
        <label className="dash-field"><span>Konfirmasi kata sandi</span><input type="password" value={confirm} onChange={event => { setConfirm(event.target.value); setSaved(false) }} autoComplete="new-password" /></label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="dash-form-actions">
        <button type="submit" className="dash-button dash-button-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kata sandi'}</button>
        {saved && <span className="dash-muted" style={{ fontSize: 11 }}>Kata sandi diperbarui.</span>}
      </div>
    </form>
  </section>
}

function AccessCard({ isActive, expiry, telegramLinked, onProfileUpdated, children }: {
  isActive: boolean; expiry: string | null; telegramLinked: boolean; onProfileUpdated: () => Promise<void>; children: ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function unlink() {
    if (!window.confirm('Putus tautan Telegram? Anda bisa menautkan ulang kapan saja.')) return
    setBusy(true)
    setErr('')
    const { error } = await supabase.rpc('unlink_telegram')
    setBusy(false)
    if (error) return setErr('Gagal memutus tautan. Periksa koneksi Anda lalu coba lagi.')
    await onProfileUpdated()
  }

  return <section className="dash-card dash-span-12" aria-labelledby="settings-access-title">
    <div className="dash-card-heading">
      <div><h2 id="settings-access-title">Akses akun & Telegram</h2><p className="dash-muted">{isActive && expiry ? `Status aktif sampai ${expiry}` : 'Akses belum aktif'}</p></div>
      {telegramLinked && <button type="button" className="dash-button" onClick={() => void unlink()} disabled={busy}><Icon name="close" size={14} />Putus tautan Telegram</button>}
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    {children}
  </section>
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function ExportCard({ name, state, transactions }: { name: string; state: FinancialState; transactions: Transaction[] }) {
  function exportData() {
    downloadJson(`finora-${todayMakassar()}.json`, {
      exported_at: new Date().toISOString(), name,
      accounts: state.accounts, categories: state.cats, budget: state.budget, goals: state.goals,
      transactions,
    })
  }
  return <section className="dash-card dash-span-6" aria-labelledby="settings-export-title">
    <div className="dash-card-heading"><h2 id="settings-export-title">Ekspor data</h2></div>
    <p className="dash-muted" style={{ marginBottom: 12 }}>Unduh seluruh akun, kategori, anggaran, tujuan tabungan, dan riwayat transaksi Anda sebagai satu berkas JSON.</p>
    <button type="button" className="dash-button" onClick={exportData}><Icon name="list" size={15} />Unduh data (JSON)</button>
  </section>
}

function DangerCard({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function deleteAccount(event: FormEvent) {
    event.preventDefault()
    if (confirmText.trim().toUpperCase() !== 'HAPUS') return setErr('Ketik HAPUS untuk konfirmasi.')
    setBusy(true)
    setErr('')
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setBusy(false)
      return setErr('Gagal menghapus akun. Periksa koneksi Anda lalu coba lagi.')
    }
    await onSignOut()
  }

  return <section className="dash-card dash-span-6" aria-labelledby="settings-danger-title">
    <div className="dash-card-heading"><h2 id="settings-danger-title">Zona berbahaya</h2></div>
    <div className="dash-form-actions" style={{ marginBottom: 18 }}>
      <button type="button" className="dash-button" onClick={() => void onSignOut()}><Icon name="logout" size={15} />Keluar dari akun</button>
    </div>
    <p className="dash-muted" style={{ marginBottom: 10 }}>Menghapus akun akan menghapus profil, akun, kategori, anggaran, tujuan tabungan, dan seluruh riwayat transaksi Anda secara permanen. Tindakan ini tidak dapat dibatalkan — ekspor data Anda dulu bila perlu.</p>
    <form className="dash-form" onSubmit={deleteAccount}>
      <div className="dash-form-grid">
        <label className="dash-field"><span>Ketik HAPUS untuk konfirmasi</span><input value={confirmText} onChange={event => setConfirmText(event.target.value)} autoComplete="off" /></label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="dash-form-actions">
        <button type="submit" className="dash-button" style={{ borderColor: 'var(--err)', color: 'var(--err)' }} disabled={busy || confirmText.trim().toUpperCase() !== 'HAPUS'}>
          {busy ? 'Menghapus…' : 'Hapus akun saya secara permanen'}
        </button>
      </div>
    </form>
  </section>
}

export function SettingsScreen({ userId, name, isActive, expiry, telegramLinked, state, transactions, onToggleTheme, onProfileUpdated, onSignOut, children }: {
  userId: string; name: string; isActive: boolean; expiry: string | null; telegramLinked: boolean
  state: FinancialState; transactions: Transaction[]
  onToggleTheme: () => void; onProfileUpdated: () => Promise<void>; onSignOut: () => Promise<void>; children: ReactNode
}) {
  return <div className="dash-grid">
    <NameCard userId={userId} name={name} onProfileUpdated={onProfileUpdated} />
    <ThemeCard onToggleTheme={onToggleTheme} />
    <PasswordCard />
    <ExportCard name={name} state={state} transactions={transactions} />
    <AccessCard isActive={isActive} expiry={expiry} telegramLinked={telegramLinked} onProfileUpdated={onProfileUpdated}>{children}</AccessCard>
    <DangerCard onSignOut={onSignOut} />
  </div>
}
