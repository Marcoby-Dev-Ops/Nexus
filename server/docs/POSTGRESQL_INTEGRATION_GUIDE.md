# PostgreSQL Integration Guide

## Overview

This guide explains how to use the new PostgreSQL integration in the Nexus frontend. The system provides unified interfaces for all database operations.

## Architecture

### Database Service Layer

The integration is built around a unified `DatabaseService` that automatically detects and uses the appropriate database:

- **PostgreSQL**: Direct connection using `pg` library with connection pooling
- **Automatic Detection**: Based on environment variables and connection strings

### Key Components

1. **DatabaseService** (`src/core/services/DatabaseService.ts`)
   - Unified interface for PostgreSQL operations
   - Automatic database type detection
   - Health checking and connection management

2. **BaseService** (`src/core/services/BaseService.ts`)
   - Updated to use unified database client
   - Consistent error handling and retry logic
   - Database-agnostic operation wrappers

3. **UnifiedService** (`src/core/services/UnifiedService.ts`)
   - Standardized CRUD operations
   - Schema validation with Zod
   - Works with PostgreSQL

4. **React Hooks** (`src/hooks/useDatabase.ts`)
   - Database health monitoring
   - Query execution
   - Transaction management
   - Connection testing

## Configuration

### Environment Variables

```bash
# PostgreSQL Configuration (Primary)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/vector_db
DB_HOST=localhost
DB_PORT=5433
DB_NAME=vector_db
DB_USER=postgres
DB_PASSWORD=postgres

# PostgreSQL Configuration
VITE_POSTGRES_URL=postgresql://postgres:postgres@localhost:5433/vector_db
VITE_POSTGRES_HOST=localhost
VITE_POSTGRES_PORT=5433
VITE_POSTGRES_DB=vector_db
VITE_POSTGRES_USER=postgres
VITE_POSTGRES_PASSWORD=postgres
```

### Database Detection Logic

The system automatically detects which database to use:

1. **PostgreSQL Priority**: If `DATABASE_URL` contains localhost, vector_db, or postgresql://
2. **Default**: Falls back to PostgreSQL with default local settings

## Usage Examples

### 1. Service Layer Usage

```typescript
import { UnifiedService, type ServiceResponse } from '@/core/services/UnifiedService';
import { z } from 'zod';

// Define your schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.string().datetime(),
});

type User = z.infer<typeof UserSchema>;

// Create your service
export class UserService extends UnifiedService<User> {
  protected config = {
    tableName: 'users',
    schema: UserSchema,
    defaultColumns: 'id, email, name, created_at',
  };

  // Custom methods
  async getByEmail(email: string): Promise<ServiceResponse<User>> {
    return this.list({ email });
  }
}

// Use the service
const userService = new UserService();

// Create a user
const result = await userService.create({
  email: 'user@example.com',
  name: 'John Doe',
  created_at: new Date().toISOString(),
});

if (result.success) {
  console.log('User created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### 2. React Component Usage

```typescript
import React from 'react';
import { useDatabaseHealth, useDatabaseQuery } from '@/hooks/useDatabase';

export const UserList: React.FC = () => {
  const { health, loading: healthLoading } = useDatabaseHealth();
  const { data: users, loading: usersLoading, error } = useDatabaseQuery<User>(
    'SELECT * FROM users ORDER BY created_at DESC',
    [],
    health?.status === 'healthy'
  );

  if (healthLoading || usersLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Users ({users?.length || 0})</h2>
      {users?.map(user => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
};
```

### 3. Database Status Component

```typescript
import React from 'react';
import DatabaseStatus from '@/components/database/DatabaseStatus';

export const AdminPanel: React.FC = () => {
  const handleStatusChange = (status: 'healthy' | 'unhealthy' | 'unknown') => {
    console.log('Database status changed:', status);
  };

  return (
    <div>
      <h1>Admin Panel</h1>
      <DatabaseStatus 
        showDetails={true} 
        onStatusChange={handleStatusChange} 
      />
    </div>
  );
};
```

### 4. Direct Database Operations

```typescript
import { databaseService } from '@/core/services/DatabaseService';

// Execute a query
const result = await databaseService.query(
  'SELECT * FROM users WHERE status = $1',
  ['active']
);

// Execute a transaction
const transactionResult = await databaseService.transaction(async (client) => {
  // Create user
  const user = await client.from('users').insert({
    email: 'user@example.com',
    name: 'John Doe'
  });

  // Create profile
  const profile = await client.from('user_profiles').insert({
    user_id: user.data.id,
    bio: 'New user'
  });

  return { user: user.data, profile: profile.data };
});
```

## Vector Operations (PostgreSQL with pgvector)

When using PostgreSQL with the pgvector extension, you can perform vector similarity searches:

```typescript
import { databaseService } from '@/core/services/DatabaseService';

// Vector similarity search
const searchResult = await databaseService.query(`
  SELECT 
    id,
    title,
    content,
    1 - (embedding <=> $1::vector(1536)) as similarity
  FROM documents
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1::vector(1536)
  LIMIT 5
`, [embeddingArray]);

// Using the built-in vector functions
const matchResult = await databaseService.getClient().rpc('match_documents', {
  query_embedding: embeddingArray,
  match_count: 5,
  filter: { user_id: 'user-123' }
});
```

## Error Handling

The system provides consistent error handling across all database operations:

```typescript
import { BaseService } from '@/core/services/BaseService';

export class MyService extends BaseService {
  async safeOperation() {
    return this.executeDbOperation(async () => {
      // Your database operation here
      const result = await this.db.from('table').select('*');
      
      if (result.error) {
        return { data: null, error: result.error.message };
      }
      
      return { data: result.data, error: null };
    }, 'safe operation description');
  }
}
```

## Health Monitoring

Monitor database health in real-time:

```typescript
import { useDatabaseHealth } from '@/hooks/useDatabase';

export const HealthMonitor: React.FC = () => {
  const { health, loading, error, refetch } = useDatabaseHealth();

  if (loading) return <div>Checking health...</div>;

  return (
    <div>
      <h3>Database Health</h3>
      <p>Status: {health?.status}</p>
      <p>Type: {health?.type}</p>
      <p>Connection: {health?.connection ? 'Connected' : 'Disconnected'}</p>
      <p>Vector Support: {health?.vectorSupport ? 'Available' : 'Not Available'}</p>
      {error && <p>Error: {error}</p>}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

## Migration from Other Databases

If you're migrating from other database systems:

1. **Update Environment Variables**: Set PostgreSQL connection details
2. **Update Services**: Services will automatically use PostgreSQL
3. **Test Vector Operations**: Ensure pgvector extension is installed
4. **Update Queries**: Some database-specific queries may need adjustment

### Example Migration

```typescript
// Before (Database-specific)
const { data, error } = await database
  .from('users')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// After (Unified interface)
const result = await userService.list({ status: 'active' });
// or
const result = await databaseService.query(
  'SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC',
  ['active']
);
```

## Best Practices

1. **Use Service Layer**: Always use services instead of direct database calls
2. **Schema Validation**: Define Zod schemas for all data structures
3. **Error Handling**: Use the built-in error handling and retry logic
4. **Health Monitoring**: Monitor database health in production
5. **Connection Pooling**: The system automatically handles connection pooling
6. **Vector Operations**: Use pgvector for AI/ML features when available

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Verify PostgreSQL server is running
   - Check firewall settings

2. **Vector Operations Not Working**
   - Ensure pgvector extension is installed
   - Check vector column types
   - Verify embedding dimensions match

3. **Performance Issues**
   - Monitor connection pool usage
   - Check query performance
   - Consider indexing for vector columns

### Debug Mode

Enable debug logging:

```typescript
import { logger } from '@/shared/utils/logger';

// Set log level
logger.level = 'debug';

// Check database configuration
console.log('Database Config:', databaseService.getConfig());
console.log('Database Type:', 'PostgreSQL');
```

## API Reference

### DatabaseService Methods

- `query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>`
- `transaction<T>(callback: (client: any) => Promise<T>): Promise<{ data: T | null; error: string | null }>`
- `healthCheck(): Promise<DatabaseHealth>`
- `getConfig(): DatabaseConfig`
- `isUsingPostgreSQL(): boolean`
- `isUsingPostgres(): boolean`
- `getClient(): any`

### React Hooks

- `useDatabaseHealth(): { health, loading, error, refetch }`
- `useDatabaseQuery<T>(query, params, enabled): { data, loading, error, refetch }`
- `useDatabaseTransaction<T>(): { executeTransaction, loading, error }`
- `useDatabaseConfig(): { config, isPostgres, databaseType }`
- `useDatabaseClient(): any`
- `useDatabaseConnection(): { connected, testing, error, testConnection }`
- `useVectorOperations(): { vectorSupport, testing, error, testVectorSupport }`

This integration provides a seamless way to work with PostgreSQL while maintaining consistent APIs and error handling throughout your application.
