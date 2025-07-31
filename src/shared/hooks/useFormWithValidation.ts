import { useForm } from 'react-hook-form';
import type { UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/shared/components/ui/use-toast';

export interface FormWithValidationOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface FormWithValidationReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, any>;
}

/**
 * Unified form hook with validation, error handling, and loading states
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useFormWithValidation({
 *   schema: userProfileSchema,
 *   defaultValues: { firstName: '', lastName: '', email: '' },
 *   onSubmit: async (data) => {
 *     await updateUserProfile(data);
 *   },
 *   successMessage: 'Profile updated successfully!',
 * });
 * ```
 */
export const useFormWithValidation = <T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onError,
  successMessage = 'Form submitted successfully!',
  errorMessage = 'Something went wrong. Please try again.',
}: FormWithValidationOptions<T>): FormWithValidationReturn<T> => {
  const { toast } = useToast();
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange', // Validate on change for better UX
  });

  const handleSubmit = form.handleSubmit(async (data: T) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: successMessage,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      onError?.(error as Error);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  };
}; 