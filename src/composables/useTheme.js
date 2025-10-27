import { ref, watch } from 'vue'
import { useAuth } from './useAuth'

// 支持三种主题模式：light, dark, system
const themeMode = ref(localStorage.getItem('themeMode') || 'system')
const isDark = ref(false)

// 检测系统主题
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 应用主题
const applyTheme = () => {
  const currentTheme = themeMode.value === 'system' ? getSystemTheme() : themeMode.value
  isDark.value = currentTheme === 'dark'
  
  if (currentTheme === 'dark') {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  }
}

export function useTheme() {
  const { isAuthenticated, getAuthHeaders, apiRequest } = useAuth()
  
  // 保存主题到数据库
  const saveThemeToDB = async (mode) => {
    if (!isAuthenticated.value) return
    
    try {
      await apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { themeMode: mode } })
      })
    } catch (error) {
      if (error.message === 'Token expired') {
        console.warn('Token expired, theme not saved to database')
      } else {
        console.error('Failed to save theme to database:', error)
      }
    }
  }
  
  // 从数据库加载主题
  const loadThemeFromDB = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: isAuthenticated.value ? getAuthHeaders() : {}
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.themeMode) {
          themeMode.value = data.data.themeMode
          localStorage.setItem('themeMode', themeMode.value)
          applyTheme()
        }
      }
    } catch (error) {
      console.error('Failed to load theme from database:', error)
    }
  }
  
  // 设置主题模式
  const setThemeMode = async (mode) => {
    themeMode.value = mode
    localStorage.setItem('themeMode', mode)
    applyTheme()
    
    // 保存到数据库
    await saveThemeToDB(mode)
  }
  
  // 循环切换主题：light -> dark -> system -> light
  const toggleTheme = async () => {
    const modes = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    await setThemeMode(modes[nextIndex])
  }
  
  // 监听主题模式变化
  watch(themeMode, applyTheme, { immediate: true })
  
  // 监听系统主题变化（当模式为 system 时）
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (themeMode.value === 'system') {
        applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  }
  
  return {
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
    loadThemeFromDB
  }
}

