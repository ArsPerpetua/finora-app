import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Dashboard } from '../components/dashboard/Dashboard'
import { config } from '../config'
import { useAuth } from '../lib/auth'
import { formatCode, isValidCodeFormat, MESSAGES } from '../lib/licenseCode'
import { supabase } from '../lib/supabase'
import '../styles/app.css'

export default function AppHome() {
  const { loading, session, profile, isActive, refreshProfile, signOut } = useAuth()

  if (loading) return <p className="app-wait">Memuat…</p>
  if (!session) return <Navigate to="/" replace />

  const currentProfile = profile?.id === session.user.id ? profile : null
  const accountActive = Boolean(currentProfile && isActive)
  return <Dashboard key={session.user.id} userId={session.user.id} name={currentProfile?.name || session.user.email || 'Anda'}
    activeUntil={currentProfile?.active_until ?? null} isActive={accountActive} telegramLinked={Boolean(currentProfile?.telegram_chat_id)} onSignOut={signOut}>
    {!accountActive && <ActivateCard onDone={refreshProfile} expired={Boolean(currentProfile?.active_until)} />}
    {accountActive && <TelegramCard linked={Boolean(currentProfile?.telegram_chat_id)} onLinked={refreshProfile} />}
  </Dashboard>
}

function ActivateCard({ onDone, expired }: { onDone: () => Promise<void>; expired: boolean }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const c = formatCode(code)
    if (!isValidCodeFormat(c)) return setErr(MESSAGES.invalid_format)
    setBusy(true)
    setErr('')
    const { error } = await supabase.rpc('activate_code', { p_code: c })
    setBusy(false)
    if (error) return setErr(/tidak valid|sudah dipakai/i.test(error.message) ? MESSAGES.not_found : MESSAGES.server)
    await onDone()
  }

  return (
    <section className="app-card">
      <h2>{expired ? 'Masa aktif berakhir' : 'Aktifkan akun'}</h2>
      <p className="muted">
        {expired ? 'Masukkan kode lisensi baru untuk memperpanjang.' : 'Masukkan kode lisensi dari pembelian Anda.'}{' '}
        <a href={config.checkoutUrl} target="_blank" rel="noopener">Belum punya kode?</a>
      </p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="app-code">Kode lisensi</label>
          <input
            id="app-code"
            value={code}
            onChange={(e) => { setCode(formatCode(e.target.value)); setErr('') }}
            placeholder="FNRA-XXXX-XXXX-XXXX"
            maxLength={19}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-ink" type="submit" disabled={busy}>{busy ? 'Memeriksa…' : 'Aktivasi'}</button>
      </form>
    </section>
  )
}

function TelegramCard({ linked, onLinked }: { linked: boolean; onLinked: () => Promise<void> }) {
  const [linkCode, setLinkCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function make() {
    setBusy(true)
    setErr('')
    const { data, error } = await supabase.rpc('create_link_code')
    setBusy(false)
    if (error) return setErr(MESSAGES.server)
    setLinkCode(String(data))
  }

  return (
    <section className="app-card">
      <h2>Catat lewat Telegram</h2>
      {linked ? (
        <p className="muted">Telegram sudah tertaut. Kirim pesan seperti “makan siang 25000” ke bot Finora.</p>
      ) : (
        <>
          <p className="muted">
            Tautkan sekali. Buat kode, lalu kirim <code>/start KODE</code> ke bot
            {config.telegramBot ? <> <a href={`https://t.me/${config.telegramBot}`} target="_blank" rel="noopener">@{config.telegramBot}</a></> : ''}.
            Kode berlaku 15 menit.
          </p>
          {linkCode ? (
            <p className="link-code"><code>/start {linkCode}</code></p>
          ) : (
            <button className="btn btn-ink" type="button" onClick={make} disabled={busy}>
              {busy ? 'Membuat…' : 'Buat kode tautan'}
            </button>
          )}
          {linkCode && (
            <>
              <button className="linkbtn-dark" type="button" onClick={() => void onLinked()}>Sudah saya kirim, periksa status</button>
              <button className="linkbtn-dark" type="button" onClick={() => void make()} disabled={busy}>{busy ? 'Membuat…' : 'Buat kode tautan baru'}</button>
            </>
          )}
          <p className="err" role="alert">{err}</p>
        </>
      )}
    </section>
  )
}
