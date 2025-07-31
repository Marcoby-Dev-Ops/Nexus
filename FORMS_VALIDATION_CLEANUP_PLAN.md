# Forms & Validation Layer Cleanup Plan

## 🎯 **Current State Analysis**

### ✅ **What's Working Well**
- **Modern Stack**: Using `react-hook-form` + `zod` + `@hookform/resolvers` (good!)
- **Consistent Validation**: Zod schemas provide type safety
- **UI Components**: Solid base components in `src/shared/components/ui/`
- **Toast System**: Unified notification system in place

### 🚨 **Issues Found**

#### 1. **Inconsistent Form Patterns**
- **Mixed Approaches**: Some forms use `react-hook-form` (CompanyProfilePage), others use manual state (AccountSettings)
- **Legacy Forms**: `AuthForm.tsx` uses basic HTML forms instead of the modern stack
- **Missing Reusability**: No shared form hooks or patterns

#### 2. **Validation Inconsistencies**
- **No Centralized Schemas**: Validation rules scattered across components
- **Duplicate Logic**: Similar validation patterns repeated
- **Missing Error Handling**: Inconsistent error display patterns

#### 3. **Component Library Gaps**
- **Basic Form Components**: `Form.tsx` is too simple for complex forms
- **Missing Form Hooks**: No custom hooks for common form patterns
- **No Form Builder**: No way to generate forms from schemas

---

## 🛠️ **Cleanup Strategy**

### **Phase 1: Standardize Form Patterns**

#### 1.1 Create Unified Form Hooks
```typescript
// src/shared/hooks/useFormWithValidation.ts
export const useFormWithValidation = <T extends z.ZodType>(
  schema: T,
  defaultValues: z.infer<T>,
  onSubmit: (data: z.infer<T>) => Promise<void>
) => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Unified error handling
    }
  });
  
  return { form, handleSubmit };
};
```

#### 1.2 Create Form Field Components
```typescript
// src/shared/components/forms/FormField.tsx
export const FormField = <T extends z.ZodType>({
  name,
  label,
  control,
  error,
  children,
  ...props
}: FormFieldProps<T>) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            {children(field)}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      />
    </div>
  );
};
```

### **Phase 2: Centralize Validation Schemas**

#### 2.1 Create Validation Schemas
```typescript
// src/shared/validation/schemas.ts
export const userProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  // ... other fields
});

export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Industry is required'),
  // ... other fields
});
```

#### 2.2 Create Validation Constants
```typescript
// src/shared/validation/constants.ts
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
} as const;
```

### **Phase 3: Migrate Existing Forms**

#### 3.1 High Priority Migrations
1. **AccountSettings.tsx** → Convert to `react-hook-form` + zod
2. **AuthForm.tsx** → Modernize with new patterns
3. **SignupPage.tsx** → Ensure consistent validation

#### 3.2 Form Migration Checklist
- [ ] Replace manual state with `useForm`
- [ ] Add proper TypeScript types
- [ ] Implement consistent error handling
- [ ] Add loading states
- [ ] Test form submission flows

---

## 📋 **Implementation Steps**

### **Step 1: Create Foundation (Week 1)**
1. Create `src/shared/hooks/useFormWithValidation.ts`
2. Create `src/shared/components/forms/FormField.tsx`
3. Create `src/shared/validation/schemas.ts`
4. Create `src/shared/validation/constants.ts`

### **Step 2: Migrate Core Forms (Week 2)**
1. Migrate `AccountSettings.tsx` to new patterns
2. Update `AuthForm.tsx` to use modern stack
3. Ensure `CompanyProfilePage.tsx` follows new patterns

### **Step 3: Add Form Builder (Week 3)**
1. Create form generator from schemas
2. Add form validation testing utilities
3. Create form documentation and examples

### **Step 4: Testing & Documentation (Week 4)**
1. Add comprehensive form tests
2. Update developer documentation
3. Create form usage examples

---

## 🎯 **Success Metrics**

### **Before Cleanup**
- ❌ Mixed form patterns (manual state + react-hook-form)
- ❌ Scattered validation logic
- ❌ Inconsistent error handling
- ❌ No reusable form components

### **After Cleanup**
- ✅ All forms use `react-hook-form` + `zod`
- ✅ Centralized validation schemas
- ✅ Consistent error handling and UX
- ✅ Reusable form components and hooks
- ✅ Type-safe form handling
- ✅ Easy to add new forms

---

## 🚀 **Next Steps**

1. **Start with Phase 1**: Create the foundation hooks and components
2. **Migrate one form at a time**: Begin with AccountSettings (most complex)
3. **Test thoroughly**: Ensure no regressions in user flows
4. **Document patterns**: Create examples for the team

**Ready to begin Phase 1?** Let me know and I'll start implementing the foundation components! 