# 500 Error Prevention Guide

## Overview

This guide documents the comprehensive improvements made to prevent 500 errors in the Nexus API server. The improvements focus on better error handling, database connection management, authentication, and monitoring.

## 🔧 **Improvements Made**

### 1. **Database Connection Improvements**

#### Enhanced Connection Pool (`server/src/database/connection.js`)
- **Increased timeout**: Connection timeout increased from 2s to 10s
- **Retry logic**: Automatic retry with exponential backoff for connection failures
- **Better error categorization**: Specific handling for different database error types
- **Connection health monitoring**: Pool statistics and health checks
- **Transaction support**: Safe transaction handling with automatic rollback

```javascript
// Key improvements:
- connectionTimeoutMillis: 10000 // Increased from 2000
- statement_timeout: 30000 // 30 second query timeout
- Automatic retry for ECONNRESET, ENOTFOUND, ETIMEDOUT
- Pool error handling with automatic reset
```

#### Migration System (`server/src/database/migrate.js`)
- **Transaction-based migrations**: All migrations run in transactions
- **Checksum validation**: File integrity checking
- **Rollback support**: Ability to rollback failed migrations
- **Better error reporting**: Detailed migration status and timing
- **Migration status tracking**: Comprehensive status monitoring

### 2. **Error Handling Improvements**

#### Enhanced Error Handler (`server/src/middleware/errorHandler.js`)
- **Error categorization**: Automatic classification of errors by type
- **Database error mapping**: Specific handling for PostgreSQL error codes
- **Security**: No internal error details exposed to clients in production
- **Structured logging**: Consistent error logging with context
- **Error codes**: Standardized error codes for client handling

```javascript
// Error categorization examples:
- 23505: unique_violation → 409 Conflict
- 23503: foreign_key_violation → 400 Bad Request
- ECONNREFUSED → 503 Service Unavailable
- ETIMEDOUT → 504 Gateway Timeout
```

#### Authentication Middleware (`server/src/middleware/auth.js`)
- **Simplified token validation**: Cleaner JWT validation logic
- **Better user mapping**: Improved external to internal user ID mapping
- **Error categorization**: Specific error codes for different auth failures
- **Graceful degradation**: Better handling of transition period tokens
- **Role-based access**: Support for role-based authorization

### 3. **API Route Improvements**

#### Database Routes (`server/src/routes/db.js`)
- **Input validation**: Comprehensive validation for all inputs
- **Security**: Prevention of dangerous SQL operations
- **Pagination**: Safe pagination with limits
- **Error handling**: Consistent error responses
- **Query logging**: Detailed query logging for debugging

#### Route Protection
- **Dangerous operation prevention**: Block DROP, DELETE, TRUNCATE, etc.
- **Parameter validation**: Type checking and sanitization
- **Rate limiting**: Built-in protection against abuse
- **Audit logging**: Track all database operations

### 4. **Logging and Monitoring**

#### Enhanced Logger (`server/src/utils/logger.js`)
- **Structured logging**: JSON format in production, readable in development
- **Log levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Context logging**: Request context, user info, performance metrics
- **Specialized methods**: Database, auth, security, performance logging

#### Server Monitor (`server/src/utils/monitor.js`)
- **Real-time metrics**: Request counts, error rates, response times
- **Database monitoring**: Query performance, connection pool status
- **System monitoring**: Memory usage, uptime tracking
- **Issue detection**: Automatic detection of potential problems
- **Health checks**: Periodic system health validation

### 5. **Server Improvements**

#### Main Server (`server/server.js`)
- **Graceful shutdown**: Proper cleanup on server termination
- **Health checks**: Comprehensive health endpoint with database status
- **Request logging**: Detailed request/response logging
- **Error boundaries**: Uncaught exception and rejection handling
- **JSON validation**: Request body validation with error handling

## 📊 **Monitoring and Debugging**

### Health Check Endpoint

```bash
# Check server health
curl http://localhost:3001/health

# Response includes:
{
  "status": "ok",
  "timestamp": "2025-08-13T18:13:46.760Z",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 1234.56,
  "memory": { "heapUsed": 123456, "heapTotal": 234567 },
  "checks": {
    "database": {
      "status": "ok",
      "version": "PostgreSQL 15.3"
    }
  }
}
```

### Database Connection Test

```bash
# Test database connection
curl http://localhost:3001/api/db/test

# Get database statistics
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/db/stats
```

### Monitoring Metrics

The server monitor tracks:
- **Request metrics**: Total requests, error rates, response times
- **Database metrics**: Query counts, errors, slow queries
- **System metrics**: Memory usage, uptime
- **Error tracking**: Error types, recent errors, patterns

## 🚨 **Common 500 Error Scenarios and Solutions**

### 1. **Database Connection Issues**

**Symptoms:**
- 503 Service Unavailable errors
- "Database connection failed" messages
- High connection pool usage

**Solutions:**
- Check database server status
- Verify connection string in environment variables
- Monitor connection pool statistics
- Check for connection leaks

### 2. **Authentication Failures**

**Symptoms:**
- 401 Unauthorized errors
- Token validation failures
- User mapping errors

**Solutions:**
- Verify Authentik configuration
- Check JWT token format and expiration
- Ensure user_mappings table exists
- Review authentication logs

### 3. **Query Performance Issues**

**Symptoms:**
- Slow response times
- Database timeouts
- High memory usage

**Solutions:**
- Monitor slow query logs
- Check database indexes
- Review query complexity
- Implement query caching

### 4. **Memory Leaks**

**Symptoms:**
- Gradually increasing memory usage
- Server crashes
- Poor performance

**Solutions:**
- Monitor memory usage trends
- Check for unclosed connections
- Review object lifecycle management
- Implement memory profiling

## 🔍 **Debugging Tools**

### 1. **Log Analysis**

```bash
# View server logs
tail -f server.log | grep ERROR

# Search for specific error types
grep "Database connection failed" server.log

# Monitor error rates
grep "ERROR" server.log | wc -l
```

### 2. **Database Debugging**

```bash
# Test database connection directly
psql "$DATABASE_URL" -c "SELECT version();"

# Check connection pool status
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/db/stats

# Monitor slow queries
grep "Slow database query" server.log
```

### 3. **Performance Monitoring**

```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:3001/health

# Monitor memory usage
curl http://localhost:3001/health | jq '.memory'

# Track error rates
curl http://localhost:3001/health | jq '.checks'
```

## 🛠️ **Prevention Best Practices**

### 1. **Environment Configuration**

```bash
# Required environment variables
DATABASE_URL=postgresql://user:pass@host:port/db
LOG_LEVEL=INFO
NODE_ENV=production

# Optional but recommended
API_PORT=3001
FRONTEND_URL=https://your-frontend.com
```

### 2. **Database Configuration**

```sql
-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_user_mappings_external_id ON user_mappings(external_user_id);

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 3. **Monitoring Setup**

```javascript
// Start monitoring in your application
const { serverMonitor } = require('./src/utils/monitor');
serverMonitor.start();

// Get metrics
const metrics = serverMonitor.getMetricsSummary();
console.log('Error rate:', metrics.requests.errorRate);
```

### 4. **Error Response Standards**

All API endpoints now return consistent error responses:

```javascript
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-13T18:13:46.760Z"
}
```

## 📈 **Performance Metrics**

### Key Metrics to Monitor

1. **Error Rate**: Should be < 5%
2. **Response Time**: Average < 500ms
3. **Database Queries**: < 100ms average
4. **Memory Usage**: < 500MB heap
5. **Connection Pool**: < 80% utilization

### Alerting Thresholds

- **Error Rate > 10%**: Investigate immediately
- **Response Time > 2s**: Check for performance issues
- **Memory Usage > 1GB**: Check for memory leaks
- **Database Errors > 10**: Check database health

## 🔄 **Maintenance Procedures**

### Daily Checks

1. Review error logs for patterns
2. Check health endpoint status
3. Monitor database connection pool
4. Review slow query logs

### Weekly Checks

1. Analyze error rate trends
2. Review performance metrics
3. Check memory usage patterns
4. Validate backup procedures

### Monthly Checks

1. Review and update error handling
2. Analyze database performance
3. Update monitoring thresholds
4. Review security configurations

## 📚 **Additional Resources**

- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [Node.js Error Handling](https://nodejs.org/api/errors.html)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [JWT Token Validation](https://jwt.io/introduction)

## 🆘 **Emergency Procedures**

### Server Unresponsive

1. Check server logs for errors
2. Verify database connectivity
3. Check memory and CPU usage
4. Restart server if necessary

### Database Issues

1. Check database server status
2. Verify connection string
3. Check for connection pool exhaustion
4. Review recent migrations

### High Error Rate

1. Check application logs
2. Monitor database performance
3. Review recent deployments
4. Check external service dependencies

---

This guide should be updated regularly as new error patterns are discovered and additional improvements are implemented.
