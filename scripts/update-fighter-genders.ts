import { prisma } from '@/lib/prisma'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

async function updateFighterGenders() {
  console.log('🔄 Starting gender update for all fighters...\n')
  
  const ufc = await prisma.organization.findFirst({
    where: { shortName: 'UFC' }
  })
  if (!ufc) throw new Error('UFC organization not found')

  const fightersToUpdate = await prisma.fighter.findMany({
    where: {
      organizationId: ufc.id
    },
    select: { id: true, firstName: true, lastName: true }
  })

  console.log(`📊 Found ${fightersToUpdate.length} fighters to process\n`)

  // Get ALL event IDs from ESPN for last 25 years
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 25
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
  console.log(`🔄 Processing events to extract fighter data...\n`)

  const athleteCache = new Map<string, any>()
  const fighterMap = new Map(fightersToUpdate.map(f => [`${f.firstName}|${f.lastName}`, f]))
  let updated = 0
  let eventCount = 0

  // Process in batches of 20
  for (let i = 0; i < allEventIds.length; i += 20) {
    const batch = allEventIds.slice(i, i + 20)
    console.log(`📦 Batch ${Math.floor(i/20) + 1}/${Math.ceil(allEventIds.length/20)}`)

    for (const eventId of batch) {
      try {
        await delay(400)
        const eventResp = await fetchWithRetry(
          `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${eventId}?lang=en&region=us`
        )
        if (!eventResp.ok) continue
        const eventData = await eventResp.json()

        for (const comp of eventData.competitions || []) {
          for (const competitor of comp.competitors || []) {
            const athleteRef = competitor.athlete.$ref
            
            if (athleteCache.has(athleteRef)) continue

            try {
              await delay(400)
              const athleteResp = await fetchWithRetry(athleteRef + '?lang=en&region=us')
              if (!athleteResp.ok) continue
              
              const athleteData = await athleteResp.json()
              athleteCache.set(athleteRef, athleteData)
              
              const key = `${athleteData.firstName}|${athleteData.lastName}`
              const dbFighter = fighterMap.get(key)
              
              if (dbFighter) {
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
                
                await prisma.fighter.update({
                  where: { id: dbFighter.id },
                  data: { gender }
                })
                console.log(`  ✅ ${dbFighter.firstName} ${dbFighter.lastName} → ${gender}`)
                fighterMap.delete(key)
                updated++
              }
            } catch (err) {
              // Skip failed athletes
            }
          }
        }
        
        eventCount++
        if (fighterMap.size === 0) {
          console.log(`\n🎉 All fighters updated!`)
          break
        }
      } catch (err) {
        // Skip failed events
      }
    }

    console.log(`   Progress: ${updated} updated, ${fighterMap.size} remaining, ${eventCount} events processed\n`)
    
    if (fighterMap.size === 0) break
  }

  console.log(`\n🎉 Complete!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Remaining: ${fighterMap.size}`)
  console.log(`   Events processed: ${eventCount}`)
  console.log(`   Unique athletes fetched: ${athleteCache.size}`)
}

updateFighterGenders()