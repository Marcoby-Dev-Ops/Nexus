// scripts/generate-robots.cjs
// Usage: node scripts/generate-robots.cjs
// Generates robots.txt for the site, disallowing protected/admin routes.

const fs = require('fs');
const path = require('path');

const protectedRoutes = [
  '/dashboard',
  '/workspace',
  '/ai-hub',
  '/chat',
  '/ai-performance',
  '/business-setup',
  '/business-chat',
  '/analytics',
  '/data-warehouse',
  '/assessment',
  '/company-status',
  '/think',
  '/see',
  '/act',
  '/sales',
  '/finance',
  '/marketing',
  '/operations',
  '/support',
  '/hr',
  '/it',
  '/product',
  '/customer-success',
  '/legal',
  '/maturity',
  '/sales-performance',
  '/financial-operations',
  '/integrations',
  '/settings',
  '/profile',
  '/onboarding',
  '/documents',
  '/admin',
  '/component',
];

const lines = [
  'User-agent: *',
  ...protectedRoutes.map((route) => `Disallow: ${route}`),
  'Sitemap: https://nexus.marcoby.net/sitemap.xml',
];

const outputPath = path.join(__dirname, '../public/robots.txt');
fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
console.log('robots.txt generated at', outputPath); 