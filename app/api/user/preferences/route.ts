// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// ============================================================================
// SERVER-SIDE VALIDATION (NEW)
// ============================================================================

const AVAILABLE_SECTIONS = [
  'upcoming_events',
  'recent_predictions',
  'fighter_rankings',
  'news_feed',
  'trending_fights',
  'user_stats',
  'quick_actions',
  'watchlist',
]

const DEFAULT_PREFERENCES = {
  enabledSections: ['upcoming_events', 'recent_predictions', 'fighter_rankings'],
  sectionOrder: ['upcoming_events', 'recent_predictions', 'fighter_rankings'],
  layoutPreferences: {
    favoriteFighters: { position: 'left', visible: true },
    mainContent: { gridCols: 2, gap: 4 },
    liveEvent: { enabled: true, position: 'top' },
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function validatePreferencesServer(prefs: any) {
  const enabled = (prefs.enabledSections || []).filter((id: string) =>
    AVAILABLE_SECTIONS.includes(id)
  )

  const sectionOrder = (prefs.sectionOrder || []).filter((id: string) =>
    enabled.includes(id)
  )

  const layoutPrefs = prefs.layoutPreferences || {}
  const favoriteFighters = layoutPrefs.favoriteFighters || {}
  const mainContent = layoutPrefs.mainContent || {}
  const liveEvent = layoutPrefs.liveEvent || {}

  return {
    enabledSections: enabled,
    sectionOrder,
    layoutPreferences: {
      favoriteFighters: {
        position: favoriteFighters.position === 'right' ? 'right' : 'left',
        visible: typeof favoriteFighters.visible === 'boolean' 
          ? favoriteFighters.visible 
          : true,
      },
      mainContent: {
        gridCols: clamp(mainContent.gridCols || 2, 1, 3),
        gap: clamp(mainContent.gap || 4, 2, 8),
      },
      liveEvent: {
        enabled: typeof liveEvent.enabled === 'boolean' 
          ? liveEvent.enabled 
          : true,
        position: ['top', 'bottom', 'hidden'].includes(liveEvent.position)
          ? liveEvent.position
          : 'top',
      },
    },
  }
}

// ============================================================================
// GET - Fetch user preferences (UPDATED)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If no preferences exist, return defaults
    if (!user.preferences) {
      return NextResponse.json({
        preferences: {
          ...DEFAULT_PREFERENCES,
          fighters: [],
          skipped: false,
        },
        hasPreferences: false
      })
    }

    // Parse stored values and fallback to defaults if empty
    const enabledSections = user.preferences.enabledSections as string[]
    const sectionOrder = user.preferences.sectionOrder as string[]
    const layoutPreferences = user.preferences.layoutPreferences as any

    const storedPrefs = {
      // FIX: Check for empty arrays, not just falsy values
      enabledSections: (enabledSections && enabledSections.length > 0) 
        ? enabledSections 
        : DEFAULT_PREFERENCES.enabledSections,
      sectionOrder: (sectionOrder && sectionOrder.length > 0) 
        ? sectionOrder 
        : DEFAULT_PREFERENCES.sectionOrder,
      // FIX: Check for empty objects
      layoutPreferences: (layoutPreferences && Object.keys(layoutPreferences).length > 0)
        ? layoutPreferences
        : DEFAULT_PREFERENCES.layoutPreferences,
      fighters: user.preferences.fighters as any[] || [],
      skipped: user.preferences.skipped || false,
    }

    return NextResponse.json({
      preferences: storedPrefs,
      hasPreferences: true
    })

  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Save user preferences (UPDATED - supports both dashboard & fighters)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get user with existing preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, preferences: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Handle dashboard preferences (if provided)
    let dashboardPrefs = DEFAULT_PREFERENCES
    if (body.enabledSections || body.sectionOrder || body.layoutPreferences) {
      // Validate new dashboard preferences
      dashboardPrefs = validatePreferencesServer({
        enabledSections: body.enabledSections,
        sectionOrder: body.sectionOrder,
        layoutPreferences: body.layoutPreferences,
      })
    } else if (user.preferences) {
      // Keep existing dashboard prefs if not updating them
      dashboardPrefs = {
        enabledSections: user.preferences.enabledSections as string[] || DEFAULT_PREFERENCES.enabledSections,
        sectionOrder: user.preferences.sectionOrder as string[] || DEFAULT_PREFERENCES.sectionOrder,
        layoutPreferences: user.preferences.layoutPreferences as any || DEFAULT_PREFERENCES.layoutPreferences,
      }
    }

    // Handle fighter preferences (if provided)
    const fighters = body.fighters !== undefined 
      ? body.fighters 
      : (user.preferences?.fighters || [])
    const skipped = body.skipped !== undefined 
      ? body.skipped 
      : (user.preferences?.skipped || false)

    // Upsert all preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        enabledSections: dashboardPrefs.enabledSections,
        sectionOrder: dashboardPrefs.sectionOrder,
        layoutPreferences: dashboardPrefs.layoutPreferences,
        fighters: fighters,
        skipped: skipped,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        enabledSections: dashboardPrefs.enabledSections,
        sectionOrder: dashboardPrefs.sectionOrder,
        layoutPreferences: dashboardPrefs.layoutPreferences,
        fighters: fighters,
        skipped: skipped,
      }
    })

    console.log(`✅ Preferences saved for user: ${session.user.email}`)
    if (body.fighters !== undefined) {
      console.log('Fighters count:', fighters?.length || 0)
    }

    // Return merged preferences
    const response = {
      enabledSections: dashboardPrefs.enabledSections,
      sectionOrder: dashboardPrefs.sectionOrder,
      layoutPreferences: dashboardPrefs.layoutPreferences,
      fighters: fighters,
      skipped: skipped,
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences: response
    })

  } catch (error) {
    console.error('Error saving user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update existing preferences (KEPT FROM ORIGINAL)
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.preferences) {
      return NextResponse.json({ error: 'No preferences to update' }, { status: 404 })
    }

    const updatedPreferences = await prisma.userPreferences.update({
      where: { userId: user.id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    })

  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Clear user preferences (KEPT FROM ORIGINAL)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.userPreferences.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to clear preferences' },
      { status: 500 }
    )
  }
}