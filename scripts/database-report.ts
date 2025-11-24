import { prisma } from '../lib/prisma'

async function generateReport() {
  console.log('📊 FightWatchr Database Report')
  console.log('=' .repeat(60))
  
  // Organizations
  const orgs = await prisma.organization.findMany()
  console.log('\n🏢 Organizations:', orgs.length)
  for (const org of orgs) {
    console.log(`   - ${org.name} (${org.shortName})`)
  }
  
  // Events
  const totalEvents = await prisma.event.count()
  const eventsByType = await prisma.event.groupBy({
    by: ['eventType'],
    _count: true,
    orderBy: { _count: { eventType: 'desc' } }
  })
  console.log('\n📅 Events:', totalEvents)
  for (const type of eventsByType) {
    console.log(`   - ${type.eventType}: ${type._count}`)
  }
  
  // Date range
  const oldestEvent = await prisma.event.findFirst({
    orderBy: { date: 'asc' },
    select: { name: true, date: true }
  })
  const newestEvent = await prisma.event.findFirst({
    orderBy: { date: 'desc' },
    select: { name: true, date: true }
  })
  console.log(`   Range: ${oldestEvent?.date.toLocaleDateString()} to ${newestEvent?.date.toLocaleDateString()}`)
  
  // Fighters
  const totalFighters = await prisma.fighter.count()
  const fightersByWeightClass = await prisma.fighter.groupBy({
    by: ['weightClass'],
    _count: true,
    orderBy: { weightClass: 'asc' }
  })
  console.log('\n🥊 Fighters:', totalFighters)
  for (const wc of fightersByWeightClass) {
    console.log(`   - ${wc.weightClass || 'Unknown'}: ${wc._count}`)
  }
  
  // Fighter stats
  const fighterStats = await prisma.fighter.aggregate({
    _avg: { wins: true, losses: true },
    _max: { wins: true },
    _sum: { wins: true, losses: true, draws: true }
  })
  console.log(`   Avg Record: ${fighterStats._avg.wins?.toFixed(1)}-${fighterStats._avg.losses?.toFixed(1)}`)
  console.log(`   Most Wins: ${fighterStats._max.wins}`)
  console.log(`   Total Fights Tracked: ${(fighterStats._sum.wins || 0) + (fighterStats._sum.losses || 0) + (fighterStats._sum.draws || 0)}`)
  
  // Top fighters by wins
  const topFighters = await prisma.fighter.findMany({
    orderBy: { wins: 'desc' },
    take: 5,
    select: { firstName: true, lastName: true, wins: true, losses: true, draws: true }
  })
  console.log('\n   Top 5 by Wins:')
  for (const f of topFighters) {
    console.log(`   - ${f.firstName} ${f.lastName}: ${f.wins}-${f.losses}-${f.draws}`)
  }
  
  // Fights
  const totalFights = await prisma.fight.count()
  const fightsByStatus = await prisma.fight.groupBy({
    by: ['status'],
    _count: true
  })
  const fightsByWeightClass = await prisma.fight.groupBy({
    by: ['weightClass'],
    _count: true,
    orderBy: { _count: { weightClass: 'desc' } }
  })
  console.log('\n⚔️  Fights:', totalFights)
  console.log('   By Status:')
  for (const status of fightsByStatus) {
    console.log(`   - ${status.status}: ${status._count}`)
  }
  console.log('   By Weight Class:')
  for (const wc of fightsByWeightClass.slice(0, 5)) {
    console.log(`   - ${wc.weightClass}: ${wc._count}`)
  }
  
  // Completed fights
  const completedFights = await prisma.fight.count({
    where: { status: 'COMPLETED' }
  })
  const fightsWithWinner = await prisma.fight.count({
    where: { 
      status: 'COMPLETED',
      winner: { not: null }
    }
  })
  console.log(`   Completed: ${completedFights} (${fightsWithWinner} with winner)`)
  
  // Users
  const totalUsers = await prisma.user.count()
  const usersWithPrefs = await prisma.userPreferences.count()
  console.log('\n👥 Users:', totalUsers)
  console.log(`   With Preferences: ${usersWithPrefs}`)
  
  // Database integrity checks
  console.log('\n🔍 Integrity Checks:')
  
  // Fighters without weight class
  const fightersNoWeightClass = await prisma.fighter.count({
    where: { weightClass: null }
  })
  console.log(`   Fighters without weight class: ${fightersNoWeightClass}`)
  
  // Fighters with 0-0-0 record
  const fightersNoRecord = await prisma.fighter.count({
    where: { wins: 0, losses: 0, draws: 0 }
  })
  console.log(`   Fighters with 0-0-0 record: ${fightersNoRecord}`)
  
  // Events without fights
  const eventsNoFights = await prisma.event.count({
    where: { fights: { none: {} } }
  })
  console.log(`   Events without fights: ${eventsNoFights}`)

  // ESPN ID coverage
  console.log('\n📡 ESPN ID Coverage:')
  const eventsWithEspnId = await prisma.event.count({
    where: { espnId: { not: null } }
  })
  const fightersWithEspnId = await prisma.fighter.count({
    where: { espnId: { not: null } }
  })
  const fightsWithEspnId = await prisma.fight.count({
    where: { espnId: { not: null } }
  })
  console.log(`   Events with ESPN ID: ${eventsWithEspnId}/${totalEvents} (${((eventsWithEspnId/totalEvents)*100).toFixed(1)}%)`)
  console.log(`   Fighters with ESPN ID: ${fightersWithEspnId}/${totalFighters} (${((fightersWithEspnId/totalFighters)*100).toFixed(1)}%)`)
  console.log(`   Fights with ESPN ID: ${fightsWithEspnId}/${totalFights} (${((fightsWithEspnId/totalFights)*100).toFixed(1)}%)`)
  
  // Storage size estimate
  const avgFighterSize = 1024 // ~1KB per fighter
  const avgFightSize = 512    // ~0.5KB per fight
  const avgEventSize = 256    // ~0.25KB per event
  const estimatedSize = (totalFighters * avgFighterSize + totalFights * avgFightSize + totalEvents * avgEventSize) / (1024 * 1024)
  console.log(`\n💾 Estimated Database Size: ${estimatedSize.toFixed(2)} MB`)
  
  console.log('\n' + '='.repeat(60))
  
  await prisma.$disconnect()
}

generateReport().catch(console.error)