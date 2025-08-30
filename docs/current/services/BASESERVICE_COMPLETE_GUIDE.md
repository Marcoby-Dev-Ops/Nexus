# 🏗️ BaseService Complete Guide

**Last Updated**: January 2025  
**Status**: ✅ **ACTIVE AND STABLE**  
**Version**: 2.0 - Enhanced with retry logic and transaction support

---

## 📋 **Overview**

The `BaseService` class provides a standardized foundation for all service-layer operations in Nexus. It consolidates common patterns for error handling, retry logic, transaction management, and response formatting.

## 🎯 **Key Features**

### **Standardized Response Format**
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    duration: number;
    retryCount?: number;
  };
}
```

### **Enhanced Error Handling**
- **Automatic retry logic** with exponential backoff
- **Transaction support** for database operations
- **Comprehensive logging** with structured error context
- **Graceful degradation** for non-critical failures

## 🏗️ **Architecture**

### **Core BaseService Class**
```typescript
export abstract class BaseService {
  protected logger: Logger;
  protected retryConfig: RetryConfig;
  
  constructor(serviceName: string) {
    this.logger = new Logger(serviceName);
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    };
  }
}
```

## 📚 **Usage Patterns**

### **1. Basic Service Implementation**
```typescript
export class UserService extends BaseService {
  constructor() {
    super('UserService');
  }

  async getUserById(id: string): Promise<ServiceResponse<User>> {
    try {
      const user = await this.withRetry(() => 
        supabase.from('users').select('*').eq('id', id).single()
      );
      
      return this.createResponse(user.data);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user');
    }
  }
}
```

### **2. Transaction Support**
```typescript
async createUserWithProfile(userData: UserData): Promise<ServiceResponse<User>> {
  return this.withTransaction(async (client) => {
    // Create user
    const { data: user, error: userError } = await client
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (userError) throw userError;
    
    // Create profile
    const { error: profileError } = await client
      .from('profiles')
      .insert({ user_id: user.id, ...profileData });
    
    if (profileError) throw profileError;
    
    return user;
  });
}
```

### **3. Retry Logic**
```typescript
async syncWithExternalAPI(): Promise<ServiceResponse<SyncResult>> {
  return this.withRetry(
    async () => {
      const response = await fetch('/api/external');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      return response.json();
    },
    {
      maxAttempts: 5,
      baseDelay: 2000,
      shouldRetry: (error) => error.message.includes('429')
    }
  );
}
```

## 🔧 **Advanced Features**

### **Custom Retry Strategies**
```typescript
// Exponential backoff with jitter
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  shouldRetry: (error: Error) => {
    return error.message.includes('rate limit') || 
           error.message.includes('timeout');
  }
};
```

### **Transaction Management**
```typescript
// Complex multi-table operations
async processOrder(orderData: OrderData): Promise<ServiceResponse<Order>> {
  return this.withTransaction(async (client) => {
    // 1. Validate inventory
    const inventory = await client
      .from('inventory')
      .select('quantity')
      .eq('product_id', orderData.productId)
      .single();
    
    if (inventory.quantity < orderData.quantity) {
      throw new Error('Insufficient inventory');
    }
    
    // 2. Create order
    const { data: order } = await client
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    // 3. Update inventory
    await client
      .from('inventory')
      .update({ quantity: inventory.quantity - orderData.quantity })
      .eq('product_id', orderData.productId);
    
    return order;
  });
}
```

## 📊 **Performance Monitoring**

### **Built-in Metrics**
```typescript
// Automatic performance tracking
const result = await this.withMetrics('getUserById', async () => {
  return await this.getUserById(userId);
});

// Result includes:
// - Execution time
// - Retry attempts
// - Success/failure status
// - Error details
```

### **Custom Metrics**
```typescript
async complexOperation(): Promise<ServiceResponse<Result>> {
  const startTime = Date.now();
  
  try {
    const result = await this.performOperation();
    
    this.logger.info('Operation completed', {
      duration: Date.now() - startTime,
      success: true,
      resultSize: result.length
    });
    
    return this.createResponse(result);
  } catch (error) {
    this.logger.error('Operation failed', {
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    });
    
    return this.handleError(error);
  }
}
```

## 🛡️ **Error Handling Patterns**

### **Graceful Degradation**
```typescript
async getCachedData(): Promise<ServiceResponse<Data>> {
  try {
    // Try cache first
    const cached = await this.cache.get(key);
    if (cached) {
      return this.createResponse(cached);
    }
    
    // Fallback to database
    const data = await this.database.get(key);
    await this.cache.set(key, data);
    
    return this.createResponse(data);
  } catch (error) {
    // Log but don't fail the request
    this.logger.warn('Cache/database unavailable, using fallback', {
      error: error.message
    });
    
    // Return fallback data
    return this.createResponse(this.getFallbackData());
  }
}
```

### **Circuit Breaker Pattern**
```typescript
async callExternalService(): Promise<ServiceResponse<Data>> {
  if (this.circuitBreaker.isOpen()) {
    return this.createResponse(this.getCachedData());
  }
  
  try {
    const result = await this.externalAPI.call();
    this.circuitBreaker.recordSuccess();
    return this.createResponse(result);
  } catch (error) {
    this.circuitBreaker.recordFailure();
    return this.handleError(error);
  }
}
```

## 📈 **Best Practices**

### **1. Service Organization**
```typescript
// ✅ Good: Clear separation of concerns
export class UserService extends BaseService {
  async getUser(id: string) { /* ... */ }
  async createUser(data: UserData) { /* ... */ }
  async updateUser(id: string, data: Partial<UserData>) { /* ... */ }
  async deleteUser(id: string) { /* ... */ }
}

// ❌ Bad: Mixed concerns
export class UserService extends BaseService {
  async getUser(id: string) { /* ... */ }
  async sendEmail() { /* ... */ } // Should be in EmailService
  async processPayment() { /* ... */ } // Should be in PaymentService
}
```

### **2. Error Context**
```typescript
// ✅ Good: Rich error context
async processUser(userId: string): Promise<ServiceResponse<User>> {
  try {
    const user = await this.getUser(userId);
    if (!user) {
      return this.createErrorResponse('User not found', {
        userId,
        operation: 'processUser',
        timestamp: new Date().toISOString()
      });
    }
    
    return this.createResponse(user);
  } catch (error) {
    return this.handleError(error, 'Failed to process user', {
      userId,
      operation: 'processUser'
    });
  }
}
```

### **3. Transaction Boundaries**
```typescript
// ✅ Good: Proper transaction scope
async createOrderWithItems(orderData: OrderData, items: OrderItem[]): Promise<ServiceResponse<Order>> {
  return this.withTransaction(async (client) => {
    // All operations in single transaction
    const order = await this.createOrder(client, orderData);
    await this.createOrderItems(client, order.id, items);
    await this.updateInventory(client, items);
    
    return order;
  });
}
```

## 🔄 **Migration Guide**

### **From Old Service Pattern**
```typescript
// ❌ Old pattern
export class OldUserService {
  async getUser(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

// ✅ New pattern
export class UserService extends BaseService {
  constructor() {
    super('UserService');
  }
  
  async getUser(id: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await this.withRetry(() =>
        supabase.from('users').select('*').eq('id', id).single()
      );
      
      if (error) throw error;
      return this.createResponse(data);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch user');
    }
  }
}
```

## 📋 **Implementation Checklist**

### **For New Services**
- [ ] Extend `BaseService`
- [ ] Implement proper error handling
- [ ] Add retry logic for external calls
- [ ] Use transactions for multi-step operations
- [ ] Add comprehensive logging
- [ ] Write unit tests
- [ ] Document public methods

### **For Existing Services**
- [ ] Migrate to `BaseService` extension
- [ ] Replace manual error handling
- [ ] Add retry logic where appropriate
- [ ] Implement transaction support
- [ ] Update response format
- [ ] Add performance monitoring
- [ ] Update tests

## 🔗 **Related Documents**

- [Authentication System](./authentication/AUTH_NOTIFICATIONS_SYSTEM.md)
- [Architecture Standards](../architecture/ARCHITECTURE_STANDARDIZATION_SUMMARY.md)
- [Service Layer Patterns](../development/SERVICE_LAYER_PATTERNS.md)
- [Error Handling Guide](../development/ERROR_HANDLING_GUIDE.md)

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Next Review**: March 2025
