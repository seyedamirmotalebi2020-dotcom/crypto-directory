// public/js/live-feed.js

const POLL_MS = 15000
const MAX_ITEMS = 10

const els = {
  list:  document.getElementById('liveFeedList'),
  stats: document.getElementById('liveStats'),
}

let pollTimer = null
let lastTopId = null
let seenIds = new Set()

// ── Helpers ──────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 5)   return 'just now'
  if (s < 60)  return s + 's ago'
  const m = Math.floor(s / 60)
  if (m < 60)  return m + 'm ago'
  const h = Math.floor(m / 60)
  if (h < 24)  return h + 'h ago'
  const d = Math.floor(h / 24)
  return d + 'd ago'
}

function voteIcon(vote) {
  switch (vote) {
    case 'trustworthy': return { cls: 'trustworthy', icon: 'fa-thumbs-up',      label: 'trustworthy' }
    case 'scam':        return { cls: 'scam',        icon: 'fa-thumbs-down',    label: 'scam' }
    case 'unsure':      return { cls: 'unsure',      icon: 'fa-circle-question', label: 'unsure' }
    default:            return { cls: 'unsure',      icon: 'fa-circle-question', label: 'vote' }
  }
}

function renderItem(item, isFresh) {
  const v = voteIcon(item.vote)
  const fresh = isFresh ? ' fresh' : ''
  return `
    <a class="live-item${fresh}" href="/site/${esc(item.siteSlug)}" data-id="${item.id}">
      <span class="live-item__icon ${v.cls}" aria-hidden="true">
        <i class="fas ${v.icon}"></i>
      </span>
      <span class="live-item__text">
        <strong>${esc(item.siteName)}</strong> marked ${v.label}
      </span>
      <span class="live-item__time">${esc(relativeTime(item.timestamp))}</span>
    </a>
  `
}

function updateStats(stats) {
  if (!els.stats) return
  if (stats.total === 0) {
    els.stats.textContent = ''
    return
  }
  if (stats.lastHour > 0) {
    els.stats.textContent = `${stats.lastHour} vote${stats.lastHour === 1 ? '' : 's'} this hour`
  } else if (stats.last24h > 0) {
    els.stats.textContent = `${stats.last24h} today · ${stats.total} total`
  } else {
    els.stats.textContent = `${stats.total} total`
  }
}

function renderEmpty() {
  els.list.innerHTML = `
    <div class="live-feed__empty">
      <i class="fas fa-bolt" aria-hidden="true"></i>
      <span>No votes yet — be the first!</span>
    </div>
  `
}

// ── Rendering ────────────────────────────────────────────────
function render(data) {
  updateStats(data.stats)

  const items = (data.items || []).slice(0, MAX_ITEMS)

  if (items.length === 0) {
    renderEmpty()
    return
  }

  const newTopId = items[0]?.id
  const isFirstLoad = lastTopId === null
  const topChanged  = !isFirstLoad && newTopId !== lastTopId

  // On first load: just render everything
  if (isFirstLoad) {
    els.list.innerHTML = items.map((it) => renderItem(it, false)).join('')
    items.forEach((it) => seenIds.add(it.id))
    lastTopId = newTopId
    return
  }

  // Subsequent loads: if nothing new, just refresh the timestamps
  if (!topChanged) {
    // Re-render in place to update "12s ago" style timestamps without animation
    els.list.innerHTML = items.map((it) => renderItem(it, false)).join('')
    return
  }

  // Something new! Find items we haven't seen yet
  const freshItems = []
  for (const it of items) {
    if (seenIds.has(it.id)) break
    freshItems.push(it)
  }

  if (freshItems.length === 0) {
    // The top changed but no unseen items (shouldn't happen, but safe fallback)
    els.list.innerHTML = items.map((it) => renderItem(it, false)).join('')
    lastTopId = newTopId
    return
  }

  // Prepend fresh items, keep older ones
  const freshHtml = freshItems
    .reverse() // oldest first so they stack correctly
    .map((it) => renderItem(it, true))
    .join('')

  // Update times on existing items by re-rendering the whole list, but mark only fresh ones
  const existingIds = new Set(freshItems.map((it) => it.id))
  const restHtml = items
    .filter((it) => !existingIds.has(it.id))
    .map((it) => renderItem(it, false))
    .join('')

  els.list.innerHTML = freshHtml + restHtml
  freshItems.forEach((it) => seenIds.add(it.id))
  lastTopId = newTopId
}

// ── Polling ──────────────────────────────────────────────────
async function fetchActivity() {
  try {
    const res = await fetch('/api/activity', { cache: 'no-store' })
    if (!res.ok) return
    const json = await res.json()
    if (!json.ok) return
    render(json.data)
  } catch (err) {
    // Silent fail — the widget just stays as-is
    console.debug('Live feed fetch failed:', err.message)
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(fetchActivity, POLL_MS)
}

function stopPolling() {
  if (!pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
}

// ── Boot ─────────────────────────────────────────────────────
function init() {
  if (!els.list) return

  fetchActivity().then(startPolling)

  // Pause when tab is hidden — no point polling a page nobody is looking at
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPolling()
    } else {
      fetchActivity()
      startPolling()
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}