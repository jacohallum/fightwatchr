// src/features/dashboard/sectionRegistry.ts
import { SectionId } from './types'

// Import section components
import UpcomingEventsSection from './sections/UpcomingEventsSection'  // default export
import { PredictionsSection } from './sections/PredictionsSection'    // named export
import { RankingsSection } from './sections/RankingsSection'          // named export
import { NewsSection } from './sections/NewsSection'                  // named export
import { TrendingFightsSection } from './sections/TrendingFightsSection'  // named export
import { UserStatsSection } from './sections/UserStatsSection'        // named export
import { QuickActionsSection } from './sections/QuickActionsSection'  // named export
import { WatchlistSection } from './sections/WatchlistSection'        // named export

export const SECTION_COMPONENTS: Record<SectionId, React.ComponentType<any>> = {
  upcoming_events: UpcomingEventsSection,
  predictions: PredictionsSection,
  rankings: RankingsSection,
  news: NewsSection,
  trending_fights: TrendingFightsSection,
  user_stats: UserStatsSection,
  quick_actions: QuickActionsSection,
  watchlist: WatchlistSection,
}