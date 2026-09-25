// prisma/split-sites.js
// One-time script: splits the monolithic sites.json into per-category files.
// Run once, then delete (or keep for future splits).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = join(__dirname, 'data', 'sites.json')
const OUT_DIR = join(__dirname, 'data', 'sites')

// Map every category slug to the top-level bucket it belongs in.
// If a site's first category isn't here, it goes to "uncategorized".
const CATEGORY_TO_BUCKET = {
  // crypto tree
  'crypto-earn': 'crypto',
  'faucets': 'crypto',
  'faucets-btc': 'crypto',
  'faucets-eth': 'crypto',
  'faucets-ltc': 'crypto',
  'faucets-doge': 'crypto',
  'faucets-usdt': 'crypto',
  'faucets-other': 'crypto',
  'ptc': 'crypto',
  'offerwalls': 'crypto',
  'shortlinks': 'crypto',
  'mining': 'crypto',
  'airdrops': 'crypto',
  'learn-earn': 'crypto',

  // surveys tree
  'surveys': 'surveys',
  'surveys-academic': 'surveys',
  'surveys-panels': 'surveys',
  'surveys-apps': 'surveys',
  'surveys-gpt': 'surveys',

  // cashback tree
  'cashback': 'cashback',
  'cashback-online': 'cashback',
  'cashback-instore': 'cashback',
  'cashback-receipt': 'cashback',
  'cashback-grocery': 'cashback',
  'cashback-giftcard': 'cashback',
  'cashback-fuel': 'cashback',
  'cashback-travel': 'cashback',
  'cashback-coupons': 'cashback',
  'cashback-international': 'cashback',

  // freelancing tree
  'freelancing': 'freelancing',
  'freelancing-general': 'freelancing',
  'freelancing-premium': 'freelancing',
  'freelancing-design': 'freelancing',
  'freelancing-dev': 'freelancing',
  'freelancing-writing': 'freelancing',
  'freelancing-marketing': 'freelancing',
  'freelancing-va': 'freelancing',
  'freelancing-tutoring': 'freelancing',
  'freelancing-local': 'freelancing',
  'freelancing-remote': 'freelancing',

  // captcha tree
  'captcha': 'captcha',
  'captcha-solving': 'captcha',
  'captcha-microtasks': 'captcha',
  'captcha-ai': 'captcha',
  'captcha-audio': 'captcha',
  'captcha-testing': 'captcha',
  'captcha-closed': 'captcha',

  // games (top-level now)
  'games': 'games',

  // selling tree
  'selling': 'selling',
  'selling-general': 'selling',
  'selling-fashion': 'selling',
  'selling-handmade': 'selling',
  'selling-digital': 'selling',
  'selling-pod': 'selling',
  'selling-collectibles': 'selling',
  'selling-luxury': 'selling',
  'selling-local': 'selling',
  'selling-stores': 'selling',

  // content tree
  'content': 'content',
  'content-video': 'content',
  'content-livestream': 'content',
  'content-writing': 'content',
  'content-newsletters': 'content',
  'content-podcasts': 'content',
  'content-fans': 'content',
  'content-courses': 'content',
  'content-digital': 'content',
  'content-merch': 'content',

  // app-offers tree
  'app-offers': 'app-offers',
  'app-offers-installs': 'app-offers',
  'app-offers-games': 'app-offers',
  'app-offers-financial': 'app-offers',
  'app-offers-trials': 'app-offers',
  'app-offers-walls': 'app-offers',

  // videos tree
  'videos': 'videos',
  'videos-direct': 'videos',
  'videos-gpt': 'videos',
  'videos-passive': 'videos',
  'videos-mixed': 'videos',

  // misc
  'telegram': 'telegram',
  'referral-programs': 'referral-programs',
  'testnets': 'testnets',
}

function bucketFor(site) {
  const cats = site.categories || []
  if (!cats.length) return 'uncategorized'
  for (const c of cats) {
    if (CATEGORY_TO_BUCKET[c]) return CATEGORY_TO_BUCKET[c]
  }
  return 'uncategorized'
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(`❌ Source file not found: ${SOURCE}`)
    process.exit(1)
  }

  const raw = readFileSync(SOURCE, 'utf8')
  const sites = JSON.parse(raw)
  console.log(`📖 Loaded ${sites.length} sites from sites.json`)

  // Group by bucket
  const buckets = {}
  for (const site of sites) {
    const bucket = bucketFor(site)
    if (!buckets[bucket]) buckets[bucket] = []
    buckets[bucket].push(site)
  }

  // Create output directory
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  // Write each bucket
  let totalWritten = 0
  const summary = []
  for (const [bucket, list] of Object.entries(buckets).sort()) {
    const outPath = join(OUT_DIR, `${bucket}.json`)
    writeFileSync(outPath, JSON.stringify(list, null, 2), 'utf8')
    totalWritten += list.length
    summary.push(`  ${bucket.padEnd(22)} ${list.length} sites`)
  }

  console.log(`\n📦 Split into ${Object.keys(buckets).length} files:\n`)
  console.log(summary.join('\n'))
  console.log(`\n✅ Wrote ${totalWritten} sites total.`)

  if (buckets.uncategorized?.length) {
    console.log(`\n⚠️  ${buckets.uncategorized.length} sites had no recognized category.`)
    console.log(`   They're in sites/uncategorized.json — review and re-tag them.`)
  }
}

main()