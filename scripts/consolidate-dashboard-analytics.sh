#!/bin/bash

# Dashboard & Analytics Consolidation Script
# This script consolidates the dashboard and analytics domains by:
# 1. Moving analytics components to dashboard
# 2. Removing nested features structure
# 3. Updating import statements
# 4. Creating unified exports

set -e

echo "🚀 Starting Dashboard & Analytics Consolidation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Creating backup of current structure..."
# Create backup
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp -r src/domains/dashboard backups/$(date +%Y%m%d_%H%M%S)/dashboard
cp -r src/domains/analytics backups/$(date +%Y%m%d_%H%M%S)/analytics

print_status "Creating analytics subdirectory in dashboard..."
# Create analytics subdirectory in dashboard
mkdir -p src/domains/dashboard/components/analytics

print_status "Moving analytics components to dashboard..."
# Move analytics components to dashboard
if [ -d "src/domains/analytics/components" ]; then
    cp -r src/domains/analytics/components/* src/domains/dashboard/components/analytics/
    print_success "Analytics components moved to dashboard"
else
    print_warning "No analytics components directory found"
fi

print_status "Moving useful components from nested features structure..."
# Move useful components from nested features
if [ -d "src/domains/dashboard/features/components" ]; then
    # Move components that aren't duplicates
    for component in src/domains/dashboard/features/components/*.tsx; do
        if [ -f "$component" ]; then
            filename=$(basename "$component")
            if [ ! -f "src/domains/dashboard/components/$filename" ]; then
                cp "$component" "src/domains/dashboard/components/"
                print_status "Moved $filename to dashboard/components"
            else
                print_warning "Skipping $filename (already exists in dashboard/components)"
            fi
        fi
    done
else
    print_warning "No nested features/components directory found"
fi

print_status "Moving hooks from nested structure..."
# Move hooks from nested structure
if [ -d "src/domains/dashboard/features/hooks" ]; then
    mkdir -p src/domains/dashboard/hooks
    cp -r src/domains/dashboard/features/hooks/* src/domains/dashboard/hooks/
    print_success "Hooks moved to dashboard/hooks"
else
    print_warning "No nested features/hooks directory found"
fi

print_status "Moving services from nested structure..."
# Move services from nested structure
if [ -d "src/domains/dashboard/features/services" ]; then
    mkdir -p src/domains/dashboard/services
    cp -r src/domains/dashboard/features/services/* src/domains/dashboard/services/
    print_success "Services moved to dashboard/services"
else
    print_warning "No nested features/services directory found"
fi

print_status "Creating types directory..."
# Create types directory
mkdir -p src/domains/dashboard/types

print_status "Removing nested features structure..."
# Remove nested features structure
if [ -d "src/domains/dashboard/features" ]; then
    rm -rf src/domains/dashboard/features
    print_success "Removed nested features directory"
else
    print_warning "No nested features directory found"
fi

print_status "Updating import statements..."
# Update import statements in dashboard components
find src/domains/dashboard -name "*.tsx" -type f -exec sed -i 's|@/domains/analytics/components|@/domains/dashboard/components/analytics|g' {} \;
find src/domains/dashboard -name "*.tsx" -type f -exec sed -i 's|@/domains/dashboard/features/components|@/domains/dashboard/components|g' {} \;
find src/domains/dashboard -name "*.tsx" -type f -exec sed -i 's|@/domains/dashboard/features/hooks|@/domains/dashboard/hooks|g' {} \;
find src/domains/dashboard -name "*.tsx" -type f -exec sed -i 's|@/domains/dashboard/features/services|@/domains/dashboard/services|g' {} \;

print_status "Updating analytics domain exports..."
# Update analytics domain to only export pages and services
cat > src/domains/analytics/index.ts << 'EOF'
/**
 * Analytics Domain - Simplified Exports
 * Only exports pages and services, components moved to dashboard
 */

// Pages
export { default as FireCyclePage } from './pages/FireCyclePage';
export { default as IntegrationsPage } from './pages/IntegrationsPage';
export { default as UnifiedAnalyticsPage } from './pages/UnifiedAnalyticsPage';

// Services
export { default as analyticsService } from './lib/analyticsService';
export { default as googleAnalyticsService } from './lib/googleAnalyticsService';
export { default as googleWorkspaceService } from './lib/googleWorkspaceService';

// Types
export type { KeyMetric, NorthStar, Priority, Opportunity, Risk, Trend, Blocker } from './types';
EOF

print_status "Creating unified dashboard exports..."
# Create unified dashboard exports
cat > src/domains/dashboard/index.ts << 'EOF'
/**
 * Dashboard Domain - Consolidated Exports
 * Unified dashboard components with analytics integration
 */

// Core Dashboard Components
export { ConsolidatedDashboard } from './components/ConsolidatedDashboard';
export { CompanyStatusDashboard } from './components/CompanyStatusDashboard';
export { default as LivingBusinessAssessment } from './components/LivingBusinessAssessment';
export { default as UnifiedCommunicationDashboard } from './components/UnifiedCommunicationDashboard';

// Analytics Integration (moved from analytics domain)
export { default as CrossPlatformInsightsEngine } from './components/analytics/CrossPlatformInsightsEngine';
export { default as DigestibleMetricsDashboard } from './components/analytics/DigestibleMetricsDashboard';
export { FireCycleDashboard } from './components/analytics/FireCycleDashboard';
export { BlockersCard } from './components/analytics/BlockersCard';
export { OpportunitiesCard } from './components/analytics/OpportunitiesCard';
export { RisksCard } from './components/analytics/RisksCard';

// AI Agent Integration
export { MarcobyNexusAgent } from '../ai/components/MarcobyNexusAgent';

// Types
export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  category: 'fire-cycle' | 'see-think-act' | 'business-intelligence' | 'communication';
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface FireCycleState {
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  progress: number;
  insights: string[];
  actions: string[];
  lastUpdated: string;
}

export interface BusinessHealth {
  overall: number;
  revenue: number;
  operations: number;
  team: number;
  customer: number;
  trend: 'up' | 'down' | 'stable';
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'automation' | 'analysis' | 'communication' | 'planning';
  priority: 'urgent' | 'high' | 'medium' | 'low';
}
EOF

print_status "Running TypeScript check..."
# Run TypeScript check to catch any import issues
if command -v npx &> /dev/null; then
    npx tsc --noEmit || print_warning "TypeScript check found some issues - please review"
else
    print_warning "npx not available - skipping TypeScript check"
fi

print_status "Running lint check..."
# Run lint check
if command -v npx &> /dev/null; then
    npx eslint src/domains/dashboard --ext .ts,.tsx || print_warning "ESLint found some issues - please review"
else
    print_warning "npx not available - skipping lint check"
fi

print_success "🎉 Dashboard & Analytics consolidation completed!"
print_status "Next steps:"
print_status "1. Review the changes in src/domains/dashboard/"
print_status "2. Test the application to ensure everything works"
print_status "3. Update any remaining import statements manually"
print_status "4. Remove the backup directory when confident in the changes"

echo ""
print_status "Backup created at: backups/$(ls -t backups/ | head -1)"
print_status "You can restore from backup if needed: cp -r backups/$(ls -t backups/ | head -1)/* src/domains/" 