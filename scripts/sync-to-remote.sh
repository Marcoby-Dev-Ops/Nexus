#!/bin/bash

# Script to sync with remote Supabase instance (source of truth)
# This ensures that the remote database is always the authoritative source

set -e

echo "🔄 Syncing with remote Supabase instance (source of truth)..."

# First, pull the latest schema from remote to ensure we're in sync
echo "📥 Pulling latest schema from remote database..."
pnpm supabase db pull --linked

# Check if we have any new migrations to apply
echo "📋 Checking for new migrations..."

# Apply any new migrations to remote
echo "🚀 Applying new migrations to remote database..."
pnpm supabase db push --linked

echo "✅ Sync complete! Remote database is the source of truth."

# Show current remote schema status
echo "📊 Current remote database status:"
pnpm supabase db diff --linked --schema public 