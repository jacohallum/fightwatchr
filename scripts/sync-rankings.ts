//scripts\sync-rankings.ts
import { syncUFCRankings } from '@/lib/services/ufc-rankings-sync'

async function main() {
  await syncUFCRankings()
  process.exit(0)
}

main()