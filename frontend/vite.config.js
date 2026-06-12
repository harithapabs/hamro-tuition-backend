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
          { src: 'hamro-logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'hamro-logo.png', sizes: '512x512', type: 'image/png' },
          { src: 'hamro-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: [],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: []
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          'toast': ['react-hot-toast'],
          'icons': ['react-icons/fi', 'react-icons/fa'],
          'player': ['react-player'],
          'charts': ['chart.js', 'react-chartjs-2'],
          'html2canvas': ['html2canvas'],
          'purify': ['dompurify']
        }
      }
    }
  },
  server: { port: 3000, proxy: { '/api': 'http://localhost:8080', '/uploads': 'http://localhost:8080' } }
})
