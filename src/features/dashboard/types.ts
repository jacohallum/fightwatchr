// src/features/dashboard/types.ts
export type SectionId =
  | 'upcoming_events'
  | 'predictions'      // Changed from 'recent_predictions'
  | 'rankings'         // Changed from 'fighter_rankings'
  | 'news'            // Changed from 'news_feed'
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

export const AVAILABLE_SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'upcoming_events', label: 'Upcoming Events' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'news', label: 'News' },
  { id: 'trending_fights', label: 'Trending Fights' },
  { id: 'user_stats', label: 'User Stats' },
  { id: 'quick_actions', label: 'Quick Actions' },
  { id: 'watchlist', label: 'Watchlist' },
]

export const DEFAULT_PREFERENCES: UserPreferences = {
  enabledSections: [
    'upcoming_events',
    'predictions',
    'rankings',
    'news',
    'trending_fights',
    'user_stats',
    'quick_actions',
    'watchlist',
  ],
  sectionOrder: [
    'upcoming_events',
    'predictions',
    'rankings',
    'news',
    'trending_fights',
    'user_stats',
    'quick_actions',
    'watchlist',
  ],
  layoutPreferences: {
    favoriteFighters: { position: 'left', visible: true },
    mainContent: { gridCols: 2, gap: 4 },
    liveEvent: { enabled: true, position: 'top' },
  },
}

// Live event API shape
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