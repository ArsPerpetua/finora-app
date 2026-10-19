import { useCallback, useEffect, useRef, useState } from 'react'
import { readFinancialState, type FinancialState, type Transaction } from '../lib/finance'
import { supabase } from '../lib/supabase'

interface DashboardData {
  ownerId: string
  transactions: Transaction[]
  financialState: FinancialState
  loading: boolean
  hasData: boolean
  error: string
  updatedAt: Date | null
  conflict: boolean
}

const emptyFinancialState: FinancialState = { accounts: [], cats: [], goals: [], budget: { total: 0, cats: {} } }

const empty = (ownerId: string): DashboardData => ({
  ownerId, transactions: [], financialState: emptyFinancialState,
  loading: true, hasData: false, error: '', updatedAt: null, conflict: false,
})

async function readTransactions(userId: string, signal: AbortSignal): Promise<Transaction[]> {
  const transactions: Transaction[] = []
  let cursor: string | null = null
  // Ambil semua halaman: batas bawaan API tidak boleh memotong perhitungan saldo.
  // Cursor UUID menghindari duplikasi halaman saat transaksi Telegram masuk.
  while (!signal.aborted) {
    let query = supabase.from('transactions')
      .select('id, type, amount, account_id, to_account_id, cat_id, title, note, tx_date, created_at, source')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .limit(1000)
      .abortSignal(signal)
    if (cursor) query = query.gt('id', cursor)
    const { data, error } = await query.returns<Transaction[]>()
    if (error) throw error
    if (!data?.length) break
    const next = data[data.length - 1].id
    if (next === cursor) throw new Error('Cursor transaksi tidak berubah')
    transactions.push(...data)
    cursor = next
  }
  if (signal.aborted) throw new Error('Pemuatan transaksi dibatalkan')
  return transactions
}

export function useDashboardData(userId: string) {
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<DashboardData>(() => empty(userId))
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  // Versi `user_state.updated_at` yang terakhir kita baca, untuk deteksi konflik
  // optimistik saat menyimpan (lihat updateState di bawah). Ref, bukan state,
  // supaya updateState selalu baca nilai terbaru tanpa jadi dependency useCallback.
  const stateVersionRef = useRef<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    const timeout = window.setTimeout(() => controller.abort(), 20000)
    setData(previous => previous.ownerId === userId ? { ...previous, loading: true, error: '' } : empty(userId))
    async function load() {
      try {
        const [transactions, state] = await Promise.all([
          readTransactions(userId, controller.signal),
          supabase.from('user_state').select('data, updated_at').eq('user_id', userId).abortSignal(controller.signal).maybeSingle(),
        ])
        if (state.error) throw state.error
        if (!disposed && !controller.signal.aborted) {
          stateVersionRef.current = state.data?.updated_at ?? null
          setData({
            ownerId: userId, transactions, financialState: readFinancialState(state.data?.data),
            loading: false, hasData: true, error: '', updatedAt: new Date(), conflict: false,
          })
        }
      } catch {
        if (!disposed) setData(previous => ({
          ...(previous.ownerId === userId ? previous : empty(userId)), loading: false,
          error: 'Data belum dapat diperbarui. Periksa koneksi Anda, lalu coba lagi.',
        }))
      } finally { window.clearTimeout(timeout) }
    }
    void load()
    return () => { disposed = true; window.clearTimeout(timeout); controller.abort() }
  }, [userId, revision])

  useEffect(() => {
    const onReturn = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', onReturn)
    window.addEventListener('online', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => {
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('online', onReturn)
      document.removeEventListener('visibilitychange', onReturn)
    }
  }, [refresh])

  // Realtime: catatan baru/ubahan dari Telegram (atau tab lain) langsung tampil tanpa refresh manual.
  useEffect(() => {
    const channel = supabase
      .channel(`transactions-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => refresh())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [userId, refresh])

  const updateState = useCallback(async (updater: (state: FinancialState) => FinancialState) => {
    let previous: FinancialState | null = null
    let next: FinancialState | null = null
    setData(current => {
      if (current.ownerId !== userId) return current
      previous = current.financialState
      next = updater(current.financialState)
      return { ...current, financialState: next }
    })
    if (!next) return
    const nowIso = new Date().toISOString()
    const expectedVersion = stateVersionRef.current
    let query = supabase.from('user_state').update({ data: next, updated_at: nowIso }).eq('user_id', userId)
    if (expectedVersion) query = query.eq('updated_at', expectedVersion)
    const { data: rows, error } = await query.select('updated_at')
    if (error) {
      setData(current => current.ownerId === userId && previous ? { ...current, financialState: previous } : current)
      throw error
    }
    if (rows?.length) {
      stateVersionRef.current = rows[0].updated_at
      return
    }
    // `expectedVersion` tidak cocok lagi: baris berubah di server sejak terakhir dibaca
    // (mis. disimpan dari tab/perangkat lain). Simpan tetap (last-write-wins), tapi beri tahu.
    const retry = await supabase.from('user_state').update({ data: next, updated_at: nowIso }).eq('user_id', userId).select('updated_at')
    if (retry.error) {
      setData(current => current.ownerId === userId && previous ? { ...current, financialState: previous } : current)
      throw retry.error
    }
    stateVersionRef.current = retry.data?.[0]?.updated_at ?? nowIso
    setData(current => current.ownerId === userId ? { ...current, conflict: true } : current)
  }, [userId])

  const dismissConflict = useCallback(() => {
    setData(current => current.ownerId === userId ? { ...current, conflict: false } : current)
  }, [userId])

  return { ...(data.ownerId === userId ? data : empty(userId)), refresh, updateState, dismissConflict }
}
