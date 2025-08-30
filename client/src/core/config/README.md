# Logging Configuration

This directory contains configuration files for controlling logging behavior across the application.

## Environment Variables

To control logging behavior, set these environment variables in your `.env` file:

### Debug Logging
```bash
# Enable comprehensive debug logging (development only)
VITE_ENABLE_DEBUG_LOGS=true

# Enable authentication-specific debug logging
VITE_DEBUG_AUTH=true
```

### Logging Levels
- **Production**: Only error and warning logs are shown
- **Development (default)**: Info, warning, and error logs are shown
- **Development (debug)**: All logs including debug and method calls are shown

## Logging Categories

### 1. Authentication Logging (`VITE_DEBUG_AUTH=true`)
- Token retrieval from localStorage
- Authorization header setting
- Session validation

### 2. Service Method Logging (`VITE_ENABLE_DEBUG_LOGS=true`)
- All service method calls
- Database operations
- API requests

### 3. Performance Logging (`VITE_ENABLE_DEBUG_LOGS=true`)
- Slow operation detection (>1 second)
- API response times
- Database query performance

### 4. Business System Logging (`VITE_ENABLE_DEBUG_LOGS=true`)
- Business body state updates
- Health service calls
- System interactions

## Usage Examples

### In Services
```typescript
import { loggingUtils } from '@/core/config/logging';

// Only logs if debug logging is enabled
loggingUtils.service('UserService', 'getUser', { userId: '123' });

// Only logs if auth logging is enabled
loggingUtils.auth('Token retrieved from session');

// Only logs if performance logging is enabled
loggingUtils.performance('Database query', 150, { table: 'users' });
```

### In Components
```typescript
import { logger } from '@/shared/utils/logger';

// Standard logging (respects environment settings)
logger.info('Component mounted');
logger.debug('Debug information');
logger.warn('Warning message');
logger.error('Error occurred');
```

## Reducing Log Noise

If you're experiencing too much logging:

1. **Disable debug logs**: Remove `VITE_ENABLE_DEBUG_LOGS=true` from your `.env`
2. **Disable auth logs**: Remove `VITE_DEBUG_AUTH=true` from your `.env`
3. **Use production mode**: Set `NODE_ENV=production`

## Performance Impact

- **Debug logging disabled**: Minimal performance impact
- **Debug logging enabled**: Slight performance impact due to string formatting and conditional checks
- **Method call logging**: Can be significant in high-frequency operations

## Best Practices

1. **Use appropriate log levels**: Don't use `console.log` directly, use the logger utilities
2. **Conditional logging**: Use the logging utilities that respect environment settings
3. **Structured logging**: Include relevant data objects for better debugging
4. **Performance monitoring**: Use performance logging for slow operations
5. **Clean up**: Remove debug logs before production deployment
