// src/services/sites.service.js
import * as repo from '../repositories/sites.repo.js'
import { computeCommunityScore, blendScores } from './votes.service.js'

// DB-level sort keys. Only `name` and `newest` are truly sorted in SQL.
// `trust` uses these as a fallback ordering for stability, then we
// re-sort in JS using the blended score (see listSites).
const SORTABLE = {
  name:   { name: 'asc' },
  newest: { createdAt: 'desc' },
  trust:  { trustScore: 'desc' }, // fallback — real sort happens in JS
}

// ─────────────────────────────────────────────────────────────
// Shape a Site row into the object the frontend expects
// ─────────────────────────────────────────────────────────────
function shapeSite(site, voteCounts = { trustworthy: 0, scam: 0, unsure: 0 }) {
  const totalVotes =
    (voteCounts.trustworthy || 0) +
    (voteCounts.scam        || 0) +
    (voteCounts.unsure      || 0)

  const communityScore = computeCommunityScore(voteCounts)
  const trustScore     = blendScores(site.trustScore, communityScore)

  return {
    id:             site.id,
    slug:           site.slug,
    name:           site.name,
    url:            site.url,
    logoUrl:        site.logoUrl,
    description:    site.description,
    status:         site.status,

    // Scores
    trustScore,            // blended editorial + community (displayed)
    editorialScore: site.trustScore,
    communityScore,
    totalVotes,

    // Referral
    referralUrl:    site.referralUrl,
    hasReferral:    site.hasReferralProgram,
    referralPct:    site.referralPercent,

    // Dates
    startedAt:      site.startedAt,
    lastTestedAt:   site.lastTestedAt,

    // Relations
    categories: (site.categories || []).map((c) => ({
      slug: c.category.slug,
      name: c.category.name,
    })),
    features: (site.features || []).map((f) => ({
      slug: f.feature.slug,
      name: f.feature.name,
    })),
    offers: (site.offers || []).map((o) => ({
      coin:           o.coin.symbol,
      coinName:       o.coin.name,
      payment:        o.paymentMethod.slug,
      paymentName:    o.paymentMethod.name,
      minWithdrawal:  o.minimumWithdrawal,
      claimInterval:  o.claimInterval,
      payoutSpeed:    o.payoutSpeed,
      notes:          o.notes,
    })),

    // Vote breakdown for the current page
    voteCounts,
    reviewData: site.reviewData ?? null,    // ← add this
  }
}

// ─────────────────────────────────────────────────────────────
// Sort by blended trust score
// - Higher score first
// - null scores fall to the end (alphabetical among themselves)
// - Tie-break by offer count, then name
// ─────────────────────────────────────────────────────────────
function compareByTrust(a, b) {
  const aScore = a.trustScore
  const bScore = b.trustScore

  if (aScore == null && bScore == null) return a.name.localeCompare(b.name)
  if (aScore == null) return 1
  if (bScore == null) return -1
  if (bScore !== aScore) return bScore - aScore

  const aOffers = a.offers?.length ?? 0
  const bOffers = b.offers?.length ?? 0
  if (bOffers !== aOffers) return bOffers - aOffers

  return a.name.localeCompare(b.name)
}

// ─────────────────────────────────────────────────────────────
// Build the Prisma `where` clause from query params
// ─────────────────────────────────────────────────────────────
function buildWhere(query) {
  const where = {}

  // Search — matches name, description or URL (case-insensitive)
  if (query.q && String(query.q).trim()) {
    const q = String(query.q).trim()
    where.OR = [
      { name:        { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { url:         { contains: q, mode: 'insensitive' } },
    ]
  }

  // Status
  if (query.status) {
    where.status = query.status
  }

  // Category (via relation)
  if (query.category) {
    where.categories = { some: { category: { slug: query.category } } }
  }

  // Feature (via relation)
  if (query.feature) {
    where.features = { some: { feature: { slug: query.feature } } }
  }

  // Coin / Payment / Claim interval (all live on SiteOffer)
  if (query.coin || query.payment || query.max_interval) {
    const offerFilter = {}
    if (query.coin)    offerFilter.coin          = { symbol: query.coin }
    if (query.payment) offerFilter.paymentMethod = { slug:   query.payment }

    if (query.max_interval) {
      const interval = parseInt(query.max_interval, 10)
      if (Number.isFinite(interval) && interval > 0) {
        offerFilter.claimInterval = { lte: interval }
      }
    }

    where.offers = { some: { ...offerFilter, isActive: true } }
  }

  return where
}

// ─────────────────────────────────────────────────────────────
// List sites with filters, sort, and pagination
// ─────────────────────────────────────────────────────────────
export async function listSites(query) {
  const page    = Math.max(1, parseInt(query.page, 10) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 25))

  const where    = buildWhere(query)
  const sortKey  = query.sort || 'trust'
  const isTrust  = sortKey === 'trust'
  const orderBy  = SORTABLE[sortKey] || SORTABLE.trust

  // ── Trust sort: fetch, shape, sort by blended score, then paginate ──
  if (isTrust) {
    const { rows, voteBreakdown } = await repo.findSites({
      where,
      orderBy,
      skip: 0,
      take: 2000, // upper bound; fine for directories under ~2000 sites
    })

    const shaped = rows.map((s) =>
      shapeSite(
        s,
        voteBreakdown[s.id] || { trustworthy: 0, scam: 0, unsure: 0 }
      )
    )

    shaped.sort(compareByTrust)

    const total = shaped.length
    const start = (page - 1) * perPage
    const pageSlice = shaped.slice(start, start + perPage)

    return {
      data: pageSlice,
      meta: {
        page,
        per_page:    perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    }
  }

  // ── Other sorts: use DB-level pagination ──
  const skip = (page - 1) * perPage
  const { rows, total, voteBreakdown } = await repo.findSites({
    where,
    orderBy,
    skip,
    take: perPage,
  })

  return {
    data: rows.map((s) =>
      shapeSite(
        s,
        voteBreakdown[s.id] || { trustworthy: 0, scam: 0, unsure: 0 }
      )
    ),
    meta: {
      page,
      per_page:    perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  }
}

// ─────────────────────────────────────────────────────────────
// Single site by slug
// ─────────────────────────────────────────────────────────────
export async function getSiteBySlug(slug) {
  const site = await repo.findSiteBySlug(slug)
  if (!site) return null

  const counts = { trustworthy: 0, scam: 0, unsure: 0 }
  for (const v of site.votes || []) {
    if (counts[v.vote] != null) counts[v.vote]++
  }

  return shapeSite(site, counts)
}
