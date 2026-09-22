// public/js/earn.js
// Earning-method landing page: sets hero text, meta tags, and related tiles.
// app.js reads the category directly from the URL path, so this file only
// handles presentation.

const EARN_METHODS = {
  // ═══ Crypto (the classic section) ═══
  'crypto': {
    label: 'Crypto & Web3',
    title: 'Crypto Earning Sites',
    description: 'Faucets, PTC, offerwalls and airdrops paying BTC, ETH, LTC, DOGE and 20+ other coins. The largest category in our directory.',
    icon: 'coins',
  },
  'faucets': {
    label: 'Crypto Faucets',
    title: 'Crypto Faucets',
    description: 'Small crypto rewards for a simple click. Claim BTC, ETH, LTC, DOGE and 20+ other coins from legitimate faucets with verified payouts.',
    icon: 'faucet-drip',
  },
  'faucets-btc': {
    label: 'Bitcoin Faucets',
    title: 'Bitcoin Faucets',
    description: 'Claim free satoshis from the top BTC faucets. Every listing shows current payout evidence, minimum withdrawal and claim interval.',
    icon: 'bitcoin-sign',
  },
  'faucets-eth': {
    label: 'Ethereum Faucets',
    title: 'Ethereum Faucets',
    description: 'Earn small amounts of ETH for free from active faucets. Filtered by current payout evidence and community trust.',
    icon: 'ethereum',
  },
  'faucets-ltc': {
    label: 'Litecoin Faucets',
    title: 'Litecoin Faucets',
    description: 'Fast, low-fee LTC faucets that pay regularly. Every site checked for minimum withdrawal and payout speed.',
    icon: 'coins',
  },
  'faucets-doge': {
    label: 'Dogecoin Faucets',
    title: 'Dogecoin Faucets',
    description: 'Claim free DOGE from active faucets. Community trust scores and live payout evidence on every listing.',
    icon: 'dog',
  },
  'faucets-usdt': {
    label: 'USDT Faucets',
    title: 'USDT Faucets',
    description: 'Earn stablecoin rewards from faucets paying in Tether. Best for avoiding volatility on small balances.',
    icon: 'dollar-sign',
  },
  'faucets-other': {
    label: 'Altcoin Faucets',
    title: 'Altcoin Faucets',
    description: 'Faucets paying in TON, BNB, SOL, XRP, ADA, SHIB, PEPE, and other altcoins.',
    icon: 'shapes',
  },
  'ptc': {
    label: 'PTC Ads',
    title: 'Paid-to-Click (PTC) Sites',
    description: 'Earn by viewing short ads on a timer. Low hourly rate but zero-effort — great for stacking alongside other methods.',
    icon: 'mouse-pointer',
  },
  'offerwalls': {
    label: 'Offerwalls',
    title: 'Offerwall Sites',
    description: 'Complete app installs, game trials and product tests for larger one-off payouts.',
    icon: 'table-cells-large',
  },
  'games': {
    label: 'Play-to-Earn',
    title: 'Play-to-Earn Crypto Games',
    description: 'Earn crypto through gameplay — RPGs, bubble-popping, mining simulations, and casual games.',
    icon: 'gamepad',
  },
  'shortlinks': {
    label: 'Shortlinks',
    title: 'Shortlink Earning Sites',
    description: 'Get paid small amounts for viewing shortlinks and completing micro-tasks.',
    icon: 'link',
  },
  'videos': {
    label: 'Watch-to-Earn',
    title: 'Watch Videos, Earn Crypto',
    description: 'Get paid for watching videos and ads. Similar rate to PTC but often with lower click frequency.',
    icon: 'play-circle',
  },
  'app-offers': {
    label: 'App Offers',
    title: 'App Offer Rewards',
    description: 'Install apps, hit milestones, and receive crypto payouts. High-value tasks but slow to complete.',
    icon: 'mobile-screen',
  },
  'mining': {
    label: 'Crypto Mining',
    title: 'Cloud Mining & Mining Games',
    description: 'Cloud mining services and virtual mining games. Note: most are simulated — very few offer genuine mining.',
    icon: 'microchip',
  },
  'telegram': {
    label: 'Telegram Bots',
    title: 'Telegram Earning Bots',
    description: 'Earning bots and Mini-Apps on Telegram. Faucet claims, tasks, and game rewards — paid into FaucetPay.',
    icon: 'telegram',
  },
  'testnets': {
    label: 'Testnet Faucets',
    title: 'Testnet Faucets (Developers)',
    description: 'Free test cryptocurrency for developers building on Bitcoin, Ethereum, Polygon, Solana and other test networks. No monetary value.',
    icon: 'flask',
  },
  'referral-programs': {
    label: 'Referral Programs',
    title: 'Referral Programs',
    description: 'Sites paying commissions for referrals. Long-tail passive earning — worth using if you already have an audience.',
    icon: 'user-group',
  },

  // ═══ Paid Surveys ═══
  'surveys': {
    label: 'Paid Surveys',
    title: 'Paid Survey Sites & Research Platforms',
    description: 'The highest-paying low-effort earning category. Complete surveys and research studies for cash, PayPal, bank transfer or gift cards.',
    icon: 'clipboard-list',
  },
  'surveys-academic': {
    label: 'Academic & Research Studies',
    title: 'Academic & Research Studies',
    description: 'Higher-value paid studies from universities and companies. Pay is often $10–$100+ per study, but availability depends on your profile.',
    icon: 'microscope',
  },
  'surveys-panels': {
    label: 'Traditional Survey Panels',
    title: 'Traditional Survey Panels',
    description: 'Long-running survey companies like YouGov, Ipsos and Toluna. Frequent short surveys, points that convert to cash or vouchers.',
    icon: 'poll',
  },
  'surveys-apps': {
    label: 'Survey Apps',
    title: 'Survey Apps',
    description: 'Mobile-first survey apps with low withdrawal thresholds. Complete surveys on your phone between other tasks.',
    icon: 'mobile-screen',
  },
  'surveys-gpt': {
    label: 'GPT with Surveys',
    title: 'GPT Platforms with Surveys',
    description: 'Get-Paid-To platforms combining surveys with offerwalls, games and app offers. Higher total earning potential than pure panels.',
    icon: 'table-cells-large',
  },

  // ═══ Cashback & Rewards ═══
  'cashback': {
    label: 'Cashback & Rewards',
    title: 'Cashback & Rewards Sites',
    description: 'Get money, points, vouchers or rewards back when shopping online, in-store, buying groceries, or using participating services.',
    icon: 'cart-shopping',
  },
  'cashback-online': {
    label: 'Online Shopping Cashback',
    title: 'Online Shopping Cashback',
    description: 'Classic cashback portals — click through to a retailer, shop normally, receive a percentage back.',
    icon: 'globe',
  },
  'cashback-instore': {
    label: 'In-Store Cashback',
    title: 'In-Store Cashback & Card-Linked Rewards',
    description: 'Link a payment card, shop normally at participating retailers, and receive automatic cashback.',
    icon: 'shop',
  },
  'cashback-receipt': {
    label: 'Receipt Rewards',
    title: 'Receipt Rewards Apps',
    description: 'Photograph or scan receipts from any purchase to earn cashback, points or gift cards.',
    icon: 'receipt',
  },
  'cashback-grocery': {
    label: 'Grocery Cashback',
    title: 'Grocery Cashback Apps',
    description: 'Product-specific grocery cashback — buy eligible items at major supermarkets, upload the receipt, get cashback.',
    icon: 'basket-shopping',
  },
  'cashback-giftcard': {
    label: 'Gift Card Cashback',
    title: 'Gift Card Cashback',
    description: 'Buy retailer gift cards with instant cashback credited to your wallet, then spend the gift card normally.',
    icon: 'gift',
  },
  'cashback-fuel': {
    label: 'Fuel Cashback',
    title: 'Fuel & Petrol Cashback',
    description: 'Earn cashback on petrol and diesel purchases at participating stations, plus some restaurant and retail offers.',
    icon: 'gas-pump',
  },
  'cashback-travel': {
    label: 'Travel Cashback',
    title: 'Travel Cashback',
    description: 'Cashback on hotels, flights, package holidays and car hire.',
    icon: 'plane',
  },
  'cashback-coupons': {
    label: 'Coupons + Cashback',
    title: 'Coupons & Cashback Extensions',
    description: 'Browser extensions that combine coupon codes and cashback.',
    icon: 'tags',
  },
  'cashback-international': {
    label: 'International Cashback',
    title: 'International Cashback Platforms',
    description: 'Cashback platforms serving Asia-Pacific, Europe and other regions.',
    icon: 'earth-americas',
  },
    'freelancing': {
    label: 'Freelancing',
    title: 'Freelance & Remote Work Platforms',
    description: 'Find paid freelance projects, gigs, contracts, clients, and remote work across technology, design, writing, marketing, business, and creative skills. The highest-paying category in our directory.',
    icon: 'briefcase',
  },
  'freelancing-general': {
    label: 'General Marketplaces',
    title: 'General Freelance Marketplaces',
    description: 'Large platforms where freelancers can find work across many different professions — Upwork, Fiverr, Freelancer.com, PeoplePerHour and more.',
    icon: 'store',
  },
  'freelancing-premium': {
    label: 'Premium / Vetted Networks',
    title: 'Premium & Vetted Freelance Networks',
    description: 'Platforms with selective admission — Toptal, Codeable, Gun.io, Arc, Braintrust. Higher pay but you need to pass screening first.',
    icon: 'award',
  },
  'freelancing-design': {
    label: 'Design & Creative',
    title: 'Design & Creative Freelancing',
    description: 'Graphic design, UI/UX, illustration, branding and motion. Portfolio-led platforms like 99designs, Dribbble, Behance and ArtStation.',
    icon: 'palette',
  },
  'freelancing-dev': {
    label: 'Programming & Software',
    title: 'Programming & Software Freelancing',
    description: 'Software development, web development and technical contracts. General marketplaces plus vetted networks like Codeable and Gun.io.',
    icon: 'code',
  },
  'freelancing-writing': {
    label: 'Writing & Translation',
    title: 'Writing & Translation Freelancing',
    description: 'Blogging, copywriting, content, technical writing, translation and interpreting. Platforms like ProBlogger, ProZ, Gengo and Textbroker.',
    icon: 'pen-nib',
  },
  'freelancing-marketing': {
    label: 'Marketing & SEO',
    title: 'Marketing & SEO Freelancing',
    description: 'Digital marketing, SEO, paid ads, email, social media and analytics. Specialised networks like MarketerHire and Mayple.',
    icon: 'chart-line',
  },
  'freelancing-va': {
    label: 'Virtual Assistants',
    title: 'Virtual Assistant Platforms',
    description: 'Remote admin, scheduling, research and executive assistance. Platforms like Belay, Time Etc, Fancy Hands and general marketplaces.',
    icon: 'user-tie',
  },
  'freelancing-tutoring': {
    label: 'Tutoring & Teaching',
    title: 'Tutoring & Teaching Freelancing',
    description: 'Academic tutoring, language teaching and online classes. Superprof, Preply, italki, Cambly, Tutorful and more.',
    icon: 'chalkboard-user',
  },
  'freelancing-local': {
    label: 'Local / Task Work',
    title: 'Local Freelance & Task Work',
    description: 'Local services like furniture assembly, cleaning, pet care, trades and handyman work. TaskRabbit, Airtasker, Checkatrade and more.',
    icon: 'screwdriver-wrench',
  },
  'freelancing-remote': {
    label: 'Remote Jobs',
    title: 'Remote Freelance & Contract Jobs',
    description: 'Curated remote job boards with vetted listings — FlexJobs, We Work Remotely, Remote OK, Wellfound and more.',
    icon: 'laptop-house',
  },
    'captcha': {
    label: 'CAPTCHA & Micro-Tasks',
    title: 'CAPTCHA Solving & Micro-Task Platforms',
    description: 'Earn small amounts by completing simple online tasks such as CAPTCHA solving, data labelling, research, transcription and testing. Availability and pay vary significantly by country, qualification and task demand.',
    icon: 'keyboard',
  },
  'captcha-solving': {
    label: 'CAPTCHA Solving',
    title: 'CAPTCHA Solving Platforms',
    description: 'Type CAPTCHAs for tiny per-task payouts. Very easy, globally available, but low hourly rates. Best combined with other earning methods.',
    icon: 'shield-halved',
  },
  'captcha-microtasks': {
    label: 'Simple Micro-Tasks',
    title: 'Simple Micro-Task Platforms',
    description: 'Data mining, categorisation, tagging, sentiment analysis and content evaluation. Slightly higher pay than pure CAPTCHA work, but still low hourly rates.',
    icon: 'list-check',
  },
  'captcha-ai': {
    label: 'AI & Data Annotation',
    title: 'AI & Data Annotation Tasks',
    description: 'Label data for AI systems, evaluate AI responses, classify images. Some require qualifications or language skills. The highest-paid micro-task subcategory.',
    icon: 'robot',
  },
  'captcha-audio': {
    label: 'Audio & Language Tasks',
    title: 'Audio & Language Tasks',
    description: 'Speech recording, pronunciation, transcription, translation and text evaluation. Often project-based rather than continuous.',
    icon: 'microphone',
  },
  'captcha-testing': {
    label: 'App & Website Testing',
    title: 'App & Website Testing Platforms',
    description: 'Test apps, websites and digital products for bugs, usability and performance.',
    icon: 'vial',
  },
  'captcha-closed': {
    label: 'Closed Platforms',
    title: 'Closed & Historical Platforms',
    description: 'Platforms that have shut down or are shutting down. Kept for reference only — do not sign up.',
    icon: 'box-archive',
  },
    'selling': {
    label: 'Selling & Reselling',
    title: 'Selling & Reselling Platforms',
    description: 'Earn money by selling unwanted items, handmade products, digital goods, clothing, collectibles and print-on-demand products. Models range from second-hand marketplaces to digital download stores and general e-commerce.',
    icon: 'tag',
  },
  'selling-general': {
    label: 'General Marketplaces',
    title: 'General Selling Marketplaces',
    description: 'Large marketplaces for almost anything — eBay, Facebook Marketplace, Mercari, OfferUp. Best for reselling items you already own.',
    icon: 'store',
  },
  'selling-fashion': {
    label: 'Clothing & Fashion',
    title: 'Clothing & Fashion Resale',
    description: 'Sell second-hand clothing, vintage finds, streetwear or designer fashion. Vinted, Depop, Poshmark, Grailed and more.',
    icon: 'shirt',
  },
  'selling-handmade': {
    label: 'Handmade & Crafts',
    title: 'Handmade & Craft Marketplaces',
    description: 'Sell handmade goods, crafts, personalised products and vintage items. Etsy and Not On The High Street lead this category.',
    icon: 'palette',
  },
  'selling-digital': {
    label: 'Digital Products',
    title: 'Digital Product Platforms',
    description: 'Sell e-books, courses, templates, software and memberships. Gumroad, Ko-fi, Payhip and Creative Market.',
    icon: 'file-arrow-down',
  },
  'selling-pod': {
    label: 'Print-on-Demand',
    title: 'Print-on-Demand Platforms',
    description: 'Upload designs once, earn royalties on every sale. Redbubble, TeePublic and Zazzle handle printing and shipping.',
    icon: 'shirt',
  },
  'selling-collectibles': {
    label: 'Collectibles & Sneakers',
    title: 'Collectibles & Sneaker Resale',
    description: 'Buy, sell and trade authenticated sneakers, trading cards and collectibles. StockX, GOAT and Whatnot.',
    icon: 'gem',
  },
  'selling-luxury': {
    label: 'Luxury Resale',
    title: 'Luxury Fashion Resale',
    description: 'Designer handbags, watches and jewellery resale with authentication. Vestiaire Collective, The RealReal and Rebag.',
    icon: 'crown',
  },
  'selling-local': {
    label: 'Local Classifieds',
    title: 'Local Classifieds & Resale',
    description: 'Sell locally with no shipping — Facebook Marketplace, Gumtree, Craigslist, Shpock, Preloved.',
    icon: 'map-location-dot',
  },
  'selling-stores': {
    label: 'Build Your Own Store',
    title: 'Build Your Own Store',
    description: 'Full e-commerce platforms for your own brand — Shopify, Big Cartel. Monthly fee, full control, no marketplace fees.',
    icon: 'cart-shopping',
  },
    'content': {
    label: 'Content Creation',
    title: 'Content Creation & Creator Monetization',
    description: 'Create videos, articles, livestreams, podcasts, newsletters and courses to earn from audiences and supporters. Monetization via advertising, subscriptions, memberships, tips, digital products and brand deals.',
    icon: 'pen-fancy',
  },
  'content-video': {
    label: 'Video Creation',
    title: 'Video Creation Platforms',
    description: 'Upload videos and earn through advertising, subscriptions and creator funds. YouTube, TikTok, Rumble, Vimeo and more.',
    icon: 'video',
  },
  'content-livestream': {
    label: 'Gaming & Livestreaming',
    title: 'Livestreaming Platforms',
    description: 'Stream gaming, music or creative content live. Earn via subscriptions, Bits, ads and donations. Twitch, Kick, YouTube Live.',
    icon: 'broadcast-tower',
  },
  'content-writing': {
    label: 'Writing & Blogging',
    title: 'Writing & Blogging Platforms',
    description: 'Earn from articles, blogs and long-form writing. Medium Partner Program, Substack, Ghost and Tumblr.',
    icon: 'feather',
  },
  'content-newsletters': {
    label: 'Newsletters',
    title: 'Newsletter Platforms',
    description: 'Build a paid newsletter. Direct subscriptions with low fees — Substack, Beehiiv, Ghost and Patreon.',
    icon: 'envelope-open-text',
  },
  'content-podcasts': {
    label: 'Podcasts',
    title: 'Podcast Platforms',
    description: 'Host, distribute and monetize a podcast. Spotify for Creators, Buzzsprout, Podbean, Captivate and Substack.',
    icon: 'microphone-lines',
  },
  'content-fans': {
    label: 'Fan Support & Memberships',
    title: 'Fan Support & Membership Platforms',
    description: 'Fans pay monthly for exclusive access or send one-time tips. Patreon, Buy Me a Coffee, Ko-fi, Locals.',
    icon: 'heart',
  },
  'content-courses': {
    label: 'Courses & Education',
    title: 'Online Course Platforms',
    description: 'Create and sell video courses and educational content. Teachable, Thinkific, Kajabi, Podia and Whop.',
    icon: 'graduation-cap',
  },
  'content-digital': {
    label: 'Digital Creator Products',
    title: 'Digital Creator Products',
    description: 'Sell e-books, templates, presets, software and memberships. Gumroad, Payhip, Ko-fi, Fourthwall and Whop.',
    icon: 'file-arrow-down',
  },
  'content-merch': {
    label: 'Creator Merch',
    title: 'Creator Merch Platforms',
    description: 'Turn audience into merch sales. Print-on-demand with no upfront costs. Fourthwall, Spring, Redbubble, TeePublic.',
    icon: 'shirt',
  },
    'app-offers': {
    label: 'App Offers',
    title: 'App Offer Rewards',
    description: 'Earn rewards by installing apps, trying new services, completing app goals and reaching specific milestones. Tracking matters — you usually need to install through the platform\'s offer link and satisfy the exact conditions for the reward to credit.',
    icon: 'mobile-screen',
  },
  'app-offers-installs': {
    label: 'Simple App Installs',
    title: 'Simple App Install Offers',
    description: 'Install an app, register, open it, or complete a first action. The easiest app-offer type — usually small rewards but fast to complete.',
    icon: 'circle-down',
  },
  'app-offers-games': {
    label: 'Game Offers',
    title: 'Mobile Game Milestone Offers',
    description: 'Reach a specific level, complete stages, or play for a defined number of days. Higher rewards than simple installs, but require more time. Common on Freecash, KashKick and Reward XP.',
    icon: 'dice',
  },
  'app-offers-financial': {
    label: 'Financial & Service Offers',
    title: 'Financial & Service Offers',
    description: 'Open an eligible account, sign up for a service, complete verification, or make a qualifying transaction. Highest paying offer type but often requires personal details and sometimes a deposit.',
    icon: 'building-columns',
  },
  'app-offers-trials': {
    label: 'Shopping & Trial Offers',
    title: 'Shopping & Trial Offers',
    description: 'Try a service, subscribe to a trial, or make a qualifying purchase. Rewards can be substantial but read the terms — some require continued subscription or minimum spend.',
    icon: 'bag-shopping',
  },
  'app-offers-walls': {
    label: 'Offerwalls',
    title: 'Offerwall Providers',
    description: 'Third-party offer networks (Ayet Studios, Torox, AdGate, AdGem and others) that power the offer catalogs on GPT platforms. Listed platforms act as aggregators of multiple walls.',
    icon: 'table-cells-large',
  },
    'videos': {
    label: 'Watch-to-Earn',
    title: 'Watch-to-Earn Platforms',
    description: 'Earn small rewards by watching videos, advertisements, curated content, or participating in passive media-research programs. Earnings are generally very small and depend heavily on country, available advertising inventory and account activity.',
    icon: 'play-circle',
  },
  'videos-direct': {
    label: 'Direct Video Rewards',
    title: 'Direct Video Rewards',
    description: 'Platforms that pay you specifically for watching videos and advertisements — TimeBucks, HideoutTV. The cleanest watch-to-earn model.',
    icon: 'film',
  },
  'videos-gpt': {
    label: 'Video + GPT Platforms',
    title: 'GPT Platforms with Video Offers',
    description: 'GPT platforms that include video offers alongside surveys, offers and apps. Video is one earning method among many, not the main product.',
    icon: 'table-cells-large',
  },
  'videos-passive': {
    label: 'Passive Media Research',
    title: 'Passive Media Research',
    description: 'Get paid to let a research company measure your normal TV, streaming and internet usage. Nielsen is the main platform.',
    icon: 'chart-line',
  },
  'videos-mixed': {
    label: 'Mixed Platforms',
    title: 'Mixed Reward Platforms with Video',
    description: 'General GPT platforms where video is one earning method among many. Includes InboxDollars and Freecash.',
    icon: 'shuffle',
  },
};

function getSlugFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function renderRelatedTiles(currentSlug) {
  const container = document.getElementById('relatedTiles');
  if (!container) return;

  // Pick 12 others, but keep them in a sensible order
  const entries = Object.entries(EARN_METHODS)
    .filter(([slug]) => slug !== currentSlug)
    .slice(0, 12);

  container.innerHTML = entries
    .map(([slug, m]) => `
      <a href="/earn/${slug}" class="category-tile">
        <div class="category-tile__icon">
          <i class="fas fa-${m.icon}"></i>
        </div>
        <div class="category-tile__name">${m.label}</div>
        <div class="category-tile__hint">${m.description.split('.')[0]}</div>
      </a>
    `)
    .join('');
}

function setMeta(name, content, id) {
  const el = id ? document.getElementById(id) : document.querySelector(`meta[name="${name}"]`);
  if (el) {
    if (id) el.setAttribute('content', content);
    else el.setAttribute('content', content);
  }
}

function init() {
  const slug = getSlugFromPath();
  const meta = EARN_METHODS[slug];

  if (!meta) {
    // Unknown slug — fall back to a generic hero but still let app.js run
    const titleEl = document.getElementById('earnTitle');
    if (titleEl) titleEl.textContent = 'All Earning Sites';
    const leadEl = document.getElementById('earnLead');
    if (leadEl) leadEl.textContent = 'Every site in the directory, sorted by trust score.';
    const crumbEl = document.getElementById('crumbCurrent');
    if (crumbEl) crumbEl.textContent = 'All Sites';
    window.__EARN_SLUG = null;
    renderRelatedTiles(null);
    return;
  }

  // Expose for other scripts (harmless if app.js reads the path instead)
  window.__EARN_SLUG = slug;

  // ── Meta ──
  const pageUrl = `https://earn.land.me.uk/earn/${slug}`;
  document.title = `${meta.title} — 200+ Verified Sites (2026) | Earn Online Directory`;

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = document.title;

  const descEl = document.getElementById('pageDesc');
  if (descEl) descEl.setAttribute('content', meta.description);

  const canonEl = document.getElementById('canonicalUrl');
  if (canonEl) canonEl.setAttribute('href', pageUrl);

  const ogTitleEl = document.getElementById('ogTitle');
  if (ogTitleEl) ogTitleEl.setAttribute('content', `${meta.title} — Earn Online Directory`);

  const ogDescEl = document.getElementById('ogDesc');
  if (ogDescEl) ogDescEl.setAttribute('content', meta.description);

  const ogUrlEl = document.getElementById('ogUrl');
  if (ogUrlEl) ogUrlEl.setAttribute('content', pageUrl);

  // ── Hero ──
  const crumbEl = document.getElementById('crumbCurrent');
  if (crumbEl) crumbEl.textContent = meta.label;

  const badgeEl = document.getElementById('earnBadge');
  if (badgeEl) {
    badgeEl.innerHTML =
      `<i class="fas fa-${meta.icon}" aria-hidden="true"></i> <span>${meta.label}</span>`;
  }

  const earnTitle = document.getElementById('earnTitle');
  if (earnTitle) earnTitle.innerHTML = `Best <em>${meta.title}</em>`;

  const earnLead = document.getElementById('earnLead');
  if (earnLead) earnLead.textContent = meta.description;

  const earnStats = document.getElementById('earnStats');
  if (earnStats) {
    earnStats.innerHTML = `
      <span class="stat-chip">
        <i class="fas fa-${meta.icon}"></i>
        <strong id="statTotal">—</strong> listed
      </span>
      <span class="stat-chip">
        <i class="fas fa-circle-check"></i>
        <strong id="statActive">—</strong> active
      </span>
      <span class="stat-chip">
        <i class="fas fa-thumbs-up"></i>
        <strong id="statVotes">—</strong> votes cast
      </span>
    `;
  }

  // ── Related tiles ──
  renderRelatedTiles(slug);

  // ── JSON-LD ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.title,
    description: meta.description,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Earn Online Directory',
      url: 'https://earn.land.me.uk/',
    },
  };
  const ldEl = document.getElementById('jsonLd');
  if (ldEl) ldEl.textContent = JSON.stringify(jsonLd);
}

init();