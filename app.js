(function() {
  'use strict';

  const siteDataNode = document.getElementById('site-data');
  if (!siteDataNode) return;

  const siteData = JSON.parse(siteDataNode.textContent);
  const state = {
    filter: 'all',
    query: '',
    activeSlug: null,
    archiveOpen: false
  };

  const archivePanel = document.getElementById('archive-panel');
  const archiveList = document.getElementById('archive-list');
  const filterBar = document.getElementById('filter-bar');
  const readerView = document.getElementById('reader-view');
  const searchInput = document.getElementById('search-input');
  const archiveToggle = document.getElementById('archive-toggle');
  const archiveScrim = document.getElementById('archive-scrim');
  const homeLink = document.getElementById('home-link');

  const filterOrder = [
    { key: 'all', label: 'all' },
    { key: 'essay', label: 'essays' },
    { key: 'note', label: 'notes' },
    { key: 'project', label: 'projects' },
    { key: 'update', label: 'updates' }
  ];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getEntry(slug) {
    return siteData.entries.find((entry) => entry.slug === slug) || null;
  }

  function getCounts() {
    return {
      all: siteData.entries.length,
      essay: siteData.counts.essay || 0,
      note: siteData.counts.note || 0,
      project: siteData.counts.project || 0,
      update: siteData.counts.update || 0
    };
  }

  function matchesFilter(entry) {
    return state.filter === 'all' || entry.type === state.filter;
  }

  function matchesQuery(entry) {
    if (!state.query) return true;
    const haystack = [
      entry.title,
      entry.summary,
      entry.type,
      entry.status,
      entry.tags.join(' '),
      entry.plainText
    ].join(' ').toLowerCase();
    return haystack.includes(state.query);
  }

  function getVisibleEntries() {
    return siteData.entries.filter((entry) => matchesFilter(entry) && matchesQuery(entry));
  }

  function renderFilterBar() {
    const counts = getCounts();

    filterBar.innerHTML = filterOrder.map((filter) => {
      const activeClass = filter.key === state.filter ? ' is-active' : '';
      return `<button class="filter-chip${activeClass}" data-filter="${filter.key}" type="button">
        <span>${filter.label}</span>
        <span>${counts[filter.key]}</span>
      </button>`;
    }).join('');
  }

  function renderArchiveList() {
    const visibleEntries = getVisibleEntries();

    if (visibleEntries.length === 0) {
      archiveList.innerHTML = '<p class="empty-state">No entries match that filter yet.</p>';
      return;
    }

    archiveList.innerHTML = visibleEntries.map((entry) => {
      const activeClass = entry.slug === state.activeSlug ? ' is-active' : '';
      const status = entry.status
        ? `<span class="entry-pill" data-tone="${escapeHtml(entry.status)}">${escapeHtml(entry.status)}</span>`
        : '';

      return `<button class="archive-item${activeClass}" data-slug="${escapeHtml(entry.slug)}" type="button">
        <span class="archive-meta">
          <span>${escapeHtml(entry.type)}</span>
          <span>${escapeHtml(entry.dateLabel)}</span>
        </span>
        <strong>${escapeHtml(entry.title)}</strong>
        <span class="archive-summary">${escapeHtml(entry.summary)}</span>
        <span class="archive-pills">${status}</span>
      </button>`;
    }).join('');
  }

  function renderFeaturedCards() {
    return siteData.entries
      .filter((entry) => entry.featured)
      .slice(0, 4)
      .map((entry) => {
        const status = entry.status
          ? `<span class="entry-pill" data-tone="${escapeHtml(entry.status)}">${escapeHtml(entry.status)}</span>`
          : '';

        return `<button class="featured-card" data-slug="${escapeHtml(entry.slug)}" type="button">
          <span class="archive-meta">
            <span>${escapeHtml(entry.type)}</span>
            <span>${escapeHtml(entry.dateLabel)}</span>
          </span>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.summary)}</p>
          ${status}
        </button>`;
      }).join('');
  }

  function renderShelfList(items) {
    return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderOverview() {
    const profile = siteData.profile;

    readerView.innerHTML = `<section class="overview">
      <div class="overview-hero">
        <p class="eyebrow">reading room</p>
        <h2>${escapeHtml(profile.name)}</h2>
        <p class="lead">${escapeHtml(profile.tagline)}</p>
        <div class="overview-copy">${profile.bodyHtml}</div>
      </div>

      <div class="overview-grid">
        <section class="overview-card">
          <p class="section-label">current focus</p>
          <ul class="stack-list">
            ${profile.currentFocus.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>

        <section class="overview-card">
          <p class="section-label">reading now</p>
          <ul class="stack-list">
            ${profile.readingNow.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>

        <section class="overview-card">
          <p class="section-label">shelf</p>
          <div class="shelf-grid">
            <div>
              <span>books</span>
              <ul>${renderShelfList(profile.shelf.books)}</ul>
            </div>
            <div>
              <span>films</span>
              <ul>${renderShelfList(profile.shelf.films)}</ul>
            </div>
            <div>
              <span>music</span>
              <ul>${renderShelfList(profile.shelf.music)}</ul>
            </div>
          </div>
        </section>
      </div>

      <section class="featured-section">
        <div class="section-heading">
          <p class="section-label">selected entries</p>
          <p class="section-note">${siteData.entries.length} entries in the archive</p>
        </div>
        <div class="featured-grid">
          ${renderFeaturedCards()}
        </div>
      </section>
    </section>`;
  }

  function renderEntry(entry) {
    const status = entry.status
      ? `<span class="entry-pill" data-tone="${escapeHtml(entry.status)}">${escapeHtml(entry.status)}</span>`
      : '';
    const tags = entry.tags.length
      ? `<div class="tag-row">${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';

    readerView.innerHTML = `<article class="entry-reader">
      <header class="entry-header">
        <button class="entry-back" data-action="overview" type="button">Back to overview</button>
        <p class="entry-kicker">
          <span>${escapeHtml(entry.type)}</span>
          <span>${escapeHtml(entry.dateLabel)}</span>
          ${status}
        </p>
        <h2>${escapeHtml(entry.title)}</h2>
        <p class="entry-summary">${escapeHtml(entry.summary)}</p>
        ${tags}
      </header>
      <div class="entry-body">${entry.html}</div>
    </article>`;
  }

  function setHash(slug) {
    const url = slug ? `#${slug}` : window.location.pathname;
    history.replaceState(null, '', url);
  }

  function closeArchive() {
    state.archiveOpen = false;
    document.body.classList.remove('archive-open');
    archiveToggle.setAttribute('aria-expanded', 'false');
  }

  function openArchive() {
    state.archiveOpen = true;
    document.body.classList.add('archive-open');
    archiveToggle.setAttribute('aria-expanded', 'true');
  }

  function render() {
    renderFilterBar();
    renderArchiveList();

    const activeEntry = state.activeSlug ? getEntry(state.activeSlug) : null;
    if (activeEntry) {
      renderEntry(activeEntry);
    } else {
      renderOverview();
    }
  }

  function activateEntry(slug) {
    state.activeSlug = slug;
    setHash(slug);
    render();
    closeArchive();
  }

  function showOverview() {
    state.activeSlug = null;
    setHash('');
    render();
  }

  function hydrateFromHash() {
    const slug = window.location.hash.replace(/^#/, '');
    if (slug && getEntry(slug)) {
      state.activeSlug = slug;
    } else {
      state.activeSlug = null;
    }
  }

  filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    render();
  });

  archiveList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-slug]');
    if (!button) return;
    activateEntry(button.dataset.slug);
  });

  readerView.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action="overview"]');
    if (action) {
      showOverview();
      return;
    }

    const button = event.target.closest('[data-slug]');
    if (!button) return;
    activateEntry(button.dataset.slug);
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim().toLowerCase();
    render();
  });

  archiveToggle.addEventListener('click', () => {
    if (state.archiveOpen) {
      closeArchive();
    } else {
      openArchive();
    }
  });

  archiveScrim.addEventListener('click', closeArchive);
  homeLink.addEventListener('click', showOverview);

  window.addEventListener('hashchange', () => {
    hydrateFromHash();
    render();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.archiveOpen) {
        closeArchive();
      } else if (state.query) {
        state.query = '';
        searchInput.value = '';
        render();
      } else if (state.activeSlug) {
        showOverview();
      }
    }

    if (event.key === '/' && document.activeElement !== searchInput) {
      event.preventDefault();
      openArchive();
      searchInput.focus();
    }
  });

  hydrateFromHash();
  render();
})();
