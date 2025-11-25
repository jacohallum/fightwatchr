'use client'
import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tickerItems, setTickerItems] = useState<any[]>([])
  const [showDebug, setShowDebug] = useState(false)

  // Fetch real fight data
  useEffect(() => {
    const fetchFights = () => {
      fetch('/api/ticker/fights')
        .then(res => {
          console.log('📡 Response status:', res.status, res.statusText)
          return res.json()
        })
        .then(data => {
          console.log('📊 Received ticker data:', data)
          console.log(`   Total fights: ${data.items?.length || 0}`)
          
          if (data.items && data.items.length > 0) {
            console.log('✅ Setting ticker items:', data.items.length)
            setTickerItems(data.items)
          } else {
            console.log('⚠️ No items in data.items')
            setTickerItems([
              { org: 'UFC', fighter1: 'No', fighter2: 'Fights', status: 'YET', isCompleted: false }
            ])
          }
        })
        .catch((err) => {
          console.error('❌ Error fetching fights:', err)
          setTickerItems([
            { org: 'UFC', fighter1: 'Error', fighter2: 'Loading', status: 'RETRY', isCompleted: false }
          ])
        })
    }

    fetchFights()
    const interval = setInterval(fetchFights, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Build ticker text - repeat items multiple times for continuous flow
  const tickerText = tickerItems.length > 0
    ? Array(6).fill(tickerItems)
        .flat()
        .map(item => `${item.org}: ${item.fighter1} vs ${item.fighter2} (${item.status})`)
        .join(' • ')
    : 'FightWatchr • Your MMA Command Center • Track Fights • Get Alerts • Never Miss An Event'
  
  const handleCredentialsAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      if (isLogin) {
        // Handle Sign In
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid email or password')
          setLoading(false)
        } else if (result?.ok) {
          const session = await getSession()
          if (session) {
            router.push('/dashboard')
          } else {
            setError('Login failed - please try again')
            setLoading(false)
          }
        } else {
          setError('Login failed - please try again')
          setLoading(false)
        }
      } else {
        // Handle Sign Up
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Registration successful, now sign in
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })

          if (result?.ok) {
            const session = await getSession()
            if (session) {
              router.push('/dashboard')
            } else {
              setError('Account created but login failed. Please try signing in.')
              setLoading(false)
            }
          } else {
            setError('Account created but login failed. Please try signing in.')
            setLoading(false)
          }
        } else {
          setError(data.message || 'Failed to create account')
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('An error occurred during authentication')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCredentialsAuth()
    }
  }

  const handleLogout = () => {
    setEmail('')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="max-w-md w-full space-y-12 relative z-20">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>
        {/* Section 1: Logo/Brand */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">
            Fight<span className="text-red-500">Watchr</span>
          </h1>
          <p className="text-gray-400 text-lg">Your AI-Powered Sports Command Center</p>
        </div>

        {/* Section 2: Auth Card with Octagon Shape and Ticker */}
        <div className="relative">
          {/* Continuous Ticker overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Octagon path */}
              <path
                id="tickerPath"
                d="M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z"
                fill="none"
              />
              
              {/* Single continuous ticker text */}
              <text fontSize="4" fontWeight="bold" fill="#fff" opacity="0.9" stroke="#000" strokeWidth="0.2">
                <textPath
                  href="#tickerPath"
                  startOffset="0%"
                  spacing="auto"
                >
                  {tickerText} • {tickerText} • {tickerText} • {tickerText}
                  <animate
                    attributeName="startOffset"
                    from="-25%"
                    to="0%"
                    dur="20s"
                    repeatCount="indefinite"
                  />
                </textPath>
              </text>
            </svg>
          </div>

          <div
            className="bg-gray-800/90 backdrop-blur-sm shadow-2xl transition-all duration-300 ease-in-out relative overflow-hidden"
            style={{
              clipPath:
                'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              padding: '4rem 3.5rem'
            }}
          >
            {/* Toggle Buttons */}
            <div className="flex mb-6 bg-gray-700/80 rounded-lg p-1 relative z-10">
              <button
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isLogin
                    ? 'bg-red-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  !isLogin
                    ? 'bg-red-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Credentials Form */}
            <div className="space-y-4 relative z-10">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                required
              />

              {error && (
                <div className="text-red-400 text-sm text-center bg-red-900/30 border border-red-800 rounded-lg p-2 backdrop-blur-sm animate-pulse">
                  {error}
                </div>
              )}

              <button
                onClick={handleCredentialsAuth}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>



            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-400 relative z-10">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: App Features */}
        <div className="text-center text-gray-400 text-sm space-y-1">
          <p>🥊 Track your favorite fighters</p>
          <p>📅 Never miss an event</p>
          <p>🔔 Get personalized notifications</p>
        </div>
      </div>
    </div>
  )
}