import { useState } from 'react'
import { AccountDialog, LoginDialog } from '../components/landing/AuthDialogs'
import { Closing } from '../components/landing/Closing'
import { Compare } from '../components/landing/Compare'
import { Faq } from '../components/landing/Faq'
import { Flow } from '../components/landing/Flow'
import { Header } from '../components/landing/Header'
import { Hero } from '../components/landing/Hero'
import { Pass } from '../components/landing/Pass'
import { Tour } from '../components/landing/Tour'

function focusCodeInput() {
  setTimeout(() => document.getElementById('code')?.focus({ preventScroll: true }), 450)
}

export default function Landing() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [pendingCode, setPendingCode] = useState<string | null>(null)

  return (
    <>
      <a className="skip" href="#code">Lewati ke kolom kode lisensi</a>
      <Header onLogin={() => setLoginOpen(true)} />
      <main>
        <Hero />
        <Pass onOpenLogin={() => setLoginOpen(true)} onCodeAccepted={setPendingCode} />
        <Tour />
        <Compare />
        <Flow />
        <Faq />
        <Closing onHaveCode={focusCodeInput} />
      </main>

      <AccountDialog code={pendingCode} onClose={() => setPendingCode(null)} />
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onNeedCode={() => {
          setLoginOpen(false)
          location.hash = '#masuk'
          focusCodeInput()
        }}
      />
    </>
  )
}
