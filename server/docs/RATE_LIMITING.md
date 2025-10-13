# Rate Limiting System

## Overview

The Nexus server implements a comprehensive rate limiting system to protect against abuse, manage costs, and ensure fair resource allocation. The system uses Redis for distributed rate limiting across multiple server instances and falls back gracefully to in-memory storage when Redis is unavailable.

## Architecture

### Components

1. **Redis Store** (lazy-initialized inside the rate limit middleware)
   - Centralized storage for rate limit counters
   - Enables distributed rate limiting across multiple server instances
   - Automatic reconnection with exponential backoff
   - Graceful fallback to in-memory store if Redis is unavailable

2. **Rate Limit Middleware** (`server/src/middleware/rateLimit.js`)
   - Multiple tier-based limiters for different endpoint types
   - User-based tracking for authenticated requests
   - IP-based tracking for anonymous requests
   - Standardized error responses with retry information

## Rate Limit Tiers

### 1. General API Limiter

- **Window:** 15 minutes
- **Max Requests:** 1,000
- **Applied To:** All API routes (default)
- **Use Case:** Standard API operations

### 2. Authentication Limiter

- **Window:** 15 minutes
- **Max Requests:** 5 failed attempts
- **Applied To:** `/api/auth`, `/api/companies`, `/api/oauth`
- **Special Feature:** Only counts failed authentication attempts (`skipSuccessfulRequests: true`)
- **Use Case:** Prevent brute force attacks

### 3. Database Operations Limiter

- **Window:** 1 minute
- **Max Requests:** 100
- **Applied To:** `/api/db`
- **Use Case:** Protect database from excessive queries

### 4. AI Operations Limiter

- **Window:** 1 minute
- **Max Requests:** 20
- **Applied To:** `/api/ai`, `/api/ai-insights`
- **Use Case:** Control costs for expensive AI/ML operations

### 5. File Upload Limiter

- **Window:** 15 minutes
- **Max Requests:** 10
- **Applied To:** `/api/chat` (with file uploads)
- **Use Case:** Prevent excessive file upload bandwidth usage

### 6. Development Limiter

- **Window:** 1 minute
- **Max Requests:** 10,000
- **Applied To:** All routes in development mode
- **Use Case:** Permissive limits for local development
- Optional: enable Redis in development by setting `RATE_LIMIT_DEV_USE_REDIS=true`

## Configuration

### Environment Variables

```bash
# Required for production with multiple instances
REDIS_URL=redis://localhost:6379

# Optional: Trust proxy for proper IP detection behind load balancers
TRUST_PROXY=true

# NODE_ENV determines which rate limiter is used
NODE_ENV=production
 
# Optional: enable Redis-backed limits in development as well
RATE_LIMIT_DEV_USE_REDIS=false

# Optional: logging level (DEBUG | INFO | WARN | ERROR | FATAL)
LOG_LEVEL=INFO
```

### Redis Setup

**Development:**

```bash
docker run -d -p 6379:6379 redis:latest
```

**Production:**

- Use managed Redis service (AWS ElastiCache, Redis Cloud, etc.)
- Configure connection pooling and persistence
- Enable Redis clustering for high availability

## Key Features

### 1. User-Based Rate Limiting

The system intelligently tracks rate limits by:

- **Authenticated Users:** Uses user ID from `req.user.id`
- **Anonymous Users:** Falls back to IP address
- **Format:** `user:{id}` or raw IP address (e.g., `::1`, `127.0.0.1`)

### 2. Smart Retry-After Headers

Responses include accurate retry information:

```json
{
  "success": false,
  "error": "Too many requests, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 180
}
```

Standard headers also included:

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Unix timestamp when limit resets

### 3. Graceful Degradation

If Redis is unavailable:

- Automatically falls back to in-memory store
- Logs warning about single-instance limitation
- Continues serving requests without errors

### 4. Comprehensive Logging

All rate limit violations are logged with:

- IP address
- User ID (if authenticated)
- Request path and method
- User agent
- Retry-after duration

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | General rate limit exceeded | 429 |
| `AUTH_RATE_LIMIT_EXCEEDED` | Too many auth attempts | 429 |
| `DB_RATE_LIMIT_EXCEEDED` | Too many database operations | 429 |
| `AI_RATE_LIMIT_EXCEEDED` | Too many AI operations | 429 |
| `UPLOAD_RATE_LIMIT_EXCEEDED` | Too many file uploads | 429 |
| `DEV_RATE_LIMIT_EXCEEDED` | Dev rate limit exceeded | 429 |

## Client Integration

### Handling Rate Limits

Clients should:

1. **Check Response Status**

   ```javascript
   if (response.status === 429) {
     const retryAfter = response.data.retryAfter;
     // Wait retryAfter seconds before retrying
   }
   ```

2. **Monitor Rate Limit Headers**

   ```javascript
   const remaining = response.headers['ratelimit-remaining'];
   const reset = response.headers['ratelimit-reset'];
   
   if (remaining < 10) {
     // Warn user they're approaching limit
   }
   ```

3. **Implement Exponential Backoff**

   ```javascript
   async function makeRequest(url, retries = 3) {
     try {
       return await axios.get(url);
     } catch (error) {
       if (error.response?.status === 429 && retries > 0) {
         const delay = error.response.data.retryAfter * 1000;
         await new Promise(resolve => setTimeout(resolve, delay));
         return makeRequest(url, retries - 1);
       }
       throw error;
     }
   }
   ```

## Testing

### Manual Testing

```bash
# Start server with Redis
cd server
pnpm start

# Run rate limit test
node test-rate-limit.js
```

### Load Testing

```bash
# Test rate limits under load
ab -n 1000 -c 10 http://localhost:3001/health
```

## Monitoring

### Key Metrics to Track

1. **Rate Limit Hits**
   - Monitor frequency of 429 responses
   - Identify potential abuse patterns
   - Adjust limits based on legitimate usage

2. **Redis Performance**
   - Connection errors
   - Command latency
   - Memory usage

3. **User Impact**
   - Users frequently hitting limits
   - False positive rate (legitimate users blocked)

### Recommended Alerts

- **Critical:** Redis connection failures
- **Warning:** Rate limit hit rate >10% of requests
- **Info:** Unusual spike in rate limit violations

## Best Practices

### For Administrators

1. **Always use Redis in production** with multiple instances
2. **Monitor rate limit metrics** to detect abuse
3. **Adjust limits** based on actual usage patterns
4. **Set up Redis clustering** for high availability
5. **Configure appropriate TRUST_PROXY** setting behind load balancers

### For Developers

1. **Test rate limiting** in development
2. **Handle 429 responses** gracefully in clients
3. **Use retry logic** with exponential backoff
4. **Batch requests** when possible
5. **Cache responses** to reduce API calls

## Troubleshooting

### Issue: Rate limits not working across instances

**Cause:** Redis not configured or connection failed

**Solution:**

1. Check `REDIS_URL` environment variable
2. Verify Redis is running: `redis-cli ping`
3. Check server logs for Redis connection errors

### Issue: Legitimate users getting rate limited

**Cause:** Limits too restrictive for actual usage

**Solution:**

1. Review rate limit metrics
2. Adjust limits in `server/src/middleware/rateLimit.js`
3. Consider user-tier based limits

### Issue: Rate limits reset on server restart

**Cause:** Using in-memory store (Redis not configured)

**Solution:**

1. Configure `REDIS_URL` environment variable
2. Start Redis service
3. Restart server and verify Redis connection in logs

## Future Enhancements

- [ ] User-tier based rate limits (free vs. premium)
- [ ] Configurable limits via environment variables
- [ ] CAPTCHA challenge for repeated violations
- [ ] IP whitelist for internal services
- [ ] Rate limit dashboard for administrators
- [ ] Distributed rate limiting across data centers
- [ ] Custom rate limit rules per organization

## References

- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [rate-limit-redis Documentation](https://github.com/express-rate-limit/rate-limit-redis)
- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
