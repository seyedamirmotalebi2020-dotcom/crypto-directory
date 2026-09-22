// public/js/favicon.js

export function extractHostname(url) {
  try {
    return new URL(url).hostname
  } catch (e) {
    return ''
  }
}

/**
 * Build a list of candidate favicon URLs for a given site URL.
 * Tried in order by the browser — the first that loads wins.
 */
export function getFaviconCandidates(siteUrl, size) {
  const host = extractHostname(siteUrl)
  if (!host) return []
  const s = size || 64
  return [
    // 1. Google S2 — most coverage, but 404s for some domains
    'https://www.google.com/s2/favicons?sz=' + s + '&domain=' + host,
    // 2. DuckDuckGo — different index, catches what Google misses
    'https://icons.duckduckgo.com/ip3/' + host + '.ico',
    // 3. Direct favicon.ico — works for sites that host it at the root
    (siteUrl.indexOf('https://') === 0 ? siteUrl : 'https://' + host) + '/favicon.ico',
  ]
}

/**
 * Legacy single-URL getter. Kept for backwards compatibility.
 */
export function getFaviconUrl(siteUrl, size) {
  const list = getFaviconCandidates(siteUrl, size)
  return list[0] || ''
}

export function initials(name) {
  if (!name) return '?'
  return String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map(function (w) { return w[0] || '' })
    .join('')
    .toUpperCase() || '?'
}

/**
 * Build an <img> element that cycles through candidate URLs before giving up.
 * Returns '' if there are no candidates (caller should render initials).
 */
export function buildFaviconImg(site, size, fallbackText) {
  if (!site || !site.url) return ''
  const candidates = getFaviconCandidates(site.url, size)
  if (candidates.length === 0) return ''

  const fallback = (fallbackText || initials(site.name) || '?')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")

  const data = candidates.map(function (u) {
    return u.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  }).join('|')

  return (
    '<img src="' + data.split('|')[0] + '"' +
    ' data-favs="' + data + '"' +
    ' data-fav-i="0"' +
    ' alt="" loading="lazy"' +
    ' onerror="(function(img){' +
      'var list=img.dataset.favs.split(\'|\');' +
      'var i=parseInt(img.dataset.favI,10)+1;' +
      'if(i<list.length){img.dataset.favI=i;img.src=list[i];}' +
      'else{img.style.display=\'none\';' +
        'if(img.parentNode&&!img.parentNode.dataset.fallbackShown){' +
          'img.parentNode.dataset.fallbackShown=\'1\';' +
          'img.parentNode.textContent=\'' + fallback + '\';' +
        '}' +
      '}' +
    '})(this)" />'
  )
}

/**
 * Old API — returns a single URL. Still used in some call sites.
 */
export function bestLogoUrl(site, size) {
  if (site && site.logoUrl) return site.logoUrl
  return getFaviconUrl(site && site.url, size)
}