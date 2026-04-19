#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ARCHIVE_DIR = path.join(__dirname, '../content/archive');
const type = (process.argv[2] || '').toLowerCase();
const title = process.argv.slice(3).join(' ');
const validTypes = new Set(['essay', 'note', 'project', 'update']);

if (!validTypes.has(type) || !title) {
  console.error('❌ Please provide a type and title:');
  console.error('   npm run new essay "My Article Title"');
  console.error('   npm run new note "A Short Thought"');
  process.exit(1);
}

const today = new Date();
const dateStr = today.toISOString().split('T')[0];
const dateLabel = today.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const filename = `${dateStr}-${slug}.md`;
const filePath = path.join(ARCHIVE_DIR, filename);

if (fs.existsSync(filePath)) {
  console.error(`❌ File already exists: ${filename}`);
  process.exit(1);
}

const projectFields = type === 'project'
  ? 'status: exploring\nshow_in_built: true\nshow_in_failed: false\nproject_url: "https://example.com/your-project"\n'
  : '';

const template = `---
title: ${title}
type: ${type}
${projectFields}sort_date: ${dateStr}
date_label: ${dateLabel}
summary: One sentence on what this entry is about.
tags:
  - ${type}
---

Write here.
`;

fs.writeFileSync(filePath, template);

console.log(`✅ Created new ${type}: ${filename}`);
console.log(`\n📝 Edit the file:`);
console.log(`   ${filePath}\n`);
console.log(`🔨 Then build:`);
console.log(`   npm run build\n`);
