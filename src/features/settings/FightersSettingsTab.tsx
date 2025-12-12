'use client'
import { useState, useEffect } from 'react'
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

export default function FightersSettingsTab() {
  const [selectedFighters, setSelectedFighters] = useState<Fighter[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFighters()
  }, [])

  const loadFighters = async () => {
    try {
      const res = await fetch('/api/user/preferences')
      if (res.ok) {
        const data = await res.json()
        setSelectedFighters(data.preferences?.fighters ?? [])
      }
    } catch (error) {
      console.error('Error loading fighters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (fighters: Fighter[]) => {
    const res = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighters }),
    })

    if (res.ok) {
      setSelectedFighters(fighters)
      setShowModal(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Favorite Fighters
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Manage your favorite fighters to see quick updates on your dashboard
        </p>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          {selectedFighters.length > 0 ? 'Manage Fighters' : 'Add Fighters'}
        </button>
      </div>

      {selectedFighters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedFighters.map((fighter) => (
            <div
              key={fighter.id}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3"
            >
              <div className="font-semibold text-gray-900 dark:text-white">
                {fighter.firstName} {fighter.lastName}
              </div>
              {fighter.nickname && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  &quot;{fighter.nickname}&quot;
                </div>
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Record: {fighter.wins}-{fighter.losses}-{fighter.draws}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FighterSelectModal
          initialSelectedFighters={selectedFighters}
          onSave={handleSave}
          onSkip={() => setShowModal(false)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}