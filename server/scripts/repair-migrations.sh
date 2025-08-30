#!/bin/bash

# Migration Repair Script
# This script repairs the Supabase migration history by marking migrations as reverted or applied

set -e

echo "🔧 Supabase Migration Repair"
echo "============================"

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "[ERROR] Please run this script from the project root directory"
    exit 1
fi

echo "[INFO] Starting migration repair process..."

# Function to execute migration repair commands
repair_migration() {
    local status=$1
    local migration=$2
    echo "[INFO] Repairing migration: $migration (status: $status)"
    pnpm supabase migration repair --status $status $migration
}

# Mark migrations as reverted (these are in the error output)
echo "[INFO] Marking migrations as reverted..."
reverted_migrations=(
    "20240622"
    "20250109000003"
    "20250109120000"
    "20250110000001"
    "20250118000001"
    "20250118000004"
    "20250608150000"
    "20250707"
    "20250719035607"
    "20250719044517"
    "20250719045521"
    "20250719045555"
    "20250719045731"
    "20250719045857"
    "20250719045901"
    "20250719045916"
    "20250719045921"
    "20250719045942"
    "20250719045946"
    "20250719050003"
    "20250719050008"
    "20250719050245"
    "20250719050413"
    "20250719050454"
    "20250719050501"
    "20250719050515"
    "20250719050527"
    "20250719050535"
    "20250719050543"
    "20250719051704"
    "20250719053850"
    "20250719054254"
    "20250719121520"
    "20250719121536"
    "20250719121859"
    "20250719122123"
    "20250719122141"
    "20250719122331"
    "20250719122351"
    "20250719122554"
    "20250719122616"
    "20250719122922"
    "20250719122956"
    "20250719123112"
    "20250719123200"
    "20250719123222"
)

for migration in "${reverted_migrations[@]}"; do
    repair_migration "reverted" "$migration"
done

# Mark migrations as applied (these are in the error output)
echo "[INFO] Marking migrations as applied..."
applied_migrations=(
    "20250119000001"
    "20250801000000"
)

for migration in "${applied_migrations[@]}"; do
    repair_migration "applied" "$migration"
done

echo "[SUCCESS] Migration repair completed!"
echo "[INFO] You can now run 'pnpm supabase db pull' to sync with remote" 