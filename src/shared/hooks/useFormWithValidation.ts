import { useState, useCallback } from 'react';
import type { FieldValues } from 'react-hook-form';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationConfig<T extends FieldValues> {
  onSubmit: (data: T) => Promise<void> | void;
  onError?: (errors: ValidationError[]) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useFormWithValidation = <T extends FieldValues>(
  config: FormValidationConfig<T>
) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((data: T): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    
    // Basic validation - can be extended with more complex validation logic
    Object.entries(data).forEach(([field, value]) => {
      if (value === undefined || value === null || value === '') {
        validationErrors.push({
          field,
          message: `${field} is required`,
        });
      }
    });
    
    return validationErrors;
  }, []);

  const handleSubmit = useCallback(async (data: T) => {
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // Validate form data
      const validationErrors = validateForm(data);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        config.onError?.(validationErrors);
        return;
      }
      
      // Submit form data
      await config.onSubmit(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setErrors([{ field: 'form', message: errorMessage }]);
      config.onError?.([{ field: 'form', message: errorMessage }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [config, validateForm]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors.find(error => error.field === fieldName)?.message;
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    isSubmitting,
    handleSubmit,
    getFieldError,
    clearErrors,
  };
}; 