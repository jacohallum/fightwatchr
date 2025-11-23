import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = (await headers()).get('authorization')
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the incremental sync
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/espn/sync-recent`, {
      method: 'POST'
    })
    
    const result = await response.json()
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      ...result 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}