#!/usr/bin/env node

/**
 * migrate-redundant-pages.js
 * Automated migration script for page redundancy elimination
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Page Redundancy Elimination Analysis...\n');

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

  console.log(`\n📈 ANALYSIS SUMMARY:`);
  console.log(`   • Total redundant files: ${existingFiles}`);
  console.log(`   • Total redundant lines: ${totalLines}`);
  console.log(`   • Estimated reduction: ${Math.round(totalLines * 0.85)} lines (85%)`);
  
  return { redundantPages, totalLines, existingFiles };
}

// Run analysis
analyzePageRedundancy(); 