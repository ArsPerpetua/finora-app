import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../../config'

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <div className="wrap legal-top">
        <Link className="brand" to="/" aria-label="Finora, ke beranda"><span className="mark" aria-hidden="true">F</span>Finora</Link>
      </div>
      <main className="wrap legal">
        <h1>{title}</h1>
        <p className="legal-updated">Terakhir diperbarui: {updated}</p>
        {children}
      </main>
      <footer>
        <div className="wrap row">
          <span>Know your money. Control your future.</span>
          <span>
            © 2026 Finora &nbsp;·{' '}
            <Link to="/privasi">Kebijakan Privasi</Link> &nbsp;·{' '}
            <Link to="/syarat">Syarat &amp; Ketentuan</Link> &nbsp;·{' '}
            <a href={config.supportUrl} target="_blank" rel="noopener">Hubungi kami</a>
          </span>
        </div>
      </footer>
    </>
  )
}
