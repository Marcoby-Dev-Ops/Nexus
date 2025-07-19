#!/bin/bash

echo "Fixing migration issues..."

# Remove duplicate local migrations
cd supabase/migrations

# Remove duplicate 20240607 migrations (keep only the first one)
if [ -f "20240607_integration_foundation.sql" ]; then
    echo "Keeping 20240607_integration_foundation.sql"
fi

# Remove duplicate 20240609 migrations (keep only the first one)
if [ -f "20240609_standardize_schema.sql" ]; then
    echo "Keeping 20240609_standardize_schema.sql"
fi

# Remove duplicate 20250621000002 migrations (keep only the first one)
if [ -f "20250621000002_create_public_users_table.sql" ]; then
    echo "Keeping 20250621000002_create_public_users_table.sql"
fi

# Remove duplicate 20250707 migrations (keep only the first one)
if [ -f "20250707_add_rls_policies_for_integrations.sql" ]; then
    echo "Keeping 20250707_add_rls_policies_for_integrations.sql"
fi

echo "Migration cleanup complete."

echo ""
echo "Next steps:"
echo "1. Run: supabase migration repair --status applied 20250115000001"
echo "2. Run: supabase migration repair --status applied 20250707"
echo "3. Run: supabase db reset (if needed)"
echo "4. Run: supabase db push" 