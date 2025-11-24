const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function inspectESPNData() {
  console.log('🔍 Inspecting ESPN API Data Structure\n')
  
  // Get a recent event
  const dateRange = `20240101-20241231`
  const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${dateRange}`
  
  console.log('Fetching recent events...')
  const scoreboardRes = await fetch(scoreboardUrl)
  const scoreboard = await scoreboardRes.json()
  
  if (!scoreboard.events || scoreboard.events.length === 0) {
    console.log('No events found')
    return
  }
  
  const sampleEventId = scoreboard.events[0].id
  console.log(`\nFetching event details for: ${sampleEventId}`)
  
  await delay(500)
  const eventUrl = `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${sampleEventId}?lang=en&region=us`
  const eventRes = await fetch(eventUrl)
  const eventData = await eventRes.json()
  
  console.log(`\n📅 Event: ${eventData.name}`)
  console.log(`   Date: ${eventData.date}`)
  console.log(`   Status: ${JSON.stringify(eventData.status, null, 2)}`)
  
  if (!eventData.competitions || eventData.competitions.length === 0) {
    console.log('No competitions found')
    return
  }
  
  // Look at first competition
  const comp = eventData.competitions[0]
  console.log(`\n⚔️  Competition:`)
  console.log(`   Notes: ${JSON.stringify(comp.notes, null, 2)}`)
  console.log(`   Status: ${JSON.stringify(comp.status, null, 2)}`)
  
  if (!comp.competitors || comp.competitors.length < 2) {
    console.log('Not enough competitors')
    return
  }
  
  // Inspect both fighters
  for (let i = 0; i < 2; i++) {
    const competitor = comp.competitors[i]
    console.log(`\n🥊 Fighter ${i + 1}:`)
    console.log(`   Athlete Ref: ${competitor.athlete.$ref}`)
    
    await delay(500)
    const athleteRes = await fetch(competitor.athlete.$ref + '?lang=en&region=us')
    const athleteData = await athleteRes.json()
    
    console.log(`   Name: ${athleteData.firstName} ${athleteData.lastName}`)
    console.log(`   Weight Class Object: ${JSON.stringify(athleteData.weightClass, null, 2)}`)
    console.log(`   Weight: ${athleteData.weight}`)
    console.log(`   Height: ${athleteData.height}`)
    console.log(`   Stance: ${JSON.stringify(athleteData.stance, null, 2)}`)
    
    // Check if there's a divisions field
    if (athleteData.divisions) {
      console.log(`   Divisions: ${JSON.stringify(athleteData.divisions, null, 2)}`)
    }
    
    // Check records
    if (athleteData.statistics?.$ref) {
      await delay(500)
      const statsRes = await fetch(athleteData.statistics.$ref)
      const statsData = await statsRes.json()
      console.log(`   Statistics: ${JSON.stringify(statsData, null, 2)}`)
    }
  }
}

inspectESPNData().catch(console.error)