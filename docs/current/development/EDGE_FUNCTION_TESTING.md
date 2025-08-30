# Edge Function Testing & Migration Strategy

## Overview

This document outlines the testing strategy for Supabase Edge Functions following the service layer migration. The goal is to ensure that migrated functions maintain their functionality while leveraging centralized business logic.

## Testing Strategy

### 1. Smoke Tests (`migration-regression.test.ts`)

**Purpose**: Verify that migrated Edge Functions return expected responses and maintain their API contracts.

**Location**: `__tests__/integration/migration-regression.test.ts`

**Key Features**:
- Tests all migrated functions (`ai_execute_action`, `contacts`, `deals`, `hubspot-sync`)
- Tests functions marked for migration (`email-analysis`, `company-enrichment`, etc.)
- Validates response shapes and status codes
- Mocks external dependencies (OpenAI API, Supabase client)

**Usage**:
```bash
# Run smoke tests
pnpm test:smoke

# Run specific migration tests
pnpm test:migration
```

### 2. Service Layer Unit Tests (`AIService.test.ts`)

**Purpose**: Test the enhanced service layer methods that Edge Functions now use.

**Location**: `__tests__/core/AIService.test.ts`

**Key Features**:
- Tests new embedding functionality (`generateEmbedding`, `embedCompanyProfile`)
- Validates error handling and edge cases
- Ensures proper logging and audit trails
- Tests integration with existing service methods

**Usage**:
```bash
# Run AIService tests
pnpm test:ai-service
```

## Test Categories

### ✅ Fully Migrated Functions

These functions have been completely migrated to use service layer patterns:

| Function | Service Layer | Test Coverage |
|----------|---------------|---------------|
| `ai_execute_action` | `ContactService` / `DealService` | ✅ Smoke Tests |
| `contacts` | `ContactService` | ✅ Smoke Tests |
| `deals` | `DealService` | ✅ Smoke Tests |
| `hubspot-sync` | `DealService` | ✅ Smoke Tests |

### 🔄 Functions Marked for Migration

These functions have TODO comments and are ready for migration:

| Function | Target Service | Priority | Status |
|----------|---------------|----------|---------|
| `email-analysis` | `EmailIntelligenceService` | High | 🔄 TODO Added |
| `company-enrichment` | `CompanyService` | High | 🔄 TODO Added |
| `sync_user_profile` | `UserService` | Medium | 🔄 TODO Added |
| `update_user_role` | `UserService` | Medium | 🔄 TODO Added |
| `ai_embed_company_profile` | `AIService` | Medium | 🔄 TODO Added |
| `ai_embed_thought` | `AIService` | Medium | 🔄 TODO Added |
| `ai_embed_document` | `AIService` | Medium | 🔄 TODO Added |
| `ai_generate_business_plan` | `BusinessService` | Low | 🔄 TODO Added |
| `ai_generate_suggestions` | `AIService` | Low | 🔄 TODO Added |
| `ai_metrics_daily` | `AnalyticsService` | Low | 🔄 TODO Added |
| `brain_analysis` | `AIService` | Low | 🔄 TODO Added |
| `merge-thoughts` | `AIService` | Low | 🔄 TODO Added |
| `get_finance_performance` | `AnalyticsService` | Low | 🔄 TODO Added |
| `get_sales_performance` | `AnalyticsService` | Low | 🔄 TODO Added |
| `ops_metrics_ingest` | `AnalyticsService` | Low | 🔄 TODO Added |

### 🚫 Functions Not Requiring Migration

These functions don't contain significant business logic or are utility functions:

| Function | Reason | Test Coverage |
|----------|--------|---------------|
| `business_health` | Placeholder only | ✅ Smoke Tests |
| Various auth functions | Authentication only | ✅ Existing Tests |
| Webhook handlers | Event processing only | ✅ Existing Tests |

## Test Patterns

### 1. Request/Response Testing

```typescript
// Example: Testing ai_execute_action
const request = new Request('http://localhost:8000/functions/v1/ai_execute_action', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token'
  },
  body: JSON.stringify({
    action: 'create_contact',
    data: { first_name: 'John', last_name: 'Doe' }
  })
});

const response = await mockAiExecuteAction(request);
expect(response.status).toBe(200);
const responseData = await response.json();
expect(responseData.success).toBe(true);
```

### 2. Service Layer Testing

```typescript
// Example: Testing AIService.generateEmbedding
const result = await aiService.generateEmbedding('Test text');
expect(result.success).toBe(true);
expect(result.data).toBeDefined();
expect(aiService.create).toHaveBeenCalledWith(expect.objectContaining({
  user_id: 'system',
  operation_type: 'generation'
}));
```

### 3. Error Handling Testing

```typescript
// Example: Testing error scenarios
const result = await aiService.generateEmbedding('Test text');
expect(result.success).toBe(false);
expect(result.error).toBeDefined();
```

## Mock Strategy

### 1. Supabase Client Mocking

```typescript
const mockSupabaseEdgeClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@company.com' } },
      error: null
    })
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    // ... other methods
  }))
};
```

### 2. OpenAI API Mocking

```typescript
const mockFetch = jest.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({
    data: [{ embedding: new Array(1536).fill(0.1) }]
  })
});
```

### 3. Environment Variables Mocking

```typescript
const mockDeno = {
  env: {
    get: jest.fn((key) => {
      const envVars: Record<string, string> = {
        'SUPABASE_URL': 'https://test.supabase.co',
        'OPENAI_API_KEY': 'test-openai-key',
        // ... other vars
      };
      return envVars[key] || null;
    })
  }
};
```

## Running Tests

### Individual Test Suites

```bash
# Run migration regression tests
pnpm test:migration

# Run AIService unit tests
pnpm test:ai-service

# Run all tests with coverage
pnpm test:coverage
```

### Continuous Integration

The tests are designed to run in CI environments:

```yaml
# Example GitHub Actions step
- name: Run Migration Tests
  run: pnpm test:migration

- name: Run Service Layer Tests
  run: pnpm test:ai-service
```

## Test Data

### Standard Test Data

```typescript
const testData = {
  contact: {
    id: 'test-contact-id',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    company_id: 'test-company-id',
    owner_id: 'test-user-id'
  },
  deal: {
    id: 'test-deal-id',
    name: 'Test Deal',
    value: 50000,
    stage: 'proposal',
    company_id: 'test-company-id',
    owner_id: 'test-user-id'
  },
  // ... other entities
};
```

## Best Practices

### 1. Test Organization

- Group related functions in describe blocks
- Use descriptive test names
- Test both success and failure scenarios
- Validate response shapes and status codes

### 2. Mock Management

- Clear all mocks in `beforeEach`
- Use consistent mock data across tests
- Mock external dependencies appropriately
- Avoid over-mocking internal logic

### 3. Error Testing

- Test all error paths
- Validate error messages and status codes
- Test edge cases (empty data, invalid input)
- Ensure proper logging of errors

### 4. Performance Considerations

- Keep tests fast and focused
- Use appropriate timeouts for async operations
- Avoid unnecessary database calls in tests
- Mock heavy operations (AI API calls, file operations)

## Migration Checklist

When migrating a new function:

1. ✅ Add TODO comment to the function
2. ✅ Create smoke test for the function
3. ✅ Test the target service method
4. ✅ Update this documentation
5. ✅ Run full test suite
6. ✅ Verify no regressions

## Future Enhancements

### 1. Integration Tests

Consider adding true integration tests that:
- Test against a real Supabase instance
- Validate actual database operations
- Test end-to-end workflows

### 2. Performance Tests

Add performance benchmarks for:
- Response times
- Memory usage
- Database query efficiency

### 3. Security Tests

Add security-focused tests for:
- Authentication validation
- Authorization checks
- Input sanitization
- SQL injection prevention

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure mocks are cleared in `beforeEach`
2. **Async test failures**: Use proper async/await patterns
3. **Environment variables**: Check that all required env vars are mocked
4. **Type errors**: Ensure test files use proper TypeScript types

### Debug Commands

```bash
# Run tests with verbose output
pnpm test:smoke --verbose

# Run specific test file
pnpm test __tests__/integration/migration-regression.test.ts

# Run tests with debugging
pnpm test:debug
```

## Contributing

When adding new tests:

1. Follow the existing patterns
2. Use the standard test data
3. Add appropriate mocks
4. Update this documentation
5. Ensure all tests pass

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Service Layer Architecture](../architecture/SERVICE_LAYER_ARCHITECTURE.md) 