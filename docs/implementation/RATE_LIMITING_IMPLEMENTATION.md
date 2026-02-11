# Rate Limiting Implementation

## Overview

Rate limiting has been implemented in Nexus to protect against abuse, DoS attacks, and to manage resource usage. The implementation uses `express-rate-limit` with different limits for different types of endpoints.

## Implementation Details

### Rate Limiting Tiers

#### 1. **General API Rate Limiter**
- **Window**: 15 minutes
- **Limit**: 1000 requests per IP
- **Applies to**: All routes (except those with specific limiters)
- **Purpose**: Basic protection against abuse

#### 2. **Authentication Rate Limiter**
- **Window**: 15 minutes
- **Limit**: 5 requests per IP
- **Applies to**: `/api/auth/*`, `/api/oauth/*`
- **Purpose**: Prevent brute force attacks

#### 3. **Database Operations Rate Limiter**
- **Window**: 1 minute
- **Limit**: 100 requests per IP
- **Applies to**: `/api/db/*`
- **Purpose**: Prevent database overload

#### 4. **AI/ML Operations Rate Limiter**
- **Window**: 1 minute
- **Limit**: 20 requests per IP
- **Applies to**: `/api/ai/*`, `/api/ai-insights/*`
- **Purpose**: Control AI costs and prevent abuse

#### 5. **File Upload Rate Limiter**
- **Window**: 15 minutes
- **Limit**: 10 uploads per IP
- **Applies to**: File upload endpoints
- **Purpose**: Prevent storage abuse

#### 6. **Development Rate Limiter**
- **Window**: 1 minute
- **Limit**: 10,000 requests per IP
- **Applies to**: Development environment only
- **Purpose**: Allow rapid development without restrictions

## Configuration

### Environment-Based Application

Rate limiting is applied differently based on the environment:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(generalLimiter);
} else {
  app.use(devLimiter);
}
```

### Route-Specific Application

Different rate limiters are applied to specific route groups:

```javascript
// Database operations
app.use('/api/db', dbLimiter, dbRoutes);

// Authentication routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/oauth', authLimiter, oauthRoutes);

// AI/ML routes
app.use('/api/ai', aiLimiter, aiGatewayRoutes);
app.use('/api/ai-insights', aiLimiter, aiInsightsRoutes);
```

## Response Headers

Rate limiting responses include standard headers:

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Time when the limit resets (Unix timestamp)

## Error Responses

When rate limits are exceeded, the API returns:

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## Logging

Rate limit violations are logged with:

- IP address
- Request path
- HTTP method
- User agent
- Timestamp

## Testing

### Manual Testing

Use the provided test script:

```bash
cd server
node test-rate-limit.js
```

### Testing Different Scenarios

1. **General API**: Make multiple requests to `/health`
2. **Database API**: Test `/api/db/*` endpoints
3. **Auth API**: Test `/api/auth/*` endpoints
4. **AI API**: Test `/api/ai/*` endpoints

## Monitoring

### Rate Limit Metrics

Monitor rate limiting effectiveness by tracking:

- Number of 429 responses
- IP addresses hitting limits
- Endpoints most frequently rate limited
- Time patterns of rate limit violations

### Log Analysis

```bash
# Find rate limit violations
grep "Rate limit exceeded" logs/app.log

# Count violations by IP
grep "Rate limit exceeded" logs/app.log | awk '{print $4}' | sort | uniq -c
```

## Customization

### Adjusting Limits

To modify rate limits, edit `server/src/middleware/rateLimit.js`:

```javascript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Adjust this number
  // ... other options
});
```

### Adding New Limiters

To add rate limiting for new endpoint types:

```javascript
const newLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: {
    success: false,
    error: 'Custom rate limit message',
    code: 'CUSTOM_RATE_LIMIT_EXCEEDED'
  }
});

// Apply to routes
app.use('/api/custom', newLimiter, customRoutes);
```

## Security Considerations

### IP Address Detection

The rate limiting uses `req.ip` which should be configured to detect the real client IP when behind a proxy:

```javascript
app.set('trust proxy', 1);
```

### Bypass Prevention

- Rate limits are applied before authentication
- Limits are per IP address
- No user-based rate limiting (to prevent bypass)

### DDoS Protection

Rate limiting provides basic DDoS protection but should be combined with:

- WAF (Web Application Firewall)
- CDN rate limiting
- Load balancer protection

## Troubleshooting

### Common Issues

1. **Rate limits too strict**: Adjust limits in development
2. **Rate limits not working**: Check middleware order
3. **Headers missing**: Verify `standardHeaders: true`

### Debug Mode

Enable debug logging by setting:

```javascript
const limiter = rateLimit({
  // ... other options
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});
```

## Future Enhancements

### Planned Improvements

1. **User-based rate limiting**: Different limits per user tier
2. **Dynamic rate limiting**: Adjust limits based on server load
3. **Rate limit analytics**: Dashboard for monitoring
4. **Whitelist support**: Bypass rate limits for trusted IPs
5. **Rate limit notifications**: Alert when limits are exceeded

### Integration with Monitoring

- Prometheus metrics
- Grafana dashboards
- Alerting rules
- Cost tracking for AI endpoints
