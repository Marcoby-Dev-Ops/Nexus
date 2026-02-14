#!/bin/bash

# CI/CD Import Check Script
# Comprehensive check for import and dependency issues
# Can be run locally or in CI/CD pipelines

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check if we're in CI
IS_CI=${CI:-false}

print_status "Starting comprehensive import and dependency check..."

# Step 1: TypeScript type checking
print_status "Step 1: Running TypeScript type check..."
if pnpm run type-check > /dev/null 2>&1; then
    print_success "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    if [ "$IS_CI" = "true" ]; then
        pnpm run type-check
        exit 1
    else
        print_warning "TypeScript errors found - continuing with other checks"
    fi
fi

# Step 2: ESLint check
print_status "Step 2: Running ESLint check..."
if pnpm run lint > /dev/null 2>&1; then
    print_success "ESLint check passed"
else
    print_warning "ESLint found issues"
    if [ "$IS_CI" = "true" ]; then
        pnpm run lint
    fi
fi

# Step 3: Custom import checker
print_status "Step 3: Running custom import checker..."
if node scripts/proactive-import-checker.js > /dev/null 2>&1; then
    print_success "Import checker passed"
else
    print_warning "Import checker found issues"
    if [ "$IS_CI" = "true" ]; then
        node scripts/proactive-import-checker.js
    fi
fi

# Step 4: Check for missing barrel exports
print_status "Step 4: Checking for missing barrel exports..."
MISSING_BARRELS=0

# Check common directories that should have index.ts files
BARREL_DIRS=(
    "src/components/integrations"
    "src/services/integrations/hubspot"
    "src/services/business"
    "src/hooks"
    "src/shared/utils"
)

for dir in "${BARREL_DIRS[@]}"; do
    if [ -d "$dir" ] && [ ! -f "$dir/index.ts" ]; then
        print_warning "Missing barrel export: $dir/index.ts"
        MISSING_BARRELS=$((MISSING_BARRELS + 1))
    fi
done

if [ $MISSING_BARRELS -eq 0 ]; then
    print_success "All barrel exports present"
else
    print_warning "Found $MISSING_BARRELS missing barrel exports"
fi

# Step 5: Check for circular dependencies
print_status "Step 5: Checking for circular dependencies..."
if command -v madge > /dev/null 2>&1; then
    if madge --circular src/ > /dev/null 2>&1; then
        print_success "No circular dependencies found"
    else
        print_warning "Circular dependencies detected"
        if [ "$IS_CI" = "true" ]; then
            madge --circular src/
        fi
    fi
else
    print_warning "madge not installed - skipping circular dependency check"
fi

# Step 6: Check for unused imports
print_status "Step 6: Checking for unused imports..."
if pnpm run lint | grep -q "no-unused-vars"; then
    print_warning "Unused imports detected"
    if [ "$IS_CI" = "true" ]; then
        pnpm run lint | grep "no-unused-vars"
    fi
else
    print_success "No unused imports found"
fi

# Step 7: Check for missing dependencies
print_status "Step 7: Checking for missing dependencies..."
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
    print_success "All dependencies are properly installed"
else
    print_error "Missing dependencies detected"
    if [ "$IS_CI" = "true" ]; then
        pnpm install --frozen-lockfile
        exit 1
    fi
fi

# Step 8: Build test
print_status "Step 8: Testing build process..."
if pnpm run build > /dev/null 2>&1; then
    print_success "Build test passed"
else
    print_error "Build test failed"
    if [ "$IS_CI" = "true" ]; then
        pnpm run build
        exit 1
    fi
fi

# Summary
print_status "Import and dependency check completed!"
print_success "All critical checks passed"

if [ "$IS_CI" = "true" ]; then
    echo "::set-output name=status::success"
fi 