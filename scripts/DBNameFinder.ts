// scripts\DBNameFinder.ts
import { prisma } from '../lib/prisma'

function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacritics (accents)
    .replace(/ł/g, 'l')                  // Polish ł
    .replace(/Ł/g, 'L')                  // Polish Ł
    .replace(/ø/g, 'o')                  // Nordic ø
    .replace(/Ø/g, 'O')                  // Nordic Ø
    .replace(/æ/g, 'ae')                 // Nordic æ
    .replace(/Æ/g, 'AE')                 // Nordic Æ
    .replace(/ß/g, 'ss')                 // German ß
    .replace(/ð/g, 'd')                  // Icelandic ð
    .replace(/þ/g, 'th')                 // Icelandic þ
    .replace(/ç/g, 'c')                  // Cedilla
    .replace(/ñ/g, 'n')                  // Spanish ñ
    .replace(/['’`´]/g, '')              // All apostrophe / quote variants you care about
    .replace(/[""„"]/g, '')              // Remove quotes
    .replace(/-/g, ' ')                  // Replace hyphens with spaces
    .replace(/\./g, '')                  // Remove periods (Jr. -> Jr)
    .replace(/,/g, '')                   // Remove commas
    .replace(/\bjr\b/gi, '')             // Remove "Jr"
    .replace(/\bsr\b/gi, '')             // Remove "Sr"
    .replace(/\biii\b/gi, '')            // Remove "III"
    .replace(/\bii\b/gi, '')             // Remove "II"
    .replace(/\s+/g, ' ')                // Collapse multiple spaces
    .toLowerCase()
    .trim()
}

async function findFighter(searchTerm: string) {
  console.log(`\n🔍 Searching for: "${searchTerm}"`)
  console.log(`   Normalized: "${normalizeString(searchTerm)}"`)
  
  // Character analysis for debugging apostrophes
  if (searchTerm.includes("'") || searchTerm.includes("'") || searchTerm.includes("`")) {
    console.log(`\n🔬 Character Analysis:`)
    for (let i = 0; i < searchTerm.length; i++) {
      const char = searchTerm[i]
      const code = searchTerm.charCodeAt(i)
      if ([39, 96, 180, 8216, 8217].includes(code)) {
        console.log(`   Position ${i}: "${char}" = Unicode ${code} (0x${code.toString(16)})`)
      }
    }
  }
  
  console.log('─'.repeat(80))

  const ufc = await prisma.organization.findFirst({
    where: { shortName: 'UFC' }
  })

  if (!ufc) {
    console.error('❌ UFC organization not found')
    return
  }

  // Get all UFC fighters
  const allFighters = await prisma.fighter.findMany({
    where: { organizationId: ufc.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true
    }
  })

  console.log(`\n📊 Total UFC fighters in database: ${allFighters.length}\n`)

  // Search strategy 1: Exact match (case-insensitive)
  console.log('1️⃣  EXACT MATCHES (case-insensitive):')
  const exactMatches = allFighters.filter(f => {
    const fullName = `${f.firstName} ${f.lastName}`.toLowerCase()
    return fullName === searchTerm.toLowerCase()
  })
  
  if (exactMatches.length > 0) {
    exactMatches.forEach(f => {
      console.log(`   ✅ "${f.firstName}" "${f.lastName}"${f.nickname ? ` ("${f.nickname}")` : ''}`)
      console.log(`      ID: ${f.id}`)
    })
  } else {
    console.log('   (none)')
  }

  // Search strategy 2: Partial match (contains)
  console.log('\n2️⃣  PARTIAL MATCHES (contains search term):')
  const partialMatches = allFighters.filter(f => {
    const fullName = `${f.firstName} ${f.lastName}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || search.includes(fullName)
  }).filter(f => !exactMatches.includes(f))
  
  if (partialMatches.length > 0) {
    partialMatches.forEach(f => {
      console.log(`   🔸 "${f.firstName}" "${f.lastName}"${f.nickname ? ` ("${f.nickname}")` : ''}`)
      console.log(`      ID: ${f.id}`)
    })
  } else {
    console.log('   (none)')
  }

  // Search strategy 3: Normalized match
  console.log('\n3️⃣  NORMALIZED MATCHES:')
  const normalizedSearch = normalizeString(searchTerm)
  const normalizedMatches = allFighters.filter(f => {
    const normalizedDb = normalizeString(`${f.firstName} ${f.lastName}`)
    return normalizedDb === normalizedSearch
  }).filter(f => !exactMatches.includes(f) && !partialMatches.includes(f))
  
  if (normalizedMatches.length > 0) {
    normalizedMatches.forEach(f => {
      const normalizedDb = normalizeString(`${f.firstName} ${f.lastName}`)
      console.log(`   ✅ "${f.firstName}" "${f.lastName}"${f.nickname ? ` ("${f.nickname}")` : ''}`)
      console.log(`      ID: ${f.id}`)
      console.log(`      Normalized DB: "${normalizedDb}"`)
      console.log(`      Normalized Search: "${normalizedSearch}"`)
    })
  } else {
    console.log('   (none)')
  }

  // Search strategy 4: Fuzzy match (last name + first initial)
  console.log('\n4️⃣  FUZZY MATCHES (last name + first initial):')
  const parts = searchTerm.trim().split(' ')
  const searchFirstName = parts[0]?.toLowerCase()
  const searchLastName = parts.slice(1).join(' ').toLowerCase()
  
  const fuzzyMatches = allFighters.filter(f => {
    if (!searchFirstName || !searchLastName) return false
    const dbFirst = f.firstName.toLowerCase()
    const dbLast = f.lastName.toLowerCase()
    return dbLast.includes(searchLastName) && dbFirst.startsWith(searchFirstName[0])
  }).filter(f => !exactMatches.includes(f) && !partialMatches.includes(f) && !normalizedMatches.includes(f))
  
  if (fuzzyMatches.length > 0) {
    fuzzyMatches.forEach(f => {
      console.log(`   🔸 "${f.firstName}" "${f.lastName}"${f.nickname ? ` ("${f.nickname}")` : ''}`)
      console.log(`      ID: ${f.id}`)
    })
  } else {
    console.log('   (none)')
  }

  // Search strategy 5: Show fighters with similar last names
  if (searchLastName) {
    console.log('\n5️⃣  SIMILAR LAST NAMES:')
    const similarLastNames = allFighters.filter(f => {
      const dbLast = f.lastName.toLowerCase()
      const normDbLast = normalizeString(f.lastName)
      const normSearchLast = normalizeString(searchLastName)
      return (
        dbLast.includes(searchLastName) || 
        searchLastName.includes(dbLast) ||
        normDbLast.includes(normSearchLast) ||
        normSearchLast.includes(normDbLast)
      )
    }).filter(f => 
      !exactMatches.includes(f) && 
      !partialMatches.includes(f) && 
      !normalizedMatches.includes(f) &&
      !fuzzyMatches.includes(f)
    ).slice(0, 10) // Limit to 10 results
    
    if (similarLastNames.length > 0) {
      similarLastNames.forEach(f => {
        console.log(`   🔹 "${f.firstName}" "${f.lastName}"${f.nickname ? ` ("${f.nickname}")` : ''}`)
        console.log(`      Normalized: "${normalizeString(f.firstName)}" "${normalizeString(f.lastName)}"`)
      })
    } else {
      console.log('   (none)')
    }
  }

  // Summary
  const totalFound = exactMatches.length + partialMatches.length + normalizedMatches.length + fuzzyMatches.length
  console.log('\n' + '─'.repeat(80))
  console.log(`\n📈 SUMMARY: Found ${totalFound} match(es)`)
  
  if (totalFound === 0) {
    console.log('\n💡 SUGGESTIONS:')
    console.log('   - Check spelling')
    console.log('   - Try just the last name')
    console.log('   - Try just the first name')
    console.log('   - Fighter might not be in the database yet')
  }
  
  console.log('')
}

// Main execution
// Join all arguments after script name (handles spaces in names)
const searchTerm = process.argv.slice(2).join(' ')

if (!searchTerm) {
  console.log('Usage: npm run find-fighter "Fighter Name"')
  console.log('Example: npm run find-fighter "Lone\'er Kavanagh"')
  console.log('   or: npm run find-fighter Lone\'er Kavanagh')
  process.exit(1)
}

findFighter(searchTerm)
  .then(() => {
    prisma.$disconnect()
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    prisma.$disconnect()
    process.exit(1)
  })