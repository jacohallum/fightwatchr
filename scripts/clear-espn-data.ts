import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearESPNData() {
  console.log('🗑️  Starting data cleanup...\n')
  
  try {
    // Delete in order: fights -> events -> fighters (due to foreign keys)
    
    console.log('1️⃣  Deleting fights...')
    const fightsDeleted = await prisma.fight.deleteMany({})
    console.log(`   ✅ Deleted ${fightsDeleted.count} fights\n`)
    
    console.log('2️⃣  Deleting events...')
    const eventsDeleted = await prisma.event.deleteMany({})
    console.log(`   ✅ Deleted ${eventsDeleted.count} events\n`)
    
    console.log('3️⃣  Deleting fighters...')
    const fightersDeleted = await prisma.fighter.deleteMany({})
    console.log(`   ✅ Deleted ${fightersDeleted.count} fighters\n`)
    
    console.log('4️⃣  Deleting rankings...')
    const rankingsDeleted = await prisma.ranking.deleteMany({})
    console.log(`   ✅ Deleted ${rankingsDeleted.count} rankings\n`)
    
    console.log('🎉 Cleanup complete!')
    console.log('   Ready for fresh ESPN import')
    console.log('\nNext step: Run the mass import')
    console.log('   npx tsx scripts/mass-import.ts')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearESPNData()