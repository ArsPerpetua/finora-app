import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { config } from '../../config'
import { useAuth } from '../../lib/auth'
import { formatCode, isValidCodeFormat, MESSAGES, type CodeStatus } from '../../lib/licenseCode'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

interface Props {
  onOpenLogin: () => void
  onCodeAccepted: (code: string) => void
}

/** Tiket tiga pintu: beli, punya kode, sudah punya akun. */
export function Pass({ onOpenLogin, onCodeAccepted }: Props) {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean }>({ text: '', ok: false })
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const c = formatCode(code)
    if (!isValidCodeFormat(c)) {
      setMsg({ text: MESSAGES.invalid_format, ok: false })
      inputRef.current?.focus()
      return
    }
    if (!isSupabaseConfigured) {
      setMsg({ text: MESSAGES.not_configured, ok: false })
      return
    }
    if (!navigator.onLine) {
      setMsg({ text: MESSAGES.offline, ok: false })
      return
    }
    setBusy(true)
    setMsg({ text: '', ok: false })
    const { data, error } = await supabase.rpc('check_code', { p_code: c })
    setBusy(false)
    if (error) {
      setMsg({ text: MESSAGES.server, ok: false })
      return
    }
    const status = data as CodeStatus
    if (status !== 'ok') {
      setMsg({ text: MESSAGES[status] ?? MESSAGES.server, ok: false })
      inputRef.current?.focus()
      return
    }
    onCodeAccepted(c)
    setCode('')
  }

  const loggedIn = Boolean(session)

  return (
    <section className="pass-wrap wrap" id="masuk" aria-labelledby="t-masuk">
      <h2 className="sr-only" id="t-masuk">Masuk ke Finora</h2>
      <div className="pass">
        <div className="stub stub-buy">
          <h3>Belum punya kode lisensi?</h3>
          <p className="t">
            Beli akses di Order Hero. Setelah pembayaran lunas, link Finora dan kode lisensi dikirim ke email atau WhatsApp Anda.
          </p>
          <div className="push">
            <a className="btn btn-lime btn-block" href={config.checkoutUrl} target="_blank" rel="noopener">Daftar</a>
          </div>
        </div>

        <form className="stub stub-code" onSubmit={submit} noValidate>
          <h3>Punya kode lisensi?</h3>
          <p className="t">Masukkan kode dari email atau WhatsApp pembelian Anda, lalu buat akun. Kode hanya berlaku sekali.</p>
          <label htmlFor="code">Kode lisensi</label>
          <input
            ref={inputRef}
            id="code"
            name="code"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={19}
            placeholder="FNRA-XXXX-XXXX-XXXX"
            aria-describedby="code-msg"
            aria-invalid={msg.text && !msg.ok ? 'true' : 'false'}
            value={code}
            onChange={(e) => {
              setCode(formatCode(e.target.value))
              if (msg.text) setMsg({ text: '', ok: false })
            }}
            required
          />
          <p className={'msg' + (msg.ok ? ' ok' : '')} id="code-msg" role="alert">{msg.text}</p>
          <div className="push">
            <button className="btn btn-ink btn-block" type="submit" disabled={busy}>
              {busy ? 'Memeriksa kode…' : 'Aktivasi'}
            </button>
          </div>
        </form>

        <div className="stub stub-login">
          {loggedIn ? (
            <>
              <h3>Selamat datang kembali</h3>
              <p className="who">{profile?.name || session?.user.email}</p>
              <p className="msg" role="status" />
              <div className="push">
                <button className="btn btn-paper btn-block" type="button" onClick={() => navigate('/app')}>Lanjut ke Finora</button>
              </div>
              <button className="linkbtn" type="button" onClick={() => void signOut()}>Keluar dari akun ini</button>
            </>
          ) : (
            <>
              <h3>Sudah punya akun?</h3>
              <p className="t">Cukup login dengan email dan kata sandi Anda. Tidak perlu kode lisensi lagi.</p>
              <div className="push">
                <button className="btn btn-paper btn-block" type="button" onClick={onOpenLogin}>Login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
