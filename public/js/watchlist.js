// public/js/watchlist.js
// Shared watchlist manager — stored in localStorage, no backend.

const KEY = 'ced_watchlist_v1'
const listeners = new Set()

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch (err) {
    console.warn('Watchlist write failed:', err)
  }
  listeners.forEach((fn) => { try { fn(list) } catch (_) {} })
}

export function getWatchlist() {
  return read()
}

export function isWatched(slug) {
  return read().includes(slug)
}

export function addToWatchlist(slug) {
  const list = read()
  if (!list.includes(slug)) {
    list.push(slug)
    write(list)
  }
  return list
}

export function removeFromWatchlist(slug) {
  const list = read().filter((s) => s !== slug)
  write(list)
  return list
}

export function toggleWatch(slug) {
  const list = read()
  const next = list.includes(slug)
    ? list.filter((s) => s !== slug)
    : [...list, slug]
  write(next)
  return next.includes(slug)
}

export function getWatchlistCount() {
  return read().length
}

export function onChange(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

// Sync across tabs
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    const list = read()
    listeners.forEach((fn) => { try { fn(list) } catch (_) {} })
  }
})