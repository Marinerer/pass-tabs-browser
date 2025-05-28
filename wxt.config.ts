import { defineConfig, type WxtViteConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  outDir: 'dist',
  manifest: {
    name: 'pass tabs', //页签时空门
    description: 'Quickly switch and manage recently visited browser tabs.', //快速切换和管理最近访问的浏览器页签
    permissions: ['storage', 'tabs', 'history'],
    options_ui: {
      page: 'entrypoints/options/options.html', // Reverted path
      open_in_tab: true,
    },
  },
  vite: () =>
    ({
      plugins: [],
      css: {
        postcss: {
          plugins: [require('tailwindcss'), require('autoprefixer')],
        },
      },
    } as WxtViteConfig),
})
