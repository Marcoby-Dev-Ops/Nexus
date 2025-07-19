#!/bin/bash

# Quick Migration Repair Script
# This script handles the migration history mismatch efficiently

set -e

echo "🔧 Quick Migration Repair"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first."
    exit 1
fi

print_status "Starting quick repair process..."

# Step 1: Backup current migrations
print_status "Backing up current migrations..."
if [ -d "supabase/migrations" ]; then
    cp -r supabase/migrations supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Migrations backed up"
fi

# Step 2: Pull schema from remote (this will create new migration files)
print_status "Pulling schema from remote..."
print_warning "You will need to enter your database password once"
supabase db pull

# Step 3: Reset local database to match remote
print_status "Resetting local database to match remote..."
supabase db reset

print_success "Quick repair completed!"
print_status "Your local database should now match the remote schema."
print_status "You can now start your local development environment with:"
echo "  pnpm supabase:start"
echo "  pnpm dev" 