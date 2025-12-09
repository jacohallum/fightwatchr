'use client'
import { useSession, signOut } from 'next-auth/react'
import ThemeToggle from '@/components/ThemeToggle'
import { useState, useEffect } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/', redirect: true })
  }

  const showMobileMenu = mounted && mobileMenuOpen
  
  return (
    <header className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-red-900/30">
      {/* Main Header Row */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side - Menu Icon & Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col space-y-1.5 w-8 h-8 justify-center hover:opacity-80 transition-opacity"
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-0.5 bg-gray-900 dark:bg-white"></span>
            <span className="block w-6 h-0.5 bg-gray-900 dark:bg-white"></span>
            <span className="block w-6 h-0.5 bg-gray-900 dark:bg-white"></span>
            <span className="block w-6 h-0.5 bg-gray-900 dark:bg-white"></span>
          </button>
          <a href="/dashboard" className="flex items-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Fight<span className="text-red-500">Watchr</span>
            </h1>
          </a>
        </div>

       {/* Desktop Navigation - Centered like Sherdog */}
        <nav className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-1">
          <a href="/dashboard/fighters"
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
          >
            FIGHTERS
          </a>
          <a href="/dashboard/events"
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
          >
            EVENTS
          </a>
          <a href="/dashboard/predictions"
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
          >
            PREDICTIONS
          </a>
          <a href="/dashboard/rankings"
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
          >
            RANKINGS
          </a>
        </nav>

        {/* Right Side - User Dropdown & Actions */}
        <div className="flex items-center space-x-3 lg:space-x-4">
          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="hidden sm:block text-sm lg:text-base">
                {session?.user?.email?.split('@')[0] || 'Fighter'}
              </span>
              <svg 
                className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1">
                <a
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Settings
                </a>
                <button
                  onClick={() => {
                    handleSignOut();
                    setUserDropdownOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu - Centered like Sherdog's top-menu */}
      {showMobileMenu && (
       <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-3">
          <div className="flex justify-center">
            <nav className="flex flex-col items-center space-y-2 w-full max-w-md px-4">
              <a
                href="/dashboard/fighters"
                className="w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                FIGHTERS
              </a>
              <a
                href="/dashboard/events"
                className="w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                EVENTS
              </a>
              <a
                href="/dashboard/predictions"
                className="w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                PREDICTIONS
              </a>
              <a
                href="/dashboard/rankings"
                className="w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                RANKINGS
              </a>
              
              {/* Mobile User Options */}
              <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <a
                  href="/dashboard/settings"
                  className="w-full text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-700/50 rounded text-center block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </a>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-700/50 rounded text-center"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {userDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserDropdownOpen(false)}
        />
      )}
    </header>
  )
}