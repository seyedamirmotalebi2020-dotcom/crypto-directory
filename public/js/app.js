// public/js/app.js
// Directory controller — used by the homepage, the crypto page, and every
// /earn/* category page. Handles search, filters, sort, pagination, votes,
// watchlist, and share. Every DOM lookup is guarded because some pages
// (e.g. the hub) don't render the site grid at all.

import {
  isWatched,
  toggleWatch,
  getWatchlist,
  onChange,
  getWatchlistCount,
} from './watchlist.js';

// ───────── State ─────────
const state = {
  filters: {
    q:         '',
    category:  '',
    coin:      '',
    payment:   '',
    feature:   '',
    status:    '',
    sort:      'trust',
    watched:   false,
  },
  page:       1,
  perPage:    12,
  total:      0,
  totalPages: 0,
  sites:      [],
  votes:      {},
  loading:    false,
};

// ───────── Element refs (may be null on some pages) ─────────
const $ = (id) => document.getElementById(id);

const els = {
  grid:        $('siteGrid'),
  loadingGrid: $('loadingGrid'),
  pagination:  $('pagination'),
  resultCount: $('resultCount'),
  pageInfo:    $('pageInfo'),
  activeChips: $('activeChips'),
  search:      $('searchInput'),
  searchClear: $('searchClear'),
  toast:       $('toast'),
  fCategory:   $('fCategory'),
  fCoin:       $('fCoin'),
  fPayment:    $('fPayment'),
  fFeature:    $('fFeature'),
  fStatus:     $('fStatus'),
  fSort:       $('fSort'),
  resetBtn:    $('resetBtn'),
  statTotal:   $('statTotal'),
  statActive:  $('statActive'),
  statVotes:   $('statVotes'),
};

// If there's no site grid on this page, don't do anything.
if (!els.grid) {
  // eslint-disable-next-line no-console
  console.debug('[app.js] No site grid on this page — skipping init.');
} else {
  boot();
}

// ───────── Helpers ─────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toast(msg, type = '') {
  if (!els.toast) return;
  els.toast.textContent = msg;
  els.toast.className = 'toast show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function debounce(fn, ms = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getFingerprint() {
  let fp = localStorage.getItem('ced_fp');
  if (!fp) {
    fp =
      (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
      '-' +
      (navigator.userAgent || '').length;
    localStorage.setItem('ced_fp', fp);
  }
  return fp;
}

function initials(name) {
  return (
    (name || '?')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase() || '?'
  );
}

function trustClass(score) {
  if (score == null) return 'unknown';
  if (score >= 80) return 'good';
  if (score >= 50) return 'mid';
  return 'low';
}

function formatMin(min, coin) {
  if (min == null) return null;
  const n = Number(min);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 }) + ' ' + coin;
}

function formatInterval(sec) {
  if (!sec) return null;
  const s = Number(sec);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.round(s / 60) + ' min';
  if (s < 86400) return Math.round(s / 3600) + ' h';
  return Math.round(s / 86400) + ' d';
}

// ───────── Data loading ─────────
async function loadReference() {
  const [cats, coins, payments, features] = await Promise.all([
    fetch('/api/categories').then((r) => r.json()).catch(() => ({ data: [] })),
    fetch('/api/coins').then((r) => r.json()).catch(() => ({ data: [] })),
    fetch('/api/payment-methods').then((r) => r.json()).catch(() => ({ data: [] })),
    fetch('/api/features').then((r) => r.json()).catch(() => ({ data: [] })),
  ]);

  // Categories — flatten the tree
  const flatCats = [];
  (function walk(nodes, depth = 0) {
    for (const n of nodes || []) {
      flatCats.push({ slug: n.slug, name: n.name, depth });
      if (n.children?.length) walk(n.children, depth + 1);
    }
  })(cats.data || []);

  if (els.fCategory) {
    for (const c of flatCats) {
      const opt = document.createElement('option');
      opt.value = c.slug;
      opt.textContent = (c.depth > 0 ? '— '.repeat(c.depth) : '') + c.name;
      els.fCategory.appendChild(opt);
    }
  }

  if (els.fCoin) {
    for (const c of coins.data || []) {
      const opt = document.createElement('option');
      opt.value = c.symbol;
      opt.textContent = `${c.symbol} — ${c.name}`;
      els.fCoin.appendChild(opt);
    }
  }

  if (els.fPayment) {
    for (const p of payments.data || []) {
      const opt = document.createElement('option');
      opt.value = p.slug;
      opt.textContent = p.name;
      els.fPayment.appendChild(opt);
    }
  }

  if (els.fFeature) {
    for (const f of features.data || []) {
      const opt = document.createElement('option');
      opt.value = f.slug;
      opt.textContent = f.name;
      els.fFeature.appendChild(opt);
    }
  }
}

async function loadSites() {
  state.loading = true;
  renderSkeletons();

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(state.filters)) {
    if (k === 'watched') continue;
    if (v) params.set(k, v);
  }

  if (state.filters.watched) {
    params.set('per_page', '500');
    params.set('page', '1');
  } else {
    params.set('page', state.page);
    params.set('per_page', state.perPage);
  }

  try {
    const res = await fetch('/api/sites?' + params.toString());
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Failed to load');

    let sites = json.data || [];
    let total = json.meta?.total ?? sites.length;
    let totalPages = json.meta?.total_pages ?? 1;

    if (state.filters.watched) {
      const watched = getWatchlist();
      sites = sites.filter((s) => watched.includes(s.slug));
      total = sites.length;
      totalPages = 1;
    }

    state.sites = sites;
    state.total = total;
    state.totalPages = totalPages;

    renderSites();
    renderPagination();
    updateResultCount();
    updateHeroStats();
    syncUrl();
  } catch (err) {
    console.error(err);
    if (els.grid) {
      els.grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-triangle-exclamation"></i>
          <h3>Couldn't load sites</h3>
          <p>${esc(err.message)}</p>
        </div>`;
    }
  } finally {
    state.loading = false;
  }
}

// ───────── Rendering ─────────
function renderSkeletons() {
  if (!els.loadingGrid) return;
  els.loadingGrid.innerHTML = '';
  const count = Math.min(state.perPage, 9);
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    els.loadingGrid.appendChild(s);
  }
  if (els.grid) {
    els.grid.innerHTML = '';
    els.grid.appendChild(els.loadingGrid);
  }
}

function renderSites() {
  if (!els.grid) return;

  if (!state.sites.length) {
    if (state.filters.watched) {
      els.grid.innerHTML = `
        <div class="watchlist-empty">
          <i class="far fa-star"></i>
          <h3>Your watchlist is empty</h3>
          <p>Click the <i class="far fa-star" style="color:#f59e0b;font-size:0.9em;"></i> on any site card to add it here. Your watchlist is saved in this browser — no account needed.</p>
        </div>`;
    } else {
      els.grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-magnifying-glass"></i>
          <h3>No sites match your filters</h3>
          <p>Try clearing a filter or widening your search.</p>
        </div>`;
    }
    return;
  }

  els.grid.innerHTML = state.sites.map((s) => renderCard(s)).join('');
  bindVoteHandlers();
  bindStarHandlers();
}

function renderCard(site) {
  const trust = site.trustScore;
  const trustCls = trustClass(trust);
  const trustLabel = trust == null ? '—' : trust;

  const coins = [...new Set((site.offers || []).map((o) => o.coin))].slice(0, 4);
  const payments = [...new Set((site.offers || []).map((o) => o.paymentName))].slice(0, 2);
  const features = (site.features || []).slice(0, 2).map((f) => f.name);

  const primary = (site.offers || [])[0] || null;
  const minStr = primary ? formatMin(primary.minWithdrawal, primary.coin) : null;
  const intStr = primary ? formatInterval(primary.claimInterval) : null;

  const voteCounts = site.voteCounts || { trustworthy: 0, scam: 0, unsure: 0 };
  const userVote = state.votes[site.slug]?.userVote || '';
  const isStarred = isWatched(site.slug);

  // Favicon chain (Google → DuckDuckGo → direct /favicon.ico → initials)
  let host = '';
  try {
    host = new URL(site.url).hostname;
  } catch {
    host = '';
  }

  const candidates = host
    ? [
        `https://www.google.com/s2/favicons?sz=64&domain=${host}`,
        `https://icons.duckduckgo.com/ip3/${host}.ico`,
        `https://${host}/favicon.ico`,
      ]
    : [];

  const fallbackText = esc(initials(site.name));
  const dataFavs = candidates.map((u) => esc(u)).join('|');

  const logoHtml = candidates.length
    ? `<img src="${esc(candidates[0])}"
           data-favs="${dataFavs}"
           data-fav-i="0"
           alt=""
           loading="lazy"
           onerror="(function(img){
             var list=img.dataset.favs.split('|');
             var i=parseInt(img.dataset.favI,10)+1;
             if(i<list.length){img.dataset.favI=i;img.src=list[i];}
             else{img.style.display='none';if(img.parentNode){img.parentNode.textContent='${fallbackText}';}}
           })(this)" />`
    : fallbackText;

  return `
    <article class="site-card reveal" data-slug="${esc(site.slug)}">
      <header class="sc-header">
        <div class="sc-logo">${logoHtml}</div>
        <div class="sc-meta">
          <h2 class="sc-name" title="${esc(site.name)}">
            <a href="/site/${esc(site.slug)}" style="color:inherit;text-decoration:none;">${esc(site.name)}</a>
          </h2>
          <span class="sc-status ${esc(site.status)}">${esc(site.status.replace('_', ' '))}</span>
        </div>
        <button class="sc-star ${isStarred ? 'active' : ''}"
                data-slug="${esc(site.slug)}"
                aria-label="${isStarred ? 'Remove from watchlist' : 'Add to watchlist'}">
          <i class="${isStarred ? 'fas' : 'far'} fa-star"></i>
        </button>
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
        <div class="vote-group" role="group" aria-label="Vote on trustworthiness">
          <button class="vote-btn ${userVote === 'trustworthy' ? 'voted' : ''}"
                  data-vote="trustworthy" data-slug="${esc(site.slug)}"
                  aria-label="Vote trustworthy">
            <i class="fas fa-thumbs-up"></i><span class="vc">${voteCounts.trustworthy ?? 0}</span>
          </button>
          <button class="vote-btn ${userVote === 'scam' ? 'voted' : ''}"
                  data-vote="scam" data-slug="${esc(site.slug)}"
                  aria-label="Vote scam">
            <i class="fas fa-thumbs-down"></i><span class="vc">${voteCounts.scam ?? 0}</span>
          </button>
          <button class="vote-btn ${userVote === 'unsure' ? 'voted' : ''}"
                  data-vote="unsure" data-slug="${esc(site.slug)}"
                  aria-label="Vote unsure">
            <i class="fas fa-circle-question"></i><span class="vc">${voteCounts.unsure ?? 0}</span>
          </button>
        </div>
        <a class="visit-btn" href="${esc(site.url)}" target="_blank" rel="noopener nofollow">
          Visit <i class="fas fa-arrow-up-right-from-square"></i>
        </a>
      </footer>
    </article>
  `;
}

// ───────── Voting ─────────
function bindVoteHandlers() {
  if (!els.grid) return;
  els.grid.querySelectorAll('.vote-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleVote(btn));
  });
}

async function handleVote(btn) {
  const slug = btn.dataset.slug;
  const vote = btn.dataset.vote;

  const card = btn.closest('.site-card');
  if (!card) return;

  card.querySelectorAll('.vote-btn').forEach((b) => b.classList.remove('voted'));
  btn.classList.add('voted', 'pulse');
  setTimeout(() => btn.classList.remove('pulse'), 500);

  const prevVote = state.votes[slug]?.userVote || '';
  const counts = { ...(state.votes[slug]?.counts || { trustworthy: 0, scam: 0, unsure: 0 }) };

  if (prevVote && prevVote !== vote) {
    counts[prevVote] = Math.max(0, (counts[prevVote] || 0) - 1);
  }
  if (prevVote !== vote) {
    counts[vote] = (counts[vote] || 0) + 1;
  }

  card.querySelectorAll('.vote-btn').forEach((b) => {
    const v = b.dataset.vote;
    const span = b.querySelector('.vc');
    if (span) span.textContent = counts[v] ?? 0;
  });

  state.votes[slug] = { userVote: vote, counts };

  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(slug)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote, fingerprint: getFingerprint() }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.ok) {
      state.votes[slug] = { userVote: prevVote, counts };
      card.querySelectorAll('.vote-btn').forEach((b) => {
        b.classList.toggle('voted', b.dataset.vote === prevVote);
        const span = b.querySelector('.vc');
        if (span) span.textContent = counts[b.dataset.vote] ?? 0;
      });
      toast(json.error || 'Vote failed', 'error');
      return;
    }

    if (json.data) {
      state.votes[slug] = {
        userVote: json.data.yourVote || vote,
        counts: json.data.counts || counts,
      };
      card.querySelectorAll('.vote-btn').forEach((b) => {
        b.classList.toggle('voted', b.dataset.vote === json.data.yourVote);
        const span = b.querySelector('.vc');
        if (span && json.data.counts)
          span.textContent = json.data.counts[b.dataset.vote] ?? 0;
      });
      if (typeof json.data.trustScore === 'number') {
        const trust = card.querySelector('.sc-trust');
        if (trust) {
          trust.className = `sc-trust ${trustClass(json.data.trustScore)}`;
          const num = trust.querySelector('.num');
          if (num) num.textContent = json.data.trustScore;
        }
      }
      toast('Thanks for voting!', 'success');
    }
  } catch (err) {
    console.error(err);
    toast('Network error — try again', 'error');
  }
}

// ───────── Watchlist ─────────
function bindStarHandlers() {
  if (!els.grid) return;
  els.grid.querySelectorAll('.sc-star').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const slug = btn.dataset.slug;
      const nowActive = toggleWatch(slug);

      btn.classList.toggle('active', nowActive);
      btn.classList.add('pulse');
      setTimeout(() => btn.classList.remove('pulse'), 500);
      btn.setAttribute('aria-label', nowActive ? 'Remove from watchlist' : 'Add to watchlist');
      const icon = btn.querySelector('i');
      if (icon) icon.className = nowActive ? 'fas fa-star' : 'far fa-star';

      updateWatchlistButton();
      toast(nowActive ? '⭐ Added to watchlist' : 'Removed from watchlist');

      if (state.filters.watched && !nowActive) {
        const card = btn.closest('.site-card');
        if (card) {
          card.style.transition = 'opacity 0.25s, transform 0.25s';
          card.style.opacity = '0';
          card.style.transform = 'translateY(-8px)';
          setTimeout(() => loadSites(), 260);
        }
      }
    });
  });
}

function updateWatchlistButton() {
  const btn = document.getElementById('watchlistBtn');
  const countEl = document.getElementById('watchlistCount');
  if (!btn || !countEl) return;
  const n = getWatchlistCount();
  countEl.textContent = n;
  btn.classList.toggle('active', state.filters.watched);
}

// ───────── Pagination ─────────
function renderPagination() {
  if (!els.pagination) return;
  const total = state.totalPages;
  const cur = state.page;
  if (total <= 1) {
    els.pagination.innerHTML = '';
    return;
  }

  const pages = [];
  const push = (p) => pages.push(p);
  push(1);
  for (let i = cur - 1; i <= cur + 1; i++) {
    if (i > 1 && i < total) push(i);
  }
  if (total > 1) push(total);
  const unique = [...new Set(pages)].sort((a, b) => a - b);

  let html = `<button class="page-btn" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>
    <i class="fas fa-chevron-left"></i>
  </button>`;

  let last = 0;
  for (const p of unique) {
    if (p - last > 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`;
    last = p;
  }

  html += `<button class="page-btn" data-page="${cur + 1}" ${cur === total ? 'disabled' : ''}>
    <i class="fas fa-chevron-right"></i>
  </button>`;

  els.pagination.innerHTML = html;

  els.pagination.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (!p || p === state.page || p < 1 || p > total) return;
      state.page = p;
      loadSites();
      document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function updateResultCount() {
  if (els.resultCount) els.resultCount.textContent = state.total.toLocaleString();
  if (els.pageInfo) {
    if (state.totalPages > 1) {
      els.pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
    } else {
      els.pageInfo.textContent = '';
    }
  }
}

function updateHeroStats() {
  if (els.statTotal) els.statTotal.textContent = state.total.toLocaleString();
  if (els.statActive) {
    const active = state.sites.filter((s) => s.status === 'active').length;
    els.statActive.textContent = active.toLocaleString();
  }
  if (els.statVotes) {
    const totalVotes = state.sites.reduce((n, s) => n + (s.totalVotes || 0), 0);
    els.statVotes.textContent = totalVotes.toLocaleString();
  }
}

// ───────── Active filter chips ─────────
const FILTER_LABELS = {
  q:        'Search',
  category: 'Category',
  coin:     'Coin',
  payment:  'Payout',
  feature:  'Feature',
  status:   'Status',
};

function renderActiveChips() {
  if (!els.activeChips) return;

  const chips = [];
  for (const [k, v] of Object.entries(state.filters)) {
    if (!v || k === 'sort' || k === 'watched') continue;
    chips.push(`
      <button class="chip-remove" data-key="${k}">
        ${esc(FILTER_LABELS[k] || k)}: ${esc(v)}
        <i class="fas fa-times"></i>
      </button>
    `);
  }

  if (chips.length === 0) {
    els.activeChips.classList.remove('show');
    els.activeChips.innerHTML = '';
    return;
  }

  els.activeChips.classList.add('show');
  els.activeChips.innerHTML = chips.join('');

  els.activeChips.querySelectorAll('.chip-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      state.filters[key] = '';
      if (key === 'q' && els.search) els.search.value = '';

      const map = {
        category: els.fCategory,
        coin: els.fCoin,
        payment: els.fPayment,
        feature: els.fFeature,
        status: els.fStatus,
      };
      if (map[key]) map[key].value = '';

      state.page = 1;
      loadSites();
      renderActiveChips();
    });
  });
}

// ───────── URL sync ─────────
function syncUrl() {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(state.filters)) {
    if (v && k !== 'sort' && k !== 'watched') params.set(k, v);
  }
  if (state.filters.sort && state.filters.sort !== 'trust') {
    params.set('sort', state.filters.sort);
  }
  if (state.page > 1) params.set('page', state.page);

  const search = params.toString();
  const url = search ? '?' + search : location.pathname;
  history.replaceState(null, '', url);
}

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  for (const key of ['q', 'category', 'coin', 'payment', 'feature', 'status', 'sort']) {
    if (params.get(key)) state.filters[key] = params.get(key);
  }
  state.page = parseInt(params.get('page') || '1', 10) || 1;

  // Read category from the URL path: /earn/cashback → category = 'cashback'
  const pathMatch = location.pathname.match(/^\/earn\/([^/]+)\/?$/);
  if (pathMatch && !params.get('category')) {
    state.filters.category = pathMatch[1];
  }

  if (els.search)    els.search.value    = state.filters.q || '';
  if (els.fCategory) els.fCategory.value = state.filters.category || '';
  if (els.fCoin)     els.fCoin.value     = state.filters.coin || '';
  if (els.fPayment)  els.fPayment.value  = state.filters.payment || '';
  if (els.fFeature)  els.fFeature.value  = state.filters.feature || '';
  if (els.fStatus)   els.fStatus.value   = state.filters.status || '';
  if (els.fSort)     els.fSort.value     = state.filters.sort || 'trust';
}

// ───────── Share ─────────
function handleShare() {
  const list = getWatchlist();

  if (list.length === 0) {
    toast('⭐ Star some sites first, then share your list');
    return;
  }

  const slugs = list.slice(0, 60).join(',');
  const url = `${location.origin}/watchlist.html?slugs=${encodeURIComponent(slugs)}`;

  if (navigator.share) {
    navigator.share({
      title: 'My Crypto Earn Watchlist',
      text: `Check out my ${list.length} curated earning sites`,
      url,
    }).catch((err) => {
      if (err.name !== 'AbortError') copyUrl(url);
    });
    return;
  }

  copyUrl(url);
}

function copyUrl(url) {
  const done = () => {
    toast('🔗 Shareable link copied to clipboard', 'success');
    setTimeout(() => {
      if (confirm('Link copied. Open the shared page in a new tab to preview?')) {
        window.open(url, '_blank', 'noopener');
      }
    }, 400);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch {
    toast('Could not copy — copy manually');
  }
  document.body.removeChild(ta);
}

// ───────── Events ─────────
function wireEvents() {
  if (els.search) {
    els.search.addEventListener('input', debounce((e) => {
      state.filters.q = e.target.value.trim();
      state.page = 1;
      if (els.searchClear) els.searchClear.classList.toggle('show', !!state.filters.q);
      loadSites();
      renderActiveChips();
    }, 400));
  }

  if (els.searchClear) {
    els.searchClear.addEventListener('click', () => {
      if (els.search) els.search.value = '';
      state.filters.q = '';
      state.page = 1;
      els.searchClear.classList.remove('show');
      loadSites();
      renderActiveChips();
      if (els.search) els.search.focus();
    });
  }

  const selectMap = [
    ['fCategory', 'category'],
    ['fCoin',     'coin'],
    ['fPayment',  'payment'],
    ['fFeature',  'feature'],
    ['fStatus',   'status'],
    ['fSort',     'sort'],
  ];
  for (const [id, key] of selectMap) {
    const el = $(id);
    if (!el) continue;
    el.addEventListener('change', (e) => {
      state.filters[key] = e.target.value;
      state.page = 1;
      loadSites();
      renderActiveChips();
    });
  }

  if (els.resetBtn) {
    els.resetBtn.addEventListener('click', () => {
      Object.keys(state.filters).forEach((k) => {
        if (k === 'sort') state.filters[k] = 'trust';
        else if (k === 'watched') state.filters[k] = false;
        else state.filters[k] = '';
      });
      if (els.search) els.search.value = '';
      if (els.searchClear) els.searchClear.classList.remove('show');
      if (els.fCategory) els.fCategory.value = '';
      if (els.fCoin)     els.fCoin.value = '';
      if (els.fPayment)  els.fPayment.value = '';
      if (els.fFeature)  els.fFeature.value = '';
      if (els.fStatus)   els.fStatus.value = '';
      if (els.fSort)     els.fSort.value = 'trust';
      state.page = 1;
      loadSites();
      renderActiveChips();
      toast('Filters reset');
    });
  }

  const watchlistBtn = document.getElementById('watchlistBtn');
  if (watchlistBtn) {
    watchlistBtn.addEventListener('click', () => {
      state.filters.watched = !state.filters.watched;
      state.page = 1;
      updateWatchlistButton();
      loadSites();
      renderActiveChips();
      toast(state.filters.watched ? '⭐ Showing your watchlist' : 'Showing all sites');
    });
  }

  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', handleShare);
  }
}

// ───────── Reveal ─────────
function initReveal() {
  if (!els.grid) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  const observe = () => {
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));
  };
  observe();

  new MutationObserver(observe).observe(els.grid, { childList: true, subtree: true });
}

// ───────── Boot ─────────
async function boot() {
  loadFromUrl();
  updateWatchlistButton();
  initReveal();
  wireEvents();

  try {
    await loadReference();
  } catch (err) {
    console.warn('Reference data failed:', err);
  }

  await loadSites();
  renderActiveChips();
}

// React to watchlist changes from other tabs
onChange(() => {
  updateWatchlistButton();
  if (state.filters.watched) {
    loadSites();
  } else if (els.grid) {
    els.grid.querySelectorAll('.sc-star').forEach((btn) => {
      const slug = btn.dataset.slug;
      const active = isWatched(slug);
      btn.classList.toggle('active', active);
      const icon = btn.querySelector('i');
      if (icon) icon.className = active ? 'fas fa-star' : 'far fa-star';
    });
  }
});