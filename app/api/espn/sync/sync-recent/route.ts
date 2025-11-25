// app\api\espn\sync\sync-recent\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WeightClass } from '@prisma/client'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function detectWeightClass(competition: any, eventName: string): WeightClass {
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
  
  return WeightClass.CATCHWEIGHT // Always return a valid WeightClass
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

export async function POST() {
  try {
    console.log('⚡ Starting incremental sync...')
    
    const stats = { events: 0, fights: 0, fighters: 0, fightsSkipped: 0 }
    
    const ufc = await prisma.organization.findFirst({
      where: { shortName: 'UFC' }
    })
    
    if (!ufc) {
      return NextResponse.json({ success: false, error: 'UFC org not found' })
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
      return NextResponse.json({ success: true, events: 0, fights: 0, fighters: 0, message: 'No recent events' })
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

              // Parse gender - check multiple sources
              let gender: 'MALE' | 'FEMALE' = 'MALE'
              
              // 1. Check ESPN gender field
              if (athleteData.gender) {
                const genderValue = typeof athleteData.gender === 'string'
                  ? athleteData.gender
                  : athleteData.gender.name || athleteData.gender.type
                
                if (genderValue?.toUpperCase() === 'FEMALE') {
                  gender = 'FEMALE'
                }
              }
              
              // 2. Check competition/event name for "Women's"
              if (gender === 'MALE') {
                const compName = comp.name?.toLowerCase() || ''
                const eventName = eventData.name?.toLowerCase() || ''
                const notes = comp.notes?.map((n: any) => n.headline?.toLowerCase() || '').join(' ') || ''
                
                if (compName.includes('women') || eventName.includes('women') || notes.includes('women')) {
                  gender = 'FEMALE'
                }
              }
              
              // 3. Infer from weight class - Strawweight in UFC is women-only
              if (gender === 'MALE') {
                const wcText = (athleteData.weightClass?.text || '').toLowerCase()
                if (wcText.includes('women') || wcText.includes("women's")) {
                  gender = 'FEMALE'
                }
                // UFC Strawweight (115 lbs) is women-only
                if (wcText === 'strawweight' || fighterWeightClass?.toLowerCase() === 'strawweight') {
                  gender = 'FEMALE'
                }
              }

              // Fetch detailed record with breakdown
              let wins = 0, losses = 0, draws = 0, noContests = 0
              let winsByKO = 0, winsBySub = 0, winsByDec = 0
              
              try {
                await delay(100)
                const recordResponse = await fetch(
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
                console.error('Error fetching fighter records:', err)
              }
              // Check for existing fighter by normalized name (handles accents)
              const normalizedFirst = athleteData.firstName?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() || ''
              const normalizedLast = athleteData.lastName?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() || ''
              
              // Get all fighters and check with full normalization
              const potentialMatches = await prisma.fighter.findMany({
                where: {
                  organizationId: ufc.id,
                  lastName: { mode: 'insensitive', startsWith: normalizedLast.slice(0, 4) }
                }
              })
              
              const existingByName = potentialMatches.find(f => {
                const dbFirst = f.firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
                const dbLast = f.lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
                return dbFirst === normalizedFirst && dbLast === normalizedLast
              })
              
              // If found by name but different espnId, update the espnId
              if (existingByName && existingByName.espnId !== athleteData.id) {
                console.log(`⚠️ Found duplicate: ${athleteData.firstName} ${athleteData.lastName} - updating espnId`)
                await prisma.fighter.update({
                  where: { id: existingByName.id },
                  data: { espnId: athleteData.id }
                })
              }

              const fighter = await prisma.fighter.upsert({
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

              fighters.push(fighter)
              stats.fighters++
            } catch (err) {
              console.error('Error fetching fighter:', err)
            }
          }
          
          if (fighters.length === 2) {
            const detectedWeightClass = fighters[0].weightClass || 
                          fighters[1].weightClass || 
                          WeightClass.CATCHWEIGHT
            
            const statusState = comp.status?.type?.state?.toLowerCase() || 'pre'
            let fightStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED'
            if (statusState === 'post') fightStatus = 'COMPLETED'
            else if (statusState === 'cancelled') fightStatus = 'CANCELLED'
            
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
                cardPosition: stats.fights + 1,
                status: fightStatus,
                winner: comp.competitors[0].winner ? fighters[0].id : 
                      comp.competitors[1].winner ? fighters[1].id : null
              }
            })
            stats.fights++
            
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
          }
        }
      } catch (err) {
        console.error('Error processing event:', err)
      }
    }

    console.log(`✅ Incremental sync complete: ${stats.events} events, ${stats.fights} fights, ${stats.fighters} fighters`)
    return NextResponse.json({ success: true, ...stats })
    
  } catch (error) {
    console.error('Incremental sync error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}