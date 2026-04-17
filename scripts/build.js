#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const ARCHIVE_DIR = path.join(CONTENT_DIR, 'archive');
const PROFILE_FILE = path.join(CONTENT_DIR, 'profile.md');
const HOME_TEMPLATE_FILE = path.join(ROOT, 'index.template.html');
const ENTRY_TEMPLATE_FILE = path.join(ROOT, 'entry.template.html');
const OUTPUT_FILE = path.join(ROOT, 'index.html');
const STYLE_FILE = path.join(ROOT, 'styles.css');
const GENERATED_DIRS = ['articles', 'notes', 'projects', 'updates'];

marked.setOptions({
  headerIds: false,
  mangle: false
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readMarkdown(filePath) {
  return matter(fs.readFileSync(filePath, 'utf8'));
}

function toSlug(filename, frontmatterSlug) {
  if (frontmatterSlug) return frontmatterSlug;
  return filename.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function collectionName(type) {
  switch (type) {
    case 'essay':
      return 'articles';
    case 'project':
      return 'projects';
    case 'update':
      return 'updates';
    case 'note':
    default:
      return 'notes';
  }
}

function homeLabel(entry) {
  if (entry.type === 'project') return entry.status || 'project';
  if (entry.type === 'update') return 'now';
  return entry.dateLabel;
}

function entryMeta(entry) {
  const parts = [entry.type];
  if (entry.status) {
    parts.push(entry.status);
  } else if (entry.dateLabel) {
    parts.push(entry.dateLabel);
  }
  return parts.join(' · ');
}

function entryPath(entry) {
  return `${collectionName(entry.type)}/${entry.slug}/`;
}

function cleanGeneratedDirs() {
  for (const dir of GENERATED_DIRS) {
    fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
  }
}

function readProfile() {
  const parsed = readMarkdown(PROFILE_FILE);
  return {
    name: parsed.data.name || 'Arian',
    siteTitle: parsed.data.site_title || parsed.data.name || 'Arian',
    tagline: parsed.data.tagline || '',
    location: parsed.data.location || '',
    avatar: parsed.data.avatar || 'assets/avatar-placeholder.svg',
    intro: parsed.data.intro || [],
    contact: parsed.data.contact || [],
    currentFocus: parsed.data.current_focus || [],
    readingNow: parsed.data.reading_now || [],
    bodyHtml: marked.parse(parsed.content.trim())
  };
}

function readEntries() {
  return fs.readdirSync(ARCHIVE_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(ARCHIVE_DIR, file);
      const parsed = readMarkdown(filePath);
      const slug = toSlug(file, parsed.data.slug);
      const type = parsed.data.type || 'note';

      return {
        slug,
        title: parsed.data.title || slug,
        type,
        status: parsed.data.status || '',
        sortDate: parsed.data.sort_date || parsed.data.date || '',
        dateLabel: parsed.data.date_label || parsed.data.date || '',
        summary: parsed.data.summary || '',
        tags: parsed.data.tags || [],
        featured: Boolean(parsed.data.featured),
        projectUrl: parsed.data.project_url || '',
        html: marked.parse(parsed.content.trim()),
        path: entryPath({ slug, type })
      };
    })
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
}

function renderSocialLinks(profile) {
  return profile.contact.map((item) => (
    `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`
  )).join('\n');
}

function renderList(entries) {
  return entries.map((entry) => (
    `<a class="list-item" href="${escapeHtml(entry.path)}">
      <div class="item-copy">
        <div class="item-line">
          <span class="item-title">${escapeHtml(entry.title)}</span>
          <span class="item-summary">${escapeHtml(entry.summary)}</span>
        </div>
        <span class="item-meta">${escapeHtml(homeLabel(entry))}</span>
      </div>
      <span class="item-arrow" aria-hidden="true">→</span>
    </a>`
  )).join('');
}

function renderIntro(profile) {
  return profile.intro.map((line) => `<p class="hero-line">${escapeHtml(line)}</p>`).join('');
}

function renderHome(profile, entries) {
  const projects = entries.filter((entry) => entry.type === 'project');
  const activeProjects = projects.filter((entry) => entry.status !== 'failed');
  const failedProjects = projects.filter((entry) => entry.status === 'failed');
  const essays = entries.filter((entry) => entry.type === 'essay');
  const notesAndUpdates = entries.filter((entry) => entry.type === 'note' || entry.type === 'update');
  const inlineStyles = fs.readFileSync(STYLE_FILE, 'utf8');

  let template = fs.readFileSync(HOME_TEMPLATE_FILE, 'utf8');
  template = template
    .replace(/<!-- PAGE_TITLE -->/g, escapeHtml(profile.siteTitle))
    .replace(/<!-- INLINE_STYLES -->/g, inlineStyles)
    .replace(/<!-- PROFILE_NAME -->/g, escapeHtml(profile.name))
    .replace(/<!-- PROFILE_TAGLINE -->/g, escapeHtml(profile.tagline))
    .replace(/<!-- PROFILE_LOCATION -->/g, escapeHtml(profile.location))
    .replace(/<!-- PROFILE_AVATAR -->/g, escapeHtml(profile.avatar))
    .replace(/<!-- SOCIAL_LINKS -->/g, renderSocialLinks(profile))
    .replace(/<!-- PROFILE_INTRO -->/g, renderIntro(profile))
    .replace(/<!-- PROJECT_ITEMS -->/g, renderList(activeProjects))
    .replace(/<!-- ARTICLE_ITEMS -->/g, renderList(essays))
    .replace(/<!-- NOTE_ITEMS -->/g, renderList(notesAndUpdates))
    .replace(/<!-- FAILURE_ITEMS -->/g, renderList(failedProjects));

  fs.writeFileSync(OUTPUT_FILE, template);
}

function renderExternalLink(entry) {
  if (!entry.projectUrl) return '';
  return `<a class="external-link" href="${escapeHtml(entry.projectUrl)}" target="_blank" rel="noreferrer">project link ↗</a>`;
}

function renderTags(entry) {
  if (!entry.tags.length) return '';
  return `<div class="tag-list">${entry.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`;
}

function renderEntryPage(profile, entry) {
  const outputDir = path.join(ROOT, entry.path);
  ensureDir(outputDir);
  const inlineStyles = fs.readFileSync(STYLE_FILE, 'utf8');

  let template = fs.readFileSync(ENTRY_TEMPLATE_FILE, 'utf8');
  template = template
    .replace(/<!-- PAGE_TITLE -->/g, escapeHtml(`${entry.title} — ${profile.siteTitle}`))
    .replace(/<!-- INLINE_STYLES -->/g, inlineStyles)
    .replace(/<!-- HOME_LINK -->/g, '../../')
    .replace(/<!-- ENTRY_META -->/g, escapeHtml(entryMeta(entry)))
    .replace(/<!-- ENTRY_TITLE -->/g, escapeHtml(entry.title))
    .replace(/<!-- ENTRY_SUMMARY -->/g, escapeHtml(entry.summary))
    .replace(/<!-- ENTRY_PROJECT_LINK -->/g, renderExternalLink(entry))
    .replace(/<!-- ENTRY_TAGS -->/g, renderTags(entry))
    .replace(/<!-- ENTRY_BODY -->/g, entry.html);

  fs.writeFileSync(path.join(outputDir, 'index.html'), template);
}

function build() {
  console.log('Building static site...');

  cleanGeneratedDirs();

  const profile = readProfile();
  const entries = readEntries();

  renderHome(profile, entries);
  entries.forEach((entry) => renderEntryPage(profile, entry));

  console.log(`Built ${OUTPUT_FILE}`);
  console.log(`Built ${entries.length} entry pages`);
}

try {
  build();
} catch (error) {
  console.error('Build failed.');
  console.error(error);
  process.exit(1);
}
