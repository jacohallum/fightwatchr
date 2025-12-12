'use client'
import { useState } from 'react'
import { AVAILABLE_SECTIONS, SectionId } from './types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  preferences: {
    enabledSections: SectionId[]
    layoutPreferences: {
      mainContent: { gridCols: number; gap: number }
      favoriteFighters: { position: 'left' | 'right'; visible: boolean }
      liveEvent: { position: 'top' | 'bottom' | 'hidden' }
    }
  }
  toggleSection: (id: SectionId) => void
  setGridCols: (cols: number) => void
  setGridGap: (gap: number) => void
  setFavoriteFightersPosition: (pos: 'left' | 'right') => void
  setFavoriteFightersVisible: (visible: boolean) => void
  setLiveEventPosition: (pos: 'top' | 'bottom' | 'hidden') => void
  restoreDefaults: () => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  preferences,
  toggleSection,
  setGridCols,
  setGridGap,
  setFavoriteFightersPosition,
  setFavoriteFightersVisible,
  setLiveEventPosition,
  restoreDefaults,
}: SettingsModalProps) {
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

  if (!isOpen) return null

  const handleRestore = () => {
    restoreDefaults()
    setShowRestoreConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Customize Dashboard
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section Toggles */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Dashboard Sections
            </h3>
            <div className="space-y-2">
              {AVAILABLE_SECTIONS.map((sectionId) => {
                const isEnabled = preferences.enabledSections.includes(sectionId)
                const label = sectionId
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')

                return (
                  <label
                    key={sectionId}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleSection(sectionId)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Grid Layout */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Grid Layout
            </h3>
            <div className="space-y-4">
              {/* Columns */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Columns
                  </label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {preferences.layoutPreferences.mainContent.gridCols}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={preferences.layoutPreferences.mainContent.gridCols}
                  onChange={(e) => setGridCols(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Gap */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Spacing
                  </label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {preferences.layoutPreferences.mainContent.gap}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={preferences.layoutPreferences.mainContent.gap}
                  onChange={(e) => setGridGap(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Favorite Fighters Sidebar */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Favorite Fighters Sidebar
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.layoutPreferences.favoriteFighters.visible}
                  onChange={(e) => setFavoriteFightersVisible(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">Show sidebar</span>
              </label>

              {preferences.layoutPreferences.favoriteFighters.visible && (
                <div className="pl-7">
                  <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                    Position
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFavoriteFightersPosition('left')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preferences.layoutPreferences.favoriteFighters.position === 'left'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => setFavoriteFightersPosition('right')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preferences.layoutPreferences.favoriteFighters.position === 'right'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Event Position */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Live Event Banner
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Controls where the live event banner appears when an event is active
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLiveEventPosition('top')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  preferences.layoutPreferences.liveEvent.position === 'top'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Top
              </button>
              <button
                onClick={() => setLiveEventPosition('bottom')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  preferences.layoutPreferences.liveEvent.position === 'bottom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Bottom
              </button>
              <button
                onClick={() => setLiveEventPosition('hidden')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  preferences.layoutPreferences.liveEvent.position === 'hidden'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Hidden
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          {showRestoreConfirm ? (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Reset all settings to default?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Restore Defaults
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRestoreConfirm(true)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Restore Defaults
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}