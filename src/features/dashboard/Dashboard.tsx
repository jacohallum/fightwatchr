// src/features/dashboard/Dashboard.tsx

import React from 'react'
import { useDashboardPreferences } from './useDashboardPreferences'
import { useLiveEventData } from './useLiveEventData'
import { SECTION_COMPONENTS } from './sectionRegistry'
import { SectionId, LiveEventPosition } from './types'

type LiveEventSectionProps = {
  eventData: any
  position: LiveEventPosition
  onTogglePosition: (pos: LiveEventPosition) => void
  onHide: () => void
}

// Stub – implement visually later
const LiveEventSection: React.FC<LiveEventSectionProps> = ({
  eventData,
  position,
  onTogglePosition,
  onHide,
}) => {
  if (!eventData) return null

  return (
    <section>
      <header>
        <span>🔴 LIVE</span>
        <span>{eventData.name}</span>
        <button
          type="button"
          onClick={() =>
            onTogglePosition(position === 'top' ? 'bottom' : 'top')
          }
        >
          Move {position === 'top' ? 'to bottom' : 'to top'}
        </button>
        <button type="button" onClick={onHide}>
          Hide
        </button>
      </header>
      {/* Replace with real content */}
      <div>Current fight + stats placeholder</div>
    </section>
  )
}

// Stub – you’ll wire real DnD later
const DraggableSection: React.FC<{
  id: SectionId
  componentType: React.ComponentType<any>
  onRemove: (id: SectionId) => void
}> = ({ id, componentType, onRemove }) => {
  const Comp = componentType
  return (
    <section>
      <header>
        <span>{id}</span>
        <button type="button" onClick={() => onRemove(id)}>
          Remove
        </button>
      </header>
      <Comp />
    </section>
  )
}

export const Dashboard: React.FC = () => {
  const {
    preferences,
    toggleSection,
    reorderSections,
    restoreDefaults,
    setFavoriteFightersPosition,
    setFavoriteFightersVisible,
    setLiveEventPosition,
    setGridCols,
    setGridGap,
  } = useDashboardPreferences()

  const { data: liveData } = useLiveEventData()
  const hasLiveEvent = !!liveData?.isLive && !!liveData.event

  const liveEventPosition = preferences.layoutPreferences.liveEvent.position
  const liveEventEnabled = preferences.layoutPreferences.liveEvent.enabled

  const showLiveEvent =
    liveEventEnabled && hasLiveEvent && liveEventPosition !== 'hidden'

  const handleLiveEventHide = () => setLiveEventPosition('hidden')

  const handleSectionRemove = (id: SectionId) => toggleSection(id)

  return (
    <div className="dashboard-layout">
      {/* Favorite fighters sidebar */}
      {preferences.layoutPreferences.favoriteFighters.visible && (
        <aside
          className={
            preferences.layoutPreferences.favoriteFighters.position === 'left'
              ? 'sidebar-left'
              : 'sidebar-right'
          }
        >
          {/* Wire your actual favorite fighters UI here */}
          <div>Favorite Fighters Sidebar</div>
        </aside>
      )}

      <main className="dashboard-main">
        {/* Live event at top */}
        {showLiveEvent && liveEventPosition === 'top' && (
          <LiveEventSection
            eventData={liveData?.event}
            position={liveEventPosition}
            onTogglePosition={setLiveEventPosition}
            onHide={handleLiveEventHide}
          />
        )}

        {/* Grid */}
        <div
          className="dashboard-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${preferences.layoutPreferences.mainContent.gridCols}, minmax(0, 1fr))`,
            gap: `${preferences.layoutPreferences.mainContent.gap * 0.25}rem`,
          }}
        >
          {preferences.sectionOrder
            .filter(id => preferences.enabledSections.includes(id))
            .map(sectionId => {
              const Comp = SECTION_COMPONENTS[sectionId]
              if (!Comp) return null
              return (
                <DraggableSection
                  key={sectionId}
                  id={sectionId}
                  componentType={Comp}
                  onRemove={handleSectionRemove}
                />
              )
            })}
        </div>

        {/* Live event at bottom */}
        {showLiveEvent && liveEventPosition === 'bottom' && (
          <LiveEventSection
            eventData={liveData?.event}
            position={liveEventPosition}
            onTogglePosition={setLiveEventPosition}
            onHide={handleLiveEventHide}
          />
        )}
      </main>
    </div>
  )
}