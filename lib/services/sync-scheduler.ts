// lib\services\sync-scheduler.ts
import { prisma } from '@/lib/prisma'
import { WeightClass } from '@prisma/client'
import { syncUFCRankings } from './ufc-rankings-sync'

let syncInterval: NodeJS.Timeout | null = null
let lastSyncTime: Date | null = null
let lastRankingsSyncTime: Date | null = null

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function mapWeightClass(espnWeightClass: string | null): WeightClass | null {
  if (!espnWeightClass) return null
  const normalized = espnWeightClass.toUpperCase().replace(/[^A-Z]/g, '')
  const mapping: Record<string, WeightClass> = {
    'STRAWWEIGHT': WeightClass.STRAWWEIGHT,
    'FLYWEIGHT': WeightClass.FLYWEIGHT,
    'BANTAMWEIGHT': WeightClass.BANTAMWEIGHT,
    'FEATHERWEIGHT': WeightClass.FEATHERWEIGHT,
    'LIGHTWEIGHT': WeightClass.LIGHTWEIGHT,
    'WELTERWEIGHT': WeightClass.WELTERWEIGHT,
    'MIDDLEWEIGHT': WeightClass.MIDDLEWEIGHT,
    'LIGHTHEAVYWEIGHT': WeightClass.LIGHT_HEAVYWEIGHT,
    'LHEAVYWEIGHT': WeightClass.LIGHT_HEAVYWEIGHT,
    'HEAVYWEIGHT': WeightClass.HEAVYWEIGHT
  }
  return mapping[normalized] || null
}

async function incrementalSync() {
  const stats = { events: 0, fights: 0, fighters: 0 }
  
  try {
    const ufc = await prisma.organization.findFirst({
      where: { shortName: 'UFC' }
    })
    
    if (!ufc) {
      console.log('⚠️ UFC organization not found')
      return { success: false, ...stats }
    }

    // Get events from last 30 days and next 90 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 90)
    
    const dateRange = `${startDate.getFullYear()}${String(startDate.getMonth()+1).padStart(2,'0')}${String(startDate.getDate()).padStart(2,'0')}-${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}`
    
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${dateRange}`
    )
    
    const data = await response.json()
    
    if (!data.events) {
      return { success: true, ...stats }
    }

    for (const espnEvent of data.events) {
      try {
        await delay(150)
        
        const eventResponse = await fetch(
          `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${espnEvent.id}?lang=en&region=us`
        )
        
        if (!eventResponse.ok) continue
        
        const eventData = await eventResponse.json()
        if (!eventData.competitions) continue
        
        const event = await prisma.event.upsert({
          where: {
            espnId: eventData.id
          },
          update: {
            name: eventData.name,
            date: new Date(eventData.date),
            espnUid: eventData.uid
          },
          create: {
            espnId: eventData.id,
            espnUid: eventData.uid,
            name: eventData.name,
            eventType: eventData.name.match(/UFC \d+/) ? 'PPV' : 'FIGHT_NIGHT',
            date: new Date(eventData.date),
            venue: eventData.venue?.fullName || 'TBA',
            city: eventData.venue?.address?.city || 'TBA',
            country: 'USA',
            organizationId: ufc.id
          }
        })
        stats.events++
        
        for (const comp of eventData.competitions) {
          if (!comp.competitors || comp.competitors.length !== 2) continue
          
          const fighters = []
          
          for (const competitor of comp.competitors) {
            try {
              await delay(100)
              
              const athleteResponse = await fetch(competitor.athlete.$ref + '?lang=en&region=us')
              if (!athleteResponse.ok) continue
              
              const athleteData = await athleteResponse.json()

              const weightClass = mapWeightClass(
                athleteData.weightClass?.text || athleteData.weightClass?.shortName || null
              )

              // Parse gender
              let gender: 'MALE' | 'FEMALE' = 'MALE'
              if (athleteData.gender) {
                const genderValue = typeof athleteData.gender === 'string'
                  ? athleteData.gender
                  : athleteData.gender.name || athleteData.gender.type
                
                if (genderValue) {
                  gender = genderValue.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE'
                }
              }

              const fighter = await prisma.fighter.upsert({
                where: {
                  espnId: athleteData.id
                },
                update: {
                  firstName: athleteData.firstName || 'Unknown',
                  lastName: athleteData.lastName || 'Fighter',
                  imageUrl: athleteData.headshot?.href || null,
                  weightClass: weightClass || undefined,
                  gender,
                  espnUid: athleteData.uid
                },
                create: {
                  espnId: athleteData.id,
                  espnUid: athleteData.uid, 
                  firstName: athleteData.firstName || 'Unknown',
                  lastName: athleteData.lastName || 'Fighter',
                  nickname: athleteData.nickname || null,
                  imageUrl: athleteData.headshot?.href || null,
                  organizationId: ufc.id,
                  weightClass: weightClass,
                  gender,
                  wins: 0,
                  losses: 0,
                  draws: 0
                }
              })
              
              fighters.push(fighter)
              stats.fighters++
            } catch (err) {
              // Skip fighter on error
            }
          }
          
          if (fighters.length === 2) {
            const statusState = comp.status?.type?.state?.toLowerCase() || 'pre'
            let fightStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED'
            if (statusState === 'post') fightStatus = 'COMPLETED'
            else if (statusState === 'cancelled') fightStatus = 'CANCELLED'

            const fightWeightClass = fighters[0].weightClass || fighters[1].weightClass || WeightClass.CATCHWEIGHT

            await prisma.fight.upsert({
              where: {
                espnId: comp.id
              },
              update: {
                status: fightStatus,
                weightClass: fightWeightClass,
                winner: comp.competitors[0].winner ? fighters[0].id : 
                      comp.competitors[1].winner ? fighters[1].id : null,
                espnUid: comp.uid
              },
              create: {
                espnId: comp.id,
                espnUid: comp.uid,
                eventId: event.id,
                fighter1Id: fighters[0].id,
                fighter2Id: fighters[1].id,
                weightClass: fightWeightClass,
                rounds: 3,
                cardPosition: stats.fights + 1,
                status: fightStatus,
                winner: comp.competitors[0].winner ? fighters[0].id : 
                      comp.competitors[1].winner ? fighters[1].id : null
              }
            })
            stats.fights++
          }
        }
      } catch (err) {
        // Skip event on error
      }
    }

    return { success: true, ...stats }
    
  } catch (error) {
    console.error('❌ Incremental sync error:', error)
    return { success: false, ...stats }
  }
}

export async function startSyncScheduler() {
  // Don't run in production - use cron jobs instead
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Scheduler disabled in production - use cron jobs')
    return
  }

  // Don't start multiple schedulers
  if (syncInterval) {
    console.log('⚠️ Sync scheduler already running')
    return
  }

  console.log('🤖 Starting automatic sync scheduler...')
  
  // Run ESPN data sync immediately on startup if last sync was > 1 hour ago
  const shouldRunImmediately = !lastSyncTime || 
    (Date.now() - lastSyncTime.getTime()) > 60 * 60 * 1000
  if (shouldRunImmediately) {
    runSync()
  }
  
  // Run rankings sync immediately on startup if last sync was > 1 day ago
  const shouldRunRankingsImmediately = !lastRankingsSyncTime || 
    (Date.now() - lastRankingsSyncTime.getTime()) > 24 * 60 * 60 * 1000
  if (shouldRunRankingsImmediately) {
    runRankingsSync()
  }
  
  // ESPN data sync every 6 hours
  syncInterval = setInterval(() => {
    runSync()
  }, 6 * 60 * 60 * 1000)
  
  // Rankings sync every 7 days
  setInterval(() => {
    runRankingsSync()
  }, 7 * 24 * 60 * 60 * 1000)
  
  console.log('✅ Scheduler started - ESPN sync every 6 hours, Rankings sync every 7 days')
}

async function runSync() {
  console.log('🔄 Running automated sync...')
  lastSyncTime = new Date()
  
  try {
    const result = await incrementalSync()
    
    if (result.success) {
      console.log(`✅ Auto-sync complete: ${result.events} events, ${result.fights} fights, ${result.fighters} fighters`)
    } else {
      console.log('⚠️ Auto-sync completed with issues')
    }
  } catch (error) {
    console.error('❌ Auto-sync error:', error)
  }
}

async function runRankingsSync() {
  console.log('🥊 Running automated rankings sync...')
  lastRankingsSyncTime = new Date()
  
  try {
    const result = await syncUFCRankings()
    
    if (result.success) {
      console.log(`✅ Rankings sync complete: ${result.rankingsProcessed} rankings updated`)
    } else {
      console.log('⚠️ Rankings sync completed with issues')
    }
  } catch (error) {
    console.error('❌ Rankings sync error:', error)
  }
}

export function stopSyncScheduler() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('🛑 Sync scheduler stopped')
  }
}