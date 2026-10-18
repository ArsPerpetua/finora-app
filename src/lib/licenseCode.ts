import { config } from '../config'

/** Menyusun input menjadi FNRA-XXXX-XXXX-XXXX saat pengguna mengetik. */
export function formatCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
  return (s.match(/.{1,4}/g) ?? []).join('-')
}

export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(code) && code.startsWith(config.codePrefix + '-')
}

export type CodeStatus = 'ok' | 'used' | 'revoked' | 'not_found'

export const MESSAGES = {
  invalid_format: 'Format kode tidak sesuai. Contoh: FNRA-XXXX-XXXX-XXXX',
  not_found: 'Kode tidak ditemukan. Periksa kembali atau hubungi kami.',
  used: 'Kode ini sudah dipakai untuk membuat akun. Silakan tekan Login.',
  revoked: 'Kode ini sudah tidak aktif. Hubungi kami untuk bantuan.',
  offline: 'Perlu koneksi internet untuk langkah ini. Coba lagi saat online.',
  server: 'Terjadi gangguan pada server. Coba lagi sebentar lagi.',
  not_configured: 'Aplikasi belum tersambung ke server. Isi file .env terlebih dahulu.',
  email_taken: 'Email ini sudah terdaftar. Silakan tekan Login.',
  bad_credentials: 'Email atau kata sandi salah.',
  activation_failed: 'Akun sudah dibuat, tetapi kode belum bisa diaktifkan. Login lalu masukkan kode lagi di dalam aplikasi.',
} as const

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
