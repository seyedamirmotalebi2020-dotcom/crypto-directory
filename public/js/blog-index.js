// public/js/blog-index.js
// Client-side tag filter + pagination for the blog index.
// Enhances the existing static HTML — all cards stay in the DOM for SEO.

const PER_PAGE = 9

const main = document.querySelector('.blog-container')
const filtersEl = document.getElementById('blogFilters')
const paginationEl = document.getElementById('blogPagination')
const groupTitles = document.querySelectorAll('.blog-group-title')
const groupIndexes = document.querySelectorAll('.blog-index')

if (!main || !filtersEl || !paginationEl || !groupIndexes.length) {
  // Nothing to do — page isn't the blog index or DOM is missing.
} else {
  init()
}

function init() {
  // ── Collect all cards from the grouped markup ──
  const allCards = []

  groupIndexes.forEach((index) => {
    index.querySelectorAll('.blog-card').forEach((card) => {
      const tagEl = card.querySelector('.blog-card__tag')
      const tag = tagEl ? tagEl.textContent.trim().toLowerCase() : 'other'
      card.dataset.tag = tag
      allCards.push(card)
    })
  })

  // ── Build a flat container for the paginated view ──
  const flat = document.createElement('div')
  flat.className = 'blog-index blog-index--flat'
  main.insertBefore(flat, filtersEl.nextElementSibling)

  // Hide the original grouped structure (kept in DOM for SEO)
  groupTitles.forEach((g) => { g.style.display = 'none' })
  groupIndexes.forEach((i) => { i.style.display = 'none' })

  // ── Build filter buttons ──
  const tagCounts = {}
  allCards.forEach((c) => {
    tagCounts[c.dataset.tag] = (tagCounts[c.dataset.tag] || 0) + 1
  })

  const tags = ['all', ...Object.keys(tagCounts).sort((a, b) => {
    // Sort by count desc, then alphabetically
    return (tagCounts[b] - tagCounts[a]) || a.localeCompare(b)
  })]

  let currentTag = 'all'
  let currentPage = 1

  tags.forEach((tag) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'blog-filter-btn' + (tag === 'all' ? ' active' : '')
    btn.dataset.tag = tag
    const label = tag === 'all'
      ? 'All'
      : tag.charAt(0).toUpperCase() + tag.slice(1)
    const count = tag === 'all' ? allCards.length : tagCounts[tag]
    btn.innerHTML = `${label} <span class="count">${count}</span>`
    btn.setAttribute('aria-pressed', tag === 'all' ? 'true' : 'false')
    btn.addEventListener('click', () => setFilter(tag))
    filtersEl.appendChild(btn)
  })

  // ── Render loop ──
  function getFiltered() {
    return currentTag === 'all'
      ? allCards
      : allCards.filter((c) => c.dataset.tag === currentTag)
  }

  function render() {
    const filtered = getFiltered()
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
    if (currentPage > totalPages) currentPage = totalPages

    const start = (currentPage - 1) * PER_PAGE
    const pageItems = filtered.slice(start, start + PER_PAGE)

    // Clear and refill the flat container
    flat.innerHTML = ''
    if (!pageItems.length) {
      flat.innerHTML = '<div class="blog-empty">No articles match this filter yet.</div>'
    } else {
      pageItems.forEach((card) => flat.appendChild(card))
    }

    renderPagination(totalPages)

    // Sync button active state
    filtersEl.querySelectorAll('.blog-filter-btn').forEach((b) => {
      const isActive = b.dataset.tag === currentTag
      b.classList.toggle('active', isActive)
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    })
  }

  function renderPagination(totalPages) {
    paginationEl.innerHTML = ''

    if (totalPages <= 1) return

    // Prev
    const prev = document.createElement('button')
    prev.type = 'button'
    prev.className = 'blog-page-btn'
    prev.disabled = currentPage === 1
    prev.setAttribute('aria-label', 'Previous page')
    prev.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>'
    prev.addEventListener('click', () => goto(currentPage - 1, totalPages))
    paginationEl.appendChild(prev)

    // Page numbers — with ellipsis for long ranges
    const pages = pageNumbers(currentPage, totalPages)
    pages.forEach((p) => {
      if (p === '…') {
        const span = document.createElement('span')
        span.className = 'blog-page-btn'
        span.style.pointerEvents = 'none'
        span.style.border = 'none'
        span.style.background = 'transparent'
        span.textContent = '…'
        paginationEl.appendChild(span)
        return
      }
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'blog-page-btn' + (p === currentPage ? ' active' : '')
      btn.textContent = p
      btn.addEventListener('click', () => goto(p, totalPages))
      paginationEl.appendChild(btn)
    })

    // Next
    const next = document.createElement('button')
    next.type = 'button'
    next.className = 'blog-page-btn'
    next.disabled = currentPage === totalPages
    next.setAttribute('aria-label', 'Next page')
    next.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>'
    next.addEventListener('click', () => goto(currentPage + 1, totalPages))
    paginationEl.appendChild(next)
  }

  function pageNumbers(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    const out = [1]
    if (current > 3) out.push('…')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      out.push(i)
    }
    if (current < total - 2) out.push('…')
    out.push(total)
    return out
  }

  function goto(page, totalPages) {
    if (page < 1 || page > totalPages || page === currentPage) return
    currentPage = page
    render()
    // Scroll back to top of blog for a clean feel
    main.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function setFilter(tag) {
    if (tag === currentTag) return
    currentTag = tag
    currentPage = 1
    render()
  }

  // Initial render
  render()
}