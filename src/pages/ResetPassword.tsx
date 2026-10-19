import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Tujuan tautan di email resetPasswordForEmail. Supabase mendeteksi token pemulihan di
 * fragmen URL (#access_token=...&type=recovery) saat klien ini dimuat dan membuatkan sesi
 * sementara — cukup baca sesi, tidak perlu mengurai token secara manual.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setReady(data.session ? 'ready' : 'invalid')
    })
    return () => { alive = false }
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setErr('Kata sandi minimal 8 karakter.')
    if (password !== confirm) return setErr('Konfirmasi kata sandi tidak cocok.')
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setErr('Gagal menyimpan. Tautan mungkin sudah kedaluwarsa — minta tautan atur ulang baru lewat Login.')
    setReady('done')
  }

  if (ready === 'checking') return <p className="app-wait">Memeriksa tautan…</p>

  if (ready === 'invalid') return (
    <div className="app-wait">
      <p>Tautan atur ulang kata sandi tidak valid atau sudah kedaluwarsa.</p>
      <button className="btn btn-ink" type="button" onClick={() => navigate('/')}>Kembali ke beranda</button>
    </div>
  )

  if (ready === 'done') return (
    <div className="app-wait">
      <p>Kata sandi berhasil diperbarui.</p>
      <button className="btn btn-ink" type="button" onClick={() => navigate('/app')}>Masuk ke Finora</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 20px' }}>
      <h1>Atur kata sandi baru</h1>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="rp-password">Kata sandi baru</label>
          <input id="rp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </div>
        <div className="field">
          <label htmlFor="rp-confirm">Konfirmasi kata sandi</label>
          <input id="rp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </div>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-ink btn-block" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kata sandi baru'}</button>
      </form>
    </div>
  )
}
