// public/js/watchlist-share.js
// Renders a shared watchlist from the ?slugs= query param.
// Includes "Save all to my watchlist" for the recipient.

import { addToWatchlist, getWatchlist } from './watchlist.js'
import { buildFaviconImg, initials } from './favicon.js'
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

function initials(name) {
  return (name || '?')
    .split(/\s+/).slice(0, 2)
    .map((w) => w[0] || '').join('').toUpperCase() || '?'
}

function trustClass(score) {
  if (score == null) return 'unknown'
  if (score >= 80) return 'good'
  if (score >= 50) return 'mid'
  return 'low'
}


// ── Parse slugs from URL ──────────────────────────────────────
function parseSlugs() {
  const params = new URLSearchParams(location.search)
  const raw = params.get('slugs') || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s, i, arr) => arr.indexOf(s) === i) // dedupe
    .slice(0, 60) // hard cap for URL sanity
}

// ── State ─────────────────────────────────────────────────────
const state = {
  allSlugs: [],
  sites: [],
  filtered: [],
  search: '',
  sort: 'trust',
}

// ── Fetch and render ─────────────────────────────────────────
async function loadShared() {
  state.allSlugs = parseSlugs()

  if (state.allSlugs.length === 0) {
    $('loadingGrid').style.display = 'none'
    $('emptyState').style.display = 'block'
    $('shareLead').textContent = 'This link doesn\'t contain any sites.'
    return
  }

  $('shareLead').textContent = `Loading ${state.allSlugs.length} site${state.allSlugs.length === 1 ? '' : 's'}…`

  // Fetch each site via the API (parallel)
  const results = await Promise.all(
    state.allSlugs.map(async (slug) => {
      try {
        const res = await fetch(`/api/sites/${encodeURIComponent(slug)}`)
        if (!res.ok) return null
        const json = await res.json()
        return json.ok && json.data ? json.data : null
      } catch {
        return null
      }
    })
  )

  state.sites = results.filter(Boolean)

  if (state.sites.length === 0) {
    $('loadingGrid').style.display = 'none'
    $('emptyState').style.display = 'block'
    $('shareLead').textContent = 'None of the sites in this list could be found.'
    return
  }

  applyFilterAndSort()
  renderHeader()
  renderGrid()
  showActions()
}

function renderHeader() {
  const found = state.sites.length
  const requested = state.allSlugs.length
  const missing = requested - found

  let lead = `A curated list of ${found} crypto earning site${found === 1 ? '' : 's'}. `
  lead += `Each has been checked for current payout evidence and community trust.`

  if (missing > 0) {
    lead += ` (${missing} of the original ${requested} could not be found.)`
  }

  $('shareLead').textContent = lead

  const stats = []
  const active = state.sites.filter((s) => s.status === 'active').length
  const totalVotes = state.sites.reduce((n, s) => n + (s.totalVotes || 0), 0)
  if (active > 0)      stats.push(`<span><i class="fas fa-circle-check"></i> ${active} active</span>`)
  if (totalVotes > 0)  stats.push(`<span><i class="fas fa-thumbs-up"></i> ${totalVotes} votes cast</span>`)
  stats.push(`<span><i class="fas fa-globe"></i> ${found} site${found === 1 ? '' : 's'}</span>`)
  $('shareStats').innerHTML = stats.join('')
}

function showActions() {
  $('shareActions').style.display = 'flex'
  $('shareFilters').style.display = ''
  $('shareResultsHeader').style.display = ''

  // ── Save all button ──
  const saveAllBtn = $('saveAllBtn')
  const saveLabel = saveAllBtn.querySelector('span')
  const existing = new Set(getWatchlist())
  const newCount = state.sites.filter((s) => !existing.has(s.slug)).length

  if (newCount === 0 && state.sites.length > 0) {
    saveAllBtn.classList.add('saved')
    saveLabel.textContent = 'Already in your watchlist'
    saveAllBtn.disabled = true
  } else {
    saveLabel.textContent = `Save all ${state.sites.length} to my watchlist`
    saveAllBtn.addEventListener('click', () => {
      state.sites.forEach((s) => addToWatchlist(s.slug))
      saveAllBtn.classList.add('saved')
      saveLabel.textContent = 'Saved to your watchlist ✓'
      saveAllBtn.disabled = true
      toast(`⭐ Added ${state.sites.length} sites to your watchlist`, 'success')
    })
  }

  // ── Copy link button ──
  const copyBtn = $('copyBtn')
  copyBtn.addEventListener('click', () => {
    const url = location.href
    copyToClipboard(url, () => {
      copyBtn.classList.add('copied')
      copyBtn.querySelector('span').textContent = 'Link copied ✓'
      toast('Link copied to clipboard', 'success')
      setTimeout(() => {
        copyBtn.classList.remove('copied')
        copyBtn.querySelector('span').textContent = 'Copy link'
      }, 2200)
    })
  })

  // ── Search + sort ──
  $('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase()
    applyFilterAndSort()
    renderGrid()
    updateResultCount()
  })

  $('fSort').addEventListener('change', (e) => {
    state.sort = e.target.value
    applyFilterAndSort()
    renderGrid()
  })
}

function copyToClipboard(text, done) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done))
  } else {
    fallback(text, done)
  }
}
function fallback(text, done) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try { document.execCommand('copy'); done() } catch { toast('Could not copy — copy manually') }
  document.body.removeChild(ta)
}

// ── Filter and sort ───────────────────────────────────────────
function applyFilterAndSort() {
  let list = [...state.sites]

  if (state.search) {
    const q = state.search
    list = list.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    )
  }

  if (state.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    list.sort((a, b) => {
      const at = a.trustScore, bt = b.trustScore
      if (at == null && bt == null) return a.name.localeCompare(b.name)
      if (at == null) return 1
      if (bt == null) return -1
      if (bt !== at) return bt - at
      return a.name.localeCompare(b.name)
    })
  }

  state.filtered = list
}

function updateResultCount() {
  $('resultCount').textContent = state.filtered.length
}

// ── Card rendering ────────────────────────────────────────────
function formatMin(min, coin) {
  if (min == null) return null
  const n = Number(min)
  if (!Number.isFinite(n)) return null
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 }) + ' ' + coin
}

function formatInterval(sec) {
  if (!sec) return null
  const s = Number(sec)
  if (s < 60)    return s + 's'
  if (s < 3600)  return Math.round(s / 60) + ' min'
  if (s < 86400) return Math.round(s / 3600) + ' h'
  return Math.round(s / 86400) + ' d'
}

function renderGrid() {
  if (state.filtered.length === 0) {
    $('siteGrid').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-magnifying-glass"></i>
        <h3>No sites match "${esc(state.search)}"</h3>
        <p>Try a different search term.</p>
      </div>`
    updateResultCount()
    return
  }

  $('siteGrid').innerHTML = state.filtered.map((site) => renderCard(site)).join('')
  updateResultCount()
}

function renderCard(site) {
  const trust = site.trustScore
  const trustCls = trustClass(trust)
  const trustLabel = trust == null ? '—' : trust

  const coins = [...new Set((site.offers || []).map((o) => o.coin))].slice(0, 4)
  const payments = [...new Set((site.offers || []).map((o) => o.paymentName))].slice(0, 2)
  const features = (site.features || []).slice(0, 2).map((f) => f.name)
  const primary = (site.offers || [])[0] || null
  const minStr = primary ? formatMin(primary.minWithdrawal, primary.coin) : null
  const intStr = primary ? formatInterval(primary.claimInterval) : null

  const logoHtml = buildFaviconImg(site, 64, initials(site.name)) || esc(initials(site.name))

  const vc = site.voteCounts || { trustworthy: 0, scam: 0, unsure: 0 }

  return `
    <article class="site-card reveal visible" data-slug="${esc(site.slug)}">
      <header class="sc-header">
        <div class="sc-logo">${logoHtml}</div>
        <div class="sc-meta">
          <h2 class="sc-name" title="${esc(site.name)}">
            <a href="/site/${esc(site.slug)}" style="color:inherit;text-decoration:none;">${esc(site.name)}</a>
          </h2>
          <span class="sc-status ${esc(site.status)}">${esc(site.status.replace('_', ' '))}</span>
        </div>
        <div class="sc-trust ${trustCls}" aria-label="Trust score ${trustLabel}">
          <span class="num">${trustLabel}</span>
          <span class="lbl">TRUST</span>
        </div>
      </header>

      ${site.description ? `<a class="sc-desc-link" href="/site/${esc(site.slug)}"><p class="sc-desc">${esc(site.description)}</p></a>` : ''}

      ${(coins.length || payments.length || features.length) ? `
        <div class="sc-chips">
          ${coins.map((c) => `<span class="chip chip-coin">${esc(c)}</span>`).join('')}
          ${payments.map((p) => `<span class="chip chip-payment">${esc(p)}</span>`).join('')}
          ${features.map((f) => `<span class="chip chip-feature">${esc(f)}</span>`).join('')}
        </div>` : ''}

      ${(minStr || intStr) ? `
        <div class="sc-offer">
          ${minStr ? `<span><i class="fas fa-arrow-down"></i> Min: <strong>${esc(minStr)}</strong></span>` : ''}
          ${intStr ? `<span><i class="fas fa-clock"></i> Claims: <strong>${esc(intStr)}</strong></span>` : ''}
        </div>` : ''}

      <footer class="sc-footer">
        <div class="vote-group" role="group" aria-label="Vote counts">
          <span class="vote-btn" style="cursor:default;">
            <i class="fas fa-thumbs-up"></i><span class="vc">${vc.trustworthy ?? 0}</span>
          </span>
          <span class="vote-btn" style="cursor:default;">
            <i class="fas fa-thumbs-down"></i><span class="vc">${vc.scam ?? 0}</span>
          </span>
          <span class="vote-btn" style="cursor:default;">
            <i class="fas fa-circle-question"></i><span class="vc">${vc.unsure ?? 0}</span>
          </span>
        </div>
        <a class="visit-btn" href="${esc(site.url)}" target="_blank" rel="noopener nofollow">
          Visit <i class="fas fa-arrow-up-right-from-square"></i>
        </a>
      </footer>
    </article>
  `
}

// ── Boot ─────────────────────────────────────────────────────
loadShared()