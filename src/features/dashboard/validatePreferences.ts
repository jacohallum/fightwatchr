// src/features/dashboard/validatePreferences.ts

import {
  AVAILABLE_SECTIONS,
  DEFAULT_PREFERENCES,
  LayoutPreferences,
  LiveEventPosition,
  SectionId,
  UserPreferences,
} from './types'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function sanitizeLayoutPreferences(
  layout: Partial<LayoutPreferences> | undefined
): LayoutPreferences {
  const base = DEFAULT_PREFERENCES.layoutPreferences

  const favoriteFighters = layout?.favoriteFighters ?? base.favoriteFighters
  const mainContent = layout?.mainContent ?? base.mainContent
  const liveEvent = layout?.liveEvent ?? base.liveEvent

  // Favorite fighters
  const favoritePosition =
    favoriteFighters.position === 'right' ? 'right' : 'left'

  // Main content
  const gridCols = clamp(mainContent.gridCols ?? base.mainContent.gridCols, 1, 3)
  const gap = clamp(mainContent.gap ?? base.mainContent.gap, 2, 8)

  // Live event
  const allowedPositions: LiveEventPosition[] = ['top', 'bottom', 'hidden']
  const livePosition = allowedPositions.includes(liveEvent.position)
    ? liveEvent.position
    : base.liveEvent.position

  return {
    favoriteFighters: {
      position: favoritePosition,
      visible:
        typeof favoriteFighters.visible === 'boolean'
          ? favoriteFighters.visible
          : base.favoriteFighters.visible,
    },
    mainContent: {
      gridCols,
      gap,
    },
    liveEvent: {
      enabled:
        typeof liveEvent.enabled === 'boolean'
          ? liveEvent.enabled
          : base.liveEvent.enabled,
      position: livePosition,
    },
  }
}

export function validatePreferences(prefs: UserPreferences): UserPreferences {
  // Filter invalid section ids
  const enabled: SectionId[] = prefs.enabledSections.filter(id =>
    AVAILABLE_SECTIONS.includes(id)
  )

  // sectionOrder must only contain enabled sections
  const sectionOrder: SectionId[] = prefs.sectionOrder.filter(id =>
    enabled.includes(id)
  )

  return {
    ...prefs,
    enabledSections: enabled,
    sectionOrder,
    layoutPreferences: sanitizeLayoutPreferences(prefs.layoutPreferences),
  }
}