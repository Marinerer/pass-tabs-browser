import { defineConfig, type WxtViteConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  outDir: 'dist',
  manifest: {
    name: '页签时空门',
    description: '快速切换和管理最近访问的浏览器页签',
    permissions: ['storage', 'tabs', 'history'],
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
