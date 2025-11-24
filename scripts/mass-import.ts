import { syncESPNData } from '../lib/services/espn-sync'

async function main() {
  console.log('🚀 Starting mass ESPN import...\n')
  
  try {
    const result = await syncESPNData()
    
    if (result.success) {
      console.log('\n✅ Mass import completed successfully!')
    } else {
      console.error('\n❌ Import failed:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()