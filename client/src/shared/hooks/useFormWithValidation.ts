import { useMemo } from 'react';
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useToast } from '@/shared/components/ui/use-toast';

export interface FormWithValidationOptions<TFormValues extends FieldValues> {
  schema: z.ZodType<TFormValues, any, any>;
  defaultValues: TFormValues;
  onSubmit: (data: TFormValues) => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
}

export interface FormWithValidationReturn<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  handleSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isValid: boolean;
  errors: UseFormReturn<TFormValues>['formState']['errors'];
}

export const useFormWithValidation = <TFormValues extends FieldValues>(
  config: FormWithValidationOptions<TFormValues>
): FormWithValidationReturn<TFormValues> => {
  const { toast } = useToast();

  const form = useForm<TFormValues>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const submitHandler = form.handleSubmit(async (data: TFormValues) => {
    try {
      await config.onSubmit(data);
      if (config.successMessage) {
        toast({ title: config.successMessage });
      }
    } catch (err) {
      const message = config.errorMessage || (err instanceof Error ? err.message : 'An error occurred');
      toast({ title: 'Error', description: message, variant: 'destructive' });
      // Re-throw to allow callers to handle if needed
      throw err;
    }
  });

  const returnValue: FormWithValidationReturn<TFormValues> = useMemo(() => ({
    form,
    handleSubmit: submitHandler,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  }), [form, submitHandler]);

  return returnValue;
};
