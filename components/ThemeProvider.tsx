'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({
  theme: 'dark',
  toggleTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // Only run on client after mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as Theme | null
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = saved === 'light' || saved === 'dark' ? saved : (systemPrefersDark ? 'dark' : 'light')
    
    setTheme(initialTheme)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}