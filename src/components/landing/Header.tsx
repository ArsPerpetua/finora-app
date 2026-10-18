import { config } from '../../config'
import { useTheme } from '../../hooks/useTheme'

export function Header({ onLogin }: { onLogin: () => void }) {
  const toggleTheme = useTheme()
  return (
    <div className="wrap">
      <header className="top">
        <a className="brand" href="#" aria-label="Finora, ke atas halaman">
          <span className="mark" aria-hidden="true">F</span>Finora
        </a>
        <nav className="nav" aria-label="Utama">
          <a className="link" href="#fitur">Fitur</a>
          <a className="link" href="#cara-kerja">Cara kerja</a>
          <a className="link" href="#faq">Pertanyaan umum</a>
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Ganti tema terang atau gelap">
            <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
            <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <button className="pill" type="button" onClick={onLogin}>Login</button>
          <a className="pill pill-lime" href={config.checkoutUrl} target="_blank" rel="noopener">Daftar</a>
        </nav>
      </header>
    </div>
  )
}
