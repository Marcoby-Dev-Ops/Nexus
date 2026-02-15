#!/bin/bash

# Nexus RAG Database Deployment Script
# This script deploys the Nexus RAG database using Docker Compose

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

# Set Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Check for environment file
ENV_FILE=".env.nexus-rag"
if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file $ENV_FILE not found."
    print_status "Creating from template..."
    cp env.nexus-rag.example "$ENV_FILE"
    print_warning "Please edit $ENV_FILE with your production values before continuing."
    print_warning "Especially update the passwords!"
    exit 1
fi

# Load environment variables
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Validate required environment variables
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "your_secure_password_here" ]; then
    print_error "DB_PASSWORD is not set or is using the default value."
    print_error "Please update $ENV_FILE with a secure password."
    exit 1
fi

if [ -z "$REDIS_PASSWORD" ] || [ "$REDIS_PASSWORD" = "your_redis_password_here" ]; then
    print_error "REDIS_PASSWORD is not set or is using the default value."
    print_error "Please update $ENV_FILE with a secure password."
    exit 1
fi

# Function to deploy database
deploy_database() {
    print_status "Deploying Nexus RAG database..."
    
    # Stop existing containers if they exist
    print_status "Stopping existing containers..."
    $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml down 2>/dev/null || true
    
    # Pull latest images
    print_status "Pulling latest images..."
    $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml pull
    
    # Start services
    print_status "Starting services..."
    $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml up -d
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml exec -T nexus-rag-db pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within 60 seconds."
        exit 1
    fi
    
    print_status "Database is ready!"
}

# Function to run migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if migrations directory exists
    if [ ! -d "server/migrations" ]; then
        print_warning "Migrations directory not found. Skipping migrations."
        return
    fi
    
    # Run migrations using the server's migration script
    if [ -f "server/package.json" ]; then
        print_status "Running migrations via server script..."
        cd server
        npm run migrate 2>/dev/null || print_warning "Migration script failed or not available."
        cd ..
    else
        print_warning "Server directory not found. Skipping migrations."
    fi
}

# Function to show status
show_status() {
    print_status "Database deployment status:"
    $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml ps
    
    print_status "Database connection info:"
    echo "  Host: localhost"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  Password: [HIDDEN]"
    
    print_status "Redis connection info:"
    echo "  Host: localhost"
    echo "  Port: $REDIS_PORT"
    echo "  Password: [HIDDEN]"
}

# Function to show logs
show_logs() {
    print_status "Showing database logs..."
    $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml logs -f nexus-rag-db
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy_database
        run_migrations
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        print_status "Stopping Nexus RAG database..."
        $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml down
        ;;
    "restart")
        print_status "Restarting Nexus RAG database..."
        $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml restart
        ;;
    "backup")
        print_status "Creating database backup..."
        $DOCKER_COMPOSE -f docker-compose.nexus-rag.prod.yml exec nexus-rag-db pg_dump -U "$DB_USER" -d "$DB_NAME" > "nexus_rag_backup_$(date +%Y%m%d_%H%M%S).sql"
        print_status "Backup created successfully!"
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|stop|restart|backup}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the database (default)"
        echo "  status  - Show deployment status"
        echo "  logs    - Show database logs"
        echo "  stop    - Stop the database"
        echo "  restart - Restart the database"
        echo "  backup  - Create a database backup"
        exit 1
        ;;
esac
