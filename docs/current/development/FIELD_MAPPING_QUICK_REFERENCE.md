# Field Mapping Quick Reference

Quick reference for common field mappings and their intended purposes.

## 🔑 Key Field Relationships

### User Identity
```
auth.users.id = user_profiles.id = user_profiles.user_id
```

### Company Relationships
```
user_profiles.company_id → companies.id
user_profiles.company (string) = companies.name
```

### Email Fields
```
user_profiles.email (primary) ← auth.users.email
user_profiles.business_email (work) ← AccountSettings
user_profiles.personal_email (personal) ← AccountSettings
```

## 📝 Common Field Mappings

### User Profile Fields

| Frontend Field | Database Field | Purpose | Default |
|----------------|----------------|---------|---------|
| `firstName` | `first_name` | First name | null |
| `lastName` | `last_name` | Last name | null |
| `displayName` | `display_name` | Display name | null |
| `jobTitle` | `job_title` | Job title | null |
| `company` | `company` | Company name (string) | null |
| `role` | `role` | User role | 'user' |
| `department` | `department` | Department | null |
| `businessEmail` | `business_email` | Work email | null |
| `personalEmail` | `personal_email` | Personal email | null |
| `website` | `linkedin_url` | LinkedIn/Website | null |
| `phone` | `phone` | Phone number | null |
| `location` | `location` | Location | null |
| `bio` | `bio` | Biography | null |

### Company Fields

| Frontend Field | Database Field | Purpose | Default |
|----------------|----------------|---------|---------|
| `name` | `name` | Company name | Required |
| `domain` | `domain` | Company domain | null |
| `website` | `website` | Company website | null |
| `industry` | `industry` | Industry | null |
| `size` | `size` | Company size | null |
| `description` | `description` | Company description | null |
| `employeeCount` | `employee_count` | Employee count | null |

## 🎯 Field Validation Rules

### Required Fields
- `user_profiles.id` (from auth)
- `user_profiles.user_id` (must match id)
- `companies.name`

### Enum Values
- `role`: 'owner', 'admin', 'manager', 'user'
- `department`: 'executive', 'sales', 'marketing', 'operations', 'finance', 'hr', 'it', 'other'
- `company_size`: 'startup', 'small', 'medium', 'large', 'enterprise'

### Auto-Calculated Fields
- `full_name`: `first_name + ' ' + last_name`
- `profile_completion_percentage`: Calculated from filled fields
- `updated_at`: Auto-set on changes

## 🔄 Common Operations

### Creating User Profile
```typescript
const profile = {
  id: userId,
  user_id: userId, // Must match id
  email: user.email,
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
```

### Updating User Profile
```typescript
const updates = {
  first_name: formData.firstName,
  last_name: formData.lastName,
  full_name: `${formData.firstName} ${formData.lastName}`.trim(),
  business_email: formData.businessEmail,
  personal_email: formData.personalEmail,
  updated_at: new Date().toISOString()
};
```

### Creating Company
```typescript
const company = {
  name: data.name,
  domain: data.domain,
  industry: data.industry,
  size: data.size,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
```

## ⚠️ Common Pitfalls

### Don't Do This
```typescript
// ❌ Wrong - user_id should match id
const profile = { id: userId, user_id: null };

// ❌ Wrong - full_name should be calculated
const profile = { first_name: 'John', last_name: 'Doe', full_name: 'John Doe' };

// ❌ Wrong - role should be enum
const profile = { role: 'founder' }; // Should be 'owner'
```

### Do This Instead
```typescript
// ✅ Correct - user_id matches id
const profile = { id: userId, user_id: userId };

// ✅ Correct - full_name auto-calculated
const profile = { 
  first_name: 'John', 
  last_name: 'Doe',
  full_name: `${firstName} ${lastName}`.trim()
};

// ✅ Correct - role uses enum
const profile = { role: 'owner' };
```

## 📊 Status Tracking

### Current Status (2025-01-22)
- ✅ `user_id` consistency fixed
- ✅ `full_name` calculation fixed
- ✅ `role` and `department` set correctly
- ❌ `business_email` and `personal_email` need implementation
- ❓ Company fields need organization setup completion

### Next Steps
1. Complete email fields in AccountSettings
2. Finish organization setup flow
3. Add data validation constraints
4. Update profile completion calculation

---

*For detailed field documentation, see `DATABASE_FIELD_DICTIONARY.md`* 