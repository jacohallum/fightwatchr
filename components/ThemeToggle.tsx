'use client'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-gray-300 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}