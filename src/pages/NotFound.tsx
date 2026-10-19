import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ maxWidth: 480, margin: '96px auto', padding: '0 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em' }}>404</p>
      <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', marginBottom: 14 }}>Halaman tidak ditemukan</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>
        Tautan yang Anda buka mungkin salah ketik atau sudah tidak berlaku.
      </p>
      <Link className="btn btn-ink" to="/">Kembali ke beranda</Link>
    </div>
  )
}
