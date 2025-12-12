'use client'
import { useState } from 'react'
import { AVAILABLE_SECTIONS, SectionId } from '../dashboard/types'

interface DashboardSettingsTabProps {
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

export default function DashboardSettingsTab({
  preferences,
  toggleSection,
  setGridCols,
  setGridGap,
  setFavoriteFightersPosition,
  setFavoriteFightersVisible,
  setLiveEventPosition,
  restoreDefaults,
}: DashboardSettingsTabProps) {
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Section Toggles */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dashboard Sections
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose which sections appear on your dashboard
        </p>
        <div className="space-y-2">
          {AVAILABLE_SECTIONS.map((section) => {
            const isEnabled = preferences.enabledSections.includes(section.id)
            const label = section.label  // ← Use the label from the object

            return (
              <label
                key={section.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleSection(section.id)}
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Grid Layout
        </h3>
        <div className="space-y-6">
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Favorite Fighters Sidebar
        </h3>
        <div className="space-y-4">
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Live Event Banner
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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

      {/* Restore Defaults */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        {showRestoreConfirm ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Reset all dashboard settings to default?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  restoreDefaults()
                  setShowRestoreConfirm(false)
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Restore Defaults
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowRestoreConfirm(true)}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Restore Default Settings
          </button>
        )}
      </div>
    </div>
  )
}