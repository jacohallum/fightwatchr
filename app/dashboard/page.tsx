'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const MENS_DIVISIONS = [
  { id: 'FLYWEIGHT', name: 'Flyweight', weight: '125 lbs' },
  { id: 'BANTAMWEIGHT', name: 'Bantamweight', weight: '135 lbs' },
  { id: 'FEATHERWEIGHT', name: 'Featherweight', weight: '145 lbs' },
  { id: 'LIGHTWEIGHT', name: 'Lightweight', weight: '155 lbs' },
  { id: 'WELTERWEIGHT', name: 'Welterweight', weight: '170 lbs' },
  { id: 'MIDDLEWEIGHT', name: 'Middleweight', weight: '185 lbs' },
  { id: 'LIGHT_HEAVYWEIGHT', name: 'Light Heavyweight', weight: '205 lbs' },
  { id: 'HEAVYWEIGHT', name: 'Heavyweight', weight: '265 lbs' }
]

const WOMENS_DIVISIONS = [
  { id: 'STRAWWEIGHT', name: 'Strawweight', weight: '115 lbs' },
  { id: 'FLYWEIGHT', name: 'Flyweight', weight: '125 lbs' },
  { id: 'BANTAMWEIGHT', name: 'Bantamweight', weight: '135 lbs' },
  { id: 'FEATHERWEIGHT', name: 'Featherweight', weight: '145 lbs' }
]

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
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [selectedFighters, setSelectedFighters] = useState<Fighter[]>([])
  const [genderTab, setGenderTab] = useState<'mens' | 'womens'>('mens')
  const [activeDivision, setActiveDivision] = useState(MENS_DIVISIONS[0].id)
  const [divisionFighters, setDivisionFighters] = useState<{ [key: string]: Fighter[] }>({})
  const [loadingDivision, setLoadingDivision] = useState<string | null>(null)
  const [savingPreferences, setSavingPreferences] = useState(false)
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
          loadDivisionFighters(activeDivision)
        }
      } else {
        setShowWelcomeModal(true)
        loadDivisionFighters(activeDivision)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      setShowWelcomeModal(true)
    } finally {
      setLoadingPreferences(false)
    }
  }

  const loadDivisionFighters = async (divisionId: string, gender?: 'mens' | 'womens') => {
    const currentGender = gender ?? genderTab // Use passed gender or fall back to state
    const cacheKey = `${currentGender}-${divisionId}`
    
    if (divisionFighters[cacheKey]) return

    setLoadingDivision(divisionId)
    try {
      const response = await fetch(`/api/fighters?weightClass=${divisionId}&gender=${currentGender}&limit=100`)
      
      if (response.ok) {
        const data = await response.json()
        const fighters = data.fighters || []
        
        const sortedFighters = fighters.sort((a: Fighter, b: Fighter) => {
          const aWinRate = a.totalFights > 0 ? a.wins / a.totalFights : 0
          const bWinRate = b.totalFights > 0 ? b.wins / b.totalFights : 0
          return bWinRate - aWinRate
        })
        
        setDivisionFighters(prev => ({
          ...prev,
          [cacheKey]: sortedFighters.slice(0, 50)
        }))

        // Prefetch next division
        const currentDivisions = currentGender === 'mens' ? MENS_DIVISIONS : WOMENS_DIVISIONS
        const currentIndex = currentDivisions.findIndex(d => d.id === divisionId)
        if (currentIndex >= 0 && currentIndex < currentDivisions.length - 1) {
          const nextDivisionId = currentDivisions[currentIndex + 1].id
          const nextCacheKey = `${currentGender}-${nextDivisionId}`
          if (!divisionFighters[nextCacheKey]) {
            setTimeout(() => loadDivisionFighters(nextDivisionId, currentGender), 100)
          }
        }
      }
    } catch (error) {
      console.error('Error loading division fighters:', error)
    } finally {
      setLoadingDivision(null)
    }
  }
  
  const handleGenderTabChange = (gender: 'mens' | 'womens') => {
    setGenderTab(gender)
    const divisions = gender === 'mens' ? MENS_DIVISIONS : WOMENS_DIVISIONS
    setActiveDivision(divisions[0].id)
    loadDivisionFighters(divisions[0].id, gender) // Pass gender explicitly
  }

  const handleDivisionChange = (divisionId: string) => {
    setActiveDivision(divisionId)
    loadDivisionFighters(divisionId)
  }

  const handleFighterToggle = (fighter: Fighter) => {
    setSelectedFighters(prev => {
      const isSelected = prev.some(f => f.id === fighter.id)
      if (isSelected) {
        return prev.filter(f => f.id !== fighter.id)
      } else {
        return [...prev, fighter]
      }
    })
  }

  const handleFinish = async () => {
    if (selectedFighters.length === 0) {
      alert('Please select at least one fighter to follow!')
      return
    }

    try {
      setSavingPreferences(true)
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighters: selectedFighters })
      })

      if (response.ok) {
        setShowWelcomeModal(false)
      } else {
        alert('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('An error occurred')
    } finally {
      setSavingPreferences(false)
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/', redirect: true })
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

  const currentDivisions = genderTab === 'mens' ? MENS_DIVISIONS : WOMENS_DIVISIONS
  const currentFighters = divisionFighters[`${genderTab}-${activeDivision}`] || []
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">
              Game<span className="text-red-500">Watchr</span>
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                Welcome, {session.user?.email?.split('@')[0] || 'Fighter'}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">
                Select Your Favorite Fighters
              </h2>
              <p className="text-gray-400 mt-1">
                {selectedFighters.length} fighter{selectedFighters.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Gender Tabs */}
            <div className="border-b border-gray-700 px-6">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleGenderTabChange('mens')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    genderTab === 'mens'
                      ? 'text-white border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Men's Divisions
                </button>
                <button
                  onClick={() => handleGenderTabChange('womens')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    genderTab === 'womens'
                      ? 'text-white border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Women's Divisions
                </button>
              </div>
            </div>

            {/* Division Tabs */}
            <div className="border-b border-gray-700 px-6 overflow-x-auto">
              <div className="flex space-x-1 min-w-max">
                {currentDivisions.map(division => (
                  <button
                    key={division.id}
                    onClick={() => handleDivisionChange(division.id)}
                    className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeDivision === division.id
                        ? 'text-white bg-gray-700/50'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                    }`}
                  >
                    {division.name}
                    <span className="text-xs ml-1 opacity-75">{division.weight}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fighters List */}
            <div className="p-6">
              {loadingDivision === activeDivision ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : currentFighters.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {currentFighters.map((fighter, index) => {
                    const isSelected = selectedFighters.some(f => f.id === fighter.id)
                    const winRate = fighter.totalFights > 0 
                      ? ((fighter.wins / fighter.totalFights) * 100).toFixed(0)
                      : '0'
                    
                    return (
                      <button
                        key={fighter.id}
                        onClick={() => handleFighterToggle(fighter)}
                        className={`p-4 rounded-lg text-left transition-all relative ${
                          isSelected
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {/* Ranking Badge */}
                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="pr-8">
                          <div className="font-semibold text-sm">
                            {fighter.firstName} {fighter.lastName}
                          </div>
                          {fighter.nickname && (
                            <div className="text-xs opacity-75 mt-1">"{fighter.nickname}"</div>
                          )}
                          <div className="text-xs mt-2 space-y-1">
                            <div>Record: {fighter.wins}-{fighter.losses}-{fighter.draws}</div>
                            <div>Win Rate: {winRate}%</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  No fighters available in this division
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-between">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleFinish}
                disabled={selectedFighters.length === 0 || savingPreferences}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  selectedFighters.length === 0 || savingPreferences
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {savingPreferences ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Favorites ({selectedFighters.length})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}