import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hamro Tuition - Online Learning Platform',
        short_name: 'Hamro Tuition',
        description: 'Online tuition platform for Class 8 to Bachelor Level students in Nepal',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en-US',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/courses'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-courses',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  server: { port: 3000, proxy: { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' } }
})
