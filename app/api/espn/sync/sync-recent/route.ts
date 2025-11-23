import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST() {
  try {
    console.log('⚡ Starting incremental sync...')
    
    const stats = { events: 0, fights: 0, fighters: 0 }
    
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
            organizationId_name: {
              organizationId: ufc.id,
              name: eventData.name
            }
          },
          update: {
            date: new Date(eventData.date)
          },
          create: {
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
              
              const fighter = await prisma.fighter.upsert({
                where: {
                  organizationId_firstName_lastName: {
                    organizationId: ufc.id,
                    firstName: athleteData.firstName || 'Unknown',
                    lastName: athleteData.lastName || 'Fighter'
                  }
                },
                update: {
                  imageUrl: athleteData.headshot?.href || null
                },
                create: {
                  firstName: athleteData.firstName || 'Unknown',
                  lastName: athleteData.lastName || 'Fighter',
                  nickname: athleteData.nickname || null,
                  imageUrl: athleteData.headshot?.href || null,
                  organizationId: ufc.id,
                  wins: 0,
                  losses: 0,
                  draws: 0
                }
              })
              
              fighters.push(fighter)
              stats.fighters++
            } catch (err) {
              console.error('Error fetching fighter:', err)
            }
          }
          
          if (fighters.length === 2) {
            const statusState = comp.status?.type?.state?.toLowerCase() || 'pre'
            let fightStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED'
            if (statusState === 'post') fightStatus = 'COMPLETED'
            else if (statusState === 'cancelled') fightStatus = 'CANCELLED'
            
            await prisma.fight.upsert({
              where: {
                eventId_fighter1Id_fighter2Id: {
                  eventId: event.id,
                  fighter1Id: fighters[0].id,
                  fighter2Id: fighters[1].id
                }
              },
              update: {
                status: fightStatus,
                winner: comp.competitors[0].winner ? fighters[0].id : 
                       comp.competitors[1].winner ? fighters[1].id : null
              },
              create: {
                eventId: event.id,
                fighter1Id: fighters[0].id,
                fighter2Id: fighters[1].id,
                weightClass: 'CATCHWEIGHT',
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
        console.error('Error processing event:', err)
      }
    }

    console.log(`✅ Incremental sync complete: ${stats.events} events, ${stats.fights} fights`)
    return NextResponse.json({ success: true, ...stats })
    
  } catch (error) {
    console.error('Incremental sync error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}