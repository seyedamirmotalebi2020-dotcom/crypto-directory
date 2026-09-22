// prisma/seed.js
import { prisma } from '../src/config/db.js'

// ---------- Data ----------

const categories = [
  { slug: 'crypto-earn',        name: 'Crypto Earn',           parentSlug: null,               sortOrder: 0 },

  // ── Crypto subcategories ──
  { slug: 'faucets',            name: 'Faucets',               parentSlug: 'crypto-earn',      sortOrder: 1 },
  { slug: 'faucets-btc',        name: 'BTC Faucets',           parentSlug: 'faucets',          sortOrder: 1 },
  { slug: 'faucets-eth',        name: 'ETH Faucets',           parentSlug: 'faucets',          sortOrder: 2 },
  { slug: 'faucets-ltc',        name: 'LTC Faucets',           parentSlug: 'faucets',          sortOrder: 3 },
  { slug: 'faucets-doge',       name: 'DOGE Faucets',          parentSlug: 'faucets',          sortOrder: 4 },
  { slug: 'faucets-usdt',       name: 'USDT Faucets',          parentSlug: 'faucets',          sortOrder: 5 },
  { slug: 'faucets-other',      name: 'Other Coin Faucets',    parentSlug: 'faucets',          sortOrder: 6 },
  { slug: 'ptc',                name: 'PTC',                   parentSlug: 'crypto-earn',      sortOrder: 2 },
  { slug: 'offerwalls',         name: 'Offerwalls',            parentSlug: 'crypto-earn',      sortOrder: 3 },
  { slug: 'games',              name: 'Games',                 parentSlug: 'crypto-earn',      sortOrder: 5 },
  { slug: 'shortlinks',         name: 'Shortlinks',            parentSlug: 'crypto-earn',      sortOrder: 6 },

  { slug: 'telegram',           name: 'Telegram',              parentSlug: 'crypto-earn',      sortOrder: 9 },
  { slug: 'airdrops',           name: 'Airdrops',              parentSlug: 'crypto-earn',      sortOrder: 10 },
  { slug: 'testnets',           name: 'Testnets',              parentSlug: 'crypto-earn',      sortOrder: 11 },
  { slug: 'learn-earn',         name: 'Learn & Earn',          parentSlug: 'crypto-earn',      sortOrder: 12 },
  { slug: 'mining',             name: 'Mining',                parentSlug: 'crypto-earn',      sortOrder: 13 },
  { slug: 'cashback',           name: 'Cashback',              parentSlug: 'crypto-earn',      sortOrder: 14 },
  { slug: 'referral-programs',  name: 'Referral Programs',     parentSlug: 'crypto-earn',      sortOrder: 15 },

  // ── Paid Surveys (top-level for the general hub) ──
  { slug: 'surveys',            name: 'Paid Surveys',          parentSlug: null,               sortOrder: 1 },
  { slug: 'surveys-academic',   name: 'Academic & Research',   parentSlug: 'surveys',          sortOrder: 1 },
  { slug: 'surveys-panels',     name: 'Traditional Panels',    parentSlug: 'surveys',          sortOrder: 2 },
  { slug: 'surveys-apps',       name: 'Survey Apps',           parentSlug: 'surveys',          sortOrder: 3 },
  { slug: 'surveys-gpt',        name: 'GPT with Surveys',      parentSlug: 'surveys',          sortOrder: 4 },

    // ── Cashback & Rewards (top-level) ──
  { slug: 'cashback',                 name: 'Cashback & Rewards',       parentSlug: null,       sortOrder: 2 },
  { slug: 'cashback-online',          name: 'Online Shopping Cashback', parentSlug: 'cashback', sortOrder: 1 },
  { slug: 'cashback-instore',         name: 'In-Store Cashback',        parentSlug: 'cashback', sortOrder: 2 },
  { slug: 'cashback-receipt',         name: 'Receipt Rewards',          parentSlug: 'cashback', sortOrder: 3 },
  { slug: 'cashback-grocery',         name: 'Grocery Cashback',         parentSlug: 'cashback', sortOrder: 4 },
  { slug: 'cashback-giftcard',        name: 'Gift Card Cashback',       parentSlug: 'cashback', sortOrder: 5 },
  { slug: 'cashback-fuel',            name: 'Fuel Cashback',            parentSlug: 'cashback', sortOrder: 6 },
  { slug: 'cashback-travel',          name: 'Travel Cashback',          parentSlug: 'cashback', sortOrder: 7 },
  { slug: 'cashback-coupons',         name: 'Coupons + Cashback',       parentSlug: 'cashback', sortOrder: 8 },
  { slug: 'cashback-international',   name: 'International Cashback',   parentSlug: 'cashback', sortOrder: 9 },
  
    // ── Freelancing (top-level) ──
  { slug: 'freelancing',           name: 'Freelancing',              parentSlug: null,            sortOrder: 3 },
  { slug: 'freelancing-general',   name: 'General Marketplaces',     parentSlug: 'freelancing',   sortOrder: 1 },
  { slug: 'freelancing-premium',   name: 'Premium / Vetted',         parentSlug: 'freelancing',   sortOrder: 2 },
  { slug: 'freelancing-design',    name: 'Design & Creative',        parentSlug: 'freelancing',   sortOrder: 3 },
  { slug: 'freelancing-dev',       name: 'Programming & Software',   parentSlug: 'freelancing',   sortOrder: 4 },
  { slug: 'freelancing-writing',   name: 'Writing & Translation',    parentSlug: 'freelancing',   sortOrder: 5 },
  { slug: 'freelancing-marketing', name: 'Marketing & SEO',          parentSlug: 'freelancing',   sortOrder: 6 },
  { slug: 'freelancing-va',        name: 'Virtual Assistants',       parentSlug: 'freelancing',   sortOrder: 7 },
  { slug: 'freelancing-tutoring',  name: 'Tutoring & Teaching',      parentSlug: 'freelancing',   sortOrder: 8 },
  { slug: 'freelancing-local',     name: 'Local / Task Work',        parentSlug: 'freelancing',   sortOrder: 9 },
  { slug: 'freelancing-remote',    name: 'Remote Jobs',              parentSlug: 'freelancing',   sortOrder: 10 },

    // ── CAPTCHA & Micro-Tasks (top-level) ──
  { slug: 'captcha',              name: 'CAPTCHA & Micro-Tasks',  parentSlug: null,         sortOrder: 4 },
  { slug: 'captcha-solving',      name: 'CAPTCHA Solving',        parentSlug: 'captcha',    sortOrder: 1 },
  { slug: 'captcha-microtasks',   name: 'Simple Micro-Tasks',     parentSlug: 'captcha',    sortOrder: 2 },
  { slug: 'captcha-ai',           name: 'AI & Data Annotation',   parentSlug: 'captcha',    sortOrder: 3 },
  { slug: 'captcha-audio',        name: 'Audio & Language Tasks', parentSlug: 'captcha',    sortOrder: 4 },
  { slug: 'captcha-testing',      name: 'App & Website Testing',  parentSlug: 'captcha',    sortOrder: 5 },
  { slug: 'captcha-closed',       name: 'Closed Platforms',       parentSlug: 'captcha',    sortOrder: 6 },
    // ── Selling & Reselling (top-level) ──
  { slug: 'selling',                name: 'Selling & Reselling',    parentSlug: null,        sortOrder: 5 },
  { slug: 'selling-general',        name: 'General Marketplaces',   parentSlug: 'selling',   sortOrder: 1 },
  { slug: 'selling-fashion',        name: 'Clothing & Fashion',     parentSlug: 'selling',   sortOrder: 2 },
  { slug: 'selling-handmade',       name: 'Handmade & Crafts',      parentSlug: 'selling',   sortOrder: 3 },
  { slug: 'selling-digital',        name: 'Digital Products',       parentSlug: 'selling',   sortOrder: 4 },
  { slug: 'selling-pod',            name: 'Print-on-Demand',        parentSlug: 'selling',   sortOrder: 5 },
  { slug: 'selling-collectibles',   name: 'Collectibles & Sneakers', parentSlug: 'selling',  sortOrder: 6 },
  { slug: 'selling-luxury',         name: 'Luxury Resale',          parentSlug: 'selling',   sortOrder: 7 },
  { slug: 'selling-local',          name: 'Local Classifieds',      parentSlug: 'selling',   sortOrder: 8 },
  { slug: 'selling-stores',         name: 'Build Your Own Store',   parentSlug: 'selling',   sortOrder: 9 },
    // ── Content Creation (top-level) ──
  { slug: 'content',                name: 'Content Creation',        parentSlug: null,        sortOrder: 6 },
  { slug: 'content-video',          name: 'Video Creation',          parentSlug: 'content',   sortOrder: 1 },
  { slug: 'content-livestream',     name: 'Gaming & Livestreaming',  parentSlug: 'content',   sortOrder: 2 },
  { slug: 'content-writing',        name: 'Writing & Blogging',      parentSlug: 'content',   sortOrder: 3 },
  { slug: 'content-newsletters',    name: 'Newsletters',             parentSlug: 'content',   sortOrder: 4 },
  { slug: 'content-podcasts',       name: 'Podcasts',                parentSlug: 'content',   sortOrder: 5 },
  { slug: 'content-fans',           name: 'Fan Support & Memberships', parentSlug: 'content', sortOrder: 6 },
  { slug: 'content-courses',        name: 'Courses & Education',     parentSlug: 'content',   sortOrder: 7 },
  { slug: 'content-digital',        name: 'Digital Creator Products', parentSlug: 'content',  sortOrder: 8 },
  { slug: 'content-merch',          name: 'Creator Merch',           parentSlug: 'content',   sortOrder: 9 },
    // ── App Offers (top-level, previously nested under crypto) ──
  { slug: 'app-offers',             name: 'App Offers',            parentSlug: null,          sortOrder: 7 },
  { slug: 'app-offers-installs',    name: 'Simple App Installs',   parentSlug: 'app-offers',  sortOrder: 1 },
  { slug: 'app-offers-games',       name: 'Game Offers',           parentSlug: 'app-offers',  sortOrder: 2 },
  { slug: 'app-offers-financial',   name: 'Financial/Service',     parentSlug: 'app-offers',  sortOrder: 3 },
  { slug: 'app-offers-trials',      name: 'Shopping & Trials',     parentSlug: 'app-offers',  sortOrder: 4 },
  { slug: 'app-offers-walls',       name: 'Offerwalls',            parentSlug: 'app-offers',  sortOrder: 5 },
    // ── Watch-to-Earn (top-level) ──
  { slug: 'videos',              name: 'Watch-to-Earn',          parentSlug: null,         sortOrder: 8 },
  { slug: 'videos-direct',       name: 'Direct Video Rewards',   parentSlug: 'videos',     sortOrder: 1 },
  { slug: 'videos-gpt',          name: 'Video + GPT Platforms',  parentSlug: 'videos',     sortOrder: 2 },
  { slug: 'videos-passive',      name: 'Passive Media Research', parentSlug: 'videos',     sortOrder: 3 },
  { slug: 'videos-mixed',        name: 'Mixed Platforms',        parentSlug: 'videos',     sortOrder: 4 },
]




 const coins = [
  { symbol: 'BTC',  name: 'Bitcoin',       sortOrder: 1 },
  { symbol: 'ETH',  name: 'Ethereum',      sortOrder: 2 },
  { symbol: 'USDT', name: 'Tether',        sortOrder: 3 },
  { symbol: 'USDC', name: 'USD Coin',      sortOrder: 4 },
  { symbol: 'LTC',  name: 'Litecoin',      sortOrder: 5 },
  { symbol: 'DOGE', name: 'Dogecoin',      sortOrder: 6 },
  { symbol: 'TRX',  name: 'Tron',          sortOrder: 7 },
  { symbol: 'BNB',  name: 'BNB',           sortOrder: 8 },
  { symbol: 'SOL',  name: 'Solana',        sortOrder: 9 },
  { symbol: 'MATIC',name: 'Polygon',       sortOrder: 10 },
  { symbol: 'XRP',  name: 'XRP',           sortOrder: 11 },
  { symbol: 'ADA',  name: 'Cardano',       sortOrder: 12 },
  { symbol: 'DASH', name: 'Dash',          sortOrder: 13 },
  { symbol: 'BCH',  name: 'Bitcoin Cash',  sortOrder: 14 },
  { symbol: 'SHIB', name: 'Shiba Inu',     sortOrder: 15 },
  { symbol: 'PEPE', name: 'Pepe',          sortOrder: 16 },
  { symbol: 'BONK', name: 'Bonk',          sortOrder: 17 },
  // added for later batches
  { symbol: 'DGB',  name: 'DigiByte',      sortOrder: 18 },
  { symbol: 'ZEC',  name: 'Zcash',         sortOrder: 19 },
  { symbol: 'TON',  name: 'Toncoin',       sortOrder: 20 },
  { symbol: 'FEY',  name: 'Feyorra',       sortOrder: 21 },
  { symbol: 'XLM',  name: 'Stellar',       sortOrder: 22 },
  { symbol: 'TRP',  name: 'Trump',       sortOrder: 23 },
]


const paymentMethods = [
  { slug: 'faucetpay',      name: 'FaucetPay' },
  { slug: 'direct-wallet',  name: 'Direct Wallet' },
  { slug: 'binance-pay',    name: 'Binance Pay' },
  { slug: 'coinbase',       name: 'Coinbase' },
  { slug: 'metamask',       name: 'MetaMask' },
  { slug: 'trust-wallet',   name: 'Trust Wallet' },
  { slug: 'airtm',          name: 'Airtm' },
  { slug: 'payeer',         name: 'Payeer' },
  { slug: 'skrill',         name: 'Skrill' },
  { slug: 'paypal',         name: 'PayPal' },
  { slug: 'gift-card',      name: 'Gift Card' },
  { slug: 'bank-transfer',  name: 'Bank Transfer' },
  { slug: 'payoneer',       name: 'Payoneer' },
  { slug: 'wise',           name: 'Wise' },
];

const features = [
  { slug: 'offerwall',    name: 'Offerwall' },
  { slug: 'ptc-ads',      name: 'PTC Ads' },
  { slug: 'games',        name: 'Games' },
  { slug: 'telegram',     name: 'Telegram Bot' },
  { slug: 'shortlinks',   name: 'Shortlinks' },
  { slug: 'videos',       name: 'Videos' },
  { slug: 'surveys',      name: 'Surveys' },
  { slug: 'app-offers',   name: 'App Offers' },
  { slug: 'referral',     name: 'Referral Program' },
  { slug: 'autofaucet',   name: 'Auto Faucet' },
  { slug: 'lottery',      name: 'Lottery' },
  { slug: 'staking',      name: 'Staking' },
  { slug: 'wheel',        name: 'Lucky Wheel' },
  { slug: 'chest',        name: 'Lucky Chest' },
  { slug: 'daily-bonus',  name: 'Daily Bonus' },
  { slug: 'achievements', name: 'Achievements' },
  { slug: 'microtasks',   name: 'Micro-Tasks' },
  { slug: 'cashback',     name: 'Cashback' },
  { slug: 'freelancing',  name: 'Freelancing' },
];
// ---------- Seed ----------

async function seedCategories() {
  // First pass: create/update all categories with parentId = null
  const bySlug = {}

  for (const cat of categories) {
    const row = await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder },
    })
    bySlug[cat.slug] = row
  }

  // Second pass: wire up parents (now that all rows exist)
  for (const cat of categories) {
    if (!cat.parentSlug) continue
    const parent = bySlug[cat.parentSlug]
    if (!parent) {
      console.warn(`⚠️  Parent "${cat.parentSlug}" not found for "${cat.slug}"`)
      continue
    }
    await prisma.category.update({
      where: { slug: cat.slug },
      data:  { parentId: parent.id },
    })
  }

  console.log(`✅ Categories: ${categories.length} seeded`)
}

async function seedCoins() {
  for (const coin of coins) {
    await prisma.coin.upsert({
      where:  { symbol: coin.symbol },
      update: { name: coin.name, sortOrder: coin.sortOrder },
      create: coin,
    })
  }
  console.log(`✅ Coins: ${coins.length} seeded`)
}

async function seedPaymentMethods() {
  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where:  { slug: pm.slug },
      update: { name: pm.name },
      create: pm,
    })
  }
  console.log(`✅ Payment methods: ${paymentMethods.length} seeded`)
}

async function seedFeatures() {
  for (const f of features) {
    await prisma.feature.upsert({
      where:  { slug: f.slug },
      update: { name: f.name },
      create: f,
    })
  }
  console.log(`✅ Features: ${features.length} seeded`)
}

async function main() {
  console.log('🌱 Seeding database...\n')
  await seedCategories()
  await seedCoins()
  await seedPaymentMethods()
  await seedFeatures()
  console.log('\n🎉 Done.')
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })