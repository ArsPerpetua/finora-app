import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
}

/** Pembungkus <dialog> bawaan browser: fokus terkunci, Esc menutup, klik latar menutup. */
export function Modal({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open ? children : null}
    </dialog>
  )
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="x" type="button" onClick={onClick} aria-label="Tutup">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
