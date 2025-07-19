#!/bin/bash

# Clear Migration History Script
# This script directly clears the migration history table and pulls fresh migrations

set -e

echo "🗑️  Clear Migration History"
echo "============================"

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "[ERROR] Please run this script from the project root directory"
    exit 1
fi

echo "[WARNING] This will completely clear your migration history table!"
echo "[WARNING] This is a destructive operation that will clear all migration records."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "[INFO] Operation cancelled"
    exit 1
fi

echo "[INFO] Starting migration history clear..."

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

# Clear the migration history table using SQL
echo "[INFO] Clearing migration history table using SQL..."
echo "[WARNING] You will need to enter your database password"
pnpm supabase db reset --linked

# Alternative approach: Use SQL to clear the migration history
echo "[INFO] Attempting to clear migration history with SQL..."
pnpm supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.kqclbpimkraenvbffnpk.supabase.co:5432/postgres" --include-all

# Pull fresh schema from remote
echo "[INFO] Pulling fresh schema from remote database..."
echo "[WARNING] You will need to enter your database password again"
pnpm supabase db pull

echo "[SUCCESS] Migration history cleared and fresh migrations pulled!"
echo "[INFO] Your local migrations now match the remote database"
echo "[INFO] You can now run 'pnpm supabase start' to start local development" 