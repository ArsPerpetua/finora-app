import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. Salin .env.example menjadi .env.')
}

// Nilai cadangan supaya halaman tetap tampil walau .env belum diisi.
// Jangan pernah memakai service_role key di sini: file ini berjalan di browser.
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'belum-diisi', {
  auth: { persistSession: true, autoRefreshToken: true },
})
