#!/bin/bash

echo "🚀 Initializing Nexus Database..."

# Check if PostgreSQL container is running
if ! docker ps | grep -q nexus-postgres; then
    echo "❌ PostgreSQL container 'nexus-postgres' is not running."
    echo "Please start it with: docker start nexus-postgres"
    exit 1
fi

# Check if Redis container is running
if ! docker ps | grep -q nexus-redis; then
    echo "❌ Redis container 'nexus-redis' is not running."
    echo "Please start it with: docker start nexus-redis"
    exit 1
fi

echo "📊 Applying database initialization script..."

# Run the initialization script
docker exec -i nexus-postgres psql -U postgres -d vector_db < init-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialization completed successfully!"
    echo ""
    echo "🎉 Your Nexus database is ready!"
    echo ""
    echo "Database details:"
    echo "  - Host: localhost:5432"
    echo "  - Database: vector_db"
    echo "  - User: postgres"
    echo "  - Extensions: uuid-ossp, vector, pgcrypto"
    echo ""
    echo "Next steps:"
    echo "1. Start your server application"
    echo "2. Run any additional setup scripts if needed"
    echo "3. Begin development with a fresh database schema"
else
    echo "❌ Database initialization failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
