// public/js/hub-stats.js
// Fetches live category stats from /api/category-stats and updates
// the hub cards on the homepage. Falls back silently if the API fails
// so the hardcoded HTML values remain as a safety net.

const FALLBACK = {
  crypto:            { total: 220, active: 180, trustScore: 64 },
  surveys:           { total: 25,  active: 22,  trustScore: 72 },
  cashback:          { total: 44,  active: 32,  trustScore: 70 },
  freelancing:       { total: 50,  active: 42,  trustScore: 75 },
  captcha:           { total: 20,  active: 17,  trustScore: 72 },
  games:             { total: 79,  active: 62,  trustScore: 70 },
  selling:           { total: 32,  active: 28,  trustScore: 75 },
  content:           { total: 34,  active: 30,  trustScore: 76 },
  'app-offers':      { total: 12,  active: 10,  trustScore: 70 },
  videos:            { total: 10,  active: 8,   trustScore: 70 },
  'referral-programs':{ total: 0,  active: 0,   trustScore: null },
  testnets:          { total: 12,  active: 12,  trustScore: null },
}

function trustClass(score) {
  if (score == null) return 'unknown'
  if (score >= 80) return 'good'
  if (score >= 50) return 'mid'
  return 'low'
}

function slugFromHref(href) {
  if (!href) return null
  // /crypto → "crypto"
  if (href === '/crypto' || href.startsWith('/crypto?')) return 'crypto'
  // /earn/surveys → "surveys"
  const m = href.match(/^\/earn\/([^/?#]+)/)
  return m ? m[1] : null
}

function updateCard(card, stats) {
  if (!stats) return

  // Trust number + class
  const trustBox = card.querySelector('.hub-card__trust')
  const trustNum = card.querySelector('.hub-trust-num')
  if (trustBox && trustNum) {
    if (stats.trustScore != null) {
      trustNum.textContent = stats.trustScore
      trustBox.className = 'hub-card__trust ' + trustClass(stats.trustScore)
    } else {
      trustNum.textContent = '—'
      trustBox.className = 'hub-card__trust unknown'
    }
  }

  // Site count + active count in the stats row
  const statsRow = card.querySelector('.hub-card__stats')
  if (statsRow) {
    const spans = statsRow.querySelectorAll('span')
    // Convention: first span shows site count, second shows active count.
    // We replace only the numeric text after the icon.
    if (spans[0]) {
      const icon = spans[0].querySelector('i')
      spans[0].innerHTML = (icon ? icon.outerHTML : '<i class="fas fa-globe"></i>') +
        ` ${stats.total} sites`
    }
    if (spans[1]) {
      const icon = spans[1].querySelector('i')
      spans[1].innerHTML = (icon ? icon.outerHTML : '<i class="fas fa-circle-check"></i>') +
        ` ${stats.active} active`
    }
  }

  // Update the "Explore N sites" CTA at the bottom
  const cta = card.querySelector('.hub-card__cta')
  if (cta) {
    const arrow = cta.querySelector('i')
    cta.innerHTML = `Explore ${stats.total} sites ` + (arrow ? arrow.outerHTML : '<i class="fas fa-arrow-right"></i>')
  }
}

async function init() {
  // Find every hub card on the page.
  const cards = document.querySelectorAll('.hub-card')
  if (!cards.length) return

  // Index cards by their slug
  const cardsBySlug = {}
  for (const card of cards) {
    const slug = slugFromHref(card.getAttribute('href'))
    if (slug) cardsBySlug[slug] = card
  }

  // Apply fallback numbers first so the page always shows something.
  for (const [slug, card] of Object.entries(cardsBySlug)) {
    if (FALLBACK[slug]) updateCard(card, FALLBACK[slug])
  }

  // Then try to fetch live stats.
  try {
    const res = await fetch('/api/category-stats', { cache: 'no-store' })
    if (!res.ok) return
    const json = await res.json()
    if (!json.ok || !json.data) return

    const live = json.data.categories || {}

    for (const [slug, stats] of Object.entries(live)) {
      const card = cardsBySlug[slug]
      if (card) updateCard(card, stats)
    }

    // Update the hero stats too if present
    const heroTotal = document.getElementById('statTotal')
    if (heroTotal && json.data.totals) {
      heroTotal.textContent = json.data.totals.sites.toLocaleString()
    }
    const heroActive = document.getElementById('statActive')
    if (heroActive && json.data.totals) {
      heroActive.textContent = json.data.totals.active.toLocaleString()
    }
  } catch (err) {
    // Silent — fallback numbers are already shown.
    console.debug('[hub-stats] Live stats unavailable:', err.message)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}