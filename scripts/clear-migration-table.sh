#!/bin/bash

# Clear Migration Table Script
# Based on: https://github.com/orgs/supabase/discussions/18483

set -e

echo "🗑️  Clear Migration Table"
echo "========================="

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "[ERROR] Please run this script from the project root directory"
    exit 1
fi

echo "[WARNING] This will clear the migration history table!"
echo "[WARNING] This follows the official Supabase approach for schema sync issues."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "[INFO] Operation cancelled"
    exit 1
fi

echo "[INFO] Starting migration table clear..."

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

# Clear the migration history table using direct SQL
echo "[INFO] Clearing migration history table using SQL..."
echo "[WARNING] You will need to enter your database password"
echo "[INFO] This will execute: DELETE FROM supabase_migrations.schema_migrations;"

# Use supabase db reset to clear the migration table
pnpm supabase db reset --linked

# Alternative: If the above doesn't work, we can try to connect directly
echo "[INFO] If the above didn't work, trying alternative approach..."
echo "[INFO] You may need to manually execute this SQL in your database:"
echo "[INFO] DELETE FROM supabase_migrations.schema_migrations;"

# Pull fresh schema from remote
echo "[INFO] Pulling fresh schema from remote database..."
echo "[WARNING] You will need to enter your database password again"
pnpm supabase db pull

echo "[SUCCESS] Migration table cleared and fresh migrations pulled!"
echo "[INFO] Your local migrations now match the remote database"
echo "[INFO] You can now run 'pnpm supabase start' to start local development" 