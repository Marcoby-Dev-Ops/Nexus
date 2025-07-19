#!/bin/bash

# Cleanup Redundant Migrations Script
# This script removes redundant migrations after applying the consolidated migration

set -e

echo "🧹 Starting migration cleanup process..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

# Check if the consolidated migration exists
if [ ! -f "supabase/migrations/20250801000000_consolidate_tables_and_add_missing.sql" ]; then
    echo "❌ Error: Consolidated migration not found. Please apply it first."
    exit 1
fi

echo "📋 Redundant migrations to be removed:"

# List of redundant migrations to remove
REDUNDANT_MIGRATIONS=(
    "20250107000000_create_missing_tables.sql"
    "20250118000001_fix_missing_tables.sql"
    "20250118000004_fix_missing_tables_simple.sql"
    "20250119000000_fix_missing_tables.sql"
    "20250109000000_create_user_profile_system.sql"
    "20250110000001_extend_user_profiles_table.sql"
    "20250109120000_create_integrations_system.sql"
    "20250109000003_add_personal_memory_system.sql"
    "20250103000003_continuous_improvement_billing.sql"
)

# Check which migrations exist and can be removed
EXISTING_MIGRATIONS=()
for migration in "${REDUNDANT_MIGRATIONS[@]}"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo "  ✅ $migration"
        EXISTING_MIGRATIONS+=("$migration")
    else
        echo "  ⚠️  $migration (not found)"
    fi
done

if [ ${#EXISTING_MIGRATIONS[@]} -eq 0 ]; then
    echo "🎉 No redundant migrations found to remove!"
    exit 0
fi

echo ""
echo "📊 Summary:"
echo "  - Total redundant migrations: ${#REDUNDANT_MIGRATIONS[@]}"
echo "  - Existing migrations to remove: ${#EXISTING_MIGRATIONS[@]}"

# Ask for confirmation
echo ""
read -p "🤔 Do you want to proceed with removing these migrations? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# Create backup directory
BACKUP_DIR="supabase/migrations/backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup in: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup and remove migrations
echo "🗑️  Removing redundant migrations..."
for migration in "${EXISTING_MIGRATIONS[@]}"; do
    echo "  📁 Moving $migration to backup..."
    mv "supabase/migrations/$migration" "$BACKUP_DIR/"
done

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "  - Removed ${#EXISTING_MIGRATIONS[@]} redundant migrations"
echo "  - Backup created in: $BACKUP_DIR"
echo ""
echo "🔍 Next steps:"
echo "  1. Test your application to ensure everything works"
echo "  2. Run 'pnpm supabase db diff' to verify no schema changes"
echo "  3. If everything is working, you can delete the backup directory"
echo "  4. If issues arise, restore from backup: mv $BACKUP_DIR/* supabase/migrations/"
echo ""
echo "💡 The consolidated migration includes all necessary tables and improvements!" 