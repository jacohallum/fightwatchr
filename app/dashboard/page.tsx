// app\dashboard\page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import FighterSelectModal from '@/components/FighterSelectModal'

interface Fighter {
  id: string
  firstName: string
  lastName: string
  nickname: string | null
  imageUrl: string | null
  wins: number
  losses: number
  draws: number
  totalFights: number
  currentRank: number | null
  isChampion: boolean
  active: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [selectedFighters, setSelectedFighters] = useState<Fighter[]>([])
  const [loadingPreferences, setLoadingPreferences] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/')
    } else if (status === 'authenticated') {
      loadUserPreferences()
    }
  }, [status])

  const loadUserPreferences = async () => {
    try {
      setLoadingPreferences(true)
      const response = await fetch('/api/user/preferences')
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.hasPreferences && data.preferences?.fighters) {
          setSelectedFighters(data.preferences.fighters)
          setShowWelcomeModal(false)
        } else {
          setShowWelcomeModal(true)
        }
      } else {
        setShowWelcomeModal(true)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      setShowWelcomeModal(true)
    } finally {
      setLoadingPreferences(false)
    }
  }

  const handleSaveFighters = async (fighters: Fighter[]) => {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighters })
    })

    if (response.ok) {
      setSelectedFighters(fighters)
      setShowWelcomeModal(false)
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || response.statusText)
    }
  }

  const handleSkip = async () => {
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighters: [], skipped: true })
      })
    } catch (error) {
      console.error('Error:', error)
    }
    setShowWelcomeModal(false)
  }

  if (status === 'loading' || loadingPreferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedFighters.length > 0 && !showWelcomeModal && (
          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Your Favorite Fighters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {selectedFighters.map(fighter => (
                <div key={fighter.id} className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="font-semibold text-white text-sm">
                    {fighter.firstName} {fighter.lastName}
                  </div>
                  {fighter.nickname && (
                    <div className="text-xs text-gray-400">"{fighter.nickname}"</div>
                  )}
                  <div className="text-xs text-gray-300 mt-1">
                    {fighter.wins}-{fighter.losses}-{fighter.draws}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowWelcomeModal(true)}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Add More Fighters
            </button>
          </div>
        )}
      </main>

      {showWelcomeModal && (
        <FighterSelectModal
          initialSelectedFighters={selectedFighters}
          onSave={handleSaveFighters}
          onSkip={handleSkip}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </div>
  )
}