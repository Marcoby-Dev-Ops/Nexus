# Database Access Patterns - Standardization Guide

**Last Updated**: January 2025  
**Status**: ✅ **ACTIVE STANDARD**  
**Enforcement**: Required for all new code

---

## 🎯 **Database Access Pattern Rules**

### **RULE 1: Frontend Components → `api-client`**
**Use Case**: React components, hooks, pages, UI logic
**Pattern**: HTTP requests to Express server

```typescript
// ✅ CORRECT - Frontend components
import { selectData, insertOne, callRPC } from '@/lib/api-client';

function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      const result = await selectData('users', '*', { status: 'active' });
      if (result.data) setUsers(result.data);
    };
    fetchUsers();
  }, []);
}
```

**When to use:**
- ✅ React components (`.tsx` files)
- ✅ Custom hooks (`use*` functions)
- ✅ Page components
- ✅ UI event handlers
- ✅ Browser environment operations

---

### **RULE 2: Services → `this.database`**
**Use Case**: Business logic, data processing, service layer
**Pattern**: Service layer abstraction

```typescript
// ✅ CORRECT - Service layer
export class UserService extends BaseService {
  async getActiveUsers(): Promise<ServiceResponse<User[]>> {
    return await this.database.select('users', '*', { status: 'active' });
  }
  
  async createUser(userData: Partial<User>): Promise<ServiceResponse<User>> {
    return await this.database.insert('users', userData);
  }
}
```

**When to use:**
- ✅ Services extending `BaseService`
- ✅ Business logic operations
- ✅ Data transformation
- ✅ Complex data relationships
- ✅ CRUD operations with validation

---

### **RULE 3: Complex Operations → `this.postgres`**
**Use Case**: Complex SQL, custom queries, transactions
**Pattern**: Raw PostgreSQL queries

```typescript
// ✅ CORRECT - Complex SQL operations
export class AnalyticsService extends BaseService {
  async getUserStats(): Promise<ServiceResponse<UserStats>> {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_age_days
      FROM users
      WHERE created_at > $1
    `;
    
    const result = await this.postgres.query(sql, ['2024-01-01']);
    return this.createResponse(result.rows[0]);
  }
}
```

**When to use:**
- ✅ Complex SQL queries
- ✅ Custom aggregations
- ✅ Transactions
- ✅ Performance-critical operations
- ✅ Multi-table joins
- ✅ Custom database functions

---

## 🚫 **What NOT to Do**

### **❌ NEVER use direct Supabase in components**
```typescript
// ❌ WRONG - Direct Supabase in component
function UserList() {
  const { data, error } = await supabase.from('users').select('*');
}
```

### **❌ NEVER use api-client in services**
```typescript
// ❌ WRONG - HTTP API in service layer
export class UserService extends BaseService {
  async getUsers() {
    return await selectData('users'); // Should use this.database
  }
}
```

### **❌ NEVER use this.postgres for simple CRUD**
```typescript
// ❌ WRONG - Raw SQL for simple operations
export class UserService extends BaseService {
  async getUser(id: string) {
    const sql = `SELECT * FROM users WHERE id = $1`;
    return await this.postgres.query(sql, [id]); // Should use this.database
  }
}
```

---

## 🔧 **Enforcement Rules**

### **File Type Enforcement**

| File Type | Allowed Patterns | Forbidden Patterns |
|-----------|------------------|-------------------|
| `*.tsx` (Components) | `api-client` only | `this.database`, `this.postgres`, `supabase` |
| `*.ts` (Services) | `this.database`, `this.postgres` | `api-client`, `supabase` |
| `*.ts` (Hooks) | `api-client` only | `this.database`, `this.postgres`, `supabase` |
| `*.ts` (Utils) | `api-client` only | `this.database`, `this.postgres`, `supabase` |

### **Import Enforcement**

```typescript
// ✅ CORRECT - Component imports
import { selectData, insertOne, callRPC } from '@/lib/api-client';

// ✅ CORRECT - Service imports
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

// ❌ WRONG - Direct Supabase imports
import { supabase } from '@/lib/supabase';
```

---

## 🏗️ **Migration Strategy**

### **Phase 1: Update BaseService**
```typescript
// ✅ COMPLETED - BaseService now has proper database access
export abstract class BaseService {
  protected get database() {
    // PostgreSQL abstraction layer
  }
  
  protected get postgres() {
    // Raw PostgreSQL access
  }
}
```

### **Phase 2: Migrate Services**
```bash
# Run migration script
node scripts/migrate-supabase-to-postgres.cjs
```

### **Phase 3: Update Components**
```typescript
// ✅ COMPLETED - Components use api-client
import { selectData } from '@/lib/api-client';
```

### **Phase 4: Add Linting Rules**
```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["@/lib/supabase"],
            "message": "Use api-client for components, this.database for services"
          }
        ]
      }
    ]
  }
}
```

---

## 📋 **Implementation Checklist**

### **For New Code:**
- [ ] Components use `api-client` imports
- [ ] Services extend `BaseService` and use `this.database`
- [ ] Complex queries use `this.postgres`
- [ ] No direct Supabase imports

### **For Existing Code:**
- [ ] Run migration script: `node scripts/migrate-supabase-to-postgres.cjs`
- [ ] Update any remaining `this.supabase` calls
- [ ] Remove Supabase compatibility layer
- [ ] Add ESLint rules for enforcement

### **For Code Review:**
- [ ] Check file type matches allowed patterns
- [ ] Verify imports follow enforcement rules
- [ ] Ensure services extend BaseService
- [ ] Confirm complex SQL uses `this.postgres`

---

## 🎯 **Benefits of Standardization**

1. **Consistency**: All code follows the same patterns
2. **Maintainability**: Clear separation of concerns
3. **Performance**: Right tool for the right job
4. **Security**: Proper authentication and authorization
5. **Testing**: Easy to mock and test each layer
6. **Scalability**: Architecture supports growth

---

## 🔍 **Verification Commands**

```bash
# Check for direct Supabase usage
grep -r "import.*supabase" src/ --include="*.ts" --include="*.tsx"

# Check for api-client in services
grep -r "import.*api-client" src/services/ --include="*.ts"

# Check for this.supabase usage
grep -r "this\.supabase" src/ --include="*.ts"

# Run migration script
node scripts/migrate-supabase-to-postgres.cjs
```

---

## 📚 **Examples by Use Case**

### **Simple CRUD in Component**
```typescript
// ✅ Component using api-client
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      const result = await selectOne('users', userId);
      if (result.data) setUser(result.data);
    };
    fetchUser();
  }, [userId]);
}
```

### **Business Logic in Service**
```typescript
// ✅ Service using this.database
export class UserService extends BaseService {
  async getUserWithProfile(userId: string): Promise<ServiceResponse<UserWithProfile>> {
    const userResult = await this.database.select('users', '*', { id: userId });
    const profileResult = await this.database.select('user_profiles', '*', { user_id: userId });
    
    if (!userResult.data || !profileResult.data) {
      return this.createErrorResponse('User or profile not found');
    }
    
    return this.createResponse({
      ...userResult.data[0],
      profile: profileResult.data[0]
    });
  }
}
```

### **Complex Analytics Query**
```typescript
// ✅ Complex operation using this.postgres
export class AnalyticsService extends BaseService {
  async getRevenueByMonth(): Promise<ServiceResponse<RevenueData[]>> {
    const sql = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM orders 
      WHERE status = 'completed' 
        AND created_at >= $1
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `;
    
    const result = await this.postgres.query(sql, ['2024-01-01']);
    return this.createResponse(result.rows);
  }
}
```

---

**This standardization ensures consistent, maintainable, and scalable database access patterns across the entire Nexus codebase.**
