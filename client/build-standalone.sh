#!/bin/bash

# Standalone build script for client app
# This script ensures the client can build independently of the monorepo

set -e

echo "🚀 Building Nexus Client (Standalone Mode)"

# Ensure we're in the client directory
cd "$(dirname "$0")"

# Check if we have the necessary files
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in client directory"
    exit 1
fi

if [ ! -f "vite.config.ts" ]; then
    echo "❌ Error: vite.config.ts not found in client directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building application..."
pnpm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build successful! Output in ./dist"
    ls -la dist/
else
    echo "❌ Build failed - no dist directory created"
    exit 1
fi

echo "🎉 Standalone build completed successfully!"
