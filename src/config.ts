export const config = {
  checkoutUrl: (import.meta.env.VITE_CHECKOUT_URL as string | undefined) || '#',
  supportUrl: (import.meta.env.VITE_SUPPORT_URL as string | undefined) || '#',
  telegramBot: (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined) || '',
  codePrefix: 'FNRA',
}
