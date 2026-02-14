#!/bin/bash

# Nexus RAG Database Backup Script
# This script creates automated database backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values (can be overridden by environment variables)
DB_HOST="${DB_HOST:-nexus-rag-db}"
DB_USER="${DB_USER:-user}"
DB_NAME="${DB_NAME:-nexus_rag}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/nexus_rag_${timestamp}.sql"
    
    print_status "Creating database backup..."
    
    # Check if PGPASSWORD is set
    if [ -z "$PGPASSWORD" ]; then
        print_error "PGPASSWORD environment variable is not set."
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create the backup
    if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"; then
        print_status "Backup created successfully: $backup_file"
        
        # Compress the backup
        if command -v gzip > /dev/null 2>&1; then
            gzip "$backup_file"
            print_status "Backup compressed: ${backup_file}.gz"
        fi
        
        return 0
    else
        print_error "Backup failed!"
        exit 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Find and remove old backup files
    find "$BACKUP_DIR" -name "nexus_rag_*.sql*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    local remaining_backups=$(find "$BACKUP_DIR" -name "nexus_rag_*.sql*" -type f | wc -l)
    print_status "Remaining backups: $remaining_backups"
}

# Function to list backups
list_backups() {
    print_status "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/nexus_rag_*.sql* 2>/dev/null || print_warning "No backups found."
    else
        print_warning "Backup directory does not exist: $BACKUP_DIR"
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify a backup file to restore from."
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will restore the database from backup: $backup_file"
    print_warning "This action will overwrite the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        print_status "Restoring database from backup..."
        
        # Handle compressed backups
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -c "$backup_file" | psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"
        else
            psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
        fi
        
        print_status "Database restored successfully!"
    else
        print_status "Restore cancelled."
    fi
}

# Function to show backup status
show_status() {
    print_status "Backup Configuration:"
    echo "  Database Host: $DB_HOST"
    echo "  Database User: $DB_USER"
    echo "  Database Name: $DB_NAME"
    echo "  Backup Directory: $BACKUP_DIR"
    echo "  Retention Days: $RETENTION_DAYS"
    echo ""
    
    list_backups
}

# Main script logic
case "${1:-backup}" in
    "backup")
        create_backup
        cleanup_old_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|cleanup|status}"
        echo ""
        echo "Commands:"
        echo "  backup        - Create a new backup (default)"
        echo "  restore <file> - Restore from a backup file"
        echo "  list          - List available backups"
        echo "  cleanup       - Remove old backups"
        echo "  status        - Show backup configuration and status"
        echo ""
        echo "Environment Variables:"
        echo "  DB_HOST       - Database host (default: nexus-rag-db)"
        echo "  DB_USER       - Database user (default: user)"
        echo "  DB_NAME       - Database name (default: nexus_rag)"
        echo "  BACKUP_DIR    - Backup directory (default: /backups)"
        echo "  RETENTION_DAYS - Days to keep backups (default: 30)"
        echo "  PGPASSWORD    - Database password (required)"
        exit 1
        ;;
esac
