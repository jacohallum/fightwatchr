// src/features/dashboard/sectionRegistry.ts

import { SectionId } from './types'

// Import section components
import { UpcomingEventsSection } from './sections/UpcomingEventsSection'
import { PredictionsSection } from './sections/PredictionsSection'
import { RankingsSection } from './sections/RankingsSection'
import { NewsSection } from './sections/NewsSection'
import { TrendingFightsSection } from './sections/TrendingFightsSection'
import { UserStatsSection } from './sections/UserStatsSection'
import { QuickActionsSection } from './sections/QuickActionsSection'
import { WatchlistSection } from './sections/WatchlistSection'

export const SECTION_COMPONENTS: Record<SectionId, React.ComponentType<any>> = {
  upcoming_events: UpcomingEventsSection,
  recent_predictions: PredictionsSection,
  fighter_rankings: RankingsSection,
  news_feed: NewsSection,
  trending_fights: TrendingFightsSection,
  user_stats: UserStatsSection,
  quick_actions: QuickActionsSection,
  watchlist: WatchlistSection,
}