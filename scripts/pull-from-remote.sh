#!/bin/bash

# Script to pull latest schema from remote Supabase instance (source of truth)
# This ensures local development always starts with the latest remote schema

set -e

echo "📥 Pulling latest schema from remote database (source of truth)..."

# Pull the latest schema from remote
echo "🔄 Syncing local schema with remote..."
pnpm supabase db pull --linked

echo "✅ Local schema synced with remote database!"

# Show what was pulled
echo "📊 Current local schema status:"
pnpm supabase db diff --linked --schema public

echo "🎯 Remote database is the source of truth - local development is now in sync!" 