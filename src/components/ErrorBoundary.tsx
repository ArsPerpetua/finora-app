import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Pembungkus seluruh aplikasi: tangkap error render tak terduga, tampilkan halaman ramah alih-alih layar putih kosong. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Error tak tertangkap:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ maxWidth: 480, margin: '96px auto', padding: '0 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', marginBottom: 14 }}>Terjadi kesalahan</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 28 }}>
          Maaf, ada yang tidak berjalan semestinya. Coba muat ulang halaman ini.
        </p>
        <button className="btn btn-ink" type="button" onClick={() => location.reload()}>Muat ulang</button>
      </div>
    )
  }
}
