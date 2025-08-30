# 🎯 **Forms & Validation Guide**

## 📋 **Overview**

This guide covers the new unified form patterns implemented in Nexus. We've standardized all forms to use `react-hook-form` + `zod` validation with consistent error handling and UX.

---

## 🏗️ **Architecture**

### **Core Components**
- **`useFormWithValidation`** - Unified form hook with validation and error handling
- **`FormField`** - Reusable form field component with consistent styling
- **`FormSection`** - Component for grouping related form fields
- **Validation Schemas** - Centralized zod schemas for all forms

### **File Structure**
```
src/shared/
├── hooks/
│   └── useFormWithValidation.ts          # Main form hook
├── components/
│   └── forms/
│       └── FormField.tsx                 # Form field component
└── validation/
    ├── schemas.ts                        # All validation schemas
    └── constants.ts                      # Validation rules & messages
```

---

## 🚀 **Quick Start**

### **1. Basic Form Example**
```tsx
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField, FormSection } from '@/shared/components/forms/FormField';
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';

const MyForm = () => {
  const { form, handleSubmit, isSubmitting, isValid, errors } = useFormWithValidation({
    schema: userProfileSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    onSubmit: async (data: UserProfileFormData) => {
      await updateUser(data);
    },
    successMessage: 'Profile updated successfully!',
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormSection title="Personal Information">
        <FormField
          name="firstName"
          label="First Name"
          control={form.control}
          error={errors.firstName?.message}
          required
        >
          {({ field }) => (
            <Input {...field} placeholder="Enter your first name" />
          )}
        </FormField>
      </FormSection>
      
      <Button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
};
```

### **2. Form with Multiple Fields**
```tsx
const AccountForm = () => {
  const { form, handleSubmit, isSubmitting } = useFormWithValidation({
    schema: userProfileSchema,
    defaultValues: { /* ... */ },
    onSubmit: async (data) => { /* ... */ },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title="Personal Information"
        description="Your basic personal details"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="firstName"
            label="First Name"
            control={form.control}
            error={errors.firstName?.message}
            required
          >
            {({ field }) => <Input {...field} />}
          </FormField>

          <FormField
            name="lastName"
            label="Last Name"
            control={form.control}
            error={errors.lastName?.message}
            required
          >
            {({ field }) => <Input {...field} />}
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Contact Information"
        description="Your email and phone details"
      >
        <FormField
          name="email"
          label="Email Address"
          control={form.control}
          error={errors.email?.message}
          hint="We'll use this for important updates"
        >
          {({ field }) => <Input {...field} type="email" />}
        </FormField>
      </FormSection>
    </form>
  );
};
```

---

## 📝 **Available Schemas**

### **User Profile Schema**
```typescript
import { userProfileSchema, type UserProfileFormData } from '@/shared/validation/schemas';

// Fields: firstName, lastName, displayName, jobTitle, company, role, 
// department, businessEmail, personalEmail, bio, location, website, phone
```

### **Company Profile Schema**
```typescript
import { companyProfileSchema, type CompanyProfileFormData } from '@/shared/validation/schemas';

// Fields: name, industry, size, website, description, clientbase_description
```

### **Authentication Schemas**
```typescript
import { loginSchema, signupSchema, resetPasswordSchema } from '@/shared/validation/schemas';

// Login: email, password
// Signup: email, password, confirmPassword, firstName, lastName, companyName
// Reset Password: email
```

### **Settings Schemas**
```typescript
import { notificationSettingsSchema, privacySettingsSchema } from '@/shared/validation/schemas';

// Notification: emailNotifications, pushNotifications, marketingEmails, weeklyDigest
// Privacy: profileVisibility, dataSharing, analyticsTracking
```

---

## 🎨 **FormField Props**

### **Basic Props**
```typescript
interface FormFieldProps {
  name: string;                    // Field name (must match schema)
  label?: string;                  // Field label
  control: Control;                // Form control from react-hook-form
  error?: string;                  // Error message
  required?: boolean;              // Show required indicator
  disabled?: boolean;              // Disable the field
  className?: string;              // Additional CSS classes
  children: (field: any) => React.ReactNode; // Field render function
  description?: string;            // Field description
  hint?: string;                   // Helper text (shows when no error)
}
```

### **Advanced Usage**
```tsx
<FormField
  name="email"
  label="Email Address"
  control={form.control}
  error={errors.email?.message}
  required
  description="We'll use this for important updates"
  hint="Enter your primary email address"
  className="col-span-2"
>
  {({ field, disabled }) => (
    <Input
      {...field}
      type="email"
      placeholder="you@example.com"
      disabled={disabled}
    />
  )}
</FormField>
```

---

## 🔧 **FormSection Props**

```typescript
interface FormSectionProps {
  title?: string;                  // Section title
  description?: string;            // Section description
  children: React.ReactNode;       // Form fields
  className?: string;              // Additional CSS classes
}
```

### **Usage Example**
```tsx
<FormSection
  title="Personal Information"
  description="Tell us about yourself"
  className="space-y-4"
>
  <FormField name="firstName" label="First Name" control={form.control}>
    {({ field }) => <Input {...field} />}
  </FormField>
  
  <FormField name="lastName" label="Last Name" control={form.control}>
    {({ field }) => <Input {...field} />}
  </FormField>
</FormSection>
```

---

## ⚡ **useFormWithValidation Hook**

### **Options**
```typescript
interface FormWithValidationOptions<T> {
  schema: z.ZodSchema<T>;                    // Zod validation schema
  defaultValues: T;                          // Form default values
  onSubmit: (data: T) => Promise<void>;      // Submit handler
  onError?: (error: Error) => void;          // Error handler
  successMessage?: string;                    // Success toast message
  errorMessage?: string;                      // Error toast message
}
```

### **Return Values**
```typescript
interface FormWithValidationReturn<T> {
  form: UseFormReturn<T>;                    // React Hook Form instance
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>; // Submit handler
  isSubmitting: boolean;                     // Loading state
  isValid: boolean;                          // Form validity
  errors: Record<string, any>;               // Form errors
}
```

---

## 🎯 **Migration Guide**

### **From Manual State**
```tsx
// ❌ Old Pattern
const [formData, setFormData] = useState({ firstName: '', lastName: '' });
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    await updateUser(formData);
    setMessage({ type: 'success', text: 'Updated!' });
  } catch (error) {
    setErrors({ general: error.message });
  } finally {
    setIsLoading(false);
  }
};

// ✅ New Pattern
const { form, handleSubmit, isSubmitting, errors } = useFormWithValidation({
  schema: userProfileSchema,
  defaultValues: { firstName: '', lastName: '' },
  onSubmit: async (data) => {
    await updateUser(data);
  },
  successMessage: 'Profile updated successfully!',
});
```

### **From Basic React Hook Form**
```tsx
// ❌ Old Pattern
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { firstName: '', lastName: '' },
});

const onSubmit = form.handleSubmit(async (data) => {
  try {
    await updateUser(data);
    toast({ title: 'Success', description: 'Updated!' });
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  }
});

// ✅ New Pattern
const { form, handleSubmit, isSubmitting } = useFormWithValidation({
  schema: userProfileSchema,
  defaultValues: { firstName: '', lastName: '' },
  onSubmit: async (data) => {
    await updateUser(data);
  },
  successMessage: 'Profile updated successfully!',
});
```

---

## 🧪 **Testing Patterns**

### **Form Testing**
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyForm } from './MyForm';

test('submits form with valid data', async () => {
  const mockSubmit = jest.fn();
  render(<MyForm onSubmit={mockSubmit} />);

  fireEvent.change(screen.getByLabelText(/first name/i), {
    target: { value: 'John' },
  });
  fireEvent.change(screen.getByLabelText(/last name/i), {
    target: { value: 'Doe' },
  });

  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
    });
  });
});
```

### **Validation Testing**
```tsx
test('shows validation errors for invalid data', async () => {
  render(<MyForm />);

  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
  });
});
```

---

## 🎨 **Styling & Theming**

### **Custom Styling**
```tsx
<FormField
  name="email"
  label="Email"
  control={form.control}
  className="bg-gray-50 p-4 rounded-lg"
>
  {({ field }) => (
    <Input
      {...field}
      className="border-2 border-blue-200 focus:border-blue-500"
    />
  )}
</FormField>
```

### **Responsive Layout**
```tsx
<FormSection>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <FormField name="firstName" label="First Name" control={form.control}>
      {({ field }) => <Input {...field} />}
    </FormField>
    
    <FormField name="lastName" label="Last Name" control={form.control}>
      {({ field }) => <Input {...field} />}
    </FormField>
    
    <FormField name="email" label="Email" control={form.control}>
      {({ field }) => <Input {...field} />}
    </FormField>
  </div>
</FormSection>
```

---

## 🚀 **Best Practices**

### **1. Always Use Schemas**
```tsx
// ✅ Good - Type-safe and validated
const { form, handleSubmit } = useFormWithValidation({
  schema: userProfileSchema,
  defaultValues: { firstName: '', lastName: '' },
  onSubmit: async (data) => {
    // data is fully typed and validated
    await updateUser(data);
  },
});

// ❌ Bad - No validation or type safety
const form = useForm();
```

### **2. Use FormField for Consistency**
```tsx
// ✅ Good - Consistent styling and error handling
<FormField
  name="email"
  label="Email"
  control={form.control}
  error={errors.email?.message}
>
  {({ field }) => <Input {...field} type="email" />}
</FormField>

// ❌ Bad - Inconsistent styling and error handling
<div>
  <label>Email</label>
  <input {...register('email')} />
  {errors.email && <span>{errors.email.message}</span>}
</div>
```

### **3. Group Related Fields**
```tsx
// ✅ Good - Organized and readable
<FormSection title="Personal Information">
  <FormField name="firstName" label="First Name" control={form.control}>
    {({ field }) => <Input {...field} />}
  </FormField>
  <FormField name="lastName" label="Last Name" control={form.control}>
    {({ field }) => <Input {...field} />}
  </FormField>
</FormSection>

<FormSection title="Contact Information">
  <FormField name="email" label="Email" control={form.control}>
    {({ field }) => <Input {...field} type="email" />}
  </FormField>
</FormSection>
```

### **4. Handle Loading States**
```tsx
// ✅ Good - Clear loading feedback
<Button type="submit" disabled={isSubmitting || !isValid}>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// ❌ Bad - No loading feedback
<Button type="submit">Save Changes</Button>
```

---

## 📚 **Examples**

### **Complete Form Example**
See `src/pages/admin/AccountSettings.tsx` for a complete implementation example.

### **Simple Contact Form**
```tsx
const ContactForm = () => {
  const { form, handleSubmit, isSubmitting } = useFormWithValidation({
    schema: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email'),
      message: z.string().min(10, 'Message must be at least 10 characters'),
    }),
    defaultValues: { name: '', email: '', message: '' },
    onSubmit: async (data) => {
      await sendContactForm(data);
    },
    successMessage: 'Message sent successfully!',
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        name="name"
        label="Name"
        control={form.control}
        error={form.formState.errors.name?.message}
        required
      >
        {({ field }) => <Input {...field} />}
      </FormField>

      <FormField
        name="email"
        label="Email"
        control={form.control}
        error={form.formState.errors.email?.message}
        required
      >
        {({ field }) => <Input {...field} type="email" />}
      </FormField>

      <FormField
        name="message"
        label="Message"
        control={form.control}
        error={form.formState.errors.message?.message}
        required
      >
        {({ field }) => <Textarea {...field} rows={4} />}
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};
```

---

## 🎯 **Next Steps**

1. **Migrate existing forms** to use the new patterns
2. **Add comprehensive tests** for form validation and submission
3. **Create form builder** for generating forms from schemas
4. **Add form analytics** to track user interactions
5. **Implement form persistence** for draft saving

**Ready to migrate your forms?** Start with the examples above and let me know if you need help with specific forms! 