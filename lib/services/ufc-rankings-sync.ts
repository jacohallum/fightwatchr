// lib\services\ufc-rankings-sync.ts
import { prisma } from '@/lib/prisma'
import { WeightClass } from '@prisma/client'
import * as cheerio from 'cheerio'

interface RankingData {
  weightClass: WeightClass
  rank: number
  fighterName: string
}

const WEIGHT_CLASS_MAP: Record<string, WeightClass> = {
  'pound-for-pound': null as any, // Skip P4P for now
  'flyweight': WeightClass.FLYWEIGHT,
  'bantamweight': WeightClass.BANTAMWEIGHT,
  'featherweight': WeightClass.FEATHERWEIGHT,
  'lightweight': WeightClass.LIGHTWEIGHT,
  'welterweight': WeightClass.WELTERWEIGHT,
  'middleweight': WeightClass.MIDDLEWEIGHT,
  'light heavyweight': WeightClass.LIGHT_HEAVYWEIGHT,
  'heavyweight': WeightClass.HEAVYWEIGHT,
  'strawweight': WeightClass.STRAWWEIGHT,
}

function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacritics (accents)
    .replace(/ł/g, 'l')                   // Polish ł
    .replace(/Ł/g, 'L')                   // Polish Ł
    .replace(/ø/g, 'o')                   // Nordic ø
    .replace(/Ø/g, 'O')                   // Nordic Ø
    .replace(/æ/g, 'ae')                  // Nordic æ
    .replace(/Æ/g, 'AE')                  // Nordic Æ
    .replace(/ß/g, 'ss')                  // German ß
    .replace(/ð/g, 'd')                   // Icelandic ð
    .replace(/þ/g, 'th')                  // Icelandic þ
    .replace(/ç/g, 'c')                   // Cedilla
    .replace(/ñ/g, 'n')                   // Spanish ñ
    .replace(/[''`´']/g, '')              // Remove apostrophes (all variants)
    .replace(/[""„"]/g, '')               // Remove quotes
    .replace(/-/g, ' ')                   // Replace hyphens with spaces
    .replace(/\./g, '')                   // Remove periods (Jr. -> Jr)
    .replace(/,/g, '')                    // Remove commas
    .replace(/\bjr\b/gi, '')              // Remove "Jr"
    .replace(/\bsr\b/gi, '')              // Remove "Sr"
    .replace(/\biii\b/gi, '')             // Remove "III"
    .replace(/\bii\b/gi, '')              // Remove "II"
    .replace(/\s+/g, ' ')                 // Collapse multiple spaces
    .toLowerCase()
    .trim()
}

async function findFighterByName(name: string, organizationId: string): Promise<string | null> {
  const cleanName = name.trim().replace(/\s+/g, ' ')
  const normalizedSearchName = normalizeString(cleanName)
  const parts = cleanName.split(' ')
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')

  // Try exact match first
  let fighter = await prisma.fighter.findFirst({
    where: {
      organizationId,
      OR: [
        { 
          firstName: { equals: firstName, mode: 'insensitive' },
          lastName: { equals: lastName, mode: 'insensitive' }
        }
      ]
    }
  })
  
  if (fighter) return fighter.id
  
  // Try fuzzy match - get all fighters and normalize for comparison
    const allFighters = await prisma.fighter.findMany({
    where: { organizationId }
    })

    // Debug: show potential matches for troublesome names
    if (cleanName.includes('Błachowicz') || cleanName.includes('Blachowicz')) {
        // Search by first name only to see all "Jan" fighters
        const candidates = allFighters.filter(f => 
            normalizeString(f.firstName) === normalizeString(firstName)
        )
    }

    for (const f of allFighters) {
        const dbFullName = normalizeString(`${f.firstName} ${f.lastName}`)
        const dbLastName = normalizeString(f.lastName)
        const searchLastName = normalizeString(lastName)
        
        // Full name match
        if (dbFullName === normalizedSearchName) {
            return f.id
        }
        
        // Handle hyphens vs spaces (e.g., "Cortes-Acosta" vs "Cortes Acosta")
        const dbFullNameNoHyphen = dbFullName.replace(/-/g, ' ')
        const searchNameNoHyphen = normalizedSearchName.replace(/-/g, ' ')
        if (dbFullNameNoHyphen === searchNameNoHyphen) {
            return f.id
        }
        
        // Last name match + first name starts with
        if (dbLastName === searchLastName && 
            normalizeString(f.firstName).startsWith(normalizeString(firstName))) {
            return f.id
        }
        
        // Last name partial match (handles "Błachowicz" stored as "Blachowicz")
        if (dbLastName.replace(/-/g, ' ') === searchLastName.replace(/-/g, ' ') &&
            normalizeString(f.firstName) === normalizeString(firstName)) {
            return f.id
        }
    }

  return null
}

export async function syncUFCRankings(): Promise<{ success: boolean; rankingsProcessed: number; error?: string }> {
  try {
    console.log('🥊 Starting UFC rankings sync...\n')
    
    const ufc = await prisma.organization.findFirst({
      where: { shortName: 'UFC' }
    })
    
    if (!ufc) {
      throw new Error('UFC organization not found')
    }
    
    // Fetch rankings page
    const response = await fetch('https://www.ufc.com/rankings')
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const rankings: RankingData[] = []
    
    // Parse each division
    $('.view-grouping').each((_, divisionEl) => {
        const divisionTitle = $(divisionEl).find('.view-grouping-header').text().trim().toLowerCase()
        
        // Extract weight class from title
        let weightClass: WeightClass | null = null
        for (const [key, value] of Object.entries(WEIGHT_CLASS_MAP)) {
            if (divisionTitle.includes(key)) {
            weightClass = value
            break
            }
        }
        
        if (!weightClass) return // Skip P4P or unknown divisions       
        
        // Get all fighter links in this division
        const fighterLinks = $(divisionEl).find('a').toArray()
        
        let rank = 0
        let championFound = false
        
        for (const link of fighterLinks) {
            const fighterName = $(link).text().trim()       
            // Skip empty or very short text (likely not a fighter name)
            if (!fighterName || fighterName.length < 3) continue
            
            // Skip navigation/UI elements
            const lowerName = fighterName.toLowerCase()
            if (lowerName === 'view' || 
                lowerName === 'view all' ||
                lowerName === 'all' ||
                lowerName.includes('view all') ||
                lowerName.includes('ranking')) continue
            
            if (!championFound) {
            // First valid fighter is the champion
            rankings.push({ weightClass, rank: 0, fighterName })
            championFound = true
            rank = 1
            } else if (rank <= 15) {
            // Next 15 are ranked fighters
            rankings.push({ weightClass, rank, fighterName })
            rank++
            } else {
            break // Stop after top 15
            }
        }
    })
    
    // Delete all existing active rankings instead of deactivating
    await prisma.ranking.deleteMany({
    where: { organizationId: ufc.id, active: true }
    })
    
    let processed = 0
    let notFound = 0
    
    // Create new rankings
    for (const ranking of rankings) {
      const fighterId = await findFighterByName(ranking.fighterName, ufc.id)
      
      if (fighterId) {
        await prisma.ranking.upsert({
          where: {
            fighterId_organizationId_weightClass_active: {
              fighterId,
              organizationId: ufc.id,
              weightClass: ranking.weightClass,
              active: true
            }
          },
          update: {
            rank: ranking.rank,
            effectiveDate: new Date()
          },
          create: {
            fighterId,
            organizationId: ufc.id,
            weightClass: ranking.weightClass,
            rank: ranking.rank,
            active: true
          }
        })
        processed++
      } else {
        notFound++
      }
    }
    
    console.log(`\n✅ Rankings sync complete!`)
    console.log(`   Processed: ${processed}`)
    console.log(`   Not Found: ${notFound}`)
    
    return { success: true, rankingsProcessed: processed }
  } catch (error) {
    console.error('❌ Rankings sync error:', error)
    return { success: false, rankingsProcessed: 0, error: String(error) }
  }
}