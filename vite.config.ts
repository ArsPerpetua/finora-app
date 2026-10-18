import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Finora',
        short_name: 'Finora',
        description: 'Catat transaksi, anggaran, tabungan, dan tagihan dalam rupiah.',
        lang: 'id',
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        background_color: '#f5f5f2',
        theme_color: '#d6fb4f',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Penting: jangan biarkan service worker mengambil alih webhook bot dan API.
        navigateFallbackDenylist: [/^\/\.netlify\//, /^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
})
