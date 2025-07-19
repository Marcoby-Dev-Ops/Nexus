#!/bin/bash

# WSL Migration Repair Script
# This script handles migration issues specifically in WSL environment

set -e

echo "🔧 WSL Migration Repair"
echo "======================"

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

# Check if we're in WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    print_warning "This script is designed for WSL. You may not need it."
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    print_error "Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

print_status "Starting WSL-specific repair process..."

# Step 1: Check Docker status
print_status "Checking Docker status..."
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop."
    print_status "In WSL, you may need to:"
    echo "  1. Open Docker Desktop on Windows"
    echo "  2. Ensure WSL integration is enabled"
    echo "  3. Restart your WSL terminal"
    exit 1
fi

# Step 2: Stop any running Supabase instances
print_status "Stopping any running Supabase instances..."
supabase stop 2>/dev/null || {
    print_warning "No running Supabase instances found (this is normal)"
}

# Step 3: Clean up any orphaned containers
print_status "Cleaning up orphaned containers..."
docker container prune -f 2>/dev/null || {
    print_warning "Docker cleanup failed (this might be expected)"
}

# Step 4: Backup current migrations
print_status "Backing up current migrations..."
if [ -d "supabase/migrations" ]; then
    backup_dir="supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r supabase/migrations "$backup_dir"
    print_success "Migrations backed up to $backup_dir"
fi

# Step 5: Remove problematic migration files
print_status "Cleaning up migration files..."
if [ -d "supabase/migrations" ]; then
    # Remove files that don't match the expected pattern
    find supabase/migrations -name "*.sql" -type f | while read file; do
        filename=$(basename "$file")
        if [[ ! "$filename" =~ ^[0-9]{14}_.*\.sql$ ]]; then
            print_warning "Removing non-standard migration file: $filename"
            rm "$file"
        fi
    done
fi

# Step 6: Pull schema from remote
print_status "Pulling schema from remote..."
print_warning "You will need to enter your database password"
supabase db pull

# Step 7: Start fresh local instance
print_status "Starting fresh local Supabase instance..."
supabase start

# Step 8: Reset local database to match remote
print_status "Resetting local database to match remote..."
supabase db reset

print_success "WSL repair completed!"
print_status "Your local database should now match the remote schema."
print_status "You can now start your development environment with:"
echo "  pnpm dev" 