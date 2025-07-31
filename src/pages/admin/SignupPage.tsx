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
      const result = await signUp(data.email, data.password);
      if (result.error) {
        throw new Error(result.error);
      }
    },
    successMessage: 'Account created successfully! Welcome to Nexus!',
  });

  const isFormLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up to get started with Nexus
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="firstName"
                label="First Name"
                control={form.control}
                error={errors.firstName?.message}
                required
              >
                {({ field }) => (
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="First name"
                      disabled={isFormLoading}
                      className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                      autoComplete="given-name"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </FormField>

              <FormField
                name="lastName"
                label="Last Name"
                control={form.control}
                error={errors.lastName?.message}
                required
              >
                {({ field }) => (
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Last name"
                      disabled={isFormLoading}
                      className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                      autoComplete="family-name"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </FormField>
            </div>

            {/* Company Name */}
            <FormField
              name="companyName"
              label="Company Name"
              control={form.control}
              error={errors.companyName?.message}
              required
            >
              {({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="Your company name"
                    disabled={isFormLoading}
                    className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                    autoComplete="organization"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              )}
            </FormField>

            {/* Email Field */}
            <FormField
              name="email"
              label="Email Address"
              control={form.control}
              error={errors.email?.message}
              required
              hint="We'll use this for important updates"
            >
              {({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    type="email"
                    placeholder="Email address"
                    disabled={isFormLoading}
                    className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                    autoComplete="email"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              )}
            </FormField>

            {/* Password Fields */}
            <FormField
              name="password"
              label="Password"
              control={form.control}
              error={errors.password?.message}
              required
              hint="Must be at least 8 characters long"
            >
              {({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    type="password"
                    placeholder="Password"
                    disabled={isFormLoading}
                    className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                    autoComplete="new-password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              )}
            </FormField>

            <FormField
              name="confirmPassword"
              label="Confirm Password"
              control={form.control}
              error={errors.confirmPassword?.message}
              required
              hint="Please confirm your password"
            >
              {({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    type="password"
                    placeholder="Confirm password"
                    disabled={isFormLoading}
                    className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                    autoComplete="new-password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              )}
            </FormField>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isFormLoading}
          >
            {isFormLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
} 