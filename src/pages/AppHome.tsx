import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { config } from '../config'
import { useAuth } from '../lib/auth'
import { formatCode, isValidCodeFormat, MESSAGES } from '../lib/licenseCode'
import { supabase } from '../lib/supabase'
import '../styles/app.css'

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Makassar' })

/**
 * Halaman aplikasi sementara. Dashboard (beranda, transaksi, anggaran, dst.) dibangun
 * di sini nanti, memakai desain di docs/reference/prototype-v3.html.
 */
export default function AppHome() {
  const { loading, session, profile, isActive, refreshProfile, signOut } = useAuth()

  if (loading) return <p className="app-wait">Memuat…</p>
  if (!session) return <Navigate to="/" replace />

  return (
    <div className="app-shell">
      <header className="app-top">
        <span className="brand"><span className="mark" aria-hidden="true">F</span>Finora</span>
        <button className="pill" type="button" onClick={() => void signOut()}>Keluar</button>
      </header>

      <main className="app-main">
        <h1 className="app-h1">Halo, {profile?.name || session.user.email}</h1>

        {isActive ? (
          <p className="app-lead">
            Akses aktif sampai <b>{dateFmt.format(new Date(profile!.active_until!))}</b>.
          </p>
        ) : (
          <ActivateCard onDone={refreshProfile} expired={Boolean(profile?.active_until)} />
        )}

        {isActive && <TelegramCard linked={Boolean(profile?.telegram_chat_id)} onLinked={refreshProfile} />}

        <section className="app-card">
          <h2>Dashboard</h2>
          <p className="muted">Beranda, transaksi, anggaran, tabungan, dan laporan akan dipasang di sini.</p>
        </section>
      </main>
    </div>
  )
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
            <button className="linkbtn-dark" type="button" onClick={() => void onLinked()}>Sudah saya kirim, periksa status</button>
          )}
          <p className="err" role="alert">{err}</p>
        </>
      )}
    </section>
  )
}
