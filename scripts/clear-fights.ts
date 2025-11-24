import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearFights() {
  console.log('🗑️  Clearing all fights...')
  
  const deleted = await prisma.fight.deleteMany({})
  
  console.log(`✅ Deleted ${deleted.count} fights`)
  console.log('Events and fighters remain intact')
  console.log('Run sync again to recreate fights with correct data')
  
  await prisma.$disconnect()
}

clearFights().catch(console.error)