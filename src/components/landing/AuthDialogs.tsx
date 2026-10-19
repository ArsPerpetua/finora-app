import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseButton, Modal } from '../Modal'
import { EMAIL_RE, MESSAGES, savePendingCode } from '../../lib/licenseCode'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

function PasswordField({ id, label, autoComplete, hint }: { id: string; label: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} name="password" type={show ? 'text' : 'password'} autoComplete={autoComplete} required />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {show ? 'Sembunyikan' : 'Tampilkan'}
        </button>
      </div>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}

/* ---------------- Buat akun (setelah kode lisensi diterima) ---------------- */

type AccountStep = 'form' | 'done' | 'confirm-email'

export function AccountDialog({ code, onClose }: { code: string | null; onClose: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<AccountStep>('form')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [activationFailed, setActivationFailed] = useState(false)

  function close() {
    onClose()
    setStep('form')
    setErr('')
    setActivationFailed(false)
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!code) return
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')

    if (!name) return setErr('Isi nama panggilan Anda.')
    if (!EMAIL_RE.test(email)) return setErr('Isi email dengan format yang benar, mis. nama@email.com.')
    if (password.length < 8) return setErr('Kata sandi minimal 8 karakter.')
    if (!isSupabaseConfigured) return setErr(MESSAGES.not_configured)
    if (!navigator.onLine) return setErr(MESSAGES.offline)

    setErr('')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) {
      setBusy(false)
      setErr(/registered|already/i.test(error.message) ? MESSAGES.email_taken : MESSAGES.server)
      return
    }
    // Jika "Confirm email" di Supabase menyala, belum ada sesi untuk mengaktifkan kode
    // sekarang. Simpan dulu: AuthProvider akan mengaktifkannya otomatis begitu pengguna
    // login setelah konfirmasi, supaya kode yang sama tidak perlu dimasukkan dua kali.
    if (!data.session) {
      savePendingCode(code)
      setBusy(false)
      setStep('confirm-email')
      return
    }
    const { error: actErr } = await supabase.rpc('activate_code', { p_code: code })
    setBusy(false)
    setActivationFailed(Boolean(actErr))
    setStep('done')
  }

  return (
    <Modal open={code !== null} onClose={close} labelledBy="acc-title">
      <div className="dlg">
        {step === 'form' && (
          <>
            <div className="dlg-head">
              <h2 id="acc-title">Buat akun Anda</h2>
              <CloseButton onClick={close} />
            </div>
            <p className="ribbon">
              Kode …{code?.slice(-4)} diterima. Buat akun untuk menyelesaikan aktivasi. Setelah akun jadi, kode ini tidak berlaku lagi.
            </p>
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="acc-name">Nama panggilan</label>
                <input id="acc-name" name="name" type="text" autoComplete="given-name" maxLength={40} required />
              </div>
              <div className="field">
                <label htmlFor="acc-email">Email</label>
                <input id="acc-email" name="email" type="email" autoComplete="email" inputMode="email" required />
              </div>
              <PasswordField id="acc-pass" label="Kata sandi" autoComplete="new-password" hint="Minimal 8 karakter." />
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn btn-ink btn-block" type="submit" disabled={busy}>
                {busy ? 'Membuat akun…' : 'Buat akun'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className="done">
            <div className="badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h2 id="acc-title">{activationFailed ? 'Akun Anda sudah jadi.' : 'Akun Anda aktif.'}</h2>
            <p className="lead">
              {activationFailed
                ? 'Akun berhasil dibuat, tetapi kode belum bisa diaktifkan. Masukkan kode lisensi Anda sekali lagi di dalam aplikasi.'
                : 'Kode lisensi sudah dipakai dan tidak berlaku lagi. Mulai sekarang, masuk cukup dengan tombol Login.'}
            </p>
            <button className="btn btn-ink btn-block" style={{ marginTop: 20 }} type="button" onClick={() => { close(); navigate('/app') }}>
              Masuk ke Finora
            </button>
          </div>
        )}

        {step === 'confirm-email' && (
          <div className="done">
            <h2 id="acc-title">Cek email Anda.</h2>
            <p className="lead">
              Kami mengirim tautan konfirmasi. Setelah dikonfirmasi dan Anda login, kode lisensi Anda akan aktif secara otomatis — tidak perlu memasukkannya lagi.
            </p>
            <button className="btn btn-ink btn-block" style={{ marginTop: 20 }} type="button" onClick={close}>Mengerti</button>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ---------------- Login ---------------- */

type LoginStep = 'login' | 'forgot' | 'sent'

export function LoginDialog({ open, onClose, onNeedCode }: { open: boolean; onClose: () => void; onNeedCode: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<LoginStep>('login')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function close() {
    onClose()
    setErr('')
    setStep('login')
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    if (!EMAIL_RE.test(email)) return setErr('Isi email dengan format yang benar.')
    if (!password) return setErr('Isi kata sandi Anda.')
    if (!isSupabaseConfigured) return setErr(MESSAGES.not_configured)
    if (!navigator.onLine) return setErr(MESSAGES.offline)

    setErr('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setErr(/invalid|credentials/i.test(error.message) ? MESSAGES.bad_credentials : MESSAGES.server)
      return
    }
    onClose()
    navigate('/app')
  }

  async function submitForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    if (!EMAIL_RE.test(email)) return setErr('Isi email dengan format yang benar.')
    if (!isSupabaseConfigured) return setErr(MESSAGES.not_configured)
    if (!navigator.onLine) return setErr(MESSAGES.offline)

    setErr('')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` })
    setBusy(false)
    // Supabase tidak membedakan "email tidak terdaftar" lewat error (mencegah enumerasi akun),
    // jadi selalu tampilkan pesan sukses yang sama kecuali memang gangguan server/koneksi.
    if (error) return setErr(MESSAGES.server)
    setStep('sent')
  }

  return (
    <Modal open={open} onClose={close} labelledBy="log-title">
      <div className="dlg">
        {step === 'login' && (
          <>
            <div className="dlg-head">
              <h2 id="log-title">Login</h2>
              <CloseButton onClick={close} />
            </div>
            <p className="lead">Masuk dengan akun yang Anda buat saat aktivasi. Tidak perlu kode lisensi.</p>
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="log-email">Email</label>
                <input id="log-email" name="email" type="email" autoComplete="username" inputMode="email" required />
              </div>
              <PasswordField id="log-pass" label="Kata sandi" autoComplete="current-password" />
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn btn-ink btn-block" type="submit" disabled={busy}>
                {busy ? 'Memeriksa…' : 'Login'}
              </button>
            </form>
            <p className="alt">
              Belum aktivasi? <button type="button" onClick={onNeedCode}>Masukkan kode lisensi</button>.
            </p>
            <p className="alt alt-tight">
              Lupa kata sandi? <button type="button" onClick={() => { setErr(''); setStep('forgot') }}>Atur ulang</button>.
            </p>
          </>
        )}

        {step === 'forgot' && (
          <>
            <div className="dlg-head">
              <h2 id="log-title">Atur ulang kata sandi</h2>
              <CloseButton onClick={close} />
            </div>
            <p className="lead">Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.</p>
            <form onSubmit={submitForgot} noValidate>
              <div className="field">
                <label htmlFor="log-forgot-email">Email</label>
                <input id="log-forgot-email" name="email" type="email" autoComplete="username" inputMode="email" required />
              </div>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn btn-ink btn-block" type="submit" disabled={busy}>
                {busy ? 'Mengirim…' : 'Kirim tautan atur ulang'}
              </button>
            </form>
            <p className="alt">
              <button type="button" onClick={() => { setErr(''); setStep('login') }}>Kembali ke Login</button>
            </p>
          </>
        )}

        {step === 'sent' && (
          <div className="done">
            <h2 id="log-title">Cek email Anda.</h2>
            <p className="lead">Kalau email itu terdaftar, kami sudah mengirim tautan untuk membuat kata sandi baru. Tautan berlaku sekali dan sementara.</p>
            <button className="btn btn-ink btn-block" style={{ marginTop: 20 }} type="button" onClick={close}>Mengerti</button>
          </div>
        )}
      </div>
    </Modal>
  )
}
