// prisma/seed-sites.js
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { prisma } from '../src/config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data', 'sites')

// Valid enum values for PayoutSpeed — must match schema.prisma
const VALID_PAYOUT_SPEEDS = new Set([
  'instant', 'hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'manual'
])

function slugify(text) {
  return String(text).toLowerCase().trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

// Load every JSON file in prisma/data/sites/ and merge them.
function loadAllSites() {
  if (!existsSync(DATA_DIR)) {
    console.error(`❌ Directory not found: ${DATA_DIR}`)
    console.error('   Run `node prisma/split-sites.js` first, or create prisma/data/sites/ manually.')
    process.exit(1)
  }

  const files = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()  // deterministic order

  if (!files.length) {
    console.error(`❌ No .json files found in ${DATA_DIR}`)
    process.exit(1)
  }

  const merged = []
  const seenSlugs = new Set()

  for (const file of files) {
    const path = join(DATA_DIR, file)
    try {
      const raw = readFileSync(path, 'utf8')
      const sites = JSON.parse(raw)
      if (!Array.isArray(sites)) {
        console.warn(`   ⚠️  ${file}: not an array, skipping`)
        continue
      }

      let loaded = 0
      let duplicates = 0

      for (const site of sites) {
        if (!site.name || !site.url) continue
        const slug = site.slug || slugify(site.name)

        if (seenSlugs.has(slug)) {
          duplicates++
          console.warn(`   ⚠️  Duplicate slug "${slug}" in ${file} — skipping`)
          continue
        }

        seenSlugs.add(slug)
        merged.push(site)
        loaded++
      }

      console.log(`   ✓ ${file.padEnd(28)} ${loaded} sites${duplicates ? ` (${duplicates} dupes skipped)` : ''}`)
    } catch (err) {
      console.error(`   ❌ ${file}: ${err.message}`)
      process.exit(1)
    }
  }

  return merged
}

async function main() {
  console.log('📖 Loading sites from prisma/data/sites/\n')
  const sites = loadAllSites()
  console.log(`\n📦 ${sites.length} total sites loaded across all files.\n`)

  // Load reference tables
  const [coins, paymentMethods, categories, features] = await Promise.all([
    prisma.coin.findMany(),
    prisma.paymentMethod.findMany(),
    prisma.category.findMany(),
    prisma.feature.findMany(),
  ])

  const coinMap = Object.fromEntries(coins.map(c => [c.symbol, c.id]))
  const pmMap   = Object.fromEntries(paymentMethods.map(p => [p.slug, p.id]))
  const catMap  = Object.fromEntries(categories.map(c => [c.slug, c.id]))
  const featMap = Object.fromEntries(features.map(f => [f.slug, f.id]))

  let created = 0, updated = 0, skipped = 0, warnings = 0

  for (const s of sites) {
    if (!s.name || !s.url) { skipped++; continue }
    const slug = s.slug || slugify(s.name)

    try {
      const existing = await prisma.site.findUnique({ where: { slug } })

      const siteData = {
        name:               s.name,
        url:                s.url,
        description:        s.description ?? null,
        logoUrl:            s.logoUrl ?? null,
        status:             s.status ?? 'under_review',
        trustScore:         s.trustScore ?? null,
        referralUrl:        s.referralUrl ?? null,
        hasReferralProgram: s.hasReferralProgram ?? false,
        referralPercent:    s.referralPercent ?? null,
        startedAt:          s.startedAt ? new Date(s.startedAt) : null,
        lastTestedAt:       s.lastTestedAt ? new Date(s.lastTestedAt) : null,
         reviewData:         s.reviewData ?? null,             // ← new line
      }

      let site
      if (existing) {
        site = await prisma.site.update({ where: { slug }, data: siteData })
        await prisma.siteCategory.deleteMany({ where: { siteId: site.id } })
        await prisma.siteFeature.deleteMany({ where: { siteId: site.id } })
        await prisma.siteOffer.deleteMany({ where: { siteId: site.id } })
        updated++
      } else {
        site = await prisma.site.create({ data: { slug, ...siteData } })
        created++
      }

      // Categories
      for (const catSlug of s.categories ?? []) {
        const catId = catMap[catSlug]
        if (!catId) {
          console.warn(`   ⚠️  ${slug}: unknown category "${catSlug}"`)
          warnings++
          continue
        }
        try {
          await prisma.siteCategory.create({ data: { siteId: site.id, categoryId: catId } })
        } catch (e) {
          if (e.code !== 'P2002') warnings++
        }
      }

      // Features
      for (const featSlug of s.features ?? []) {
        const featId = featMap[featSlug]
        if (!featId) {
          console.warn(`   ⚠️  ${slug}: unknown feature "${featSlug}"`)
          warnings++
          continue
        }
        try {
          await prisma.siteFeature.create({ data: { siteId: site.id, featureId: featId } })
        } catch (e) {
          if (e.code !== 'P2002') warnings++
        }
      }

      // Offers
      for (const o of s.offers ?? []) {
        const coinId = coinMap[o.coin]
        const pmId   = pmMap[o.payment]

        if (!coinId) {
          console.warn(`   ⚠️  ${slug}: unknown coin "${o.coin}"`)
          warnings++
          continue
        }
        if (!pmId) {
          console.warn(`   ⚠️  ${slug}: unknown payment "${o.payment}"`)
          warnings++
          continue
        }

        let speed = o.speed ?? null
        if (speed && !VALID_PAYOUT_SPEEDS.has(speed)) {
          console.warn(`   ⚠️  ${slug}: invalid payoutSpeed "${speed}" — skipping offer`)
          warnings++
          continue
        }

        try {
          await prisma.siteOffer.create({
            data: {
              siteId:            site.id,
              coinId,
              paymentMethodId:   pmId,
              minimumWithdrawal: o.min ?? null,
              claimInterval:     o.interval ?? null,
              payoutSpeed:       speed,
              notes:             o.notes ?? null,
            },
          })
        } catch (e) {
          console.warn(`   ⚠️  ${slug}: offer failed — ${e.message.slice(0, 80)}`)
          warnings++
        }
      }

      console.log(`${existing ? '🔄' : '✅'} ${s.name}`)
    } catch (err) {
      console.error(`❌ ${s.name}: ${err.message.slice(0, 120)}`)
      warnings++
      continue
    }
  }

  console.log(`\n🎉 Done. Created ${created}, updated ${updated}, skipped ${skipped}, warnings ${warnings}.`)
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
