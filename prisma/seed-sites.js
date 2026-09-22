// prisma/seed-sites.js
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { prisma } from '../src/config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sites = JSON.parse(readFileSync(join(__dirname, 'data', 'sites.json'), 'utf8'))

const VALID_PAYOUT_SPEEDS = new Set([
  'instant', 'hourly', 'daily', 'weekly', 'biweekly', 'monthly', 'manual'
])

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

async function main() {
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
        if (!catId) { warnings++; continue }
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

      // Offers — with strict enum validation
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
          console.warn(`   ⚠️  ${slug}: offer create failed — ${e.message.slice(0, 80)}`)
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