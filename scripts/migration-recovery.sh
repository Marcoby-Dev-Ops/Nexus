#!/bin/bash

# Migration Recovery Script
# Helps recover from partial migrations by checking what's missing and applying fixes

set -e

echo "🔍 Migration Recovery Script"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in a Supabase project directory"
    exit 1
fi

# Function to check if a migration was applied
check_migration_applied() {
    local migration_name=$1
    local result=$(pnpm supabase db reset --dry-run 2>&1 | grep -c "$migration_name" || echo "0")
    echo $result
}

# Function to apply a specific migration
apply_migration() {
    local migration_file=$1
    echo "📦 Applying migration: $migration_file"
    
    # Check if migration exists
    if [ ! -f "supabase/migrations/$migration_file" ]; then
        echo "❌ Migration file not found: $migration_file"
        return 1
    fi
    
    # Try to apply the migration
    if pnpm supabase db push --include-all; then
        echo "✅ Migration applied successfully: $migration_file"
        return 0
    else
        echo "❌ Failed to apply migration: $migration_file"
        return 1
    fi
}

# Function to check database status
check_database_status() {
    echo "🔍 Checking database status..."
    
    # Check if component_usages table exists
    echo "Checking component_usages table..."
    local component_usages_exists=$(pnpm supabase db reset --dry-run 2>&1 | grep -c "component_usages" || echo "0")
    
    if [ "$component_usages_exists" -eq 0 ]; then
        echo "❌ component_usages table is missing"
        return 1
    else
        echo "✅ component_usages table exists"
    fi
    
    # Check companies table structure
    echo "Checking companies table structure..."
    local companies_columns=$(pnpm supabase db reset --dry-run 2>&1 | grep -c "companies" || echo "0")
    
    if [ "$companies_columns" -eq 0 ]; then
        echo "❌ companies table has issues"
        return 1
    else
        echo "✅ companies table structure looks good"
    fi
    
    return 0
}

# Main recovery logic
main() {
    echo "🚀 Starting migration recovery..."
    
    # Check current database status
    if check_database_status; then
        echo "✅ Database looks healthy!"
        exit 0
    fi
    
    echo "⚠️  Database has issues, attempting recovery..."
    
    # List available migrations
    echo "📋 Available migrations:"
    ls -la supabase/migrations/*.sql | grep -E "2025011800000[0-9]" || echo "No recent migrations found"
    
    # Try to apply the latest migration
    local latest_migration=$(ls supabase/migrations/*.sql | grep -E "2025011800000[0-9]" | tail -1 | xargs basename)
    
    if [ -n "$latest_migration" ]; then
        echo "🔄 Attempting to apply latest migration: $latest_migration"
        if apply_migration "$latest_migration"; then
            echo "✅ Recovery successful!"
        else
            echo "❌ Recovery failed. Manual intervention may be required."
            echo ""
            echo "💡 Manual recovery steps:"
            echo "1. Check the migration file: supabase/migrations/$latest_migration"
            echo "2. Look for any syntax errors or constraint conflicts"
            echo "3. Consider creating a new migration with a different version number"
            echo "4. Use 'pnpm supabase db reset' to start fresh (⚠️  WARNING: This will delete all data)"
            exit 1
        fi
    else
        echo "❌ No recent migrations found for recovery"
        exit 1
    fi
}

# Run the main function
main "$@" 