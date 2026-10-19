import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CloseButton, Modal } from '../Modal'
import {
  expenseCategoryOptions, incomeCategoryOptions, todayMakassar,
  type FinancialState, type TransactionType,
} from '../../lib/finance'
import { supabase } from '../../lib/supabase'

function parseAmount(value: string): number {
  const n = Number(value.replace(/[^\d]/g, '') || '0')
  return Number.isFinite(n) ? n : 0
}

export function TransactionFormDialog({ open, onClose, userId, state, onSaved }: {
  open: boolean; onClose: () => void; userId: string; state: FinancialState; onSaved: () => void
}) {
  const titleId = useId()
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => todayMakassar())
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const categories = type === 'income' ? incomeCategoryOptions(state) : expenseCategoryOptions(state)

  // Isi ulang default setiap kali dialog dibuka, karena akun bisa saja baru selesai dimuat setelah dialog pertama kali dipasang.
  useEffect(() => {
    if (!open) return
    setType('expense'); setAmount(''); setDate(todayMakassar()); setAccountId(state.accounts[0]?.id ?? '')
    setToAccountId(''); setCategoryId(''); setTitle(''); setNote(''); setErr('')
  }, [open])

  function close() {
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = parseAmount(amount)
    if (value <= 0) return setErr('Jumlah harus lebih dari 0.')
    if (type === 'transfer') {
      if (!accountId || !toAccountId) return setErr('Pilih akun asal dan akun tujuan.')
      if (accountId === toAccountId) return setErr('Akun asal dan tujuan tidak boleh sama.')
    }
    setBusy(true)
    setErr('')
    const { error } = await supabase.from('transactions').insert({
      user_id: userId, type, amount: value, account_id: accountId || null,
      to_account_id: type === 'transfer' ? toAccountId : null,
      cat_id: type === 'transfer' ? null : (categoryId || null),
      title: title.trim(), note: note.trim(), tx_date: date, source: 'web',
    })
    setBusy(false)
    if (error) return setErr(/row-level security|permission/i.test(error.message) ? 'Akun Anda belum aktif. Aktivasi akses dulu di bagian bawah Beranda.' : 'Gagal menyimpan. Periksa koneksi Anda lalu coba lagi.')
    onSaved()
    close()
  }

  return <Modal open={open} onClose={close} labelledBy={titleId}>
    <div className="dlg">
      <div className="dlg-head"><h2 id={titleId}>Catat transaksi</h2><CloseButton onClick={close} /></div>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="tx-type">Jenis</label>
          <select id="tx-type" value={type} onChange={event => { setType(event.target.value as TransactionType); setCategoryId('') }}>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer antar akun</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="tx-amount">Jumlah</label>
          <input id="tx-amount" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Contoh: 25000" autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="tx-account">{type === 'transfer' ? 'Dari akun' : 'Akun'}</label>
          {state.accounts.length
            ? <select id="tx-account" value={accountId} onChange={event => setAccountId(event.target.value)}>
              {type !== 'transfer' && <option value="">Tanpa akun</option>}
              {state.accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            : <span className="hint">Belum ada akun. <Link to="/app/akun" onClick={close}>Tambah akun</Link> agar transaksi tertaut ke akun Anda (opsional).</span>}
        </div>
        {type === 'transfer'
          ? <div className="field">
            <label htmlFor="tx-to-account">Ke akun</label>
            <select id="tx-to-account" value={toAccountId} onChange={event => setToAccountId(event.target.value)}>
              <option value="">Pilih akun tujuan</option>
              {state.accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </div>
          : <div className="field">
            <label htmlFor="tx-category">Kategori</label>
            <select id="tx-category" value={categoryId} onChange={event => setCategoryId(event.target.value)}>
              <option value="">{type === 'income' ? 'Pemasukan lain' : 'Lainnya'}</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>}
        <div className="field">
          <label htmlFor="tx-date">Tanggal</label>
          <input id="tx-date" type="date" value={date} onChange={event => setDate(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="tx-title">Judul (opsional)</label>
          <input id="tx-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Contoh: Makan siang" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="tx-note">Catatan (opsional)</label>
          <input id="tx-note" value={note} onChange={event => setNote(event.target.value)} maxLength={200} />
        </div>
        <p className="err" role="alert">{err}</p>
        <button className="btn btn-ink btn-block" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan transaksi'}</button>
      </form>
    </div>
  </Modal>
}
