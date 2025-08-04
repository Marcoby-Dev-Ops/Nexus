import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Card } from '@/shared/components/ui/Card.tsx';
import { Mail, Lock, User } from 'lucide-react';

// Import our new form patterns
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField } from '@/shared/components/forms/FormField';
import { Input } from '@/shared/components/ui/Input.tsx';
import { signupSchema, type SignupFormData } from '@/shared/validation/schemas';

/**
 * Modernized SignupPage using unified form patterns
 * 
 * Features:
 * - Email validation with real-time feedback
 * - Password strength requirements
 * - Password confirmation matching
 * - Unified error handling and loading states
 * - Consistent styling with other forms
 */
export default function SignupPage() {
  const { signUp, loading } = useAuth();

  const { form, handleSubmit, isSubmitting, errors } = useFormWithValidation({
    schema: signupSchema,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      companyName: '',
    },
    onSubmit: async (data: SignupFormData) => {
      const result = await signUp(data.email, data.password, data.firstName, data.lastName);
      if (result.error) {
        throw new Error(result.error);
      }
    },
    successMessage: 'Account created successfully! Welcome to Nexus!',
  });

  const isFormLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-2">
              Start your journey with Nexus
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                label="First Name"
                placeholder="John"
                icon={<User className="w-4 h-4" />}
                error={errors.firstName}
              />
              <FormField
                control={form.control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                icon={<User className="w-4 h-4" />}
                error={errors.lastName}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email}
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              type="password"
              placeholder="Create a strong password"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword}
            />

            <FormField
              control={form.control}
              name="companyName"
              label="Company Name (Optional)"
              placeholder="Your Company"
              icon={<User className="w-4 h-4" />}
              error={errors.companyName}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isFormLoading}
            >
              {isFormLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Link to="/" className="text-primary hover:text-primary/80">
                ← Back to home page
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 