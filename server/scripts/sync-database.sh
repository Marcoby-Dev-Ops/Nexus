#!/bin/bash

# Database Synchronization Script
# This script ensures local and remote databases stay in sync

set -e

echo "🔄 Database Sync Script"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    print_error "Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

# Function to sync from remote to local
sync_from_remote() {
    print_status "Syncing from remote to local..."
    
    # Stop local instance if running
    if supabase status | grep -q "Running"; then
        print_status "Stopping local Supabase instance..."
        supabase stop
    fi
    
    # Pull latest schema from remote
    print_status "Pulling latest schema from remote..."
    supabase db pull
    
    # Reset local database to match remote
    print_status "Resetting local database to match remote..."
    supabase db reset
    
    print_success "Local database synced with remote!"
}

# Function to sync from local to remote
sync_to_remote() {
    print_status "Syncing from local to remote..."
    
    # Push local migrations to remote
    print_status "Pushing local migrations to remote..."
    supabase db push
    
    print_success "Remote database synced with local!"
}

# Function to create a new migration
create_migration() {
    if [ -z "$1" ]; then
        print_error "Migration name is required. Usage: $0 create-migration <name>"
        exit 1
    fi
    
    print_status "Creating new migration: $1"
    supabase migration new "$1"
    
    print_success "Migration created: supabase/migrations/$(date +%Y%m%d%H%M%S)_$1.sql"
}

# Function to check sync status
check_sync_status() {
    print_status "Checking sync status..."
    
    # Get local migration count
    local_count=$(find supabase/migrations -name "*.sql" | wc -l)
    
    # Get remote migration count (this is a simplified check)
    print_warning "Remote migration count check not implemented - would need API access"
    
    print_status "Local migrations: $local_count"
    print_status "Remote migrations: (check manually with 'supabase db diff')"
}

# Function to show help
show_help() {
    echo "Database Sync Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  sync-from-remote     Pull latest schema from remote and reset local"
    echo "  sync-to-remote       Push local migrations to remote"
    echo "  create-migration     Create a new migration file"
    echo "  check-status         Check sync status between local and remote"
    echo "  help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 sync-from-remote"
    echo "  $0 create-migration add_user_table"
    echo "  $0 check-status"
}

# Main script logic
case "${1:-help}" in
    "sync-from-remote")
        sync_from_remote
        ;;
    "sync-to-remote")
        sync_to_remote
        ;;
    "create-migration")
        create_migration "$2"
        ;;
    "check-status")
        check_sync_status
        ;;
    "help"|*)
        show_help
        ;;
esac 