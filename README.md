# Arian Site

A simple static personal site inspired by clean index-style homepages: profile at the top, grouped categories on the homepage, and separate white reading pages for every entry.

## How It Works

- `index.html` is the homepage
- every item gets its own generated page
- content is still written in Markdown
- the site stays fully static and GitHub Pages friendly

## Structure

```text
assets/
  avatar-placeholder.svg
content/
  profile.md
  archive/
    2026-03-05-personal-site.md
    2026-03-28-productivity-vs-meaning.md
    ...
scripts/
  build.js
  new-article.js
index.template.html
entry.template.html
styles.css
index.html
articles/
notes/
projects/
updates/
```

## Profile

Edit `content/profile.md` to change:

- name
- tagline
- avatar path
- location
- intro lines
- social links

To replace the profile picture, either:

1. replace `assets/avatar-placeholder.svg`, or
2. change the `avatar:` path in `content/profile.md`

## Archive Entries

Every entry is a Markdown file in `content/archive/`.

Example:

```md
---
title: A short thought
type: note
sort_date: 2026-04-18
date_label: April 18, 2026
summary: One-line description for the homepage.
tags:
  - note
  - thinking
---

Write here.
```

Supported types:

- `essay`
- `note`
- `project`
- `update`

Optional project fields:

```md
status: live
project_url: https://example.com/my-project
```

`project_url` is shown on the generated project page as a link you can replace later with the real one.

## Commands

Install dependencies:

```bash
npm install
```

Build the site:

```bash
npm run build
```

Watch for changes:

```bash
npm run dev
```

Create a new entry:

```bash
npm run new essay "My New Article"
npm run new note "Quick Thought"
npm run new project "New Project"
```

## Local Preview

After building:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`

## GitHub Pages

Because the site is static, deployment is still:

```bash
npm run build
git status
git add .
git commit -m "Update site"
git push
```

Make sure you commit the generated folders too:

- `index.html`
- `articles/`
- `notes/`
- `projects/`
- `updates/`

Your custom domain continues to work through GitHub Pages and the existing `CNAME` file.
