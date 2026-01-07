// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    // from https://github.com/vite-pwa/nuxt?tab=readme-ov-file#-usage
    '@vite-pwa/nuxt',
    // from https://vuetifyjs.com/en/getting-started/installation/#manual-setup
    async (options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', config => {
        if (config && config.plugins) {
          config.plugins.push(vuetify({ autoImport: true }))
        }
      })
    }
  ],
  app: {
    head: {
      link: [
        { rel: "manifest", href: "/manifest.webmanifest" }
      ]
    }
  },
  ssr: false,
  pwa: {
    strategies: 'generateSW',
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    manifest: {
      "short_name": "Choirless",
      "name": "Choirless",
      "icons": [
        {
          "src": "/choirless192.png",
          "type": "image/png",
          "sizes": "192x192"
        },
        {
          "src": "/choirless192.png",
          "type": "image/png",
          "sizes": "512x512"
        }
      ],
      "id": "/?source=pwa",
      "start_url": "/?source=pwa",
      "background_color": "#FFFFFF",
      "display": "standalone",
      "scope": "/",
      "theme_color": "#FFC107",
      "description": "Music recorder"
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    },
    devOptions: {
      enabled: false,
      type: "module"
    }
  },
  runtimeConfig: {
    public: {
      apiBase: ''
    }
  },
  compatibilityDate: '2025-08-04',
  devtools: { enabled: true },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      }
    }
  }
})
