// src/services/sitemap.service.js
import { prisma } from '../config/db.js'

const SITE_URL = process.env.SITE_URL || 'https://earn.land.me.uk'

const STATIC_PAGES = [
  { path: '/',                     priority: '1.0', changefreq: 'daily'   },
  { path: '/crypto',               priority: '0.9', changefreq: 'daily'   },
  { path: '/blog/',                priority: '0.8', changefreq: 'weekly'  },
  { path: '/about.html',           priority: '0.5', changefreq: 'monthly' },
  { path: '/contact.html',         priority: '0.5', changefreq: 'monthly' },
  { path: '/legal.html',           priority: '0.3', changefreq: 'yearly'  },
  { path: '/blog/spot-fake-crypto-faucet.html',      priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/what-is-faucetpay.html',            priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/best-bitcoin-faucets-2026.html',    priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/faucet-trust-scores-explained.html',priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/are-crypto-faucets-legal.html',     priority: '0.7', changefreq: 'monthly' },
    { path: '/blog/paid-surveys-uk-guide.html',            priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/how-paid-surveys-work.html',            priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/are-paid-surveys-worth-it.html',        priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/why-do-surveys-screen-you-out.html',    priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/paid-survey-scams.html',                priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/survey-sites-that-pay-paypal.html',     priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/paid-surveys-and-uk-tax.html',          priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/prolific-vs-yougov.html',               priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/survey-apps-vs-research-panels.html',   priority: '0.7', changefreq: 'monthly' },
   { path: '/blog/best-cashback-sites-uk.html',              priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/how-cashback-sites-work.html',             priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/do-you-pay-tax-on-cashback-uk.html',       priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/topcashback-vs-quidco.html',               priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/best-cashback-apps-for-groceries-uk.html', priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/best-freelance-platforms-uk.html',         priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/how-to-start-freelancing-uk.html',         priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/freelance-tax-uk.html',                    priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/upwork-vs-fiverr.html',                    priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/how-to-spot-a-freelance-scam.html',        priority: '0.7', changefreq: 'monthly' },
]

// 15-minute cache
const CACHE_TTL = 15 * 60 * 1000
let cache = null
let cacheTime = 0

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`<loc>${escapeXml(loc)}</loc>`]
  if (lastmod)    parts.push(`<lastmod>${lastmod}</lastmod>`)
  if (changefreq) parts.push(`<changefreq>${changefreq}</changefreq>`)
  if (priority)   parts.push(`<priority>${priority}</priority>`)
  return `  <url>\n    ${parts.join('\n    ')}\n  </url>`
}

function toDate(d) {
  if (!d) return null
  return new Date(d).toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function generateSitemap() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL) return cache

  // Fetch everything we need in parallel
  const [categories, sites] = await Promise.all([
    prisma.category.findMany({
      select: { slug: true, name: true },
    }),
    prisma.site.findMany({
      where: {
        // Exclude blacklisted/defunct — no point telling Google about dead pages
        status: { in: ['active', 'under_review', 'paused'] },
      },
      select: {
        slug: true,
        status: true,
        trustScore: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const entries = []

  // 1. Static pages
  for (const p of STATIC_PAGES) {
    entries.push(urlEntry({
      loc: SITE_URL + p.path,
      changefreq: p.changefreq,
      priority: p.priority,
    }))
  }

  // 2. Category / earn pages
  // Exclude crypto-earn (the parent, which is /crypto handled as static)
  const excludeSlugs = new Set(['crypto-earn'])
  for (const c of categories) {
    if (excludeSlugs.has(c.slug)) continue

    // Priority tiers:
    //   Top-level hubs (faucets, surveys, cashback, freelancing, captcha, etc.)
    //   Subcategories lower priority
    const isTopLevel = !c.slug.includes('-') || [
      'faucets', 'surveys', 'cashback', 'freelancing', 'captcha', 'selling',
      'content', 'app-offers', 'videos', 'referral-programs', 'testnets',
      'games', 'ptc', 'offerwalls', 'mining', 'telegram',
    ].includes(c.slug)

    entries.push(urlEntry({
      loc: SITE_URL + '/earn/' + c.slug,
      changefreq: 'weekly',
      priority: isTopLevel ? '0.8' : '0.6',
    }))
  }

  // 3. Site detail pages
  for (const s of sites) {
    // Priority based on status:
    //   active + high trust score → higher priority
    let priority = '0.5'
    if (s.status === 'active') {
      if (s.trustScore != null && s.trustScore >= 80) priority = '0.8'
      else if (s.trustScore != null && s.trustScore >= 60) priority = '0.7'
      else priority = '0.6'
    } else if (s.status === 'under_review') {
      priority = '0.5'
    } else if (s.status === 'paused') {
      priority = '0.4'
    }

    entries.push(urlEntry({
      loc: SITE_URL + '/site/' + s.slug,
      lastmod: toDate(s.updatedAt),
      changefreq: s.status === 'active' ? 'weekly' : 'monthly',
      priority,
    }))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  cache = xml
  cacheTime = now
  return xml
}

export function invalidateSitemapCache() {
  cache = null
  cacheTime = 0
}
