#!/bin/bash

# Fresh Migration Sync Script
# This script deletes all local migrations and pulls fresh ones from remote

set -e

echo "🔄 Fresh Migration Sync"
echo "======================="

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "[ERROR] Please run this script from the project root directory"
    exit 1
fi

echo "[WARNING] This will delete ALL local migration files!"
echo "[WARNING] Make sure you have backed up any important local changes."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "[INFO] Operation cancelled"
    exit 1
fi

echo "[INFO] Starting fresh migration sync..."

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

# Pull fresh schema from remote
echo "[INFO] Pulling fresh schema from remote database..."
echo "[WARNING] You will need to enter your database password"
pnpm supabase db pull

echo "[SUCCESS] Fresh migration sync completed!"
echo "[INFO] Your local migrations now match the remote database"
echo "[INFO] You can now run 'pnpm supabase start' to start local development" 