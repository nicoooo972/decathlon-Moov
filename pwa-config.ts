import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfiguration: VitePWAOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Decathlon Urban Trek',
    short_name: 'Urban Trek',
    description: 'Explorez votre ville en famille avec des parcours personnalisés',
    theme_color: '#0082C3', // Bleu Decathlon
    background_color: '#ffffff',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico}']
  }
}; 