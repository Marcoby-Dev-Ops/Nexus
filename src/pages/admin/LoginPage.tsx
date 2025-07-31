import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager.ts';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Card } from '@/shared/components/ui/Card.tsx';
import { Mail, Lock } from 'lucide-react';

// Import our new form patterns
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField } from '@/shared/components/forms/FormField';
import { Input } from '@/shared/components/ui/Input.tsx';
import { loginSchema, type LoginFormData } from '@/shared/validation/schemas';

/**
 * Modernized LoginPage using unified form patterns
 * 
 * Features:
 * - Email validation with real-time feedback
 * - Password field with proper autocomplete
 * - Unified error handling and loading states
 * - Consistent styling with other auth forms
 * - Automatic redirect on successful login
 */
export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const { redirectToDashboard } = useRedirectManager();

  const { form, handleSubmit, isSubmitting, errors } = useFormWithValidation({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async (data: LoginFormData) => {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        throw new Error(result.error);
      } else {
        // Debug logging
        if (import.meta.env.DEV) {
          console.log('✅ Login successful, redirecting to dashboard');
        }
        // Use centralized redirect manager
        redirectToDashboard();
      }
    },
    successMessage: 'Welcome back! Redirecting to dashboard...',
  });

  const isFormLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <FormField
              name="email"
              label="Email Address"
              control={form.control}
              error={errors.email?.message}
              required
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

            {/* Password Field */}
            <FormField
              name="password"
              label="Password"
              control={form.control}
              error={errors.password?.message}
              required
            >
              {({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    type="password"
                    placeholder="Password"
                    disabled={isFormLoading}
                    className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                    autoComplete="current-password"
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
            disabled={isFormLoading}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-200"
          >
            {isFormLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link
              to="/password-reset"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
} 