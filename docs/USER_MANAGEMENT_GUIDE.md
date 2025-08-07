# 👥 User Management Guide

## 📋 Overview

This guide covers the comprehensive user management system in Nexus, combining world-class features with simplified implementation patterns.

## 🏗️ Architecture

### **Core Components**

#### **1. Enhanced User Profile System**
```typescript
// src/core/types/userProfile.ts
interface UserProfile {
  // Personal Information
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  
  // Contact Information
  phone?: string;
  personal_email?: string;
  business_email?: string;
  
  // Work Information
  role: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  manager_id?: string;
  
  // Location Information
  timezone: string;
  location?: string;
  work_location?: 'office' | 'remote' | 'hybrid';
  
  // Professional Information
  linkedin_url?: string;
  skills?: string[];
  
  // System Preferences
  preferences: UserPreferences;
  
  // Status and Metadata
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  last_login?: string;
  onboarding_completed: boolean;
  profile_completion_percentage?: number;
}
```

#### **2. User Management Hook**
```typescript
// src/shared/hooks/useUserManagement.ts
export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: Partial<UserProfile>) => {
    // User creation logic
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    // User update logic
  };

  const deleteUser = async (userId: string) => {
    // User deletion logic
  };

  const getUser = async (userId: string) => {
    // Get single user
  };

  const listUsers = async (filters?: UserFilters) => {
    // List users with filters
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    listUsers,
  };
};
```

#### **3. User Management Dashboard**
```typescript
// src/components/admin/user/UserManagementDashboard.tsx
export const UserManagementDashboard: React.FC = () => {
  const { users, loading, createUser, updateUser, deleteUser } = useUserManagement();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Add User
        </Button>
      </div>

      <UserTable 
        users={users}
        onEdit={setSelectedUser}
        onDelete={deleteUser}
        loading={loading}
      />

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createUser}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSubmit={updateUser}
        />
      )}
    </div>
  );
};
```

---

## 🚀 Key Features

### **1. Enhanced User Profiles**

#### **Profile Completion Tracking**
```typescript
const calculateProfileCompletion = (user: UserProfile): number => {
  const requiredFields = ['first_name', 'last_name', 'email', 'role'];
  const optionalFields = ['phone', 'department', 'job_title', 'location'];
  
  const completedRequired = requiredFields.filter(field => user[field]).length;
  const completedOptional = optionalFields.filter(field => user[field]).length;
  
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;
  
  const requiredScore = (completedRequired / requiredFields.length) * requiredWeight;
  const optionalScore = (completedOptional / optionalFields.length) * optionalWeight;
  
  return Math.round((requiredScore + optionalScore) * 100);
};
```

#### **Professional Information**
- Skills and certifications tracking
- Social media profiles (LinkedIn, GitHub)
- Languages and expertise areas
- Emergency contact information

### **2. Role-Based Access Control**

#### **User Roles**
```typescript
export enum UserRole {
  Owner = 'owner',      // Full system access
  Admin = 'admin',       // Administrative access
  Manager = 'manager',   // Team management
  User = 'user',         // Standard user
  Guest = 'guest'        // Limited access
}
```

#### **Permission System**
```typescript
export const userPermissions = {
  owner: ['*'], // All permissions
  admin: [
    'manage_users',
    'manage_billing',
    'manage_integrations',
    'view_reports',
    'access_admin_panel'
  ],
  manager: [
    'manage_team',
    'view_reports',
    'edit_team_content'
  ],
  user: [
    'view_own_profile',
    'edit_own_profile',
    'access_basic_features'
  ],
  guest: [
    'view_public_content'
  ]
};
```

### **3. User Lifecycle Management**

#### **Onboarding Flow**
```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  component: React.ComponentType;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Profile',
    description: 'Add your basic information',
    required: true,
    completed: false,
    component: ProfileSetupStep
  },
  {
    id: 'company',
    title: 'Company Information',
    description: 'Tell us about your business',
    required: true,
    completed: false,
    component: CompanySetupStep
  },
  {
    id: 'integrations',
    title: 'Connect Integrations',
    description: 'Connect your business tools',
    required: false,
    completed: false,
    component: IntegrationsSetupStep
  }
];
```

#### **User Status Management**
```typescript
export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended'
}

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const result = await userService.update(userId, { status });
  if (result.success) {
    // Handle status change (notifications, access control, etc.)
    await handleStatusChange(userId, status);
  }
  return result;
};
```

---

## 🔧 Implementation Patterns

### **1. User Creation**

#### **Simplified Creation**
```typescript
const createUser = async (userData: CreateUserData) => {
  try {
    // Validate user data
    const validatedData = userProfileSchema.parse(userData);
    
    // Create user in auth system
    const authResult = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true
    });
    
    if (authResult.error) {
      throw new Error(authResult.error.message);
    }
    
    // Create user profile
    const profileResult = await userService.create({
      id: authResult.data.user.id,
      ...validatedData
    });
    
    return { success: true, data: profileResult.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### **Bulk User Import**
```typescript
const importUsers = async (users: CreateUserData[]) => {
  const results = [];
  
  for (const userData of users) {
    const result = await createUser(userData);
    results.push(result);
  }
  
  return {
    success: results.every(r => r.success),
    data: results.filter(r => r.success),
    errors: results.filter(r => !r.success)
  };
};
```

### **2. User Updates**

#### **Profile Updates**
```typescript
const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  // Validate updates
  const validatedUpdates = userProfileUpdateSchema.parse(updates);
  
  // Update profile
  const result = await userService.update(userId, validatedUpdates);
  
  // Recalculate profile completion
  if (result.success && result.data) {
    const completion = calculateProfileCompletion(result.data);
    await userService.update(userId, { profile_completion_percentage: completion });
  }
  
  return result;
};
```

#### **Role Changes**
```typescript
const updateUserRole = async (userId: string, newRole: UserRole) => {
  // Validate role change permissions
  if (!hasPermission(currentUser.role, 'manage_users')) {
    throw new Error('Insufficient permissions');
  }
  
  // Update role
  const result = await userService.update(userId, { role: newRole });
  
  // Update permissions
  if (result.success) {
    await updateUserPermissions(userId, newRole);
  }
  
  return result;
};
```

### **3. User Deletion**

#### **Soft Delete**
```typescript
const deactivateUser = async (userId: string) => {
  // Update status to inactive
  const result = await userService.update(userId, { 
    status: UserStatus.Inactive,
    deactivated_at: new Date().toISOString()
  });
  
  // Revoke active sessions
  if (result.success) {
    await supabase.auth.admin.deleteUser(userId);
  }
  
  return result;
};
```

#### **Hard Delete**
```typescript
const deleteUser = async (userId: string) => {
  // Validate deletion permissions
  if (!hasPermission(currentUser.role, 'manage_users')) {
    throw new Error('Insufficient permissions');
  }
  
  // Delete user profile
  const profileResult = await userService.delete(userId);
  
  // Delete from auth system
  const authResult = await supabase.auth.admin.deleteUser(userId);
  
  return {
    success: profileResult.success && !authResult.error,
    error: authResult.error?.message
  };
};
```

---

## 🔒 Security Features

### **1. Multi-Factor Authentication**

#### **MFA Setup**
```typescript
const setupMFA = async (userId: string) => {
  // Generate MFA secret
  const secret = generateMFASecret();
  
  // Store encrypted secret
  await userService.update(userId, { 
    mfa_secret: encryptSecret(secret),
    mfa_enabled: true
  });
  
  return { secret, qrCode: generateQRCode(secret) };
};
```

#### **MFA Verification**
```typescript
const verifyMFA = async (userId: string, token: string) => {
  const user = await userService.get(userId);
  if (!user.data?.mfa_secret) {
    throw new Error('MFA not enabled');
  }
  
  const secret = decryptSecret(user.data.mfa_secret);
  const isValid = verifyTOTP(secret, token);
  
  return isValid;
};
```

### **2. Session Management**

#### **Active Sessions**
```typescript
const getActiveSessions = async (userId: string) => {
  const { data: sessions } = await supabase.auth.admin.listSessions(userId);
  
  return sessions.map(session => ({
    id: session.id,
    created_at: session.created_at,
    last_activity: session.last_activity,
    device_info: session.device_info
  }));
};
```

#### **Session Revocation**
```typescript
const revokeSession = async (sessionId: string) => {
  const { error } = await supabase.auth.admin.deleteSession(sessionId);
  return { success: !error, error: error?.message };
};
```

---

## 📊 Analytics & Reporting

### **1. User Analytics**

#### **User Activity Tracking**
```typescript
const trackUserActivity = async (userId: string, activity: UserActivity) => {
  await analyticsService.track('user_activity', {
    user_id: userId,
    activity_type: activity.type,
    timestamp: new Date().toISOString(),
    metadata: activity.metadata
  });
};
```

#### **User Engagement Metrics**
```typescript
const getUserEngagement = async (userId: string) => {
  const activities = await analyticsService.getUserActivities(userId);
  
  return {
    login_frequency: calculateLoginFrequency(activities),
    feature_usage: calculateFeatureUsage(activities),
    session_duration: calculateAverageSessionDuration(activities),
    last_activity: getLastActivity(activities)
  };
};
```

### **2. Admin Reports**

#### **User Growth**
```typescript
const getUserGrowthReport = async (dateRange: DateRange) => {
  const users = await userService.list({ 
    created_at: { gte: dateRange.start, lte: dateRange.end }
  });
  
  return {
    total_users: users.data?.length || 0,
    new_users: users.data?.filter(u => 
      new Date(u.created_at).getTime() >= dateRange.start.getTime()
    ).length || 0,
    active_users: users.data?.filter(u => u.status === 'active').length || 0
  };
};
```

#### **Role Distribution**
```typescript
const getRoleDistribution = async () => {
  const users = await userService.list();
  
  const distribution = users.data?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  return distribution;
};
```

---

## 🎯 Best Practices

### **1. Data Management**
- **Profile Completion**: Track and encourage profile completion
- **Data Validation**: Validate all user data before storage
- **Privacy Compliance**: Ensure GDPR and privacy compliance
- **Data Retention**: Implement proper data retention policies

### **2. Security**
- **Role-Based Access**: Implement proper RBAC
- **Session Management**: Monitor and manage active sessions
- **MFA Support**: Enable multi-factor authentication
- **Audit Logging**: Log all user management activities

### **3. User Experience**
- **Onboarding**: Provide smooth onboarding experience
- **Self-Service**: Allow users to manage their own profiles
- **Notifications**: Keep users informed of important changes
- **Error Handling**: Provide clear error messages

### **4. Performance**
- **Caching**: Cache frequently accessed user data
- **Pagination**: Implement proper pagination for user lists
- **Optimistic Updates**: Use optimistic updates for better UX
- **Background Processing**: Handle heavy operations in background

---

## 🚀 Next Steps

1. **Complete MFA Implementation** - Add multi-factor authentication
2. **Enhance Analytics** - Add comprehensive user analytics
3. **Improve Onboarding** - Streamline user onboarding process
4. **Add Bulk Operations** - Support bulk user management
5. **Implement Auditing** - Add comprehensive audit trails

This user management system provides enterprise-grade features while maintaining simplicity and excellent developer experience.
