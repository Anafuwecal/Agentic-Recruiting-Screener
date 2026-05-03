import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3141',
        changeOrigin: true,
      }
    }
  }
})