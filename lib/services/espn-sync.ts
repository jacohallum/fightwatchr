// lib\services\espn-sync.ts
import { prisma } from '@/lib/prisma'
import { WeightClass } from '@prisma/client'
import { error } from 'node:console'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Cache fighters during sync to avoid redundant API calls
const fighterCache = new Map<string, any>()

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      
      // Handle rate limiting with aggressive backoff
      if (response.status === 429) {
        const backoffTime = Math.min(2000 * Math.pow(2, i), 10000)
        console.log(`      ⏳ Rate limited, waiting ${backoffTime}ms...`)
        await delay(backoffTime)
        continue // Retry this iteration
      }
      
      if (response.ok) return response
      
      // For other errors, only retry if not the last attempt
      if (i < retries - 1) {
        await delay(1000 * (i + 1))
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.log(`      ❌ Network error on attempt ${i + 1}:`, errorMsg)
      if (i === retries - 1) throw err
      await delay(2000 * (i + 1))
    }
  }
  throw new Error('Max retries reached')
}

interface SyncResult {
  success: boolean
  eventsProcessed: number
  fightsProcessed: number
  fightersProcessed: number
  error?: string
}

function detectWeightClass(competition: any, eventName: string): WeightClass | null {
  // Check competition notes for weight class
  if (competition.notes) {
    for (const note of competition.notes) {
      const text = note.headline?.toLowerCase() || ''
      if (text.includes('strawweight')) return WeightClass.STRAWWEIGHT
      if (text.includes('flyweight')) return WeightClass.FLYWEIGHT
      if (text.includes('bantamweight')) return WeightClass.BANTAMWEIGHT
      if (text.includes('featherweight')) return WeightClass.FEATHERWEIGHT
      if (text.includes('lightweight')) return WeightClass.LIGHTWEIGHT
      if (text.includes('welterweight')) return WeightClass.WELTERWEIGHT
      if (text.includes('middleweight')) return WeightClass.MIDDLEWEIGHT
      if (text.includes('light heavyweight')) return WeightClass.LIGHT_HEAVYWEIGHT
      if (text.includes('heavyweight')) return WeightClass.HEAVYWEIGHT
      if (text.includes('catchweight')) return WeightClass.CATCHWEIGHT
    }
  }
  
  // Check event name
  const eventLower = eventName.toLowerCase()
  if (eventLower.includes('strawweight')) return WeightClass.STRAWWEIGHT
  if (eventLower.includes('flyweight')) return WeightClass.FLYWEIGHT
  if (eventLower.includes('bantamweight')) return WeightClass.BANTAMWEIGHT
  if (eventLower.includes('featherweight')) return WeightClass.FEATHERWEIGHT
  if (eventLower.includes('lightweight')) return WeightClass.LIGHTWEIGHT
  if (eventLower.includes('welterweight')) return WeightClass.WELTERWEIGHT
  if (eventLower.includes('middleweight')) return WeightClass.MIDDLEWEIGHT
  if (eventLower.includes('light heavyweight')) return WeightClass.LIGHT_HEAVYWEIGHT
  if (eventLower.includes('heavyweight')) return WeightClass.HEAVYWEIGHT
  if (eventLower.includes('catchweight')) return WeightClass.CATCHWEIGHT
  
  return null // Return null if we can't detect it
}
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
  
  return mapping[normalized] || WeightClass.CATCHWEIGHT
}

export async function syncESPNData(): Promise<SyncResult> {
  try {
    console.log('🚀 Starting comprehensive UFC data sync...')
    console.log('📋 Will update all existing data with latest information\n')
    
    const stats = {
      eventsProcessed: 0,
      fightsProcessed: 0,
      fightersProcessed: 0,
      fightsSkipped: 0,
      errors: 0
    }

    // Ensure UFC organization exists
    const ufc = await prisma.organization.upsert({
      where: { name: 'Ultimate Fighting Championship' },
      update: {},
      create: {
        name: 'Ultimate Fighting Championship',
        shortName: 'UFC',
        website: 'https://www.ufc.com',
        active: true
      }
    })

    // Get events from last 30 years
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 30
    const allEventIds: string[] = []

    console.log(`📅 Fetching events from ${startYear} to ${currentYear}...`)

    // Fetch events for each year
    for (let year = startYear; year <= currentYear; year++) {
      try {
        await delay(200)
        
        const response = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${year}0101-${year}1231`
        )
        
        if (!response.ok) continue
        
        const data = await response.json()
        
        if (data.events) {
          for (const event of data.events) {
            if (event.id) {
              allEventIds.push(event.id)
            }
          }
        }
        
        console.log(`  ✅ Year ${year}: ${data.events?.length || 0} events`)
      } catch (err) {
        console.warn(`  ⚠️ Failed to fetch ${year}`)
      }
    }

    console.log(`\n📊 Total events found: ${allEventIds.length}`)
    console.log(`⚡ Processing events in batches...\n`)

    // Process events in batches of 10
    for (let i = 0; i < allEventIds.length; i += 10) {
      const batch = allEventIds.slice(i, i + 10)
      
      console.log(`📦 Batch ${Math.floor(i/10) + 1}/${Math.ceil(allEventIds.length/10)}`)
      
      for (const eventId of batch) {
        try {
          await delay(500)

          const eventResponse = await fetchWithRetry(
            `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${eventId}?lang=en&region=us`
          )
          
          if (!eventResponse.ok) continue
          
          const eventData = await eventResponse.json()

          if (!eventData.name || !eventData.competitions) continue

          // Create/update event
          let event
          try {
            event = await prisma.event.upsert({
              where: {
                espnId: eventData.id
              },
              update: {
                name: eventData.name,
                date: new Date(eventData.date),
                venue: eventData.venue?.fullName || 'TBA',
                city: eventData.venue?.address?.city || 'TBA',
                country: 'USA',
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
              },
            })
            stats.eventsProcessed++
          } catch (err: any) {
            if (err.code === 'P2002') {
              // Duplicate event, fetch existing by name
              event = await prisma.event.findFirst({
                where: {
                  organizationId: ufc.id,
                  name: eventData.name
                }
              })
              if (!event) {
                console.log(`  ⚠️ Skipping duplicate event: ${eventData.name}`)
                continue
              }
              console.log(`  ♻️  Using existing event: ${eventData.name}`)
            } else {
              throw err
            }
          }

          // Process fights
          for (const comp of eventData.competitions) {
            if (!comp.competitors || comp.competitors.length !== 2) continue
            
            const fighters = []
            
            // Process both fighters
            for (const competitor of comp.competitors) {
              try {
                const athleteRef = competitor.athlete.$ref
                //console.log(`      🔍 Fetching: ${athleteRef}`)
                
                // Check cache first
                let fighter = fighterCache.get(athleteRef)
                
                if (!fighter) {
                  await delay(500)
                  
                  const athleteResponse = await fetchWithRetry(athleteRef + '?lang=en&region=us')
                  //console.log(`      📡 Response status: ${athleteResponse.status}`)
                  
                  if (!athleteResponse.ok) {
                    //console.log(`      ❌ Fighter fetch failed`)
                    continue
                  }
                  
                  const athleteData = await athleteResponse.json()
                  //console.log(`      ✅ Got: ${athleteData.firstName} ${athleteData.lastName}`)
                  
                  // Extract weight class from fighter
                  const fighterWeightClass = athleteData.weightClass?.text || athleteData.weightClass?.shortName || null

                  // Parse physical stats
                  const heightCm = athleteData.height ? Math.round(athleteData.height * 2.54) : null
                  const reachCm = athleteData.reach ? Math.round(athleteData.reach * 2.54) : null
                  const weightLbs = athleteData.weight || null
                  const dateOfBirth = athleteData.dateOfBirth ? new Date(athleteData.dateOfBirth) : null
                  
                  // Parse stance
                  let stance: 'ORTHODOX' | 'SOUTHPAW' | 'SWITCH' | null = null
                  if (athleteData.stance) {
                    const stanceValue = typeof athleteData.stance === 'string' 
                      ? athleteData.stance 
                      : athleteData.stance.name || athleteData.stance.displayName
                    
                    if (stanceValue) {
                      const stanceUpper = stanceValue.toUpperCase()
                      if (['ORTHODOX', 'SOUTHPAW', 'SWITCH'].includes(stanceUpper)) {
                        stance = stanceUpper as 'ORTHODOX' | 'SOUTHPAW' | 'SWITCH'
                      }
                    }
                  }

                  // Parse gender
                  let gender: 'MALE' | 'FEMALE' = 'MALE' // Default to MALE
                  if (athleteData.gender) {
                    const genderValue = typeof athleteData.gender === 'string'
                      ? athleteData.gender
                      : athleteData.gender.name || athleteData.gender.type
                    
                    if (genderValue) {
                      gender = genderValue.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE'
                    }
                  }
                  
                  // Fetch detailed record with breakdown
                  let wins = 0, losses = 0, draws = 0, noContests = 0
                  let winsByKO = 0, winsBySub = 0, winsByDec = 0
                  
                  try {
                    await delay(500)
                    const recordResponse = await fetchWithRetry(
                      `https://sports.core.api.espn.com/v2/sports/mma/athletes/${athleteData.id}/records?lang=en&region=us`
                    )
                    
                    if (recordResponse.ok) {
                      const recordData = await recordResponse.json()
                      
                      const overallRecord = recordData.items?.find((r: any) => 
                        r.name === 'overall' || r.type === 'total'
                      )
                      
                      if (overallRecord?.summary) {
                        const parts = overallRecord.summary.split('-')
                        wins = parseInt(parts[0]) || 0
                        losses = parseInt(parts[1]) || 0
                        draws = parseInt(parts[2]) || 0
                        if (parts[3]) noContests = parseInt(parts[3]) || 0
                      }
                      
                      const koRecord = recordData.items?.find((r: any) => 
                        r.name === 'KO/TKO' || r.displayName?.includes('KO')
                      )
                      const subRecord = recordData.items?.find((r: any) => 
                        r.name === 'Submissions' || r.displayName?.includes('Sub')
                      )
                      const decRecord = recordData.items?.find((r: any) => 
                        r.name === 'Decisions' || r.displayName?.includes('Dec')
                      )
                      
                      if (koRecord?.wins) winsByKO = koRecord.wins
                      if (subRecord?.wins) winsBySub = subRecord.wins
                      if (decRecord?.wins) winsByDec = decRecord.wins
                    }
                  } catch (err) {
                    // Silent fail on record fetch
                  }
                  
                  fighter = await prisma.fighter.upsert({
                    where: {
                      espnId: athleteData.id
                    },
                    update: {
                      firstName: athleteData.firstName || 'Unknown',
                      lastName: athleteData.lastName || 'Fighter',
                      nickname: athleteData.nickname || null,
                      imageUrl: athleteData.headshot?.href || null,
                      nationality: athleteData.citizenship || null,
                      dateOfBirth,
                      height: heightCm,
                      reach: reachCm,
                      weight: weightLbs,
                      stance,
                      wins,
                      losses,
                      draws,
                      noContests,
                      winsByKO,
                      winsBySub,
                      winsByDec,
                      weightClass: mapWeightClass(fighterWeightClass),
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
                      nationality: athleteData.citizenship || null,
                      dateOfBirth,
                      height: heightCm,
                      reach: reachCm,
                      weight: weightLbs,
                      stance,
                      organizationId: ufc.id,
                      wins,
                      losses,
                      draws,
                      noContests,
                      winsByKO,
                      winsBySub,
                      winsByDec,
                      weightClass: mapWeightClass(fighterWeightClass),
                      gender
                    }
                  })                  
                  // Cache the fighter
                  fighterCache.set(athleteRef, fighter)
                  stats.fightersProcessed++
                }
                
                fighters.push(fighter)
                
              } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err)
                console.error(`      ❌ Fighter error:`, errorMsg)
                stats.errors++
              }
            }
            
            if (fighters.length === 2) {
              // Try fighter weight class first, then fall back to competition/event detection
              let detectedWeightClass = fighters[0].weightClass || fighters[1].weightClass
              
              // If no weight class from fighters, detect from competition/event
              if (!detectedWeightClass) {
                const eventDetected = detectWeightClass(comp, eventData.name)
                detectedWeightClass = eventDetected || WeightClass.CATCHWEIGHT
              }
              
              // Better status detection - check multiple ESPN fields
              const statusState = comp.status?.type?.state?.toLowerCase() || 
                                comp.status?.type?.name?.toLowerCase() || 
                                'pre'
              const isCompleted = statusState === 'post' || statusState === 'final' || 
                                comp.status?.type?.completed === true ||
                                eventData.date < new Date() // Past events should be completed

              let fightStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED'
              if (statusState.includes('cancel')) fightStatus = 'CANCELLED'
              else if (isCompleted) fightStatus = 'COMPLETED'
              
              // Create/update fight with detected weight class
              try {
                await prisma.fight.upsert({
                  where: {
                    espnId: comp.id
                  },
                  update: {
                    status: fightStatus,
                    weightClass: detectedWeightClass,
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
                    weightClass: detectedWeightClass,
                    rounds: 3,
                    cardPosition: stats.fightsProcessed + 1,
                    status: fightStatus,
                    winner: comp.competitors[0].winner ? fighters[0].id : 
                          comp.competitors[1].winner ? fighters[1].id : null
                  }
                })
                stats.fightsProcessed++
              } catch (err: any) {
                if (err.code === 'P2002') {
                  console.log(`    ⚠️ Skipping duplicate fight: ${fighters[0].lastName} vs ${fighters[1].lastName}`)
                  stats.fightsSkipped++
                } else {
                  throw err
                }
              }
              
              // Update fighter weight classes
              if (detectedWeightClass !== WeightClass.CATCHWEIGHT) {
                await prisma.fighter.updateMany({
                  where: {
                    id: { in: [fighters[0].id, fighters[1].id] }
                  },
                  data: {
                    weightClass: detectedWeightClass
                  }
                })
              }
            } else {
              console.log(`    ⚠️ Skipping fight - only ${fighters.length}/2 fighters loaded`)
              stats.fightsSkipped++
            }
          }
          
          console.log(`  ✅ ${eventData.name}`)
          
        } catch (err) {
          console.error(`  ❌ Error processing event ${eventId}:`, err)
          stats.errors++
        }
      }
      
      console.log(`   📊 Progress: ${stats.eventsProcessed} events, ${stats.fightsProcessed} fights, ${stats.fightsSkipped} skipped\n`)
    }

    console.log(`\n🎉 Sync complete!`)
    console.log(`   Events: ${stats.eventsProcessed}`)
    console.log(`   Fights: ${stats.fightsProcessed}`)
    console.log(`   Unique Fighters: ${fighterCache.size}`)
    console.log(`   Total Fighter Fetches: ${stats.fightersProcessed}`)
    console.log(`   Fights Skipped: ${stats.fightsSkipped}`)
    console.log(`   Errors: ${stats.errors}`)

    return {
      success: true,
      eventsProcessed: stats.eventsProcessed,
      fightsProcessed: stats.fightsProcessed,
      fightersProcessed: stats.fightersProcessed
    }

  } catch (error) {
    console.error('ESPN sync error:', error)
    return { 
      success: false, 
      error: String(error),
      eventsProcessed: 0,
      fightsProcessed: 0,
      fightersProcessed: 0
    }
  }
}