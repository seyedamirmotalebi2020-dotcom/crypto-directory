// prisma/seed-sites.js
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { prisma } from '../src/config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data', 'sites')

const VALID_PAYOUT_SPEEDS = new Set([
  'instant', 'hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'manual',
])

function slugify(text) {
  return String(text).toLowerCase().trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

function titleCase(slug) {
  return slug
    .split(/[-_]/)
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : w)
    .join(' ')
}

function loadAllSites() {
  if (!existsSync(DATA_DIR)) {
    console.error(`❌ Directory not found: ${DATA_DIR}`)
    process.exit(1)
  }

  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort()
  if (!files.length) {
    console.error(`❌ No .json files in ${DATA_DIR}`)
    process.exit(1)
  }

  const merged = []
  const seen = new Set()
  let dupes = 0

  for (const file of files) {
    const raw = readFileSync(join(DATA_DIR, file), 'utf8')
    let sites
    try { sites = JSON.parse(raw) }
    catch (e) {
      console.error(`❌ ${file}: invalid JSON — ${e.message}`)
      process.exit(1)
    }
    if (!Array.isArray(sites)) continue

    let loaded = 0
    for (const site of sites) {
      if (!site.name || !site.url) continue
      const slug = site.slug || slugify(site.name)
      if (seen.has(slug)) { dupes++; continue }
      seen.add(slug)
      merged.push(site)
      loaded++
    }
    console.log(`   ✓ ${file.padEnd(28)} ${loaded} sites`)
  }

  if (dupes) console.log(`   (${dupes} duplicate slugs skipped)`)
  return merged
}

// ── Auto-create helpers ──

async function ensureCategory(slug, cache) {
  if (!slug) return null
  if (cache.has(slug)) return cache.get(slug)

  // Try to find existing
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) { cache.set(slug, existing.id); return existing.id }

  // Create new top-level category (parentId null; user can re-parent later)
  const created = await prisma.category.create({
    data: {
      slug,
      name: titleCase(slug),
      sortOrder: 999,
    },
  })
  console.log(`   + created category "${slug}"`)
  cache.set(slug, created.id)
  return created.id
}

async function ensureFeature(slug, cache) {
  if (!slug) return null
  if (cache.has(slug)) return cache.get(slug)

  const existing = await prisma.feature.findUnique({ where: { slug } })
  if (existing) { cache.set(slug, existing.id); return existing.id }

  const created = await prisma.feature.create({
    data: { slug, name: titleCase(slug) },
  })
  console.log(`   + created feature "${slug}"`)
  cache.set(slug, created.id)
  return created.id
}

async function ensureCoin(symbol, cache) {
  if (!symbol) return null
  const key = symbol.toUpperCase()
  if (cache.has(key)) return cache.get(key)

  const existing = await prisma.coin.findUnique({ where: { symbol: key } })
  if (existing) { cache.set(key, existing.id); return existing.id }

  // For unknown coins, use symbol as name (user can rename later)
  const created = await prisma.coin.create({
    data: {
      symbol: key,
      name: key,       // simple placeholder; e.g. "USD", "TRUMP", "FLOKI"
      sortOrder: 999,
    },
  })
  console.log(`   + created coin "${key}"`)
  cache.set(key, created.id)
  return created.id
}

// ── Main ──

async function main() {
  console.log('📖 Loading sites from prisma/data/sites/\n')
  const sites = loadAllSites()
  console.log(`\n📦 ${sites.length} total sites loaded.\n`)

  // Prime caches from DB
  const [coins, paymentMethods, categories, features] = await Promise.all([
    prisma.coin.findMany(),
    prisma.paymentMethod.findMany(),
    prisma.category.findMany(),
    prisma.feature.findMany(),
  ])

  const coinCache = new Map(coins.map(c => [c.symbol.toUpperCase(), c.id]))
  const pmCache   = new Map(paymentMethods.map(p => [p.slug, p.id]))
  const catCache  = new Map(categories.map(c => [c.slug, c.id]))
  const featCache = new Map(features.map(f => [f.slug, f.id]))

  // Track new reference rows so we can log a summary at the end
  const createdRefs = { categories: 0, features: 0, coins: 0 }

  const preCat  = catCache.size
  const preFeat = featCache.size
  const preCoin = coinCache.size

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
        reviewData:         s.reviewData ?? null,
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

      // Categories (auto-create missing)
      for (const catSlug of s.categories ?? []) {
        const catId = await ensureCategory(catSlug, catCache)
        if (!catId) continue
        try {
          await prisma.siteCategory.create({
            data: { siteId: site.id, categoryId: catId },
          })
        } catch (e) {
          if (e.code !== 'P2002') warnings++
        }
      }

      // Features (auto-create missing)
      for (const featSlug of s.features ?? []) {
        const featId = await ensureFeature(featSlug, featCache)
        if (!featId) continue
        try {
          await prisma.siteFeature.create({
            data: { siteId: site.id, featureId: featId },
          })
        } catch (e) {
          if (e.code !== 'P2002') warnings++
        }
      }

      // Offers (auto-create missing coins)
      for (const o of s.offers ?? []) {
        const coinId = await ensureCoin(o.coin, coinCache)
        const pmId   = pmCache.get(o.payment) ?? null

        if (!coinId) { warnings++; continue }
        if (!pmId) {
          console.warn(`   ⚠️  ${slug}: unknown payment "${o.payment}" — offer skipped`)
          warnings++
          continue
        }

        let speed = o.speed ?? null
        if (speed && !VALID_PAYOUT_SPEEDS.has(speed)) {
          console.warn(`   ⚠️  ${slug}: invalid payoutSpeed "${speed}" — using null`)
          speed = null
          warnings++
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
          console.warn(`   ⚠️  ${slug}: offer failed — ${e.message.slice(0, 100)}`)
          warnings++
        }
      }

      console.log(`${existing ? '🔄' : '✅'} ${s.name}`)
    } catch (err) {
      console.error(`❌ ${s.name}: ${err.message.slice(0, 200)}`)
      warnings++
      continue
    }
  }

  createdRefs.categories = catCache.size - preCat
  createdRefs.features   = featCache.size - preFeat
  createdRefs.coins      = coinCache.size - preCoin

  console.log(`\n📊 Reference rows created during seed:`)
  console.log(`   Categories: ${createdRefs.categories}`)
  console.log(`   Features:   ${createdRefs.features}`)
  console.log(`   Coins:      ${createdRefs.coins}`)

  console.log(`\n🎉 Done. Created ${created}, updated ${updated}, skipped ${skipped}, warnings ${warnings}.`)
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
