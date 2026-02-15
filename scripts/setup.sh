#!/bin/bash

echo "🚀 Setting up Nexus MVP..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start Supabase
echo "🗄️ Starting Supabase..."
pnpm supabase:start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Apply migrations
echo "🔄 Applying database migrations..."
pnpm supabase:reset

# Generate types
echo "📝 Generating TypeScript types..."
pnpm supabase:gen-types

echo "✅ Setup complete!"
echo ""
echo "🎉 Nexus MVP is ready!"
echo ""
echo "Next steps:"
echo "1. Copy your Supabase keys from supabase/.env to .env.local"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Open http://localhost:3000 to see your app"
echo ""
echo "Supabase Studio: http://localhost:54323"



