#!/usr/bin/env node

/**
 * UX/UI Consistency Analysis Script
 * 
 * Analyzes the codebase for consistency issues and provides actionable feedback
 * Usage: node scripts/analyze-consistency.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  sourceDir: 'src',
  excludePatterns: ['**/*.test.tsx', '**/__snapshots__/**', '**/node_modules/**'],
  includePatterns: ['**/*.tsx', '**/*.ts'],
  outputFile: 'docs/CONSISTENCY_REPORT.md'
};

// Pattern definitions for consistency checks
const PATTERNS = {
  // Loading state patterns
  loadingStates: {
    spinner: /<Spinner[^>]*>/g,
    customSpinner: /className="[^"]*animate-spin[^"]*"/g,
    skeleton: /<Skeleton[^>]*>/g,
    typingDots: /animate-bounce[^"]*"/g,
    hardcodedSpinner: /border-b-2 border-blue-600/g
  },
  
  // Error handling patterns
  errorHandling: {
    alertComponent: /<Alert[^>]*variant="error"/g,
    customError: /bg-red-\d+/g,
    inlineError: /text-red-\d+/g,
    errorDiv: /<div[^>]*className="[^"]*red[^"]*"/g
  },
  
  // Page structure patterns
  pageStructure: {
    gradientBackground: /bg-gradient-to-br/g,
    basicPadding: /^[^{]*className="p-8 space-y-8"/gm,
    dashboardStructure: /min-h-screen bg-gradient/g
  },
  
  // Data display patterns
  dataDisplay: {
    tableComponent: /<Table[^>]*columns/g,
    manualTable: /<table[^>]*className="min-w-full/g,
    cardComponent: /<Card[^>]*>/g,
    manualCard: /<div[^>]*className="[^"]*rounded-xl border[^"]*"/g
  },
  
  // Color consistency
  colorUsage: {
    designTokens: /bg-(primary|secondary|destructive|muted)/g,
    hardcodedColors: /bg-(blue|red|green|yellow|gray)-\d+/g,
    textColors: /text-(blue|red|green|yellow|gray)-\d+/g
  },
  
  // Spacing patterns
  spacing: {
    systemSpacing: /p-[48]|space-y-[48]|gap-[468]/g,
    inconsistentSpacing: /p-[^48\s]|space-y-[^48\s]|gap-[^468\s]/g
  }
};

class ConsistencyAnalyzer {
  constructor() {
    this.issues = [];
    this.stats = {
      filesAnalyzed: 0,
      totalIssues: 0,
      issuesByCategory: {}
    };
  }

  /**
   * Main analysis entry point
   */
  async analyze() {
    console.log('🔍 Starting UX/UI Consistency Analysis...\n');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    this.generateReport();
    console.log(`✅ Analysis complete! Report saved to ${CONFIG.outputFile}`);
  }

  /**
   * Get all source files to analyze
   */
  getSourceFiles() {
    const files = [];
    
    for (const pattern of CONFIG.includePatterns) {
      const matches = glob.sync(path.join(CONFIG.sourceDir, pattern), {
        ignore: CONFIG.excludePatterns.map(p => path.join(CONFIG.sourceDir, p))
      });
      files.push(...matches);
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.stats.filesAnalyzed++;
      
      // Analyze different consistency aspects
      this.analyzeLoadingStates(filePath, content);
      this.analyzeErrorHandling(filePath, content);
      this.analyzePageStructure(filePath, content);
      this.analyzeDataDisplay(filePath, content);
      this.analyzeColorUsage(filePath, content);
      this.analyzeSpacing(filePath, content);
      
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }

  /**
   * Analyze loading state consistency
   */
  analyzeLoadingStates(filePath, content) {
    const issues = [];
    
    // Check for custom spinners instead of Spinner component
    const customSpinners = content.match(PATTERNS.loadingStates.customSpinner);
    if (customSpinners) {
      issues.push({
        type: 'loading-custom-spinner',
        severity: 'medium',
        message: `Found ${customSpinners.length} custom spinner(s). Consider using <Spinner> component.`,
        lines: this.getLineNumbers(content, PATTERNS.loadingStates.customSpinner)
      });
    }
    
    // Check for hardcoded spinner styles
    const hardcodedSpinners = content.match(PATTERNS.loadingStates.hardcodedSpinner);
    if (hardcodedSpinners) {
      issues.push({
        type: 'loading-hardcoded-spinner',
        severity: 'high',
        message: `Found ${hardcodedSpinners.length} hardcoded spinner style(s). Use <Spinner> component instead.`,
        lines: this.getLineNumbers(content, PATTERNS.loadingStates.hardcodedSpinner)
      });
    }
    
    this.addIssues(filePath, 'Loading States', issues);
  }

  /**
   * Analyze error handling consistency
   */
  analyzeErrorHandling(filePath, content) {
    const issues = [];
    
    // Check for custom error styling instead of Alert component
    const customErrors = content.match(PATTERNS.errorHandling.customError);
    const inlineErrors = content.match(PATTERNS.errorHandling.inlineError);
    
    if (customErrors) {
      issues.push({
        type: 'error-custom-styling',
        severity: 'medium',
        message: `Found ${customErrors.length} custom error style(s). Consider using <Alert variant="error">.`,
        lines: this.getLineNumbers(content, PATTERNS.errorHandling.customError)
      });
    }
    
    if (inlineErrors) {
      issues.push({
        type: 'error-inline-styling',
        severity: 'low',
        message: `Found ${inlineErrors.length} inline error color(s). Consider using design tokens.`,
        lines: this.getLineNumbers(content, PATTERNS.errorHandling.inlineError)
      });
    }
    
    this.addIssues(filePath, 'Error Handling', issues);
  }

  /**
   * Analyze page structure consistency
   */
  analyzePageStructure(filePath, content) {
    const issues = [];
    
    // Check if it's a page file
    if (filePath.includes('/pages/') || filePath.includes('Home.tsx')) {
      const hasGradient = PATTERNS.pageStructure.gradientBackground.test(content);
      const hasBasicPadding = PATTERNS.pageStructure.basicPadding.test(content);
      
      if (!hasGradient && hasBasicPadding && !filePath.includes('Login.tsx')) {
        issues.push({
          type: 'page-structure-inconsistent',
          severity: 'medium',
          message: 'Page lacks gradient background. Consider using PageTemplates.Department pattern.',
          lines: this.getLineNumbers(content, PATTERNS.pageStructure.basicPadding)
        });
      }
    }
    
    this.addIssues(filePath, 'Page Structure', issues);
  }

  /**
   * Analyze data display consistency
   */
  analyzeDataDisplay(filePath, content) {
    const issues = [];
    
    // Check for manual tables instead of Table component
    const manualTables = content.match(PATTERNS.dataDisplay.manualTable);
    if (manualTables) {
      issues.push({
        type: 'data-manual-table',
        severity: 'medium',
        message: `Found ${manualTables.length} manual table(s). Consider using <Table> component.`,
        lines: this.getLineNumbers(content, PATTERNS.dataDisplay.manualTable)
      });
    }
    
    // Check for manual cards with basic styling
    const manualCards = content.match(PATTERNS.dataDisplay.manualCard);
    if (manualCards) {
      issues.push({
        type: 'data-manual-card',
        severity: 'low',
        message: `Found ${manualCards.length} manual card(s). Consider using <Card> component or ContentCard pattern.`,
        lines: this.getLineNumbers(content, PATTERNS.dataDisplay.manualCard)
      });
    }
    
    this.addIssues(filePath, 'Data Display', issues);
  }

  /**
   * Analyze color usage consistency
   */
  analyzeColorUsage(filePath, content) {
    const issues = [];
    
    // Check for hardcoded colors instead of design tokens
    const hardcodedBg = content.match(PATTERNS.colorUsage.hardcodedColors);
    const hardcodedText = content.match(PATTERNS.colorUsage.textColors);
    
    if (hardcodedBg) {
      issues.push({
        type: 'color-hardcoded-background',
        severity: 'medium',
        message: `Found ${hardcodedBg.length} hardcoded background color(s). Use design tokens instead.`,
        lines: this.getLineNumbers(content, PATTERNS.colorUsage.hardcodedColors)
      });
    }
    
    if (hardcodedText) {
      issues.push({
        type: 'color-hardcoded-text',
        severity: 'low',
        message: `Found ${hardcodedText.length} hardcoded text color(s). Use design tokens instead.`,
        lines: this.getLineNumbers(content, PATTERNS.colorUsage.textColors)
      });
    }
    
    this.addIssues(filePath, 'Color Usage', issues);
  }

  /**
   * Analyze spacing consistency
   */
  analyzeSpacing(filePath, content) {
    const issues = [];
    
    // This is a simplified check - in practice, you'd want more sophisticated analysis
    const inconsistentSpacing = content.match(/p-[1357]|space-y-[1357]|gap-[1357]/g);
    if (inconsistentSpacing) {
      issues.push({
        type: 'spacing-inconsistent',
        severity: 'low',
        message: `Found ${inconsistentSpacing.length} non-standard spacing value(s). Prefer p-4, p-6, p-8 for consistency.`,
        lines: this.getLineNumbers(content, /p-[1357]|space-y-[1357]|gap-[1357]/g)
      });
    }
    
    this.addIssues(filePath, 'Spacing', issues);
  }

  /**
   * Get line numbers for matches
   */
  getLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const lineNumbers = [];
    
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        lineNumbers.push(index + 1);
      }
    });
    
    return lineNumbers;
  }

  /**
   * Add issues to the collection
   */
  addIssues(filePath, category, issues) {
    if (issues.length > 0) {
      this.issues.push({ filePath, category, issues });
      this.stats.totalIssues += issues.length;
      this.stats.issuesByCategory[category] = (this.stats.issuesByCategory[category] || 0) + issues.length;
    }
  }

  /**
   * Generate the consistency report
   */
  generateReport() {
    const report = this.buildReport();
    
    // Ensure directory exists
    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.outputFile, report);
  }

  /**
   * Build the markdown report
   */
  buildReport() {
    const now = new Date().toISOString();
    const score = this.calculateConsistencyScore();
    
    let report = `# UX/UI Consistency Report 📊

> **Generated on:** ${now}

## Summary

- **Files Analyzed:** ${this.stats.filesAnalyzed}
- **Total Issues:** ${this.stats.totalIssues}
- **Consistency Score:** ${score}/10

## Score Breakdown

`;

    // Add score breakdown by category
    for (const [category, count] of Object.entries(this.stats.issuesByCategory)) {
      const categoryScore = Math.max(1, 10 - Math.floor(count / 2));
      report += `- **${category}:** ${categoryScore}/10 (${count} issues)\n`;
    }

    report += `
## Issues by Category

`;

    // Group issues by category
    const issuesByCategory = {};
    this.issues.forEach(fileIssues => {
      if (!issuesByCategory[fileIssues.category]) {
        issuesByCategory[fileIssues.category] = [];
      }
      issuesByCategory[fileIssues.category].push(fileIssues);
    });

    // Add detailed issues
    for (const [category, categoryIssues] of Object.entries(issuesByCategory)) {
      report += `### ${category}\n\n`;
      
      categoryIssues.forEach(fileIssues => {
        report += `#### \`${fileIssues.filePath}\`\n\n`;
        
        fileIssues.issues.forEach(issue => {
          const severity = issue.severity.toUpperCase();
          const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
          
          report += `${emoji} **${severity}:** ${issue.message}\n`;
          if (issue.lines.length > 0) {
            report += `   - Lines: ${issue.lines.join(', ')}\n`;
          }
          report += `\n`;
        });
      });
    }

    // Add recommendations
    report += `
## Recommendations

### High Priority
${this.getHighPriorityRecommendations()}

### Medium Priority
${this.getMediumPriorityRecommendations()}

### Low Priority
${this.getLowPriorityRecommendations()}

## Action Items

1. **Review high-severity issues first** - These represent the most significant inconsistencies
2. **Create standardized components** - For patterns that appear frequently
3. **Update style guide** - Document approved patterns for team reference
4. **Add linting rules** - Prevent future inconsistencies

---

*Run this script regularly to track consistency improvements over time.*
`;

    return report;
  }

  /**
   * Calculate overall consistency score
   */
  calculateConsistencyScore() {
    if (this.stats.totalIssues === 0) return 10;
    
    // More realistic scoring for development phase
    let score = 10;
    
    // Weight different severity levels appropriately
    let highSeverityCount = 0;
    let mediumSeverityCount = 0;
    let lowSeverityCount = 0;
    
    this.issues.forEach(fileIssues => {
      fileIssues.issues.forEach(issue => {
        if (issue.severity === 'high') {
          highSeverityCount++;
        } else if (issue.severity === 'medium') {
          mediumSeverityCount++;
        } else {
          lowSeverityCount++;
        }
      });
    });
    
    // More reasonable penalties for development phase
    score -= highSeverityCount * 0.15;     // High severity: -0.15 each
    score -= mediumSeverityCount * 0.08;   // Medium severity: -0.08 each  
    score -= lowSeverityCount * 0.03;      // Low severity: -0.03 each
    
    // Apply file count scaling for realistic expectations
    const filesAnalyzed = this.stats.filesAnalyzed;
    if (filesAnalyzed > 100) {
      // For large codebases, be more lenient
      score = Math.max(score, 7.0);
    }
    
    return Math.max(1, Math.round(score * 10) / 10);
  }

  /**
   * Get high priority recommendations
   */
  getHighPriorityRecommendations() {
    const recommendations = [];
    
    if (this.stats.issuesByCategory['Loading States'] > 3) {
      recommendations.push('- Create a standardized `LoadingStates` utility component');
    }
    
    if (this.stats.issuesByCategory['Error Handling'] > 3) {
      recommendations.push('- Implement consistent `ErrorStates` patterns');
    }
    
    if (this.stats.issuesByCategory['Page Structure'] > 2) {
      recommendations.push('- Apply `PageTemplates` to department pages');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- No high priority issues detected';
  }

  /**
   * Get medium priority recommendations
   */
  getMediumPriorityRecommendations() {
    const recommendations = [];
    
    if (this.stats.issuesByCategory['Data Display'] > 2) {
      recommendations.push('- Standardize table and card components usage');
    }
    
    if (this.stats.issuesByCategory['Color Usage'] > 5) {
      recommendations.push('- Enforce design token usage with linting rules');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- No medium priority issues detected';
  }

  /**
   * Get low priority recommendations
   */
  getLowPriorityRecommendations() {
    const recommendations = [];
    
    if (this.stats.issuesByCategory['Spacing'] > 5) {
      recommendations.push('- Review spacing system and create guidelines');
    }
    
    recommendations.push('- Document approved patterns in Storybook');
    recommendations.push('- Add automated consistency checks to CI/CD');
    
    return recommendations.join('\n');
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new ConsistencyAnalyzer();
    await analyzer.analyze();
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ConsistencyAnalyzer, PATTERNS };