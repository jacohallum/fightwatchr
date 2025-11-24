import { prisma } from '@/lib/prisma'

async function main() {
  const ufc = await prisma.organization.findFirst({
    where: { shortName: 'UFC' }
  })
  
  if (!ufc) {
    console.log('No UFC found')
    return
  }
  
  const divisions = ['MIDDLEWEIGHT', 'LIGHT_HEAVYWEIGHT', 'HEAVYWEIGHT']
  
  for (const div of divisions) {
    console.log(`\n=== ${div} ===`)
    const rankings = await prisma.ranking.findMany({
      where: {
        organizationId: ufc.id,
        weightClass: div as any,
        active: true
      },
      include: {
        fighter: true
      },
      orderBy: { rank: 'asc' }
    })
    
    console.log(`Found ${rankings.length} rankings`)
    
    // Check fighter attributes
    for (const r of rankings.slice(0, 3)) {
      console.log(`  ${r.fighter.firstName} ${r.fighter.lastName}:`)
      console.log(`    - fighter.active: ${r.fighter.active}`)
      console.log(`    - fighter.organizationId: ${r.fighter.organizationId}`)
      console.log(`    - fighter.gender: ${r.fighter.gender}`)
      console.log(`    - Expected orgId: ${ufc.id}`)
    }
  }
}

main().finally(() => prisma.$disconnect())