import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormWithValidation } from '../useFormWithValidation';
import { z } from 'zod';
import { useToast } from '@/shared/components/ui/use-toast';

// Mock the toast hook
jest.mock('@/shared/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

const mockToast = {
  toast: jest.fn(),
};

(useToast as jest.Mock).mockReturnValue(mockToast);

// Test schema
const testSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type TestFormData = z.infer<typeof testSchema>;

describe('useFormWithValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const defaultValues = {
      email: 'test@example.com',
      password: 'password123',
    };

    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues,
        onSubmit: jest.fn(),
      })
    );

    expect(result.current.form.getValues()).toEqual(defaultValues);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(true);
  });

  it('should validate form on change', async () => {
    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' },
        onSubmit: jest.fn(),
      })
    );

    // Initially invalid
    expect(result.current.isValid).toBe(false);

    // Set valid values
    act(() => {
      result.current.form.setValue('email', 'test@example.com');
      result.current.form.setValue('password', 'password123');
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });
  });

  it('should show validation errors for invalid data', async () => {
    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: 'invalid-email', password: 'short' },
        onSubmit: jest.fn(),
      })
    );

    await waitFor(() => {
      const errors = result.current.errors;
      expect(errors.email?.message).toBe('Please enter a valid email');
      expect(errors.password?.message).toBe('Password must be at least 8 characters');
    });
  });

  it('should call onSubmit with validated data', async () => {
    const mockOnSubmit = jest.fn();
    const testData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: testData,
        onSubmit: mockOnSubmit,
        successMessage: 'Form submitted successfully!',
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(testData);
    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Form submitted successfully!',
    });
  });

  it('should handle submission errors', async () => {
    const mockError = new Error('Submission failed');
    const mockOnSubmit = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Submission failed',
      variant: 'destructive',
    });
  });

  it('should handle custom error messages', async () => {
    const mockError = new Error('Custom error message');
    const mockOnSubmit = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();

    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
        onError: mockOnError,
        errorMessage: 'Custom error occurred',
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnError).toHaveBeenCalledWith(mockError);
    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Custom error message',
      variant: 'destructive',
    });
  });

  it('should handle loading states correctly', async () => {
    let resolveSubmit: (value: any) => void;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    const mockOnSubmit = jest.fn().mockReturnValue(submitPromise);

    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: mockOnSubmit,
      })
    );

    // Start submission
    act(() => {
      result.current.handleSubmit();
    });

    // Should be loading
    expect(result.current.isSubmitting).toBe(true);

    // Resolve the promise
    act(() => {
      resolveSubmit!(undefined);
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('should reset form when reset is called', () => {
    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: 'test@example.com', password: 'password123' },
        onSubmit: jest.fn(),
      })
    );

    // Change values
    act(() => {
      result.current.form.setValue('email', 'new@example.com');
      result.current.form.setValue('password', 'newpassword');
    });

    // Reset form
    act(() => {
      result.current.form.reset();
    });

    expect(result.current.form.getValues()).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle form submission with invalid data', async () => {
    const mockOnSubmit = jest.fn();

    const { result } = renderHook(() =>
      useFormWithValidation({
        schema: testSchema,
        defaultValues: { email: '', password: '' },
        onSubmit: mockOnSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should not call onSubmit when form is invalid
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 
