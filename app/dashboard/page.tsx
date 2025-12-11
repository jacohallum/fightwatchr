// app/dashboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import FighterSelectModal from '@/components/FighterSelectModal'
import ThemeToggle from '@/components/ThemeToggle'

// import dashboard prefs + live event hooks
import { useDashboardPreferences } from '@/src/features/dashboard/useDashboardPreferences'
import { useLiveEventData } from '@/src/features/dashboard/useLiveEventData'
import { SECTION_COMPONENTS } from '@/src/features/dashboard/sectionRegistry'
import type { SectionId } from '@/src/features/dashboard/types'

// Fighter type definition (from old dashboard)
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

  // Dashboard preferences + live event
  const {
    preferences,
    toggleSection,
    setFavoriteFightersPosition,
    setFavoriteFightersVisible,
    setLiveEventPosition,
    setGridCols,
    setGridGap,
    restoreDefaults,
  } = useDashboardPreferences()

  const { data: liveData } = useLiveEventData()

  // Favorite fighters state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [selectedFighters, setSelectedFighters] = useState<Fighter[]>([])
  const [loadingFighters, setLoadingFighters] = useState(true)

  // NEW: Live event logic
  const hasLiveEvent = !!liveData?.isLive && !!liveData.event
  const liveEventPosition = preferences.layoutPreferences.liveEvent.position
  const liveEventEnabled = preferences.layoutPreferences.liveEvent.enabled
  const showLiveEvent =
    liveEventEnabled && hasLiveEvent && liveEventPosition !== 'hidden'

  // Auth + initial favorite fighters load
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/')
    } else if (status === 'authenticated') {
      loadFavoriteFighters()
    }
  }, [status, router])

  // Load favorite fighters from /api/user/preferences
  const loadFavoriteFighters = async () => {
    try {
      setLoadingFighters(true)
      const response = await fetch('/api/user/preferences')

      // Debug logging
      console.log('API Response Status:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        
        // Debug logging
        console.log('API Response Data:', data)
        
        // Extract fighters and skipped from preferences object
        const fighters: Fighter[] = data.preferences?.fighters ?? []
        const skipped: boolean = data.preferences?.skipped ?? false
        
        console.log('Fighters count:', fighters.length)
        console.log('Skipped flag:', skipped)

        setSelectedFighters(fighters)

        // Only show modal if truly no fighters AND not skipped
        const shouldShowModal = fighters.length === 0 && !skipped
        console.log('Should show modal:', shouldShowModal)
        setShowWelcomeModal(shouldShowModal)
      } else {
        // Debug: Log the error response
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        // Don't automatically show modal on error
        console.warn('Failed to load fighters, but not showing modal')
      }
    } catch (error) {
      console.error('Error loading favorite fighters:', error)
      // Don't show modal on error - could be temporary network issue
      console.warn('Error loading fighters, but not showing modal')
    } finally {
      setLoadingFighters(false)
    }
  }

  // Save fighters to /api/user/preferences
  const handleSaveFighters = async (fighters: Fighter[]) => {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighters }),
    })

    if (response.ok) {
      setSelectedFighters(fighters)
      setShowWelcomeModal(false)
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || response.statusText)
    }
  }

  // Skip selection
  const handleSkip = async () => {
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighters: [], skipped: true }),
      })
      setShowWelcomeModal(false)
    } catch (error) {
      console.error('Error saving skip flag:', error)
      // Still close the modal even if save failed
      setShowWelcomeModal(false)
    }
  }

  // Live event handlers
  const handleLiveEventHide = () => setLiveEventPosition('hidden')
  const handleSectionRemove = (id: SectionId) => toggleSection(id)

  if (status === 'loading' || loadingFighters) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
        {/* Favorite Fighters Sidebar (position + visibility controlled by prefs) */}
        {preferences.layoutPreferences.favoriteFighters.visible && (
          <aside
            className={`w-72 shrink-0 ${
              preferences.layoutPreferences.favoriteFighters.position === 'left'
                ? 'order-1'
                : 'order-2'
            }`}
          >
            {selectedFighters.length > 0 && (
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Favorite Fighters
                  </h3>
                  <button
                    onClick={() => setShowWelcomeModal(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Manage
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {selectedFighters.map(fighter => (
                    <div
                      key={fighter.id}
                      className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-xs"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {fighter.firstName} {fighter.lastName}
                      </div>
                      {fighter.nickname && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          &quot;{fighter.nickname}&quot;
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-gray-700 dark:text-gray-300">
                        Record: {fighter.wins}-{fighter.losses}-{fighter.draws}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Main dashboard area */}
        <section
          className={`flex-1 ${
            preferences.layoutPreferences.favoriteFighters.position === 'left'
              ? 'order-2'
              : 'order-1'
          }`}
        >
          {/* Top live event (if enabled + positioned at top) */}
          {showLiveEvent && liveEventPosition === 'top' && (
            <section className="mb-6 bg-white dark:bg-gray-800/70 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xs font-semibold">
                    🔴 LIVE
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {liveData?.event?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => setLiveEventPosition('bottom')}
                  >
                    Move to bottom
                  </button>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={handleLiveEventHide}
                  >
                    Hide
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300">
                Live event summary goes here.
              </div>
            </section>
          )}

          {/* Dashboard grid (sections) */}
          <section>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${preferences.layoutPreferences.mainContent.gridCols}, minmax(0, 1fr))`,
                gap: `${preferences.layoutPreferences.mainContent.gap * 0.25}rem`,
              }}
            >
              {preferences.sectionOrder
                .filter((id: SectionId) => preferences.enabledSections.includes(id))
                .map((sectionId: SectionId) => {
                  const Comp = SECTION_COMPONENTS[sectionId]
                  if (!Comp) return null

                  return (
                    <section
                      key={sectionId}
                      className="bg-white dark:bg-gray-800/70 rounded-lg p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {sectionId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </h3>
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => handleSectionRemove(sectionId)}
                        >
                          Remove
                        </button>
                      </div>
                      <Comp />
                    </section>
                  )
                })}
            </div>
          </section>

          {/* Bottom live event (if enabled + positioned at bottom) */}
          {showLiveEvent && liveEventPosition === 'bottom' && (
            <section className="mt-6 bg-white dark:bg-gray-800/70 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xs font-semibold">
                    🔴 LIVE
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {liveData?.event?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                 <button
                    type="button"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => setLiveEventPosition('top')}
                  >
                    Move to top
                  </button>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={handleLiveEventHide}
                  >
                    Hide
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300">
                Live event summary goes here.
              </div>
            </section>
          )}
        </section>
      </main>

      {/* Existing fighter onboarding modal flow stays intact */}
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