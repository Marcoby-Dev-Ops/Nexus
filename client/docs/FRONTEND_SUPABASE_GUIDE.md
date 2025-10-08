# Frontend-Supabase Integration Guide

## 🚀 **Quick Start**

Your frontend is already configured with Supabase! Here's how to use it effectively:

### 1. **Basic Usage**

```typescript
import { supabase, authUtils, dbUtils } from '@/core/supabase';

// Get current user
const user = await authUtils.getCurrentUser();

// Insert data safely
const newTask = await dbUtils.safeInsert('tasks', {
  title: 'New Task',
  user_id: user.id,
  status: 'pending'
});

// Update data safely
await dbUtils.safeUpdate('tasks', taskId, { status: 'completed' });

// Delete data safely
await dbUtils.safeDelete('tasks', taskId);
```

## 🔧 **Enhanced Configuration**

### **Current Setup**

- ✅ Supabase client configured with TypeScript types
- ✅ Authentication with session persistence
- ✅ Real-time subscriptions enabled
- ✅ Error handling utilities
- ✅ Development logging

### **Environment Variables**

```bash
# Required
VITE_POSTGRES_URL=postgresql://postgres:postgres@localhost:5433/vector_db
VITE_POSTGRES_HOST=localhost
VITE_POSTGRES_PORT=5433
VITE_POSTGRES_DB=vector_db
VITE_POSTGRES_USER=postgres
VITE_POSTGRES_PASSWORD=postgres

# Optional (for development)
VITE_DEV=true
```

## 📊 **Database Tables Available**

| **Table** | **Purpose** | **RLS Enabled** |
|-----------|-------------|-----------------|
| `user_profiles` | User data | ✅ |
| `activities` | Analytics events | ✅ |
| `user_licenses` | Billing data | ✅ |
| `chat_usage_tracking` | Usage metrics | ✅ |
| `ai_action_card_templates` | AI templates | ✅ |
| `audit_log_events` | Security logs | ✅ |
| `recents` | User recent items | ✅ |
| `pins` | User pinned items | ✅ |
| `tasks` | User tasks | ✅ |
| `notifications` | User notifications | ✅ |
| `communication_events` | Communication tracking | ✅ |
| `company_status` | Company health | ✅ |
| `debug_logs` | Debug information | ✅ |
| `analytics_events` | Analytics data | ✅ |
| `realtime_sync_events` | Sync tracking | ✅ |
| `service_health` | Service monitoring | ✅ |

## 🔐 **Authentication Patterns**

### **1. User Authentication**

```typescript
import { authUtils } from '@/core/supabase';

// Check if user is logged in
const isLoggedIn = await authUtils.isAuthenticated();

// Get current user
const user = await authUtils.getCurrentUser();

// Sign out
await authUtils.signOut();
```

### **2. Protected Routes**

```typescript
import { useEffect, useState } from 'react';
import { authUtils } from '@/core/supabase';

function ProtectedComponent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authUtils.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        // Redirect to login
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Access denied</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

## 📡 **Real-time Subscriptions**

### **1. Subscribe to Table Changes**

```typescript
import { useEffect } from 'react';
import { supabase } from '@/core/supabase';

function RealtimeComponent() {
  useEffect(() => {
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task changed:', payload);
          // Update your UI here
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <div>Listening for task changes...</div>;
}
```

### **2. User-Specific Subscriptions**

```typescript
import { useEffect } from 'react';
import { supabase } from '@/core/supabase';

function UserTasksComponent({ userId }) {
  useEffect(() => {
    const subscription = supabase
      .channel(`user_${userId}_tasks`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('User task changed:', payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return <div>Listening for your task changes...</div>;
}
```

## 🛡️ **Error Handling**

### **1. Using Safe Database Operations**

```typescript
import { dbUtils, handleSupabaseError } from '@/core/supabase';

// Safe operations with built-in error handling
try {
  const newTask = await dbUtils.safeInsert('tasks', {
    title: 'New Task',
    user_id: userId,
    status: 'pending'
  });
  console.log('Task created:', newTask);
} catch (error) {
  console.error('Failed to create task:', error.message);
}
```

### **2. Custom Error Handling**

```typescript
import { supabase, handleSupabaseError } from '@/core/supabase';

async function customQuery() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    const handledError = handleSupabaseError(error, 'custom_query');
    throw new Error(handledError.error);
  }

  return data;
}
```

## 🔄 **Data Fetching Patterns**

### **1. React Query Integration**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase';

// Fetch user tasks
function useUserTasks(userId: string) {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Create new task
function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

### **2. Optimistic Updates**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old) => 
        old?.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

## 🎯 **Best Practices**

### **1. Type Safety**

```typescript
import type { Database } from '@/core/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Use typed operations
const newTask: TaskInsert = {
  title: 'New Task',
  user_id: userId,
  status: 'pending'
};
```

### **2. Environment-Specific Configuration**

```typescript
// Development logging
if (import.meta.env.DEV) {
  console.log('🔍 PostgreSQL URL:', import.meta.env.VITE_POSTGRES_URL);
}

// Production error handling
if (import.meta.env.PROD) {
  // Send errors to monitoring service
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}
```

### **3. Performance Optimization**

```typescript
// Use select() to limit returned fields
const { data } = await supabase
  .from('tasks')
  .select('id, title, status, created_at')
  .eq('user_id', userId);

// Use pagination for large datasets
const { data } = await supabase
  .from('tasks')
  .select('*')
  .range(0, 9) // First 10 items
  .order('created_at', { ascending: false });
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Authentication Errors**

   ```typescript
   // Check if user is authenticated
   const isAuth = await authUtils.isAuthenticated();
   if (!isAuth) {
     // Redirect to login
   }
   ```

2. **RLS Policy Errors**

   ```typescript
   // Ensure user_id is set in your queries
   const { data } = await supabase
     .from('tasks')
     .select('*')
     .eq('user_id', currentUser.id); // Required for RLS
   ```

3. **Real-time Connection Issues**

   ```typescript
   // Check connection status
   const channel = supabase.channel('test');
   channel.subscribe((status) => {
     console.log('Connection status:', status);
   });
   ```

### **Debug Mode**

```typescript
// Enable debug logging in development
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth event:', event, session?.user?.email);
  });
}
```

## 📚 **Next Steps**

1. **Generate Fresh Types**: Run `pnpm supabase:db:pull` to update types
2. **Test Real-time**: Implement real-time features in your components
3. **Add Error Boundaries**: Wrap components with error boundaries
4. **Monitor Performance**: Use React DevTools to monitor re-renders
5. **Add Loading States**: Implement proper loading states for all async operations

Your frontend is now properly configured for production use with Supabase! 🎉
