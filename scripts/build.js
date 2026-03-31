#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const CONTENT_DIR = path.join(__dirname, '../content');
const ARCHIVE_DIR = path.join(CONTENT_DIR, 'archive');
const PROFILE_FILE = path.join(CONTENT_DIR, 'profile.md');
const TEMPLATE_FILE = path.join(__dirname, '../index.template.html');
const OUTPUT_FILE = path.join(__dirname, '../index.html');

marked.setOptions({
  headerIds: false,
  mangle: false
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readMarkdown(filePath) {
  return matter(fs.readFileSync(filePath, 'utf8'));
}

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function serializeForScript(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function toSlug(filename, frontmatterSlug) {
  if (frontmatterSlug) return frontmatterSlug;
  return filename
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function readProfile() {
  const parsed = readMarkdown(PROFILE_FILE);
  return {
    name: parsed.data.name,
    siteTitle: parsed.data.site_title || parsed.data.name,
    tagline: parsed.data.tagline || '',
    location: parsed.data.location || '',
    intro: parsed.data.intro || [],
    contact: parsed.data.contact || [],
    currentFocus: parsed.data.current_focus || [],
    readingNow: parsed.data.reading_now || [],
    shelf: parsed.data.shelf || {},
    bodyHtml: marked.parse(parsed.content.trim())
  };
}

function readEntries() {
  return fs.readdirSync(ARCHIVE_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(ARCHIVE_DIR, file);
      const parsed = readMarkdown(filePath);
      const html = marked.parse(parsed.content.trim());
      const slug = toSlug(file, parsed.data.slug);

      return {
        slug,
        title: parsed.data.title,
        type: parsed.data.type || 'note',
        status: parsed.data.status || '',
        sortDate: parsed.data.sort_date || parsed.data.date || '',
        dateLabel: parsed.data.date_label || parsed.data.date || '',
        summary: parsed.data.summary || '',
        tags: parsed.data.tags || [],
        featured: Boolean(parsed.data.featured),
        html,
        searchText: [
          parsed.data.title || '',
          parsed.data.summary || '',
          (parsed.data.tags || []).join(' '),
          parsed.content
        ].join(' ')
      };
    })
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
}

function countByType(entries) {
  return entries.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {});
}

function renderContacts(contact) {
  return contact.map((item) => (
    `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`
  )).join('');
}

function renderFilterBar(counts) {
  const filters = [
    { key: 'all', label: 'all', count: Object.values(counts).reduce((sum, value) => sum + value, 0) },
    { key: 'essay', label: 'essays', count: counts.essay || 0 },
    { key: 'note', label: 'notes', count: counts.note || 0 },
    { key: 'project', label: 'projects', count: counts.project || 0 },
    { key: 'update', label: 'updates', count: counts.update || 0 }
  ];

  return filters.map((filter, index) => (
    `<button class="filter-chip${index === 0 ? ' is-active' : ''}" data-filter="${filter.key}" type="button">
      <span>${filter.label}</span>
      <span>${filter.count}</span>
    </button>`
  )).join('');
}

function renderArchiveList(entries, activeSlug = '') {
  return entries.map((entry) => {
    const activeClass = entry.slug === activeSlug ? ' is-active' : '';
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

function renderShelfList(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderFeatured(entries) {
  const featuredEntries = entries.filter((entry) => entry.featured).slice(0, 4);

  return featuredEntries.map((entry) => {
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

function renderOverview(profile, entries) {
  return `<section class="overview">
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
        <p class="section-note">${entries.length} entries in the archive</p>
      </div>
      <div class="featured-grid">
        ${renderFeatured(entries)}
      </div>
    </section>
  </section>`;
}

function build() {
  console.log('Building archive site...');

  const profile = readProfile();
  const entries = readEntries();
  const counts = countByType(entries);
  const siteData = {
    profile,
    counts,
    entries: entries.map((entry) => ({
      ...entry,
      plainText: stripTags(entry.html)
    }))
  };

  let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  template = template
    .replace(/<!-- PAGE_TITLE -->/g, escapeHtml(profile.siteTitle))
    .replace(/<!-- PROFILE_NAME -->/g, escapeHtml(profile.name))
    .replace(/<!-- PROFILE_TAGLINE -->/g, escapeHtml(profile.tagline))
    .replace(/<!-- PROFILE_LOCATION -->/g, escapeHtml(profile.location))
    .replace(/<!-- PROFILE_CONTACT_LINKS -->/g, renderContacts(profile.contact))
    .replace(/<!-- INITIAL_FILTERS -->/g, renderFilterBar(counts))
    .replace(/<!-- INITIAL_ARCHIVE_LIST -->/g, renderArchiveList(entries))
    .replace(/<!-- INITIAL_READER -->/g, renderOverview(profile, entries))
    .replace(/<!-- SITE_DATA -->/g, serializeForScript(siteData));

  fs.writeFileSync(OUTPUT_FILE, template);
  console.log(`Built ${OUTPUT_FILE}`);
}

try {
  build();
} catch (error) {
  console.error('Build failed.');
  console.error(error);
  process.exit(1);
}
