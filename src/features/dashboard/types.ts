// src/features/dashboard/types.ts

export type SectionId =
  | 'upcoming_events'
  | 'recent_predictions'
  | 'fighter_rankings'
  | 'news_feed'
  | 'trending_fights'
  | 'user_stats'
  | 'quick_actions'
  | 'watchlist'

export type LiveEventPosition = 'top' | 'bottom' | 'hidden'

export interface LayoutPreferences {
  favoriteFighters: {
    position: 'left' | 'right'
    visible: boolean
  }
  mainContent: {
    gridCols: number
    gap: number
  }
  liveEvent: {
    enabled: boolean
    position: LiveEventPosition
  }
}

export interface UserPreferences {
  enabledSections: SectionId[]
  sectionOrder: SectionId[]
  layoutPreferences: LayoutPreferences
}

export const AVAILABLE_SECTIONS: SectionId[] = [
  'upcoming_events',
  'recent_predictions',
  'fighter_rankings',
  'news_feed',
  'trending_fights',
  'user_stats',
  'quick_actions',
  'watchlist',
]

export const DEFAULT_PREFERENCES: UserPreferences = {
  enabledSections: ['upcoming_events', 'recent_predictions', 'fighter_rankings'],
  sectionOrder: ['upcoming_events', 'recent_predictions', 'fighter_rankings'],
  layoutPreferences: {
    favoriteFighters: { position: 'left', visible: true },
    mainContent: { gridCols: 2, gap: 4 },
    liveEvent: { enabled: true, position: 'top' },
  },
}

// Live event API shape (matches your pseudocode)
export interface LiveEventResponse {
  isLive: boolean
  event?: {
    id: string
    name: string
    currentFight: {
      fighter1: any
      fighter2: any
      round: number
      timeRemaining: string
    }
    remainingFights: any[]
    liveStats: {
      viewers: number
      predictions: number
    }
  }
}