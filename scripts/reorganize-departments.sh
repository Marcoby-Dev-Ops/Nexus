#!/bin/bash

# Nexus Departments Reorganization Script
# Moves archive features to proper domains and reorganizes departments structure

set -e

echo "🔄 Starting Nexus departments reorganization..."

# Create proper domain structure for security
echo "📁 Creating security domain structure..."
mkdir -p src/domains/admin/security/{components,hooks,services,types}

# Move security from archive to admin domain
echo "🔒 Moving security features to admin domain..."
cp -r src/archive/features/security/* src/domains/admin/security/
rm -rf src/archive/features/security

# Create security index file
cat > src/domains/admin/security/index.ts << 'EOF'
export * from './index';
export { SecurityManager } from './index';
export { validatePassword, logSecurityEvent, encryptData, secureDataExport } from './index';
EOF

# Create proper domain structure for user features
echo "👤 Creating user domain structure..."
mkdir -p src/domains/admin/user/{components,hooks,services,types}

# Move user features from archive
if [ -d "src/archive/features/user" ]; then
    echo "👤 Moving user features to admin domain..."
    cp -r src/archive/features/user/* src/domains/admin/user/
    rm -rf src/archive/features/user
fi

# Create proper domain structure for settings
echo "⚙️ Creating settings domain structure..."
mkdir -p src/domains/admin/settings/{components,hooks,services,types}

# Move settings from archive
if [ -d "src/archive/features/settings" ]; then
    echo "⚙️ Moving settings features to admin domain..."
    cp -r src/archive/features/settings/* src/domains/admin/settings/
    rm -rf src/archive/features/settings
fi

# Create proper domain structure for knowledge
echo "📚 Creating knowledge domain structure..."
mkdir -p src/domains/knowledge/{components,hooks,services,types}

# Move knowledge from archive
if [ -d "src/archive/features/knowledge" ]; then
    echo "📚 Moving knowledge features to knowledge domain..."
    cp -r src/archive/features/knowledge/* src/domains/knowledge/
    rm -rf src/archive/features/knowledge
fi

# Create proper domain structure for UI components
echo "🎨 Creating shared UI domain structure..."
mkdir -p src/shared/ui/{components,hooks,services,types}

# Move UI features from archive
if [ -d "src/archive/features/ui" ]; then
    echo "🎨 Moving UI features to shared domain..."
    cp -r src/archive/features/ui/* src/shared/ui/
    rm -rf src/archive/features/ui
fi

# Create proper domain structure for patterns
echo "📐 Creating shared patterns domain structure..."
mkdir -p src/shared/patterns/{components,hooks,services,types}

# Move patterns from archive
if [ -d "src/archive/features/patterns" ]; then
    echo "📐 Moving patterns features to shared domain..."
    cp -r src/archive/features/patterns/* src/shared/patterns/
    rm -rf src/archive/features/patterns
fi

# Create proper domain structure for templates
echo "📋 Creating shared templates domain structure..."
mkdir -p src/shared/templates/{components,hooks,services,types}

# Move templates from archive
if [ -d "src/archive/features/templates" ]; then
    echo "📋 Moving templates features to shared domain..."
    cp -r src/archive/features/templates/* src/shared/templates/
    rm -rf src/archive/features/templates
fi

# Create proper domain structure for layout
echo "🏗️ Creating shared layout domain structure..."
mkdir -p src/shared/layout/{components,hooks,services,types}

# Move layout from archive
if [ -d "src/archive/features/layout" ]; then
    echo "🏗️ Moving layout features to shared domain..."
    cp -r src/archive/features/layout/* src/shared/layout/
    rm -rf src/archive/features/layout
fi

# Create proper domain structure for interface
echo "🖥️ Creating shared interface domain structure..."
mkdir -p src/shared/interface/{components,hooks,services,types}

# Move interface from archive
if [ -d "src/archive/features/interface" ]; then
    echo "🖥️ Moving interface features to shared domain..."
    cp -r src/archive/features/interface/* src/shared/interface/
    rm -rf src/archive/features/interface
fi

# Create proper domain structure for widgets
echo "🧩 Creating shared widgets domain structure..."
mkdir -p src/shared/widgets/{components,hooks,services,types}

# Move widgets from archive
if [ -d "src/archive/features/widgets" ]; then
    echo "🧩 Moving widgets features to shared domain..."
    cp -r src/archive/features/widgets/* src/shared/widgets/
    rm -rf src/archive/features/widgets
fi

# Create proper domain structure for workflow
echo "⚡ Creating automation workflow domain structure..."
mkdir -p src/domains/automation/workflow/{components,hooks,services,types}

# Move workflow from archive
if [ -d "src/archive/features/workflow" ]; then
    echo "⚡ Moving workflow features to automation domain..."
    cp -r src/archive/features/workflow/* src/domains/automation/workflow/
    rm -rf src/archive/features/workflow
fi

# Create proper domain structure for inbox
echo "📥 Creating workspace inbox domain structure..."
mkdir -p src/domains/workspace/inbox/{components,hooks,services,types}

# Move inbox from archive
if [ -d "src/archive/features/inbox" ]; then
    echo "📥 Moving inbox features to workspace domain..."
    cp -r src/archive/features/inbox/* src/domains/workspace/inbox/
    rm -rf src/archive/features/inbox
fi

# Create proper domain structure for profile
echo "👤 Creating user profile domain structure..."
mkdir -p src/domains/admin/user/profile/{components,hooks,services,types}

# Move profile from archive
if [ -d "src/archive/features/profile" ]; then
    echo "👤 Moving profile features to admin user domain..."
    cp -r src/archive/features/profile/* src/domains/admin/user/profile/
    rm -rf src/archive/features/profile
fi

# Create proper domain structure for business
echo "🏢 Creating business domain structure..."
mkdir -p src/domains/business/{components,hooks,services,types}

# Move business from archive
if [ -d "src/archive/features/business" ]; then
    echo "🏢 Moving business features to business domain..."
    cp -r src/archive/features/business/* src/domains/business/
    rm -rf src/archive/features/business
fi

# Create proper domain structure for development
echo "🛠️ Creating development domain structure..."
mkdir -p src/domains/development/{components,hooks,services,types}

# Move development from archive
if [ -d "src/archive/features/development" ]; then
    echo "🛠️ Moving development features to development domain..."
    cp -r src/archive/features/development/* src/domains/development/
    rm -rf src/archive/features/development
fi

# Create proper domain structure for unified
echo "🔗 Creating shared unified domain structure..."
mkdir -p src/shared/unified/{components,hooks,services,types}

# Move unified from archive
if [ -d "src/archive/features/unified" ]; then
    echo "🔗 Moving unified features to shared domain..."
    cp -r src/archive/features/unified/* src/shared/unified/
    rm -rf src/archive/features/unified
fi

# Create proper domain structure for examples
echo "📖 Creating shared examples domain structure..."
mkdir -p src/shared/examples/{components,hooks,services,types}

# Move examples from archive
if [ -d "src/archive/features/examples" ]; then
    echo "📖 Moving examples features to shared domain..."
    cp -r src/archive/features/examples/* src/shared/examples/
    rm -rf src/archive/features/examples
fi

# Create proper domain structure for icons
echo "🎯 Creating shared icons domain structure..."
mkdir -p src/shared/icons/{components,hooks,services,types}

# Move icons from archive
if [ -d "src/archive/features/icons" ]; then
    echo "🎯 Moving icons features to shared domain..."
    cp -r src/archive/features/icons/* src/shared/icons/
    rm -rf src/archive/features/icons
fi

# Create proper domain structure for demo
echo "🎭 Creating shared demo domain structure..."
mkdir -p src/shared/demo/{components,hooks,services,types}

# Move demo from archive
if [ -d "src/archive/features/demo" ]; then
    echo "🎭 Moving demo features to shared domain..."
    cp -r src/archive/features/demo/* src/shared/demo/
    rm -rf src/archive/features/demo
fi

# Create proper domain structure for entrepreneur
echo "🚀 Creating entrepreneur domain structure..."
mkdir -p src/domains/entrepreneur/{components,hooks,services,types}

# Move entrepreneur from archive
if [ -d "src/archive/features/entrepreneur" ]; then
    echo "🚀 Moving entrepreneur features to entrepreneur domain..."
    cp -r src/archive/features/entrepreneur/* src/domains/entrepreneur/
    rm -rf src/archive/features/entrepreneur
fi

# Create proper domain structure for hype
echo "🔥 Creating hype domain structure..."
mkdir -p src/domains/hype/{components,hooks,services,types}

# Move hype from archive
if [ -d "src/archive/features/hype" ]; then
    echo "🔥 Moving hype features to hype domain..."
    cp -r src/archive/features/hype/* src/domains/hype/
    rm -rf src/archive/features/hype
fi

# Create proper domain structure for waitlist
echo "⏳ Creating waitlist domain structure..."
mkdir -p src/domains/waitlist/{components,hooks,services,types}

# Move waitlist from archive
if [ -d "src/archive/features/waitlist" ]; then
    echo "⏳ Moving waitlist features to waitlist domain..."
    cp -r src/archive/features/waitlist/* src/domains/waitlist/
    rm -rf src/archive/features/waitlist
fi

# Reorganize departments structure
echo "🏢 Reorganizing departments structure..."

# Create proper departments structure
mkdir -p src/domains/departments/{components,hooks,services,types,shared}

# Move department-specific components to proper structure
echo "📦 Moving department components to proper structure..."

# Move operations components
if [ -d "src/domains/departments/operations" ]; then
    echo "⚙️ Moving operations components..."
    mkdir -p src/domains/departments/operations/{components,hooks,services,types}
    
    # Move existing operations files to proper structure
    find src/domains/departments/operations -name "*.tsx" -exec mv {} src/domains/departments/operations/components/ \;
    find src/domains/departments/operations -name "*.ts" -not -name "index.ts" -not -name "config.ts" -not -name "types.ts" -exec mv {} src/domains/departments/operations/hooks/ \;
    
    # Keep config and types in root
    # Move hooks to hooks directory
    if [ -d "src/domains/departments/operations/hooks" ]; then
        mv src/domains/departments/operations/hooks/* src/domains/departments/operations/hooks/ 2>/dev/null || true
    fi
fi

# Create department-specific directories
echo "🏢 Creating department-specific directories..."

# Finance department
mkdir -p src/domains/departments/finance/{components,hooks,services,types}
mv src/domains/departments/FinancePage.tsx src/domains/departments/finance/components/
mv src/domains/departments/FinancialOperationsPage.tsx src/domains/departments/finance/components/

# Sales department
mkdir -p src/domains/departments/sales/{components,hooks,services,types}
mv src/domains/departments/SalesPage.tsx src/domains/departments/sales/components/
mv src/domains/departments/SalesPerformancePage.tsx src/domains/departments/sales/components/

# Marketing department
mkdir -p src/domains/departments/marketing/{components,hooks,services,types}
mv src/domains/departments/MarketingPage.tsx src/domains/departments/marketing/components/

# HR department
mkdir -p src/domains/departments/hr/{components,hooks,services,types}
mv src/domains/departments/HRPage.tsx src/domains/departments/hr/components/

# IT department
mkdir -p src/domains/departments/it/{components,hooks,services,types}
mv src/domains/departments/ITPage.tsx src/domains/departments/it/components/

# Legal department
mkdir -p src/domains/departments/legal/{components,hooks,services,types}
mv src/domains/departments/LegalPage.tsx src/domains/departments/legal/components/

# Product department
mkdir -p src/domains/departments/product/{components,hooks,services,types}
mv src/domains/departments/ProductPage.tsx src/domains/departments/product/components/

# Support department
mkdir -p src/domains/departments/support/{components,hooks,services,types}
mv src/domains/departments/SupportPage.tsx src/domains/departments/support/components/

# Customer Success department
mkdir -p src/domains/departments/customer-success/{components,hooks,services,types}
mv src/domains/departments/CustomerSuccessPage.tsx src/domains/departments/customer-success/components/

# Maturity department
mkdir -p src/domains/departments/maturity/{components,hooks,services,types}
mv src/domains/departments/MaturityPage.tsx src/domains/departments/maturity/components/

# Company Status (moved to dashboard domain)
mkdir -p src/domains/dashboard/company-status/{components,hooks,services,types}
mv src/domains/departments/CompanyStatusPage.tsx src/domains/dashboard/company-status/components/

# Update import paths
echo "🔄 Updating import paths..."

# Update security import in StreamingComposer
sed -i 's|@/archive/features/security|@/domains/admin/security|g' src/domains/ai/components/StreamingComposer.tsx

# Remove archive aliases from config files
echo "🗑️ Removing archive aliases from config files..."

# Update tsconfig.json to remove archive alias
sed -i '/@archive/d' tsconfig.json

# Update vite.config.ts to remove archive alias
sed -i '/@archive/d' vite.config.ts

# Create index files for each department
echo "📝 Creating index files for departments..."

# Finance department index
cat > src/domains/departments/finance/index.ts << 'EOF'
export { default as FinancePage } from './components/FinancePage';
export { default as FinancialOperationsPage } from './components/FinancialOperationsPage';
EOF

# Sales department index
cat > src/domains/departments/sales/index.ts << 'EOF'
export { default as SalesPage } from './components/SalesPage';
export { default as SalesPerformancePage } from './components/SalesPerformancePage';
EOF

# Marketing department index
cat > src/domains/departments/marketing/index.ts << 'EOF'
export { default as MarketingPage } from './components/MarketingPage';
EOF

# HR department index
cat > src/domains/departments/hr/index.ts << 'EOF'
export { default as HRPage } from './components/HRPage';
EOF

# IT department index
cat > src/domains/departments/it/index.ts << 'EOF'
export { default as ITPage } from './components/ITPage';
EOF

# Legal department index
cat > src/domains/departments/legal/index.ts << 'EOF'
export { default as LegalPage } from './components/LegalPage';
EOF

# Product department index
cat > src/domains/departments/product/index.ts << 'EOF'
export { default as ProductPage } from './components/ProductPage';
EOF

# Support department index
cat > src/domains/departments/support/index.ts << 'EOF'
export { default as SupportPage } from './components/SupportPage';
EOF

# Customer Success department index
cat > src/domains/departments/customer-success/index.ts << 'EOF'
export { default as CustomerSuccessPage } from './components/CustomerSuccessPage';
EOF

# Maturity department index
cat > src/domains/departments/maturity/index.ts << 'EOF'
export { default as MaturityPage } from './components/MaturityPage';
EOF

# Operations department index (update existing)
cat > src/domains/departments/operations/index.ts << 'EOF'
export { default as OperationsPage } from './components/OperationsPage';
export { default as OperationsDashboard } from './components/OperationsDashboard';
export * from './types';
export * from './config';
export * from './hooks/useOperationsMetrics';
export * from './hooks/useOperationsSuggestions';
export * from './hooks/useOpsScore';
export * from './hooks/useRunPlaybook';
EOF

# Company Status index (in dashboard domain)
cat > src/domains/dashboard/company-status/index.ts << 'EOF'
export { default as CompanyStatusPage } from './components/CompanyStatusPage';
export { default as CompanyStatusDashboard } from './components/CompanyStatusDashboard';
EOF

# Create main departments index
cat > src/domains/departments/index.ts << 'EOF'
// Finance
export * from './finance';
// Sales
export * from './sales';
// Marketing
export * from './marketing';
// HR
export * from './hr';
// IT
export * from './it';
// Legal
export * from './legal';
// Product
export * from './product';
// Support
export * from './support';
// Customer Success
export * from './customer-success';
// Maturity
export * from './maturity';
// Operations
export * from './operations';
EOF

# Clean up empty archive directory
echo "🧹 Cleaning up empty archive directory..."
if [ -z "$(ls -A src/archive/features 2>/dev/null)" ]; then
    rm -rf src/archive
fi

echo "✅ Departments reorganization complete!"
echo ""
echo "📋 Summary of changes:"
echo "  • Moved security features to admin/security domain"
echo "  • Moved user features to admin/user domain"
echo "  • Moved settings features to admin/settings domain"
echo "  • Moved knowledge features to knowledge domain"
echo "  • Moved UI features to shared/ui domain"
echo "  • Moved patterns features to shared/patterns domain"
echo "  • Moved templates features to shared/templates domain"
echo "  • Moved layout features to shared/layout domain"
echo "  • Moved interface features to shared/interface domain"
echo "  • Moved widgets features to shared/widgets domain"
echo "  • Moved workflow features to automation/workflow domain"
echo "  • Moved inbox features to workspace/inbox domain"
echo "  • Moved profile features to admin/user/profile domain"
echo "  • Moved business features to business domain"
echo "  • Moved development features to development domain"
echo "  • Moved unified features to shared/unified domain"
echo "  • Moved examples features to shared/examples domain"
echo "  • Moved icons features to shared/icons domain"
echo "  • Moved demo features to shared/demo domain"
echo "  • Moved entrepreneur features to entrepreneur domain"
echo "  • Moved hype features to hype domain"
echo "  • Moved waitlist features to waitlist domain"
echo "  • Reorganized departments into proper domain structure"
echo "  • Updated import paths to remove archive dependencies"
echo "  • Removed archive aliases from config files"
echo ""
echo "🎯 Next steps:"
echo "  1. Update any remaining import paths in your codebase"
echo "  2. Test the application to ensure all functionality works"
echo "  3. Update documentation to reflect the new structure" 