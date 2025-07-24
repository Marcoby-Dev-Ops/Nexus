# Nexus Database Documentation

This directory contains comprehensive documentation for the Nexus database schema, field mappings, and development guidelines.

## 📚 Documentation Files

### Core Documentation
- **[DATABASE_FIELD_DICTIONARY.md](./DATABASE_FIELD_DICTIONARY.md)** - Complete field reference with status tracking
- **[FIELD_MAPPING_QUICK_REFERENCE.md](./FIELD_MAPPING_QUICK_REFERENCE.md)** - Quick lookup for common field mappings
- **[README.md](./README.md)** - This file, explaining how to use the documentation

### TypeScript Interfaces
- **[../src/core/types/database-field-mappings.ts](../src/core/types/database-field-mappings.ts)** - Type-safe field mappings and validation utilities

## 🎯 How to Use This Documentation

### For New Developers

1. **Start with the Quick Reference** - Read `FIELD_MAPPING_QUICK_REFERENCE.md` to understand common field mappings
2. **Check the Full Dictionary** - Use `DATABASE_FIELD_DICTIONARY.md` for detailed field information
3. **Use TypeScript Interfaces** - Import from `database-field-mappings.ts` for type safety

### For Database Changes

1. **Check the Dictionary** - Verify field purposes and relationships
2. **Update Documentation** - Modify the dictionary when adding new fields
3. **Use TypeScript Interfaces** - Ensure type safety with the provided interfaces
4. **Follow Mapping Rules** - Adhere to the established field mapping conventions

### For Frontend Development

1. **Use Field Mappings** - Reference the quick reference for form field names
2. **Import TypeScript Interfaces** - Use the provided interfaces for type safety
3. **Follow Validation Rules** - Use the validation utilities for data consistency
4. **Handle Null Values** - Check the dictionary for field default values

## 🔧 Quick Start Examples

### Creating a User Profile

```typescript
import { UserProfileFields, validateUserIdConsistency, calculateFullName } from '@/core/types/database-field-mappings';

const createUserProfile = (userId: string, userData: any): UserProfileFields => {
  const profile: UserProfileFields = {
    id: userId,
    user_id: userId, // Must match id
    email: userData.email,
    first_name: userData.firstName,
    last_name: userData.lastName,
    full_name: calculateFullName(userData.firstName, userData.lastName),
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Validate consistency
  if (!validateUserIdConsistency(profile)) {
    throw new Error('user_id must match id');
  }

  return profile;
};
```

### Updating User Profile

```typescript
import { mapFormToDatabase } from '@/core/types/database-field-mappings';

const updateUserProfile = (formData: any) => {
  const updates = {
    [mapFormToDatabase('firstName')]: formData.firstName,
    [mapFormToDatabase('lastName')]: formData.lastName,
    [mapFormToDatabase('businessEmail')]: formData.businessEmail,
    [mapFormToDatabase('personalEmail')]: formData.personalEmail,
    updated_at: new Date().toISOString()
  };

  return updates;
};
```

### Validating Data

```typescript
import { isValidRole, isValidDepartment } from '@/core/types/database-field-mappings';

const validateProfileData = (data: any) => {
  const errors = [];

  if (!isValidRole(data.role)) {
    errors.push('Invalid role value');
  }

  if (data.department && !isValidDepartment(data.department)) {
    errors.push('Invalid department value');
  }

  return errors;
};
```

## 📊 Current Status

### ✅ Completed
- User profile field consistency fixed
- Role and department properly set
- Full name calculation implemented
- TypeScript interfaces created
- Documentation structure established

### ❌ Pending
- Business email and personal email implementation
- Company profile completion
- Organization setup flow completion
- Data validation constraints

### 🔄 Ongoing
- Profile completion calculation updates
- Migration script creation
- Documentation maintenance

## 🚀 Best Practices

### 1. Always Check the Dictionary
Before adding new fields or modifying existing ones, consult the dictionary to understand:
- Field purpose and relationships
- Where the field should be set
- Default values and constraints
- Current implementation status

### 2. Use TypeScript Interfaces
Import and use the provided TypeScript interfaces for:
- Type safety
- IntelliSense support
- Compile-time error checking
- Consistent field naming

### 3. Follow Mapping Rules
Adhere to the established mapping rules:
- `user_id` must always match `id`
- `full_name` should be calculated from `first_name + last_name`
- Use proper enum values for roles and departments
- Handle null values appropriately

### 4. Update Documentation
When making changes:
- Update the dictionary with new fields
- Modify the quick reference if needed
- Update TypeScript interfaces
- Document breaking changes

## 🔍 Troubleshooting

### Common Issues

1. **Field Not Found** - Check the dictionary for correct field names
2. **Type Errors** - Use the TypeScript interfaces for type safety
3. **Data Inconsistency** - Use validation utilities to check data
4. **Missing Fields** - Check the status tracking in the dictionary

### Getting Help

1. **Check the Quick Reference** - For common field mappings
2. **Consult the Dictionary** - For detailed field information
3. **Use TypeScript Interfaces** - For type safety and IntelliSense
4. **Review Examples** - For implementation patterns

## 📝 Contributing

When contributing to the database schema:

1. **Update Documentation** - Modify the dictionary and quick reference
2. **Add TypeScript Interfaces** - Create interfaces for new fields
3. **Follow Conventions** - Use established naming and mapping patterns
4. **Test Changes** - Verify data consistency and type safety
5. **Document Changes** - Update this README with new information

---

*Last updated: 2025-01-22*
*Maintained by: Development Team*
