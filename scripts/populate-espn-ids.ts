import { prisma } from '@/lib/prisma'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
console.log('🚀 Script started...')
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.status === 429) {
        const backoffTime = Math.min(2000 * Math.pow(2, i), 10000)
        console.log(`⏳ Rate limited, waiting ${backoffTime}ms...`)
        await delay(backoffTime)
        continue
      }
      if (response.ok) return response
      if (i < retries - 1) await delay(1000 * (i + 1))
    } catch (err) {
      if (i === retries - 1) throw err
      await delay(2000 * (i + 1))
    }
  }
  throw new Error('Max retries reached')
}

async function populateESPNIds() {
  console.log('🔄 Starting ESPN ID population for existing records...\n')
  
  const ufc = await prisma.organization.findFirst({
    where: { shortName: 'UFC' }
  })
  if (!ufc) throw new Error('UFC organization not found')

  // Get existing records without ESPN IDs
  const eventsToUpdate = await prisma.event.findMany({
    where: {
      organizationId: ufc.id,
      espnId: null
    },
    select: { id: true, name: true }
  })

  const fightersToUpdate = await prisma.fighter.findMany({
    where: {
      organizationId: ufc.id,
      espnId: null
    },
    select: { id: true, firstName: true, lastName: true }
  })

  const fightsToUpdate = await prisma.fight.findMany({
    where: {
      espnId: null,
      event: {
        organizationId: ufc.id
      }
    },
    select: { 
      id: true, 
      eventId: true,
      fighter1Id: true,
      fighter2Id: true,
      fighter1: { select: { firstName: true, lastName: true } },
      fighter2: { select: { firstName: true, lastName: true } },
      event: { select: { name: true } }
    }
  })

  console.log(`📊 Records without ESPN IDs:`)
  console.log(`   Events: ${eventsToUpdate.length}`)
  console.log(`   Fighters: ${fightersToUpdate.length}`)
  console.log(`   Fights: ${fightsToUpdate.length}\n`)

  // Get ALL event IDs from ESPN for last 27 years
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 27
  const allEventIds: string[] = []

  console.log(`📅 Fetching ESPN event IDs from ${startYear} to ${currentYear}...`)

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
          if (event.id) allEventIds.push(event.id)
        }
      }
      console.log(`  ✅ Year ${year}: ${data.events?.length || 0} events`)
    } catch (err) {
      console.warn(`  ⚠️ Failed ${year}`)
    }
  }

  console.log(`\n📊 Total ESPN events: ${allEventIds.length}`)
  console.log(`🔄 Processing events to populate IDs...\n`)

  // Create lookup maps
  const eventMap = new Map(eventsToUpdate.map(e => [e.name, e]))
  const fighterMap = new Map(fightersToUpdate.map(f => [`${f.firstName}|${f.lastName}`, f]))
  const fightMap = new Map(fightsToUpdate.map(f => [
    `${f.event.name}|${f.fighter1.firstName}|${f.fighter1.lastName}|${f.fighter2.firstName}|${f.fighter2.lastName}`, 
    f
  ]))

  const stats = {
    eventsUpdated: 0,
    fightersUpdated: 0,
    fightsUpdated: 0,
    eventsProcessed: 0
  }

  const athleteCache = new Map<string, { id: string, uid: string, firstName: string, lastName: string }>()

  // Process in batches of 15
  for (let i = 0; i < allEventIds.length; i += 15) {
    const batch = allEventIds.slice(i, i + 15)
    console.log(`📦 Batch ${Math.floor(i/15) + 1}/${Math.ceil(allEventIds.length/15)}`)

    for (const eventId of batch) {
      try {
        await delay(500)
        const eventResp = await fetchWithRetry(
          `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${eventId}?lang=en&region=us`
        )
        if (!eventResp.ok) continue
        
        const eventData = await eventResp.json()
        stats.eventsProcessed++

        // Update event if it exists in DB
        const dbEvent = eventMap.get(eventData.name)
        if (dbEvent) {
          await prisma.event.update({
            where: { id: dbEvent.id },
            data: { 
              espnId: eventData.id,
              espnUid: eventData.uid
            }
          })
          console.log(`  ✅ Event: ${eventData.name}`)
          eventMap.delete(eventData.name)
          stats.eventsUpdated++
        }

        // Process competitions (fights)
        for (const comp of eventData.competitions || []) {
          if (!comp.competitors || comp.competitors.length !== 2) continue

          // Fetch both fighters
          const fighterData: any[] = []
          
          for (const competitor of comp.competitors || []) {
            const athleteRef = competitor.athlete.$ref
            
            let athleteData = athleteCache.get(athleteRef)
            
            if (!athleteData) {
              try {
                await delay(500)
                const athleteResp = await fetchWithRetry(athleteRef + '?lang=en&region=us')
                if (!athleteResp.ok) continue
                
                const fetchedData = await athleteResp.json()
                athleteData = {
                  id: fetchedData.id,
                  uid: fetchedData.uid,
                  firstName: fetchedData.firstName,
                  lastName: fetchedData.lastName
                }
                athleteCache.set(athleteRef, athleteData)
              } catch (err) {
                continue
              }
            }
            
            fighterData.push(athleteData)

            // Update fighter if exists in DB
            const fighterKey = `${athleteData.firstName}|${athleteData.lastName}`
            const dbFighter = fighterMap.get(fighterKey)
            if (dbFighter) {
              await prisma.fighter.update({
                where: { id: dbFighter.id },
                data: { 
                  espnId: athleteData.id,
                  espnUid: athleteData.uid
                }
              })
              console.log(`  ✅ Fighter: ${athleteData.firstName} ${athleteData.lastName}`)
              fighterMap.delete(fighterKey)
              stats.fightersUpdated++
            }
          }

          // Update fight if exists in DB (match by event + fighters)
          if (fighterData.length === 2) {
            const fightKey = `${eventData.name}|${fighterData[0].firstName}|${fighterData[0].lastName}|${fighterData[1].firstName}|${fighterData[1].lastName}`
            const dbFight = fightMap.get(fightKey)
            if (dbFight) {
              await prisma.fight.update({
                where: { id: dbFight.id },
                data: { 
                  espnId: comp.id,
                  espnUid: comp.uid
                }
              })
              console.log(`  ✅ Fight: ${fighterData[0].lastName} vs ${fighterData[1].lastName}`)
              fightMap.delete(fightKey)
              stats.fightsUpdated++
            }
          }
        }

        // Stop if all records updated
        if (eventMap.size === 0 && fighterMap.size === 0 && fightMap.size === 0) {
          console.log(`\n🎉 All records updated!`)
          break
        }

      } catch (err) {
        console.error(`  ❌ Error processing event ${eventId}:`, err)
      }
    }

    console.log(`   Progress: ${stats.eventsUpdated} events, ${stats.fightersUpdated} fighters, ${stats.fightsUpdated} fights\n`)
    
    if (eventMap.size === 0 && fighterMap.size === 0 && fightMap.size === 0) break
  }

  console.log(`\n🎉 Migration Complete!`)
  console.log(`   Events updated: ${stats.eventsUpdated}`)
  console.log(`   Fighters updated: ${stats.fightersUpdated}`)
  console.log(`   Fights updated: ${stats.fightsUpdated}`)
  console.log(`   ESPN events processed: ${stats.eventsProcessed}`)
  console.log(`   Unique athletes cached: ${athleteCache.size}`)
  console.log(`\n   Remaining without IDs:`)
  console.log(`   Events: ${eventMap.size}`)
  console.log(`   Fighters: ${fighterMap.size}`)
  console.log(`   Fights: ${fightMap.size}`)
}

populateESPNIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect())