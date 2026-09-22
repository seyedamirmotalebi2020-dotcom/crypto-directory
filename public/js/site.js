// public/js/site.js — Site detail page
import { buildFaviconImg, initials } from './favicon.js'
import { isWatched, toggleWatch } from './watchlist.js'


const $ = (id) => document.getElementById(id)

// ── Utilities ──────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function toast(msg, type = '') {
  const t = $('toast')
  t.textContent = msg
  t.className = 'toast show ' + type
  clearTimeout(toast._t)
  toast._t = setTimeout(() => t.classList.remove('show'), 2600)
}

function getFingerprint() {
  let fp = localStorage.getItem('ced_fp')
  if (!fp) {
    fp = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
         '-' + (navigator.userAgent || '').length
    localStorage.setItem('ced_fp', fp)
  }
  return fp
}



function trustClass(score) {
  if (score == null) return 'unknown'
  if (score >= 80) return 'good'
  if (score >= 50) return 'mid'
  return 'low'
}

function formatMin(min, coin) {
  if (min == null) return '—'
  const n = Number(min)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 }) + ' ' + coin
}

function formatInterval(sec) {
  if (!sec) return '—'
  const s = Number(sec)
  if (s < 60)    return s + 's'
  if (s < 3600)  return Math.round(s / 60) + ' min'
  if (s < 86400) return Math.round(s / 3600) + ' h'
  return Math.round(s / 86400) + ' d'
}

// ── Extract slug from URL ─────────────────────────────────────
const slug = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '')

// ── Fetch site data ──────────────────────────────────────────
async function load() {
  if (!slug) return showError()

  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(slug)}`)
    if (!res.ok) return showError()

    const json = await res.json()
    if (!json.ok || !json.data) return showError()

    render(json.data)
  } catch (err) {
    console.error(err)
    showError()
  }
}

function showError() {
  $('loadingState').style.display = 'none'
  $('errorState').style.display = 'block'
}

// ── Render ────────────────────────────────────────────────────
function render(site) {
  document.title = `Is ${site.name} Legit? Review, Trust Score & Payout Evidence`
  $('pageDesc').setAttribute('content',
    `${site.name} review — current payout evidence, minimum withdrawal, coin support and community trust score. Updated September 2026.`)

  const url = `https://earn.land.me.uk/site/${site.slug}`
  $('canonicalUrl').setAttribute('href', url)
  $('ogTitle').setAttribute('content', `Is ${site.name} Legit? — Crypto Earn Directory`)
  $('ogDesc').setAttribute('content', site.description || `Review and trust score for ${site.name}.`)

  // Breadcrumb
  $('crumbName').textContent = site.name

  // Hero
  const logoHtml = buildFaviconImg(site, 128, initials(site.name)) || esc(initials(site.name))
  $('siteLogo').innerHTML = logoHtml

  // Tags: status + categories
  const tags = []
  tags.push(`<span class="sc-status ${esc(site.status)}">${esc(site.status.replace('_',' '))}</span>`)
  for (const c of (site.categories || []).slice(0, 4)) {
    tags.push(`<span class="site-tag">${esc(c.name)}</span>`)
  }
  $('siteTags').innerHTML = tags.join('')

  // Trust badge
  const trust = site.trustScore
  $('siteTrust').className = 'site-detail-trust ' + trustClass(trust)
  $('trustNum').textContent = trust == null ? '—' : trust

  // Score breakdown
  const breakdown = []
  if (site.editorialScore != null) breakdown.push(`<div class="score-item"><span class="score-val">${site.editorialScore}</span><span class="score-lbl">Editorial</span></div>`)
  if (site.communityScore != null) breakdown.push(`<div class="score-item"><span class="score-val">${site.communityScore}</span><span class="score-lbl">Community</span></div>`)
  breakdown.push(`<div class="score-item"><span class="score-val">${site.totalVotes || 0}</span><span class="score-lbl">Total votes</span></div>`)
  $('scoreBreakdown').innerHTML = breakdown.join('')

  // Vote counts
  const vc = site.voteCounts || { trustworthy: 0, scam: 0, unsure: 0 }
  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = vc[el.dataset.count] ?? 0
  })

  // Description
  if (site.description) {
    $('siteDescription').textContent = site.description
  } else {
    $('siteDescription').textContent = `${site.name} is a crypto earning site listed in our directory. Full editorial review coming soon.`
  }

  // Offers table
  const offers = site.offers || []
  if (offers.length) {
    $('offersBody').innerHTML = offers.map(o => `
      <tr>
        <td><strong>${esc(o.coin)}</strong><br><span style="font-size:0.78em;color:var(--text-dim);">${esc(o.coinName || '')}</span></td>
        <td>${esc(o.paymentName || o.payment)}</td>
        <td>${o.minWithdrawal != null ? esc(formatMin(o.minWithdrawal, o.coin)) : '—'}</td>
        <td>${o.claimInterval ? esc(formatInterval(o.claimInterval)) : '—'}</td>
        <td>${o.payoutSpeed ? `<span class="speed-badge ${esc(o.payoutSpeed)}">${esc(o.payoutSpeed)}</span>` : '—'}</td>
      </tr>
    `).join('')
  } else {
    $('offersBody').innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.5rem;">No offers recorded yet for this site.</td></tr>`
  }

  // Features
  const features = site.features || []
  if (features.length) {
    $('featuresSection').style.display = ''
    $('featuresList').innerHTML = features
      .map(f => `<span class="feature-chip">${esc(f.name)}</span>`)
      .join('')
  }

  // Visit button
  $('ctaSiteName').textContent = site.name
  const visitUrl = site.referralUrl || site.url
  const visitBtn = $('visitBtn')
  visitBtn.href = visitUrl
  if (site.referralUrl) {
    $('ctaReferralNote').textContent =
      'Opens in a new tab. This is our referral link — we may earn a commission at no cost to you.'
  } else {
    $('ctaReferralNote').textContent = 'Opens in a new tab.'
  }
  // Watchlist star for the detail page
const isStarred = isWatched(site.slug)
const starBtn = document.createElement('button')
starBtn.className = 'sc-star ' + (isStarred ? 'active' : '')
starBtn.style.cssText = 'width:44px;height:44px;font-size:1.1rem;margin-left:0.6rem;'
starBtn.setAttribute('aria-label', isStarred ? 'Remove from watchlist' : 'Add to watchlist')
starBtn.innerHTML = `<i class="${isStarred ? 'fas' : 'far'} fa-star"></i>`
starBtn.addEventListener('click', () => {
  const nowActive = toggleWatch(site.slug)
  starBtn.classList.toggle('active', nowActive)
  starBtn.classList.add('pulse')
  setTimeout(() => starBtn.classList.remove('pulse'), 500)
  starBtn.setAttribute('aria-label', nowActive ? 'Remove from watchlist' : 'Add to watchlist')
  starBtn.querySelector('i').className = nowActive ? 'fas fa-star' : 'far fa-star'
  toast(nowActive ? '⭐ Added to watchlist' : 'Removed from watchlist')
})
// Attach next to the site name
const nameEl = $('siteName')
if (nameEl && nameEl.parentNode) {
  nameEl.parentNode.insertBefore(starBtn, nameEl.nextSibling)
}

  // Similar sites
  const sharedCat = site.categories?.[0]?.slug
  if (sharedCat) loadSimilar(sharedCat, site.slug)

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Review",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": site.name,
          "applicationCategory": "FinanceApplication",
          "url": site.url,
          "description": site.description || ''
        },
        "reviewRating": trust == null ? undefined : {
          "@type": "Rating",
          "ratingValue": String(trust),
          "bestRating": "100",
          "worstRating": "0"
        },
        "author": { "@type": "Organization", "name": "Crypto Earn Directory" },
        "publisher": {
          "@type": "Organization",
          "name": "Crypto Earn Directory"
        },
        "datePublished": "2026-09-19"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://earn.land.me.uk/" },
          { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://earn.land.me.uk/#directory" },
          { "@type": "ListItem", "position": 3, "name": site.name, "item": url }
        ]
      }
    ]
  }
  $('jsonLd').textContent = JSON.stringify(jsonLd)

  // Show content
  $('loadingState').style.display = 'none'
  $('siteContent').style.display = 'block'

  wireVotes(site)
}

async function loadSimilar(category, excludeSlug) {
  try {
    const res = await fetch(`/api/sites?category=${encodeURIComponent(category)}&per_page=5`)
    const json = await res.json()
    if (!json.ok) return
    const others = (json.data || []).filter(s => s.slug !== excludeSlug).slice(0, 4)
    if (!others.length) return

    $('similarSection').style.display = ''
    $('similarList').innerHTML = others.map(s => {
    const t = s.trustScore
    const fav = buildFaviconImg(s, 32, initials(s.name)) || esc(initials(s.name))
    return `
      <a href="/site/${esc(s.slug)}" class="similar-card">
        <div class="similar-logo">${fav}</div>
</div>
          <div class="similar-body">
            <div class="similar-name">${esc(s.name)}</div>
            <div class="similar-trust ${trustClass(t)}">${t == null ? '—' : t}/100</div>
          </div>
        </a>
      `
    }).join('')
  } catch (err) {
    console.error('Similar sites failed:', err)
  }
}

// ── Voting ───────────────────────────────────────────────────
function wireVotes(site) {
  const buttons = document.querySelectorAll('.vote-btn-large')
  buttons.forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn, site))
  })
}

async function handleVote(btn, site) {
  const vote = btn.dataset.vote
  const fp = getFingerprint()

  // Optimistic update
  document.querySelectorAll('.vote-btn-large').forEach(b => b.classList.remove('voted'))
  btn.classList.add('voted', 'pulse')
  setTimeout(() => btn.classList.remove('pulse'), 500)

  // Bump the count
  const counter = btn.querySelector('[data-count]')
  const current = parseInt(counter.textContent, 10) || 0
  counter.textContent = current + 1

  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(site.slug)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote, fingerprint: fp }),
    })
    const json = await res.json()

    if (!res.ok || !json.ok) {
      counter.textContent = current
      btn.classList.remove('voted')
      toast(json.error || 'Vote failed', 'error')
      return
    }

    // Sync from server response
    const data = json.data
    document.querySelectorAll('[data-count]').forEach(el => {
      el.textContent = data.counts[el.dataset.count] ?? 0
    })

    if (typeof data.trustScore === 'number') {
      $('trustNum').textContent = data.trustScore
      $('siteTrust').className = 'site-detail-trust ' + trustClass(data.trustScore)
    }

    document.querySelectorAll('.vote-btn-large').forEach(b => {
      b.classList.toggle('voted', b.dataset.vote === data.yourVote)
    })

    toast('Thanks for voting!', 'success')
  } catch (err) {
    console.error(err)
    counter.textContent = current
    btn.classList.remove('voted')
    toast('Network error — try again', 'error')
  }
}

load()