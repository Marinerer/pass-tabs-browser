import { COLOR_THEME_KEY } from './const'
import StoreApi from '@/utils/api/storage'

export async function useTheme(toggleEl?: HTMLElement) {
  // 检查本地存储中的主题偏好
  const storedTheme = await getTheme()
  const doc = document.documentElement

  if (storedTheme === 'light') {
    doc.classList.remove('dark')
  } else if (storedTheme === 'dark') {
    doc.classList.add('dark')
  } else {
    // 如果没有存储的偏好，则检查系统偏好
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      doc.classList.add('dark')
    } else {
      doc.classList.remove('dark')
    }
  }

  if (toggleEl) {
    toggleEl.onclick = async () => {
      // 切换深色/浅色模式
      doc.classList.toggle('dark')
      // 保存用户偏好到本地存储
      if (doc.classList.contains('dark')) {
        await setTheme('dark')
      } else {
        await setTheme('light')
      }
    }
  }
}

async function getTheme(): Promise<string> {
  const theme = await StoreApi.get<string>(COLOR_THEME_KEY)
  return theme
}
async function setTheme(theme: string) {
  await StoreApi.set(COLOR_THEME_KEY, theme)
}
