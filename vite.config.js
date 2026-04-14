import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // GitHub Pages serves from /tiger-library/ subpath
  // Dev: base = '/' so Vite dev server works normally
  base: mode === 'production' ? '/tiger-library/' : '/',

  // Inject process.env.VITE_API_URL at build time so api/client.js gets the
  // Railway URL baked in. In dev this is '' so the proxy handles /api/*.
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  },

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  server: {
    // Dev: proxy /api/* → Express on :3001
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react:  ['react', 'react-dom'],
          framer: ['framer-motion'],
          charts: ['recharts'],
          ui:     ['lucide-react', 'clsx'],
        },
      },
    },
  },
}))
