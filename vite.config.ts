import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base './' so the same build works on GitHub Pages, any host, and inside the Capacitor APK.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': the app shows "Update" and the user taps it (Renz, 2026-11-18).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg'],
      // Exercise demo photos (1.8 MB) are cached too, so "How to do it" works offline at the gym.
      workbox: { globPatterns: ['**/*.{js,css,html,svg}', 'demos/*.jpg'] },
      manifest: {
        name: 'MaxFit',
        short_name: 'MaxFit',
        description: 'Train like a game. Unlock exercises, beat your records, evolve your avatar.',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
