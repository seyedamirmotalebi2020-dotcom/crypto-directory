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
  if (!t) return
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
  const loading = $('loadingState')
  const error = $('errorState')
  if (loading) loading.style.display = 'none'
  if (error) error.style.display = 'block'
}

// ── Render ────────────────────────────────────────────────────
function render(site) {
  // ── Meta ──
  document.title = `Is ${site.name} Legit? Review, Trust Score & Payout Evidence`

  const descEl = $('pageDesc')
  if (descEl) descEl.setAttribute('content',
    `${site.name} review — current payout evidence, minimum withdrawal, coin support and community trust score. Updated September 2026.`)

  const url = `https://earn.land.me.uk/site/${site.slug}`
  const canonEl = $('canonicalUrl')
  if (canonEl) canonEl.setAttribute('href', url)

  const ogTitleEl = $('ogTitle')
  if (ogTitleEl) ogTitleEl.setAttribute('content', `Is ${site.name} Legit? — Earn Online Directory`)

  const ogDescEl = $('ogDesc')
  if (ogDescEl) ogDescEl.setAttribute('content', site.description || `Review and trust score for ${site.name}.`)

  // ── Breadcrumb ──
  const crumbEl = $('crumbName')
  if (crumbEl) crumbEl.textContent = site.name

 // ── Hero: favicon + name ──
  const logoEl = $('siteLogo')
  if (logoEl) {
    const logoHtml = buildFaviconImg(site, 128, initials(site.name)) || esc(initials(site.name))
    logoEl.innerHTML = logoHtml
  }

  const nameEl = $('siteName')
  if (nameEl) nameEl.textContent = site.name

  // ── Tags: status + categories ──
  const tagsEl = $('siteTags')
  if (tagsEl) {
    const tags = []
    tags.push(`<span class="sc-status ${esc(site.status)}">${esc(site.status.replace(/_/g, ' '))}</span>`)
    for (const c of (site.categories || []).slice(0, 4)) {
      tags.push(`<span class="site-tag">${esc(c.name)}</span>`)
    }
    tagsEl.innerHTML = tags.join('')
  }

  // ── Trust badge ──
  const trust = site.trustScore
  const trustBox = $('siteTrust')
  const trustNum = $('trustNum')
  if (trustBox) trustBox.className = 'trust-hero ' + trustClass(trust)
  if (trustNum) trustNum.textContent = trust == null ? '—' : trust

  // ── Description (About section) ──
  const descTextEl = $('siteDescription')
  if (descTextEl) {
    if (site.description) {
      descTextEl.textContent = site.description
    } else {
      descTextEl.textContent =
        `${site.name} is an online earning platform listed in our directory. Full editorial review coming soon.`
    }
  }

  // ── Structured review content ──
  renderReviewData(site.reviewData)

  // ── Score breakdown ──
  const breakdownEl = $('scoreBreakdown')
  if (breakdownEl) {
    const breakdown = []
    if (site.editorialScore != null) {
      breakdown.push(`<div class="score-item"><span class="score-val">${site.editorialScore}</span><span class="score-lbl">Editorial</span></div>`)
    }
    if (site.communityScore != null) {
      breakdown.push(`<div class="score-item"><span class="score-val">${site.communityScore}</span><span class="score-lbl">Community</span></div>`)
    }
    breakdown.push(`<div class="score-item"><span class="score-val">${site.totalVotes || 0}</span><span class="score-lbl">Total votes</span></div>`)
    breakdownEl.innerHTML = breakdown.join('')
  }

  // ── Vote counts ──
  const vc = site.voteCounts || { trustworthy: 0, scam: 0, unsure: 0 }
  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = vc[el.dataset.count] ?? 0
  })

  // ── Offers table ──
  const offers = site.offers || []
  const offersBody = $('offersBody')
  if (offersBody) {
    if (offers.length) {
      offersBody.innerHTML = offers.map(o => `
        <tr>
          <td><strong>${esc(o.coin)}</strong><br><span style="font-size:0.78em;color:var(--text-dim);">${esc(o.coinName || '')}</span></td>
          <td>${esc(o.paymentName || o.payment)}</td>
          <td>${o.minWithdrawal != null ? esc(formatMin(o.minWithdrawal, o.coin)) : '—'}</td>
          <td>${o.claimInterval ? esc(formatInterval(o.claimInterval)) : '—'}</td>
          <td>${o.payoutSpeed ? `<span class="speed-badge ${esc(o.payoutSpeed)}">${esc(o.payoutSpeed)}</span>` : '—'}</td>
        </tr>
      `).join('')
    } else {
      offersBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.5rem;">No offers recorded yet for this site.</td></tr>`
    }
  }

  // ── Features ──
  const features = site.features || []
  if (features.length) {
    const sec = $('featuresSection')
    const list = $('featuresList')
    if (sec) sec.style.display = ''
    if (list) {
      list.innerHTML = features
        .map(f => `<span class="feature-chip">${esc(f.name)}</span>`)
        .join('')
    }
  }

  // ── Visit CTA ──
  const ctaName = $('ctaSiteName')
  if (ctaName) ctaName.textContent = site.name

  const visitUrl = site.referralUrl || site.url
  const visitBtn = $('visitBtn')
  if (visitBtn) {
    visitBtn.href = visitUrl
    const note = $('ctaReferralNote')
    if (note) {
      note.textContent = site.referralUrl
        ? 'Opens in a new tab. This is our referral link — we may earn a commission at no cost to you.'
        : 'Opens in a new tab.'
    }
  }

  // ── Watchlist star (next to the site name) ──
  addWatchlistStar(site)

  // ── Similar sites ──
  const sharedCat = site.categories?.[0]?.slug
  if (sharedCat) loadSimilar(sharedCat, site.slug)

  // ── JSON-LD ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Review',
        itemReviewed: {
          '@type': 'SoftwareApplication',
          name: site.name,
          applicationCategory: 'FinanceApplication',
          url: site.url,
          description: site.description || ''
        },
        ...(trust != null ? {
          reviewRating: {
            '@type': 'Rating',
            ratingValue: String(trust),
            bestRating: '100',
            worstRating: '0'
          }
        } : {}),
        author: { '@type': 'Organization', name: 'Earn Online Directory' },
        publisher: { '@type': 'Organization', name: 'Earn Online Directory' },
        datePublished: new Date().toISOString().slice(0, 10)
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://earn.land.me.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://earn.land.me.uk/#categories' },
          { '@type': 'ListItem', position: 3, name: site.name, item: url }
        ]
      }
    ]
  }
  const ldEl = $('jsonLd')
  if (ldEl) ldEl.textContent = JSON.stringify(jsonLd)

  // ── Show content ──
  const loading = $('loadingState')
  const content = $('siteContent')
  if (loading) loading.style.display = 'none'
  if (content) content.style.display = 'block'

  // ── Wire votes ──
  wireVotes(site)
}

// ── Render the structured review content ─────────────────────
// (Defined outside render — takes the reviewData object as its only input)
function renderReviewData(reviewData) {
  if (!reviewData) return

  // 1. Quick Facts
  const facts = reviewData.quickFacts || []
  if (facts.length) {
    const sec = $('quickFactsSection')
    const grid = $('quickFactsGrid')
    if (sec && grid) {
      grid.innerHTML = facts.map(f => `
        <div class="fact-row">
          <span class="fact-label">${esc(f.label)}</span>
          <span class="fact-value">${esc(f.value)}</span>
        </div>
      `).join('')
      sec.style.display = ''
    }
  }

  // 2. Pros & Cons
  const pros = reviewData.pros || []
  const cons = reviewData.cons || []
  if (pros.length || cons.length) {
    const sec = $('prosConsSection')
    const prosList = $('prosList')
    const consList = $('consList')
    if (sec) sec.style.display = ''
    if (prosList) prosList.innerHTML = pros.map(p => `<li>${esc(p)}</li>`).join('')
    if (consList) consList.innerHTML = cons.map(c => `<li>${esc(c)}</li>`).join('')
  }

  // 3. Review Body (paragraphs split on blank lines)
  const body = reviewData.reviewBody
  if (body && body.trim()) {
    const sec = $('reviewSection')
    const container = $('reviewBody')
    if (sec && container) {
      const paragraphs = body.split(/\n\s*\n/).filter(Boolean)
      container.innerHTML = paragraphs
        .map(p => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
        .join('')
      sec.style.display = ''
    }
  }

  // 4. Test Notes
  const notes = reviewData.testNotes
  if (notes && notes.trim()) {
    const sec = $('testNotesSection')
    const el = $('testNotesBody')
    if (sec && el) {
      el.textContent = notes
      sec.style.display = ''
    }
  }
}

// ── Watchlist star button ────────────────────────────────────
function addWatchlistStar(site) {
  const nameEl = $('siteName')
  if (!nameEl || !nameEl.parentNode) return

  // Guard against duplicate injection on re-render
  if (document.getElementById('detailStarBtn')) return

  const isStarred = isWatched(site.slug)
  const btn = document.createElement('button')
  btn.id = 'detailStarBtn'
  btn.className = 'sc-star ' + (isStarred ? 'active' : '')
  btn.style.cssText = 'display:inline-flex;width:36px;height:36px;font-size:0.95rem;margin-left:0.6rem;vertical-align:middle;'
  btn.setAttribute('aria-label', isStarred ? 'Remove from watchlist' : 'Add to watchlist')
  btn.innerHTML = `<i class="${isStarred ? 'fas' : 'far'} fa-star"></i>`

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    const nowActive = toggleWatch(site.slug)
    btn.classList.toggle('active', nowActive)
    btn.classList.add('pulse')
    setTimeout(() => btn.classList.remove('pulse'), 500)
    btn.setAttribute('aria-label', nowActive ? 'Remove from watchlist' : 'Add to watchlist')
    btn.querySelector('i').className = nowActive ? 'fas fa-star' : 'far fa-star'
    toast(nowActive ? '⭐ Added to watchlist' : 'Removed from watchlist')
  })

  nameEl.insertAdjacentElement('afterend', btn)
}

// ── Similar sites ────────────────────────────────────────────
async function loadSimilar(category, excludeSlug) {
  try {
    const res = await fetch(`/api/sites?category=${encodeURIComponent(category)}&per_page=8`)
    const json = await res.json()
    if (!json.ok) return

    const others = (json.data || []).filter(s => s.slug !== excludeSlug).slice(0, 4)
    if (!others.length) return

    const sec = $('similarSection')
    const list = $('similarList')
    if (!sec || !list) return

    sec.style.display = ''
    list.innerHTML = others.map(s => {
      const t = s.trustScore
      const fav = buildFaviconImg(s, 32, initials(s.name)) || esc(initials(s.name))
      return `
        <a href="/site/${esc(s.slug)}" class="similar-card">
          <div class="similar-logo">${fav}</div>
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
  document.querySelectorAll('.vote-btn-large').forEach(btn => {
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

  const counter = btn.querySelector('[data-count]')
  const current = parseInt(counter?.textContent, 10) || 0
  if (counter) counter.textContent = current + 1

  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(site.slug)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote, fingerprint: fp }),
    })
    const json = await res.json()

    if (!res.ok || !json.ok) {
      if (counter) counter.textContent = current
      btn.classList.remove('voted')
      toast(json.error || 'Vote failed', 'error')
      return
    }

    const data = json.data || {}

    document.querySelectorAll('[data-count]').forEach(el => {
      if (data.counts) el.textContent = data.counts[el.dataset.count] ?? 0
    })

    if (typeof data.trustScore === 'number') {
      const trustBox = $('siteTrust')
      const trustNum = $('trustNum')
      if (trustBox) trustBox.className = 'site-head__trust ' + trustClass(data.trustScore)
      if (trustNum) trustNum.textContent = data.trustScore
    }

    document.querySelectorAll('.vote-btn-large').forEach(b => {
      b.classList.toggle('voted', b.dataset.vote === data.yourVote)
    })

    toast('Thanks for voting!', 'success')
  } catch (err) {
    console.error(err)
    if (counter) counter.textContent = current
    btn.classList.remove('voted')
    toast('Network error — try again', 'error')
  }
}

// ── Boot ─────────────────────────────────────────────────────
load()
