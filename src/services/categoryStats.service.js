// src/services/categoryStats.service.js
import { prisma } from '../config/db.js'

// The 12 top-level categories shown on the hub. Each maps a DB slug to a key
// the frontend uses to find the right card.
const HUB_CATEGORIES = [
  { dbSlug: 'crypto-earn',        key: 'crypto' },
  { dbSlug: 'surveys',            key: 'surveys' },
  { dbSlug: 'cashback',           key: 'cashback' },
  { dbSlug: 'freelancing',        key: 'freelancing' },
  { dbSlug: 'captcha',            key: 'captcha' },
  { dbSlug: 'games',              key: 'games' },
  { dbSlug: 'selling',            key: 'selling' },
  { dbSlug: 'content',            key: 'content' },
  { dbSlug: 'app-offers',         key: 'app-offers' },
  { dbSlug: 'videos',             key: 'videos' },
  { dbSlug: 'referral-programs',  key: 'referral-programs' },
  { dbSlug: 'testnets',           key: 'testnets' },
]

const CACHE_TTL = 60 * 1000 // 1 minute

let cache = null
let cacheTime = 0

function median(sorted) {
  if (!sorted.length) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

export async function getCategoryStats() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) return cache

  // One query for categories, one for sites. Aggregation happens in JS —
  // for ~500 sites and ~80 categories this runs in milliseconds.
  const [categories, sites] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, slug: true, parentId: true },
    }),
    prisma.site.findMany({
      select: {
        id: true,
        status: true,
        trustScore: true,
        categories: { select: { categoryId: true } },
      },
    }),
  ])

  // Build a parent → children map so we can compute subtrees fast.
  const childrenByParent = new Map()
  for (const c of categories) {
    if (c.parentId) {
      if (!childrenByParent.has(c.parentId)) childrenByParent.set(c.parentId, [])
      childrenByParent.get(c.parentId).push(c.id)
    }
  }

  // Precompute the full subtree id set for each hub category.
  const subtreeIdsBySlug = {}
  for (const hub of HUB_CATEGORIES) {
    const cat = categories.find((c) => c.slug === hub.dbSlug)
    if (!cat) {
      subtreeIdsBySlug[hub.key] = new Set()
      continue
    }
    const ids = new Set()
    const stack = [cat.id]
    while (stack.length) {
      const id = stack.pop()
      ids.add(id)
      const children = childrenByParent.get(id) || []
      for (const childId of children) stack.push(childId)
    }
    subtreeIdsBySlug[hub.key] = ids
  }

  // Precompute site → category id array once.
  const sitesWithCats = sites.map((s) => ({
    status: s.status,
    trustScore: s.trustScore,
    categoryIds: s.categories.map((c) => c.categoryId),
  }))

  // Compute stats per hub card.
  const categoriesResult = {}
  let grandTotal = 0
  let grandActive = 0
  const seenSiteIds = new Set()

  for (const hub of HUB_CATEGORIES) {
    const subtree = subtreeIdsBySlug[hub.key]
    const matching = sitesWithCats.filter((s) =>
      s.categoryIds.some((id) => subtree.has(id))
    )

    const total = matching.length
    const active = matching.filter((s) => s.status === 'active').length

    // Median of site trust scores (only numeric values).
    const scores = matching
      .map((s) => s.trustScore)
      .filter((v) => typeof v === 'number')
      .sort((a, b) => a - b)
    const med = median(scores)

    // Trust score requires at least 5 sites to be meaningful.
    let trustScore = null
    if (total >= 5 && med != null) {
      const activeRatio = active / total
      trustScore = Math.round(med * 0.7 + activeRatio * 100 * 0.3)
    }

    categoriesResult[hub.key] = { total, active, trustScore }
  }

  // Grand total across all sites (deduped).
  for (const s of sitesWithCats) {
    grandTotal++
    if (s.status === 'active') grandActive++
  }

  cache = {
    categories: categoriesResult,
    totals: { sites: grandTotal, active: grandActive },
    generatedAt: new Date().toISOString(),
  }
  cacheTime = now
  return cache
}

export function invalidateCache() {
  cache = null
  cacheTime = 0
}