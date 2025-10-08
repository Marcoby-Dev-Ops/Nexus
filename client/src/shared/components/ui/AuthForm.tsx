import React from 'react';
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { FormField } from '@/shared/components/forms/FormField';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { loginSchema, type LoginFormData } from '@/shared/validation/schemas';

interface AuthFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  mode?: 'login' | 'signup';
}

/**
 * Modernized AuthForm using unified form patterns
 * 
 * @example
 * <AuthForm
 *   onSubmit={async (email, password) => {
 *     await signIn(email, password);
 *   }}
 *   submitLabel="Sign In"
 *   mode="login"
 * />
 */
export const AuthForm: React.FC<AuthFormProps> = ({ 
  onSubmit, 
  loading = false, 
  error, 
  submitLabel = 'Sign In',
  mode = 'login'
}) => {
  const { form, handleSubmit, isSubmitting, errors } = useFormWithValidation({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async (data: LoginFormData) => {
      await onSubmit(data.email, data.password);
    },
    successMessage: mode === 'login' ? 'Signed in successfully!' : 'Account created successfully!',
  });

  const isFormLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} aria-label="Authentication form" className="space-y-4">
      <FormField
        name="email"
        label="Email Address"
        control={form.control}
        error={errors.email?.message || error}
        required
      >
        {({ field }) => (
          <Input
            {...field}
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            disabled={isFormLoading}
          />
        )}
      </FormField>

      <FormField
        name="password"
        label="Password"
        control={form.control}
        error={errors.password?.message}
        required
      >
        {({ field }) => (
          <Input
            {...field}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="Enter your password"
            disabled={isFormLoading}
          />
        )}
      </FormField>

      <Button
        type="submit"
        className="w-full"
        disabled={isFormLoading}
        aria-busy={isFormLoading}
      >
        {isFormLoading ? 'Loading...' : submitLabel}
      </Button>
    </form>
  );
};

export default AuthForm; 
