import { NextResponse } from 'next/server'
import { syncUFCRankings } from '@/lib/services/ufc-rankings-sync'

export async function POST() {
  try {
    console.log('🥊 Starting UFC rankings sync...')
    const result = await syncUFCRankings()

    return NextResponse.json({
      success: result.success,
      rankingsProcessed: result.rankingsProcessed,
      error: result.error
    })
  } catch (error) {
    console.error('Rankings sync error:', error)
    return NextResponse.json(
      { success: false, error: String(error), rankingsProcessed: 0 },
      { status: 500 }
    )
  }
}