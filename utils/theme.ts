import { COLOR_THEME_KEY } from './const'
import StoreApi from '@/utils/api/storage'

// Function to apply the current theme to the document
function applyThemePreference(theme: 'light' | 'dark') {
  const doc = document.documentElement
  if (theme === 'dark') {
    doc.classList.remove('light')
    doc.classList.add('dark')
    doc.dataset.theme = 'dark'
    doc.style.colorScheme = 'dark'
  } else {
    doc.classList.remove('dark')
    doc.classList.add('light')
    doc.dataset.theme = 'light'
    doc.style.colorScheme = 'light'
  }
}

// Listener for system theme changes
let systemThemeChangeListener: ((e: MediaQueryListEvent) => void) | null = null

export async function useTheme(toggleEl?: HTMLElement) {
  const storedTheme = await getTheme() // Can be 'light', 'dark', or 'system'

  const applyActualTheme = (themeToApply: 'light' | 'dark' | 'system') => {
    if (themeToApply === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyThemePreference(systemPrefersDark ? 'dark' : 'light')
    } else {
      applyThemePreference(themeToApply)
    }
  }

  applyActualTheme(storedTheme)

  // Remove existing listener if any
  if (systemThemeChangeListener) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.removeEventListener('change', systemThemeChangeListener)
    systemThemeChangeListener = null
  }

  if (storedTheme === 'system') {
    systemThemeChangeListener = (e: MediaQueryListEvent) => {
      applyThemePreference(e.matches ? 'dark' : 'light')
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', systemThemeChangeListener)
  }

  if (toggleEl) {
    toggleEl.onclick = async () => {
      const doc = document.documentElement
      const isCurrentlyDark = doc.classList.contains('dark')
      const newTheme = isCurrentlyDark ? 'light' : 'dark'
      
      applyThemePreference(newTheme) // Apply visually
      await setTheme(newTheme) // Save user preference, not 'system'

      // If user was on 'system' and clicks toggle, they are now explicitly choosing light/dark
      // So, remove system listener if it exists
      if (systemThemeChangeListener) {
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        mql.removeEventListener('change', systemThemeChangeListener)
        systemThemeChangeListener = null
      }
    }
  }
}

export async function getTheme(): Promise<'light' | 'dark' | 'system'> {
  const theme = await StoreApi.get<string>(COLOR_THEME_KEY)
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme as 'light' | 'dark' | 'system'
  }
  return 'system' // Default to system if stored value is invalid
}

export async function setTheme(theme: 'light' | 'dark' | 'system') {
  await StoreApi.set(COLOR_THEME_KEY, theme)
}
