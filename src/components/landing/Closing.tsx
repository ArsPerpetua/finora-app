import { Link } from 'react-router-dom'
import { config } from '../../config'

export function Closing({ onHaveCode }: { onHaveCode: () => void }) {
  return (
    <>
      <section className="band" aria-labelledby="t-tutup">
        <div className="wrap in">
          <h2 id="t-tutup">Mulai catat hari ini.</h2>
          <div className="acts">
            <a className="btn btn-ink" href={config.checkoutUrl} target="_blank" rel="noopener">Daftar</a>
            <a className="btn btn-line" href="#masuk" onClick={onHaveCode}>Saya punya kode</a>
          </div>
        </div>
      </section>
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
