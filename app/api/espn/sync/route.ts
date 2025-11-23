//app\api\espn\sync\route.ts
import { NextResponse } from 'next/server'
import { syncESPNData } from '@/lib/services/espn-sync'

export async function POST() {
  try {
    const result = await syncESPNData()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}