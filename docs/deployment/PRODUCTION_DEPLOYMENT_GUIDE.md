# Production Deployment Guide

## Architecture Overview

```
Frontend (nexus.marcoby.net) → API (api.nexus.marcoby.net) → PostgreSQL (Coolify Managed)
```

## Services Configuration

### 1. PostgreSQL Database Service

**Create in Coolify:**
- **Type**: PostgreSQL
- **Version**: 15
- **Database**: `vector_db`
- **User**: `postgres`
- **Password**: Generate secure password
- **Backup**: Daily at 2 AM, 30-day retention
- **Monitoring**: Enabled

**Environment Variables:**
```bash
POSTGRES_DB=vector_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<generated_password>
```

### 2. Backend API Service

**Create in Coolify:**
- **Type**: Dockerfile
- **Dockerfile**: `server/Dockerfile`
- **Port**: 3001
- **Domain**: `api.nexus.marcoby.net`
- **SSL**: Let's Encrypt

**Environment Variables:**
```bash
NODE_ENV=production
DATABASE_URL=${POSTGRES_URL}
DB_HOST=${POSTGRES_HOST}
DB_PORT=${POSTGRES_PORT}
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
FRONTEND_URL=https://nexus.marcoby.net
```

### 3. Frontend Service

**Update existing Coolify service:**
- **Environment Variables**:
```bash
NODE_ENV=production
VITE_NODE_ENV=production
VITE_POSTGRES_URL=${POSTGRES_URL}
VITE_NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net
VITE_APP_URL=https://nexus.marcoby.net
VITE_API_URL=https://api.nexus.marcoby.net
```

## Deployment Steps

### Step 1: Create PostgreSQL Service
1. In Coolify dashboard, create new service
2. Select "PostgreSQL" as service type
3. Configure database settings
4. Enable backups and monitoring
5. Note the connection details

### Step 2: Deploy Backend API
1. Create new service in Coolify
2. Select "Dockerfile" deployment
3. Point to `server/Dockerfile`
4. Configure environment variables using PostgreSQL service variables
5. Set domain to `api.nexus.marcoby.net`
6. Enable SSL

### Step 3: Update Frontend
1. Update existing frontend service environment variables
2. Ensure `VITE_API_URL` points to the new API service
3. Redeploy frontend

### Step 4: Database Migration
1. Run migrations on production database:
```bash
# Connect to production database
psql ${POSTGRES_URL}

# Run migrations
\i server/migrations/000_enable_extensions.sql
\i server/migrations/001_create_organizations_tables.sql
# ... (all migration files)
```

## Environment Variables Reference

### PostgreSQL Service Variables
- `POSTGRES_URL`: Full connection string
- `POSTGRES_HOST`: Database host
- `POSTGRES_PORT`: Database port (usually 5432)
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

### API Service Variables
- `DATABASE_URL`: Full PostgreSQL connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection details
- `FRONTEND_URL`: Frontend application URL for CORS

### Frontend Service Variables
- `VITE_API_URL`: Backend API URL
- `VITE_POSTGRES_URL`: Database connection (if needed by frontend)

## Monitoring and Maintenance

### Database Monitoring
- **Coolify Dashboard**: Monitor CPU, memory, disk usage
- **Backup Status**: Check daily backup completion
- **Connection Pool**: Monitor active connections

### API Monitoring
- **Health Checks**: `/health` endpoint
- **Logs**: Monitor application logs
- **Performance**: Track response times

### Frontend Monitoring
- **Build Status**: Monitor deployment success
- **Performance**: Track page load times
- **Error Tracking**: Monitor client-side errors

## Backup Strategy

### Database Backups
- **Frequency**: Daily at 2 AM
- **Retention**: 30 days
- **Location**: Coolify managed storage
- **Recovery**: Point-in-time recovery available

### Application Backups
- **Code**: Git repository
- **Configuration**: Environment variables in Coolify
- **Data**: Database backups

## Security Considerations

### Network Security
- **Database**: Not exposed to public internet
- **API**: SSL/TLS encryption
- **Frontend**: HTTPS only

### Access Control
- **Database**: Service-to-service communication only
- **API**: CORS configured for frontend domain
- **Frontend**: Public access with authentication

### Secrets Management
- **Database Credentials**: Managed by Coolify
- **API Keys**: Environment variables
- **SSL Certificates**: Let's Encrypt auto-renewal

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service status
   - Verify environment variables
   - Check network connectivity

2. **API Not Responding**
   - Check API service logs
   - Verify health check endpoint
   - Check CORS configuration

3. **Frontend Build Failed**
   - Check build logs
   - Verify environment variables
   - Check dependency installation

### Health Check Endpoints
- **Frontend**: `https://nexus.marcoby.net/`
- **API**: `https://api.nexus.marcoby.net/health`
- **Database**: Via Coolify dashboard

## Migration from Local Development

### Data Migration
1. Export local database:
```bash
pg_dump postgresql://postgres:postgres@localhost:5433/vector_db > local_backup.sql
```

2. Import to production:
```bash
psql ${POSTGRES_URL} < local_backup.sql
```

### Configuration Updates
1. Update all environment variables
2. Test API connectivity
3. Verify frontend functionality
4. Update DNS records if needed

## Cost Optimization

### Resource Allocation
- **Database**: Start with minimal resources, scale as needed
- **API**: Monitor usage and adjust accordingly
- **Frontend**: Static hosting, minimal cost

### Monitoring Costs
- **Coolify**: Base platform cost
- **Database**: Storage and compute costs
- **Bandwidth**: API and frontend traffic

## Support and Maintenance

### Regular Tasks
- **Weekly**: Review logs and performance
- **Monthly**: Update dependencies
- **Quarterly**: Security review
- **Annually**: Architecture review

### Emergency Procedures
- **Database Failure**: Restore from backup
- **API Failure**: Check logs, restart service
- **Frontend Failure**: Redeploy from Git
