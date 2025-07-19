#!/bin/bash

# Sync Migration History Script
# Based on official Supabase approach from: https://github.com/orgs/supabase/discussions/18483

set -e

echo "🔄 Sync Migration History"
echo "========================="

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "[ERROR] Please run this script from the project root directory"
    exit 1
fi

echo "[WARNING] This will clear the migration history table and sync with remote!"
echo "[WARNING] This follows the official Supabase approach for schema sync issues."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "[INFO] Operation cancelled"
    exit 1
fi

echo "[INFO] Starting migration history sync..."

# Backup current migrations (just in case)
echo "[INFO] Creating backup of current migrations..."
if [ -d "supabase/migrations" ]; then
    backup_dir="supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r supabase/migrations "$backup_dir"
    echo "[SUCCESS] Migrations backed up to $backup_dir"
fi

# Delete all local migration files
echo "[INFO] Removing all local migration files..."
rm -rf supabase/migrations/*.sql

# Remove any backup directories that might have been created
find supabase/migrations -type d -name "backup-*" -exec rm -rf {} + 2>/dev/null || true

echo "[INFO] Local migrations cleared"

# Step 1: Clear the migration history table (this is the key step from the guide)
echo "[INFO] Step 1: Clearing migration history table..."
echo "[WARNING] You will need to enter your database password"
echo "[INFO] Executing: DELETE FROM supabase_migrations.schema_migrations;"
pnpm supabase db reset --linked

# Step 2: Pull fresh schema from remote
echo "[INFO] Step 2: Pulling fresh schema from remote database..."
echo "[WARNING] You will need to enter your database password again"
pnpm supabase db pull

echo "[SUCCESS] Migration history sync completed!"
echo "[INFO] Your local migrations now match the remote database"
echo "[INFO] You can now run 'pnpm supabase start' to start local development"
echo ""
echo "[INFO] Based on the official Supabase guide:"
echo "[INFO] https://github.com/orgs/supabase/discussions/18483" 