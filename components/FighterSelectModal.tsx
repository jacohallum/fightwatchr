// components/FighterSelectModal.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const MENS_DIVISIONS = [
  { id: 'FLYWEIGHT', name: 'Flyweight', weight: '125 lbs', minWeight: 116, maxWeight: 125 },
  { id: 'BANTAMWEIGHT', name: 'Bantamweight', weight: '135 lbs', minWeight: 126, maxWeight: 135 },
  { id: 'FEATHERWEIGHT', name: 'Featherweight', weight: '145 lbs', minWeight: 136, maxWeight: 145 },
  { id: 'LIGHTWEIGHT', name: 'Lightweight', weight: '155 lbs', minWeight: 146, maxWeight: 155 },
  { id: 'WELTERWEIGHT', name: 'Welterweight', weight: '170 lbs', minWeight: 156, maxWeight: 170 },
  { id: 'MIDDLEWEIGHT', name: 'Middleweight', weight: '185 lbs', minWeight: 171, maxWeight: 185 },
  { id: 'LIGHT_HEAVYWEIGHT', name: 'Light Heavyweight', weight: '205 lbs', minWeight: 186, maxWeight: 205 },
  { id: 'HEAVYWEIGHT', name: 'Heavyweight', weight: '265 lbs', minWeight: 206, maxWeight: 265 }
]

const WOMENS_DIVISIONS = [
  { id: 'STRAWWEIGHT', name: 'Strawweight', weight: '115 lbs', minWeight: 106, maxWeight: 115 },
  { id: 'FLYWEIGHT', name: 'Flyweight', weight: '125 lbs', minWeight: 116, maxWeight: 125 },
  { id: 'BANTAMWEIGHT', name: 'Bantamweight', weight: '135 lbs', minWeight: 126, maxWeight: 135 },
  // Women's Featherweight intentionally omitted (division inactive)
]

export interface Fighter {
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

interface FighterSelectModalProps {
  initialSelectedFighters: Fighter[]
  onSave: (fighters: Fighter[]) => Promise<void> | void
  onSkip: () => Promise<void> | void
  onClose: () => void
}

export default function FighterSelectModal({
  initialSelectedFighters,
  onSave,
  onSkip,
  onClose
}: FighterSelectModalProps) {
  const [selectedFighters, setSelectedFighters] = useState<Fighter[]>(initialSelectedFighters)
  const [genderTab, setGenderTab] = useState<'mens' | 'womens'>('mens')
  const [activeDivision, setActiveDivision] = useState(MENS_DIVISIONS[0].id)
  const [divisionFighters, setDivisionFighters] = useState<{ [key: string]: Fighter[] }>({})
  const [loadingDivision, setLoadingDivision] = useState<string | null>(null)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState<{ [key: string]: boolean }>({})
  const [searchResults, setSearchResults] = useState<Fighter[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  // Keep local selection in sync if parent changes it (e.g. after re-load)
  useEffect(() => {
    setSelectedFighters(initialSelectedFighters)
  }, [initialSelectedFighters])

  // Debounced search across all fighters (by name/nickname + gender)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const response = await fetch(
          `/api/fighters?search=${encodeURIComponent(searchQuery)}&gender=${
            genderTab === 'mens' ? 'MALE' : 'FEMALE'
          }&limit=50`
        )
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.fighters || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, genderTab])

  // Initial division load
  useEffect(() => {
    loadDivisionFighters(activeDivision, genderTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDivisionFighters = async (
    divisionId: string,
    gender: 'mens' | 'womens' = genderTab,
    loadMore = false
  ) => {
    const currentGender = gender
    const cacheKey = `${currentGender}-${divisionId}`

    if (!loadMore && divisionFighters[cacheKey]) return
    if (loadMore && !hasMore[cacheKey]) return

    loadMore ? setLoadingMore(true) : setLoadingDivision(divisionId)
    try {
      const currentDivisions = currentGender === 'mens' ? MENS_DIVISIONS : WOMENS_DIVISIONS
      const division = currentDivisions.find(d => d.id === divisionId)
      if (!division) return

      const existing = divisionFighters[cacheKey] || []
      const offset = loadMore ? existing.length : 0

      const response = await fetch(
        `/api/fighters?weightClass=${divisionId}&minWeight=${division.minWeight}&maxWeight=${division.maxWeight}&gender=${
          currentGender === 'mens' ? 'MALE' : 'FEMALE'
        }&limit=50&offset=${offset}`
      )

      if (response.ok) {
        const data = await response.json()
        const fighters: Fighter[] = data.fighters || []

        const sorted = fighters.sort((a, b) => {
          if (a.currentRank !== null && b.currentRank !== null) return a.currentRank - b.currentRank
          if (a.currentRank !== null) return -1
          if (b.currentRank !== null) return 1
          if (a.active !== b.active) return a.active ? -1 : 1
          return `${a.lastName} ${a.firstName}`.toLowerCase()
            .localeCompare(`${b.lastName} ${b.firstName}`.toLowerCase())
        })

        setDivisionFighters(prev => ({
          ...prev,
          [cacheKey]: loadMore ? [...existing, ...sorted] : sorted
        }))

        setHasMore(prev => ({
          ...prev,
          [cacheKey]: fighters.length === 50
        }))
      }
    } catch (error) {
      console.error('Error loading division fighters:', error)
    } finally {
      setLoadingMore(false)
      setLoadingDivision(null)
    }
  }

  const handleScroll: React.UIEventHandler<HTMLDivElement> = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 200 && !loadingMore) {
      loadDivisionFighters(activeDivision, genderTab, true)
    }
  }

  const handleGenderTabChange = (gender: 'mens' | 'womens') => {
    setGenderTab(gender)
    const divisions = gender === 'mens' ? MENS_DIVISIONS : WOMENS_DIVISIONS
    const first = divisions[0]
    setActiveDivision(first.id)
    loadDivisionFighters(first.id, gender)
  }

  const handleDivisionChange = (divisionId: string) => {
    setActiveDivision(divisionId)
    loadDivisionFighters(divisionId)
  }

  const handleFighterToggle = (fighter: Fighter) => {
    setSelectedFighters(prev => {
      const isSelected = prev.some(f => f.id === fighter.id)
      return isSelected ? prev.filter(f => f.id !== fighter.id) : [...prev, fighter]
    })
  }

  const handleFinish = async () => {
    if (selectedFighters.length === 0) {
      alert('Please select at least one fighter to follow!')
      return
    }

    try {
      setSavingPreferences(true)
      await onSave(selectedFighters)
      onClose()
    } catch (error) {
      console.error('Error in onSave:', error)
      alert('Failed to save preferences')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleSkip = async () => {
    try {
      await onSkip()
    } catch (error) {
      console.error('Error in onSkip:', error)
    }
    onClose()
  }

  const currentDivisions = genderTab === 'mens' ? MENS_DIVISIONS : WOMENS_DIVISIONS
  const allFighters = divisionFighters[`${genderTab}-${activeDivision}`] || []
  const currentFighters = searchQuery.trim() ? (searchResults || []) : allFighters

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Select Your Favorite Fighters
              </h2>
              <p className="text-gray-400 mt-1">
                {selectedFighters.length} fighter{selectedFighters.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Gender Tabs */}
        <div className="border-b border-gray-700 px-6 flex-shrink-0">
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
        <div className="border-b border-gray-700 px-6 overflow-x-auto flex-shrink-0">
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
        <div className="p-6 overflow-y-auto flex-1 min-h-0" onScroll={handleScroll}>
          {(loadingDivision === activeDivision || searchLoading) ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : currentFighters.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {currentFighters.map(fighter => {
                const isSelected = selectedFighters.some(f => f.id === fighter.id)
                const winRate = fighter.totalFights > 0
                  ? ((fighter.wins / fighter.totalFights) * 100).toFixed(0)
                  : '0'

                return (
                  <button
                    key={fighter.id}
                    onClick={() => handleFighterToggle(fighter)}
                    className={`p-4 rounded-lg text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {/* Ranking Badge */}
                    <div className={`absolute top-2 right-2 px-2 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                      fighter.isChampion ? 'bg-yellow-500 text-black' :
                      fighter.currentRank !== null ? 'bg-blue-500 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {fighter.isChampion ? 'C' : fighter.currentRank !== null ? `#${fighter.currentRank}` : 'NR'}
                    </div>

                    {/* Fighter Image */}
                    <div className="w-full aspect-square mb-3 rounded-lg overflow-hidden bg-gray-800 relative">
                      {fighter.imageUrl ? (
                        <Image
                          src={fighter.imageUrl}
                          alt={`${fighter.firstName} ${fighter.lastName}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 20vw"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-4xl opacity-30">👤</div>
                        </div>
                      )}
                    </div>

                    <div>
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
              {searchQuery.trim()
                ? 'No fighters found matching your search'
                : 'No fighters available in this division'}
            </div>
          )}

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between flex-shrink-0">
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
  )
}