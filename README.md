# Arian Archive

A monochrome personal archive built from Markdown. The site is static, simple to host on GitHub Pages, and designed around one archive index plus a focused reader view.

## What Changed

- The old terminal UI is gone.
- Content now lives in one unified archive system.
- Each item is written in Markdown with frontmatter.
- The interface is a monochrome archive with filters, search, and a reader panel.

## Structure

```text
content/
  profile.md          # Site identity, intro, links, current focus, shelf
  archive/
    2026-04-01-now.md
    2026-03-28-productivity-vs-meaning.md
    2026-03-05-personal-site.md
    ...
scripts/
  build.js            # Builds index.html from Markdown
  new-article.js      # Creates a new archive entry
index.template.html   # Base HTML shell
app.js                # Client-side archive interactions
styles.css            # Site styling
index.html            # Generated output for GitHub Pages
```

## Content Model

Every archive entry is a Markdown file inside `content/archive/`.

Example:

```md
---
title: A Short Thought
type: note
sort_date: 2026-04-01
date_label: April 1, 2026
summary: One sentence on what this is about.
tags:
  - note
  - thinking
---

Write here.
```

Supported `type` values:

- `essay`
- `note`
- `project`
- `update`

Optional fields for projects:

- `status`: `live`, `shipped`, `paused`, `failed`, `exploring`, `sketching`

Useful optional fields:

- `featured: true`
- `tags:`

## Profile File

`content/profile.md` controls the site header and overview:

- name
- site title
- tagline
- location
- intro
- contact links
- current focus
- reading now
- shelf lists

## Commands

Install dependencies:

```bash
npm install
```

Build the site:

```bash
npm run build
```

Watch and rebuild on changes:

```bash
npm run dev
```

Create a new entry:

```bash
npm run new essay "My New Essay"
npm run new note "A quick thought"
npm run new project "Something I'm exploring"
```

## Local Preview

After building, preview locally:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`

## GitHub Pages Deployment

Because this site is static, deployment is still simple.

When you are happy with the result:

```bash
npm run build
git status
git add .
git commit -m "Redesign personal archive"
git push
```

If your GitHub Pages setup already publishes from this repository and your custom domain is already connected through `CNAME`, pushing the updated `index.html` is enough.

## Push Checklist

Before pushing:

1. Run `npm run build`
2. Check `index.html` updated
3. Check `git status`
4. Preview locally if you want one last pass
5. Commit and push

## Notes

- `index.html` is generated, so rebuild after changing content or templates.
- Hosting stays compatible with GitHub Pages and a custom domain.
- No backend is required.
