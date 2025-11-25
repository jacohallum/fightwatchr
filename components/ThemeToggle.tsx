'use client'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-700 dark:bg-gray-700 hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}