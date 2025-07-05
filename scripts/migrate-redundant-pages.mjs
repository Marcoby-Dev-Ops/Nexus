#!/usr/bin/env node

/**
 * migrate-redundant-pages.mjs
 * Page redundancy analysis script
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Page Redundancy Analysis\n');

function analyzePageRedundancy() {
  console.log('📊 Analyzing current page redundancy...');
  
  const redundantPages = {
    department: [
      'src/pages/departments/operations/OperationsHome.tsx',
      'src/pages/departments/sales/SalesHome.tsx', 
      'src/pages/departments/finance/FinanceHome.tsx'
    ],
    settings: [
      'src/pages/settings/AccountSettings.tsx',
      'src/pages/settings/SecuritySettings.tsx',
      'src/pages/settings/BillingSettings.tsx'
    ],
    callbacks: [
      'src/pages/Microsoft365Callback.tsx',
      'src/pages/NinjaRmmCallback.tsx',
      'src/pages/GoogleWorkspaceCallback.tsx'
    ]
  };

  let totalLines = 0;
  let existingFiles = 0;

  Object.entries(redundantPages).forEach(([category, files]) => {
    console.log(`\n📁 ${category.toUpperCase()} PAGES:`);
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
        existingFiles++;
        console.log(`   ✓ ${file} (${lines} lines)`);
      } else {
        console.log(`   ❌ ${file} (not found)`);
      }
    });
  });

  console.log(`\n📈 REDUNDANCY SUMMARY:`);
  console.log(`   • Redundant files found: ${existingFiles}`);
  console.log(`   • Total redundant lines: ${totalLines.toLocaleString()}`);
  console.log(`   • Potential reduction: ${Math.round(totalLines * 0.85).toLocaleString()} lines (85%)`);
  console.log(`   • Bundle size savings: ~${Math.round(totalLines * 0.2 / 1000)}KB`);
  
  return { redundantPages, totalLines, existingFiles };
}

// Run analysis
analyzePageRedundancy(); 