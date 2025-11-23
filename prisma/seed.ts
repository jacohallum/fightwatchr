import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create Organizations
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

  const bellator = await prisma.organization.upsert({
    where: { name: 'Bellator MMA' },
    update: {},
    create: {
      name: 'Bellator MMA',
      shortName: 'BELLATOR',
      website: 'https://www.bellator.com',
      active: true
    }
  })

  console.log('Organizations created:', { ufc, bellator })

  // Create sample fighters
  const jones = await prisma.fighter.create({
    data: {
      firstName: 'Jon',
      lastName: 'Jones',
      nickname: 'Bones',
      organizationId: ufc.id,
      wins: 27,
      losses: 1,
      draws: 0,
      winsByKO: 10,
      winsBySub: 6,
      winsByDec: 11,
      stance: 'ORTHODOX'
    }
  })

  const aspinall = await prisma.fighter.create({
    data: {
      firstName: 'Tom',
      lastName: 'Aspinall',
      organizationId: ufc.id,
      wins: 14,
      losses: 3,
      draws: 0,
      winsByKO: 8,
      winsBySub: 4,
      winsByDec: 2,
      stance: 'ORTHODOX'
    }
  })

  console.log('Fighters created')

  // Create upcoming event
  const event = await prisma.event.create({
    data: {
      name: 'UFC 309',
      eventNumber: 309,
      eventType: 'PPV',
      date: new Date('2024-11-16T22:00:00Z'),
      venue: 'Madison Square Garden',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      organizationId: ufc.id
    }
  })

  // Create fight
  await prisma.fight.create({
    data: {
      eventId: event.id,
      fighter1Id: jones.id,
      fighter2Id: aspinall.id,
      weightClass: 'HEAVYWEIGHT',
      rounds: 5,
      isMainEvent: true,
      isTitleFight: true,
      cardPosition: 1,
      status: 'SCHEDULED'
    }
  })

  console.log('Event and fight created')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })