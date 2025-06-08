# Nexus Development Scripts 🛠️

This directory contains development and analysis scripts for the Nexus project.

## UX/UI Consistency Analysis

### **analyze-consistency.cjs**

An automated script that analyzes your codebase for UX/UI consistency issues and generates actionable reports.

#### **Usage**

```bash
# Run the analysis
npm run analyze:consistency

# Or run directly
node scripts/analyze-consistency.cjs
```

#### **What It Analyzes**

The script examines your React components and pages for:

1. **Loading States** 🔄
   - Custom spinners vs. `<Spinner>` component usage
   - Hardcoded spinner styles
   - Inconsistent loading patterns

2. **Error Handling** ⚠️
   - Custom error styling vs. `<Alert>` component
   - Inline error colors vs. design tokens
   - Inconsistent error display patterns

3. **Page Structure** 📐
   - Missing gradient backgrounds on pages
   - Inconsistent layout patterns
   - Department page structure compliance

4. **Data Display** 📊
   - Manual tables vs. `<Table>` component
   - Manual cards vs. `<Card>` component
   - Inconsistent data presentation

5. **Color Usage** 🎨
   - Hardcoded colors vs. design tokens
   - Inconsistent color application
   - Design system compliance

6. **Spacing** 📏
   - Non-standard spacing values
   - Inconsistent padding/margin usage
   - Spacing system compliance

#### **Output**

The script generates a comprehensive report at `docs/CONSISTENCY_REPORT.md` with:

- **Overall consistency score** (1-10)
- **Category-specific scores** and issue counts
- **File-by-file breakdown** with line numbers
- **Severity levels** (High 🔴, Medium 🟡, Low 🟢)
- **Actionable recommendations** prioritized by impact

#### **Sample Report Structure**

```markdown
# UX/UI Consistency Report 📊

## Summary
- Files Analyzed: 86
- Total Issues: 107  
- Consistency Score: 7.2/10

## Score Breakdown
- Loading States: 5/10 (11 issues)
- Error Handling: 6/10 (15 issues)
- Page Structure: 8/10 (5 issues)
- Data Display: 4/10 (13 issues)
- Color Usage: 1/10 (41 issues)
- Spacing: 1/10 (22 issues)

## Issues by Category
### Loading States
#### `src/components/onboarding/OnboardingFlow.tsx`
🔴 **HIGH:** Found 1 hardcoded spinner style(s). Use <Spinner> component instead.
   - Lines: 87
```

#### **Understanding Severity Levels**

- **🔴 High Priority**: Critical inconsistencies that significantly impact UX
  - Hardcoded spinner styles that should use components
  - Major structural inconsistencies
  - Accessibility issues

- **🟡 Medium Priority**: Important consistency issues
  - Custom styling that could use design system
  - Component usage inconsistencies
  - Page structure variations

- **🟢 Low Priority**: Minor improvements for better consistency
  - Inline color usage vs. design tokens
  - Non-standard spacing values
  - Documentation improvements

#### **Recommended Workflow**

1. **Run Initial Analysis**
   ```bash
   npm run analyze:consistency
   ```

2. **Review High Priority Issues First**
   - Focus on 🔴 high-severity issues
   - These have the biggest impact on consistency

3. **Create Standardized Components**
   - Based on frequently occurring patterns
   - Follow recommendations in the report

4. **Track Progress**
   - Re-run analysis after fixes
   - Monitor consistency score improvements
   - Set up CI integration for ongoing monitoring

5. **Set Team Standards**
   - Use report findings to create style guidelines
   - Add linting rules to prevent regression
   - Document approved patterns

#### **Integration with CI/CD**

Add to your CI pipeline:

```yaml
# .github/workflows/consistency.yml
- name: Check UX/UI Consistency
  run: |
    npm run analyze:consistency
    # Fail if score drops below threshold
    node scripts/check-consistency-score.js --min-score 7.0
```

#### **Customization**

Edit the `PATTERNS` object in the script to:
- Add new consistency checks
- Adjust severity levels
- Include/exclude file patterns
- Customize scoring algorithms

#### **Best Practices**

- **Run regularly** - Consistency analysis should be part of your development workflow
- **Set score targets** - Aim for 8.5+ overall consistency score
- **Address by priority** - High severity issues first, then medium, then low
- **Track trends** - Monitor whether consistency is improving over time
- **Team awareness** - Share reports with the team to maintain standards

#### **Future Enhancements**

The script can be extended to check:
- Animation consistency
- Typography patterns
- Accessibility compliance
- Performance patterns
- Component prop usage
- Design token coverage

---

**Pro Tip**: Run this script before major releases to ensure consistent user experience across all features! 🚀 