/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Only allow network requests to the GitHub API, so injected script can't send data anywhere
 * else. Build-only: the dev server needs inline scripts and websockets.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      ),
  }
}

/** GitHub Pages serves 404.html for unknown paths; make it the app so deep links work. */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved: (config) => void (outDir = config.build.outDir),
    closeBundle: () => copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html')),
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Set by the Pages workflow to "/<repo>/"; "/" for local dev.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), contentSecurityPolicy(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
