import { prisma } from '@/lib/prisma'

const MENS_DIVISIONS = [
  'FLYWEIGHT', 'BANTAMWEIGHT', 'FEATHERWEIGHT', 'LIGHTWEIGHT',
  'WELTERWEIGHT', 'MIDDLEWEIGHT', 'LIGHT_HEAVYWEIGHT', 'HEAVYWEIGHT'
]

const WOMENS_DIVISIONS = [
  'STRAWWEIGHT', 'FLYWEIGHT', 'BANTAMWEIGHT'
]

async function main() {
  const ufc = await prisma.organization.findFirst({
    where: { shortName: 'UFC' }
  })
  
  if (!ufc) {
    console.log('No UFC found')
    return
  }

  console.log('\n========== MENS DIVISIONS ==========')
  for (const div of MENS_DIVISIONS) {
    await checkDivision(ufc.id, div, 'MALE')
  }

  console.log('\n========== WOMENS DIVISIONS ==========')
  for (const div of WOMENS_DIVISIONS) {
    await checkDivision(ufc.id, div, 'FEMALE')
  }
}

async function checkDivision(orgId: string, weightClass: string, gender: string) {
  const rankings = await prisma.ranking.findMany({
    where: {
      organizationId: orgId,
      weightClass: weightClass as any,
      active: true,
      fighter: {
        gender: gender as any
      }
    },
    include: {
      fighter: true
    },
    orderBy: { rank: 'asc' }
  })

  console.log(`\n${weightClass} (${gender}): ${rankings.length} ranked fighters`)
  
  for (const r of rankings) {
    const champ = r.rank === 0 ? ' [C]' : ''
    console.log(`  #${r.rank}${champ} ${r.fighter.firstName} ${r.fighter.lastName}`)
  }
}

main().finally(() => prisma.$disconnect())