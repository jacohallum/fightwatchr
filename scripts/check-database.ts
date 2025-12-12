import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('\n🔍 FightWatchr Database Analysis\n')
  console.log('=' .repeat(60))

  try {
// Check Events
    console.log('\n📅 EVENTS')
    console.log('-'.repeat(60))
    const totalEvents = await prisma.event.count()
    const upcomingEvents = await prisma.event.count({
      where: { date: { gte: new Date() } }
    })
    const pastEvents = await prisma.event.count({
      where: { date: { lt: new Date() } }
    })
    
    console.log(`Total Events: ${totalEvents}`)
    console.log(`Upcoming Events: ${upcomingEvents}`)
    console.log(`Past Events: ${pastEvents}`)

    if (upcomingEvents > 0) {
      const nextEvents = await prisma.event.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 3,
        select: {
          id: true,
          name: true,
          date: true,
          venue: true,
          city: true,
          state: true,
          country: true,
          organizationId: true,
        }
      })
      console.log('\nNext 3 Upcoming Events:')
      nextEvents.forEach(event => {
        const location = [event.venue, event.city, event.state, event.country]
          .filter(Boolean)
          .join(', ')
        console.log(`  - ${event.name} (${event.date.toLocaleDateString()})`)
        console.log(`    Location: ${location || 'TBD'}`)
      })
    }

    // Check Fighters
    console.log('\n\n🥊 FIGHTERS')
    console.log('-'.repeat(60))
    const totalFighters = await prisma.fighter.count()
    const activeFighters = await prisma.fighter.count({
      where: { active: true }
    })
    const fightersWithImages = await prisma.fighter.count({
      where: { imageUrl: { not: null } }
    })

    console.log(`Total Fighters: ${totalFighters}`)
    console.log(`Active Fighters: ${activeFighters}`)
    console.log(`Fighters with Images: ${fightersWithImages}`)

    if (totalFighters > 0) {
      const sampleFighters = await prisma.fighter.findMany({
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nickname: true,
          wins: true,
          losses: true,
          draws: true,
          active: true,
        }
      })
      console.log('\nSample Fighters:')
      sampleFighters.forEach(fighter => {
        const record = `${fighter.wins}-${fighter.losses}-${fighter.draws}`
        const status = fighter.active ? '✅' : '❌'
        console.log(`  ${status} ${fighter.firstName} ${fighter.lastName} ${fighter.nickname ? `"${fighter.nickname}"` : ''} (${record})`)
      })
    }

    // Check Rankings
    console.log('\n\n🏆 RANKINGS')
    console.log('-'.repeat(60))
    const totalRankings = await prisma.ranking.count()
    const activeRankings = await prisma.ranking.count({
      where: { active: true }
    })
    
    const weightClasses = await prisma.ranking.findMany({
      where: { active: true },
      distinct: ['weightClass'],
      select: { weightClass: true }
    })

    console.log(`Total Rankings: ${totalRankings}`)
    console.log(`Active Rankings: ${activeRankings}`)
    console.log(`Weight Classes: ${weightClasses.length}`)
    
    if (weightClasses.length > 0) {
      console.log('\nWeight Classes with Rankings:')
      for (const wc of weightClasses) {
        const count = await prisma.ranking.count({
          where: { weightClass: wc.weightClass, active: true }
        })
        console.log(`  - ${wc.weightClass}: ${count} fighters`)
      }
    }

   // Check Fights
    console.log('\n\n⚔️  FIGHTS')
    console.log('-'.repeat(60))
    const totalFights = await prisma.fight.count()
    const completedFights = await prisma.fight.count({
      where: { status: 'COMPLETED' }
    })
    const scheduledFights = await prisma.fight.count({
      where: { status: 'SCHEDULED' }
    })

    console.log(`Total Fights: ${totalFights}`)
    console.log(`Completed Fights: ${completedFights}`)
    console.log(`Scheduled Fights: ${scheduledFights}`)

    if (totalFights > 0) {
      const recentFights = await prisma.fight.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          fighter1: { select: { firstName: true, lastName: true } },
          fighter2: { select: { firstName: true, lastName: true } },
          event: { select: { name: true, date: true } }
        }
      })
      console.log('\nRecent Fights:')
      recentFights.forEach(fight => {
        console.log(`  - ${fight.fighter1.firstName} ${fight.fighter1.lastName} vs ${fight.fighter2.firstName} ${fight.fighter2.lastName}`)
        console.log(`    Event: ${fight.event.name} (${fight.event.date.toLocaleDateString()})`)
        console.log(`    Status: ${fight.status}`)
        if (fight.winner) {
          const winnerName = fight.winner === fight.fighter1Id 
            ? `${fight.fighter1.firstName} ${fight.fighter1.lastName}`
            : `${fight.fighter2.firstName} ${fight.fighter2.lastName}`
          console.log(`    Winner: ${winnerName} via ${fight.method || 'Decision'}`)
        }
      })
    }

    // Check Organizations
    console.log('\n\n🏢 ORGANIZATIONS')
    console.log('-'.repeat(60))
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            events: true,
            fighters: true
          }
        }
      }
    })

    console.log(`Total Organizations: ${organizations.length}`)
    if (organizations.length > 0) {
      console.log('\nOrganizations:')
      organizations.forEach(org => {
        console.log(`  - ${org.name}: ${org._count.events} events, ${org._count.fighters} fighters`)
      })
    }

    // Summary & Recommendations
    console.log('\n\n💡 RECOMMENDATIONS')
    console.log('='.repeat(60))
    
    if (upcomingEvents > 0) {
      console.log('✅ You have upcoming events - Perfect for "Upcoming Events" section!')
    } else {
      console.log('⚠️  No upcoming events - Consider seeding some future events')
    }

    if (activeRankings > 0) {
      console.log('✅ You have rankings data - Perfect for "Rankings" section!')
    } else {
      console.log('⚠️  No rankings data - Run rankings scraper first')
    }

    if (totalFighters > 50) {
      console.log('✅ You have fighter data - Good for fighter features!')
    } else {
      console.log('⚠️  Limited fighter data - Consider importing more fighters')
    }

    if (scheduledFights > 10) {
      console.log('✅ You have scheduled fights - Perfect for "Trending Fights" section!')
    } else {
      console.log('⚠️  Few scheduled fights - Sections may look empty')
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n✨ Database check complete!\n')

  } catch (error) {
    console.error('\n❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()