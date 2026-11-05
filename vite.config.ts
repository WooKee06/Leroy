/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import type { Connect } from 'vite';
import type { ServerResponse } from 'node:http'
import path from 'path'

/**
 * Serves /tonconnect-manifest.json with the correct dApp origin embedded.
 * TON wallets fetch this file and read `url` / `iconUrl` from it, so it must be
 * reachable and match the origin the Mini App runs on. Registered in both dev
 * (server middleware) and build (emitted asset).
 */
function tonConnectManifest(): Plugin {
  const manifestBody = (origin: string) =>
    JSON.stringify(
      {
        url: origin,
        name: 'Leroy',
        iconUrl: `${origin}/favicon.svg`,
        termsOfUseUrl: `${origin}/`,
        privacyPolicyUrl: `${origin}/`,
      },
      null,
      2,
    )

  return {
    name: 'leroy-tonconnect-manifest',
    configureServer(server) {
      // Pre-middleware: must run before Vite's SPA fallback.
      server.middlewares.use(
        '/tonconnect-manifest.json',
        (req: Connect.IncomingMessage, res: ServerResponse) => {
          const host =
            req.headers.host ??
            `localhost:${server.config.server.port ?? 5173}`
          res.setHeader('Content-Type', 'application/json')
          res.end(manifestBody(`http://${host}`))
        },
      )
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'tonconnect-manifest.json',
        source: manifestBody(
          process.env.VITE_PUBLIC_URL || 'https://<set-VITE_PUBLIC_URL>',
        ),
      })
    },
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', '**/*.d.ts', 'src/main.tsx'],
    },
  },
  plugins: [react(), tonConnectManifest()],
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