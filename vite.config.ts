import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@entities': path.resolve(import.meta.dirname, './src/entities'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
      '@widgets': path.resolve(import.meta.dirname, './src/widgets'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@shared': path.resolve(import.meta.dirname, './src/shared'),
      '@app': path.resolve(import.meta.dirname, './src/app'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
