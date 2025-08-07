# Supabase Modular Architecture

## Overview

This document describes the enterprise-grade modular Supabase client architecture implemented in Nexus. The architecture separates concerns into focused modules while maintaining type safety, comprehensive error handling, and production-ready resilience.

## Architecture Structure

```
src/lib/supabase/
├── client.ts          # Core client creation and configuration
├── sessionUtils.ts    # Session management and auth utilities
├── dbUtils.ts         # Database query helpers and utilities
├── edgeFunctions.ts   # Edge function invocation utilities
├── diagnostics.ts     # Debug and testing utilities
├── errorHandling.ts   # Error wrapping and retry logic
└── index.ts          # Main exports and type re-exports
```

## Module Responsibilities

### 1. Client (`client.ts`)

**Purpose**: Core Supabase client creation and configuration

**Key Features**:
- Environment variable validation
- Client configuration with PKCE flow
- Global error handling utility
- Smart client for connection testing

**Usage**:
```typescript
import { supabase, handleSupabaseError, smartClient } from '@/lib/supabase';

// Test connection
const { success, error } = await smartClient.testConnection();
```

### 2. Session Utilities (`sessionUtils.ts`)

**Purpose**: Session management with retry logic and rate limiting

**Key Features**:
- Exponential backoff retry logic
- Rate limiting for session refresh (5s cooldown)
- Session validation with timestamp handling
- Automatic session refresh on expiration

**Usage**:
```typescript
import { sessionUtils } from '@/lib/supabase';

// Get session with retry
const { session, error } = await sessionUtils.getSession();

// Check session validity
const isValid = sessionUtils.isSessionValid(session);

// Ensure valid session
const hasValidSession = await sessionUtils.ensureSession();
```

### 3. Database Utilities (`dbUtils.ts`)

**Purpose**: Typed database query helpers with error handling

**Key Features**:
- Generic typed query functions
- Comprehensive error handling
- Safe query wrapper
- RPC function support

**Usage**:
```typescript
import { selectOne, updateOne, callRPC } from '@/lib/supabase';

// Select single record
const { data, error } = await selectOne<UserProfile>('user_profiles', userId);

// Update record
const { data, error } = await updateOne<UserProfile>('user_profiles', userId, updates);

// Call RPC function
const { data, error } = await callRPC<ResultType>('function_name', params);
```

### 4. Edge Functions (`edgeFunctions.ts`)

**Purpose**: Edge function invocation with error handling

**Key Features**:
- Typed edge function calls
- Error handling and logging
- Database service compatibility layer

**Usage**:
```typescript
import { callEdgeFunction } from '@/lib/supabase';

const result = await callEdgeFunction<ResponseType>('function-name', payload);
```

### 5. Diagnostics (`diagnostics.ts`)

**Purpose**: Debug and testing utilities

**Key Features**:
- Authentication flow testing
- JWT transmission diagnostics
- Client instance debugging
- Development-only test functions

**Usage**:
```typescript
import { diagnoseAuthIssues, testAuthenticationFlow } from '@/lib/supabase';

// Diagnose auth issues
const diagnosis = await diagnoseAuthIssues();

// Test auth flow
const result = await testAuthenticationFlow();
```

### 6. Error Handling (`errorHandling.ts`)

**Purpose**: Comprehensive error handling and retry logic

**Key Features**:
- Error wrapping utilities
- Exponential backoff retry
- Rate limiting configuration
- Transaction-like operations

**Usage**:
```typescript
import { wrapError, withRetry, withTransaction } from '@/lib/supabase';

// Wrap error-prone operations
const { data, error } = await wrapError(
  () => riskyOperation(),
  'operation-context'
);

// Retry with exponential backoff
const { data, error } = await withRetry(
  () => flakyOperation(),
  'retry-context',
  3 // max attempts
);

// Transaction-like operations
const { data, error } = await withTransaction([
  () => step1(),
  () => step2(),
  () => step3()
], 'transaction-context');
```

## Configuration

### Rate Limiting

```typescript
export const rateLimitConfig = {
  sessionRefresh: 5000, // 5 seconds
  authRetry: 1000,      // 1 second
  dbQuery: 100,         // 100ms
  edgeFunction: 2000,   // 2 seconds
} as const;
```

### Retry Configuration

```typescript
export const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
} as const;
```

## Best Practices

### 1. Error Handling

Always use the provided error handling utilities:

```typescript
// ❌ Don't do this
try {
  const result = await supabase.from('table').select();
} catch (error) {
  console.error(error);
}

// ✅ Do this
const { data, error } = await wrapError(
  () => supabase.from('table').select(),
  'select-operation'
);
```

### 2. Session Management

Use session utilities for all auth operations:

```typescript
// ❌ Don't do this
const { data: { session } } = await supabase.auth.getSession();

// ✅ Do this
const { session, error } = await sessionUtils.getSession();
```

### 3. Database Operations

Use typed database helpers:

```typescript
// ❌ Don't do this
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single();

// ✅ Do this
const { data, error } = await selectOne<UserProfile>('user_profiles', userId);
```

### 4. Type Safety

Always provide proper types:

```typescript
// ✅ Properly typed
const { data, error } = await selectOne<UserProfile>('user_profiles', userId);
const { data, error } = await updateOne<Company>('companies', companyId, updates);
```

## Testing

The modular structure includes comprehensive tests:

```bash
# Run Supabase module tests
pnpm test __tests__/lib/supabase-modular.test.ts
```

## Migration Guide

### From Monolithic to Modular

1. **Update imports**:
   ```typescript
   // Old
   import { supabase, selectOne } from '@/lib/supabase';
   
   // New
   import { supabase, selectOne } from '@/lib/supabase';
   ```

2. **Use error handling utilities**:
   ```typescript
   // Old
   try {
     const result = await operation();
   } catch (error) {
     handleError(error);
   }
   
   // New
   const { data, error } = await wrapError(operation, 'context');
   ```

3. **Use session utilities**:
   ```typescript
   // Old
   const { data: { session } } = await supabase.auth.getSession();
   
   // New
   const { session, error } = await sessionUtils.getSession();
   ```

## Performance Considerations

1. **Tree Shaking**: The modular structure allows for better tree shaking
2. **Lazy Loading**: Import only what you need
3. **Caching**: Session utilities include intelligent caching
4. **Rate Limiting**: Built-in rate limiting prevents API abuse

## Security Considerations

1. **Environment Variables**: Always validate required env vars
2. **Session Security**: Proper session validation and refresh
3. **Error Logging**: Sensitive data is not logged
4. **Rate Limiting**: Prevents abuse and 429 errors

## Future Enhancements

1. **SSR Support**: Service role client for server-side rendering
2. **Connection Pooling**: Enhanced connection management
3. **Metrics**: Built-in performance monitoring
4. **Caching Layer**: Redis or in-memory caching
5. **Circuit Breaker**: Advanced failure handling patterns

## Troubleshooting

### Common Issues

1. **Session Expiration**: Use `sessionUtils.ensureSession()`
2. **Rate Limiting**: Check `rateLimitConfig` and implement delays
3. **Type Errors**: Ensure proper typing with generics
4. **Connection Issues**: Use `smartClient.testConnection()`

### Debug Utilities

```typescript
// Test authentication flow
await window.testAuth();

// Diagnose issues
const diagnosis = await diagnoseAuthIssues();

// Check JWT transmission
const jwtStatus = await diagnoseJWTTransmission();
```

This modular architecture provides enterprise-grade reliability, type safety, and maintainability while following Nexus development standards.
