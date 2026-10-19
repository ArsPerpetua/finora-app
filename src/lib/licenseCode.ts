import { config } from '../config'

/** Menyusun input menjadi FNRA-XXXX-XXXX-XXXX saat pengguna mengetik. */
export function formatCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
  return (s.match(/.{1,4}/g) ?? []).join('-')
}

export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(code) && code.startsWith(config.codePrefix + '-')
}

export type CodeStatus = 'ok' | 'used' | 'revoked' | 'not_found' | 'rate_limited'

const PENDING_CODE_KEY = 'finora.pendingCode'

/**
 * Simpan kode yang sudah divalidasi tapi belum sempat diaktifkan (mis. menunggu konfirmasi
 * email). AuthProvider akan mencoba mengaktifkannya begitu sesi login tersedia, supaya
 * pengguna tidak perlu memasukkan kode yang sama dua kali.
 */
export function savePendingCode(code: string): void {
  try {
    localStorage.setItem(PENDING_CODE_KEY, code)
  } catch {
    /* penyimpanan diblokir: aktivasi otomatis dilewati, pengguna bisa memasukkan kode lagi di dashboard */
  }
}

/** Ambil dan hapus kode tertunda sekali pakai (percobaan aktivasi hanya dilakukan sekali). */
export function takePendingCode(): string | null {
  try {
    const value = localStorage.getItem(PENDING_CODE_KEY)
    if (value) localStorage.removeItem(PENDING_CODE_KEY)
    return value
  } catch {
    return null
  }
}

export const MESSAGES = {
  invalid_format: 'Format kode tidak sesuai. Contoh: FNRA-XXXX-XXXX-XXXX',
  not_found: 'Kode tidak ditemukan. Periksa kembali atau hubungi kami.',
  used: 'Kode ini sudah dipakai untuk membuat akun. Silakan tekan Login.',
  revoked: 'Kode ini sudah tidak aktif. Hubungi kami untuk bantuan.',
  rate_limited: 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.',
  offline: 'Perlu koneksi internet untuk langkah ini. Coba lagi saat online.',
  server: 'Terjadi gangguan pada server. Coba lagi sebentar lagi.',
  not_configured: 'Aplikasi belum tersambung ke server. Isi file .env terlebih dahulu.',
  email_taken: 'Email ini sudah terdaftar. Silakan tekan Login.',
  bad_credentials: 'Email atau kata sandi salah.',
} as const

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
