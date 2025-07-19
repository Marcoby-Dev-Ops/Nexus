#!/bin/bash

echo "Cleaning up duplicate and conflicting migrations..."

# Remove duplicate migrations that exist in both main and backup
cd supabase/migrations

# List of migrations to remove (duplicates or conflicts)
duplicates=(
    "20250707145519_test_and_fix_n8n.sql"
    "20250707145519_fix_n8n_configurations_final.sql"
    "20250708_rerun_test_and_fix_n8n.sql"
    "20250115000002_fix_migration_tracking.sql"
    "20250115000001_add_rag_context_fields.sql"
    "20250115000001_production_chat_optimization.sql"
)

for file in "${duplicates[@]}"; do
    if [ -f "$file" ]; then
        echo "Removing duplicate: $file"
        rm "$file"
    fi
done

echo "Migration cleanup complete." 