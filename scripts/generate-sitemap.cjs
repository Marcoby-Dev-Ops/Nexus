// scripts/generate-sitemap.js
// Usage: node scripts/generate-sitemap.js
// Generates sitemap.xml for main public pages.

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://nexus.marcoby.net';
const pages = [
  { loc: '/', changefreq: 'weekly', priority: 1.0 },
  { loc: '/marketing-landing', changefreq: 'weekly', priority: 0.8 },
  { loc: '/pricing', changefreq: 'weekly', priority: 0.8 },
  { loc: '/login', changefreq: 'weekly', priority: 0.8 },
  { loc: '/signup', changefreq: 'weekly', priority: 0.8 },
  { loc: '/help/privacy-policy', changefreq: 'weekly', priority: 0.8 },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>\n    <loc>${BASE_URL}${page.loc}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>
`;

const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, sitemap.trim() + '\n', 'utf8');
console.log('sitemap.xml generated at', outputPath); 