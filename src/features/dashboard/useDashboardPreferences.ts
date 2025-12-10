// src/features/dashboard/useDashboardPreferences.ts

import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PREFERENCES,
  LayoutPreferences,
  LiveEventPosition,
  SectionId,
  UserPreferences,
} from './types'
import { validatePreferences } from './validatePreferences'

const LS_KEY = 'dashboard_preferences'

export function useDashboardPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const lastServerPrefs = useRef<UserPreferences | null>(null)
  const hasLocalEdits = useRef(false)

  // init
  useEffect(() => {
    // 1) load from localStorage (instant)
    const raw = typeof window !== 'undefined'
      ? window.localStorage.getItem(LS_KEY)
      : null

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setPrefs(validatePreferences(parsed))
      } catch {
        setPrefs(DEFAULT_PREFERENCES)
      }
    } else {
      setPrefs(DEFAULT_PREFERENCES)
    }

    // 2) fetch from server (authoritative)
    ;(async () => {
      try {
        const res = await fetch('/api/user/preferences')
        if (!res.ok) return

        const json = await res.json()
        const serverPrefs = validatePreferences(json)
        lastServerPrefs.current = serverPrefs

        if (!hasLocalEdits.current) {
          setPrefs(serverPrefs)
          window.localStorage.setItem(LS_KEY, JSON.stringify(serverPrefs))
        }
      } catch {
        // optional: notify
      }
    })()
  }, [])

  async function updatePreferences(next: UserPreferences) {
    const validated = validatePreferences(next)
    hasLocalEdits.current = true

    setPrefs(validated)
    window.localStorage.setItem(LS_KEY, JSON.stringify(validated))

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      })

      if (!res.ok) throw new Error('Failed to save')

      const json = await res.json()
      const serverPrefs = validatePreferences(json)
      lastServerPrefs.current = serverPrefs
      setPrefs(serverPrefs)
      window.localStorage.setItem(LS_KEY, JSON.stringify(serverPrefs))
      hasLocalEdits.current = false
    } catch (err) {
      if (lastServerPrefs.current) {
        setPrefs(lastServerPrefs.current)
        window.localStorage.setItem(
          LS_KEY,
          JSON.stringify(lastServerPrefs.current)
        )
      }
      console.error('Failed to save preferences:', err)
    }
  }

  // Convenience handlers (thin wrappers around your pseudocode)

  function toggleSection(sectionId: SectionId) {
    const { enabledSections, sectionOrder, layoutPreferences } = prefs

    let newEnabled: SectionId[]
    let newOrder: SectionId[]

    if (enabledSections.includes(sectionId)) {
      newEnabled = enabledSections.filter(id => id !== sectionId)
      newOrder = sectionOrder.filter(id => id !== sectionId)
    } else {
      newEnabled = [...enabledSections, sectionId]
      newOrder = [...sectionOrder, sectionId]
    }

    updatePreferences({
      enabledSections: newEnabled,
      sectionOrder: newOrder,
      layoutPreferences,
    })
  }

  function reorderSections(newOrder: SectionId[]) {
    const validOrder = newOrder.filter(id => prefs.enabledSections.includes(id))
    updatePreferences({
      ...prefs,
      sectionOrder: validOrder,
    })
  }

  function restoreDefaults() {
    updatePreferences(DEFAULT_PREFERENCES)
  }

  function setFavoriteFightersPosition(position: 'left' | 'right') {
    updatePreferences({
      ...prefs,
      layoutPreferences: {
        ...prefs.layoutPreferences,
        favoriteFighters: {
          ...prefs.layoutPreferences.favoriteFighters,
          position,
        },
      },
    })
  }

  function setFavoriteFightersVisible(visible: boolean) {
    updatePreferences({
      ...prefs,
      layoutPreferences: {
        ...prefs.layoutPreferences,
        favoriteFighters: {
          ...prefs.layoutPreferences.favoriteFighters,
          visible,
        },
      },
    })
  }

  function setLiveEventPosition(position: LiveEventPosition) {
    updatePreferences({
      ...prefs,
      layoutPreferences: {
        ...prefs.layoutPreferences,
        liveEvent: {
          ...prefs.layoutPreferences.liveEvent,
          position,
        },
      },
    })
  }

  function setGridCols(cols: number) {
    updatePreferences({
      ...prefs,
      layoutPreferences: {
        ...prefs.layoutPreferences,
        mainContent: {
          ...prefs.layoutPreferences.mainContent,
          gridCols: cols,
        },
      },
    })
  }

  function setGridGap(gap: number) {
    updatePreferences({
      ...prefs,
      layoutPreferences: {
        ...prefs.layoutPreferences,
        mainContent: {
          ...prefs.layoutPreferences.mainContent,
          gap,
        },
      },
    })
  }

  return {
    preferences: prefs,
    updatePreferences,
    toggleSection,
    reorderSections,
    restoreDefaults,
    setFavoriteFightersPosition,
    setFavoriteFightersVisible,
    setLiveEventPosition,
    setGridCols,
    setGridGap,
  }
}