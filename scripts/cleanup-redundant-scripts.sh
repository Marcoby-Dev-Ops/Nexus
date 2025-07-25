#!/bin/bash

# Cleanup Redundant Scripts
# Removes outdated import and lint fix scripts that are superseded by our new comprehensive solution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status "Starting comprehensive cleanup of redundant scripts..."

# Scripts that are actively used in package.json (KEEP THESE)
USED_SCRIPTS=(
    "scripts/analyze-consistency.cjs"
    "scripts/fix-consistency.cjs"
    "scripts/ai-transformation-demo.ts"
    "scripts/scan-models.cjs"
    "scripts/fix-hardcoded-colors.cjs"
    "scripts/generate-sitemap.cjs"
    "scripts/generate-robots.cjs"
    "scripts/proactive-import-checker-fixed.js"
    "scripts/quick-import-check.js"
    "scripts/fix-supabase-imports.sh"
    "scripts/ci-import-check.sh"
    "scripts/cleanup-redundant-scripts.sh"
    "scripts/sync-database.sh"
    "scripts/repair-migrations.sh"
    "scripts/quick-repair.sh"
    "scripts/wsl-repair.sh"
    "scripts/sync-to-remote.sh"
    "scripts/pull-from-remote.sh"
    "scripts/cleanup-dependencies.js"
)

# Redundant import fix scripts (REMOVE THESE)
REDUNDANT_IMPORT_SCRIPTS=(
    "scripts/fix-imports.js"
    "scripts/fix-imports.cjs"
    "scripts/comprehensive-import-fix.cjs"
    "scripts/fix-all-imports.cjs"
    "scripts/auto-fix-imports.js"
    "scripts/analyze-import-issues.js"
    "scripts/proactive-import-checker.js"
    "scripts/fix-export-issues.js"
    "scripts/fix-undefined-variables.js"
    "scripts/fix-entry-imports.sh"
    "scripts/alias-import-fix.cjs"
    "scripts/fix-duplicate-shared-imports.sh"
)

# Redundant lint fix scripts (REMOVE THESE)
REDUNDANT_LINT_SCRIPTS=(
    "scripts/fix-lint-errors.js"
    "scripts/quick-lint-fix.js"
    "scripts/comprehensive-lint-fix.js"
)

# Redundant migration scripts (REMOVE THESE)
REDUNDANT_MIGRATION_SCRIPTS=(
    "scripts/clear-migration-table.sh"
    "scripts/sync-migration-history.sh"
    "scripts/auto-repair-migrations.sh"
    "scripts/clear-migration-history.sh"
    "scripts/reset-migration-history.sh"
    "scripts/fresh-migration-sync.sh"
    "scripts/cleanup-redundant-migrations.sh"
    "scripts/fix_migration_issues.sh"
    "scripts/cleanup_migrations.sh"
    "scripts/migration-recovery.sh"
)

# Redundant structure/migration scripts (REMOVE THESE)
REDUNDANT_STRUCTURE_SCRIPTS=(
    "scripts/migrate-structure.js"
    "scripts/migrate-to-domains-structure.cjs"
    "scripts/cleanup-features.sh"
    "scripts/cleanup-modules.cjs"
    "scripts/migrate-redundant-pages.mjs"
    "scripts/migrate-redundant-pages.js"
    "scripts/migrate-redundant-components.js"
    "scripts/reorganize-departments.sh"
    "scripts/consolidate-dashboard-analytics.sh"
    "scripts/consolidate-ai-features.sh"
)

# Redundant utility scripts (REMOVE THESE)
REDUNDANT_UTILITY_SCRIPTS=(
    "scripts/check-user-status.js"
    "scripts/test-ownership-system.js"
    "scripts/insert-sample-emails.js"
    "scripts/migrateOffice365.ts"
    "scripts/test-functions.sh"
    "scripts/deploy-edge-functions.sh"
    "scripts/update-edge-functions.sh"
    "scripts/simple_db_check.js"
    "scripts/check_n8n_workflows.js"
    "scripts/backfill-profiles.ts"
    "scripts/embed_ops_docs.ts"
    "scripts/analyze-unused.cjs"
)

# Check if we're in dry-run mode
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    print_warning "DRY RUN MODE - No files will be deleted"
fi

# Function to check if script is referenced in package.json
is_script_used() {
    local script_name="$1"
    local script_basename=$(basename "$script_name")
    if grep -q "$script_basename" package.json; then
        return 0  # Script is used
    else
        return 1  # Script is not used
    fi
}

# Function to check if script is referenced in other files
is_script_referenced() {
    local script_name="$1"
    local script_basename=$(basename "$script_name")
    
    # Check for references in other scripts, docs, etc.
    # Exclude the cleanup script itself and the script being checked
    if find . -name "*.js" -o -name "*.ts" -o -name "*.md" -o -name "*.sh" | grep -v "cleanup-redundant-scripts.sh" | xargs grep -l "$script_basename" 2>/dev/null | grep -v "$script_name" > /dev/null; then
        return 0  # Script is referenced
    else
        return 1  # Script is not referenced
    fi
}

print_status "Analyzing scripts for redundancy..."

# Combine all redundant scripts
ALL_REDUNDANT_SCRIPTS=(
    "${REDUNDANT_IMPORT_SCRIPTS[@]}"
    "${REDUNDANT_LINT_SCRIPTS[@]}"
    "${REDUNDANT_MIGRATION_SCRIPTS[@]}"
    "${REDUNDANT_STRUCTURE_SCRIPTS[@]}"
    "${REDUNDANT_UTILITY_SCRIPTS[@]}"
)

# Check each redundant script
for script in "${ALL_REDUNDANT_SCRIPTS[@]}"; do
    if [[ -f "$script" ]]; then
        print_status "Checking: $script"
        
        # Check if script is used in package.json
        if is_script_used "$script"; then
            print_warning "  ⚠️  Script is referenced in package.json - SKIPPING"
            continue
        fi
        
        # Check if script is referenced elsewhere
        if is_script_referenced "$script"; then
            print_warning "  ⚠️  Script is referenced elsewhere - SKIPPING"
            continue
        fi
        
        # Safe to remove
        if [[ "$DRY_RUN" == true ]]; then
            print_success "  🗑️  Would remove: $script"
        else
            rm "$script"
            print_success "  🗑️  Removed: $script"
        fi
    else
        print_warning "  ⚠️  Script not found: $script"
    fi
done

# Verify our new scripts are still there
print_status "Verifying our active scripts are intact..."

for script in "${USED_SCRIPTS[@]}"; do
    if [[ -f "$script" ]]; then
        print_success "  ✅ $script - PRESENT"
    else
        print_error "  ❌ $script - MISSING"
    fi
done

# Summary
print_status "Cleanup Summary:"
if [[ "$DRY_RUN" == true ]]; then
    print_warning "This was a dry run. No files were actually deleted."
    print_status "Run without --dry-run to actually remove the files."
else
    print_success "Redundant scripts have been removed!"
fi

print_status "Your active scripts are:"
for script in "${USED_SCRIPTS[@]}"; do
    if [[ -f "$script" ]]; then
        print_success "  ✅ $script"
    fi
done

print_status "Your new comprehensive import checking system is ready:"
print_status "  - pnpm run check:imports"
print_status "  - pnpm run check:imports:fix" 
print_status "  - pnpm run ci:import-check"

print_success "Cleanup completed!" 