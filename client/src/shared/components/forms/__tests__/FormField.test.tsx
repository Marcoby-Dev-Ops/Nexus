import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '../FormField';
import { Input } from '@/shared/components/ui/Input';

// Test schema
const testSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component that uses FormField
const TestForm = ({ 
  fieldName, 
  label, 
  error, 
  required = false,
  disabled = false,
  description,
  hint 
}: {
  fieldName: keyof TestFormData;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  hint?: string;
}) => {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: { email: '', name: '' },
  });

  return (
    <FormField
      name={fieldName}
      label={label}
      control={form.control}
      error={error}
      required={required}
      disabled={disabled}
      description={description}
      hint={hint}
    >
      {({ field }) => (
        <Input
          {...field}
          placeholder={`Enter ${fieldName}`}
        />
      )}
    </FormField>
  );
};

describe('FormField', () => {
  it('should render with label', () => {
    render(<TestForm fieldName="email" label="Email Address" />);
    
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('should show required indicator when required is true', () => {
    render(<TestForm fieldName="email" label="Email Address" required />);
    
    const label = screen.getByText('Email Address');
    expect(label).toBeInTheDocument();
    expect(label.parentElement).toHaveTextContent('*');
  });

  it('should display error message when error is provided', () => {
    const errorMessage = 'This field is required';
    render(<TestForm fieldName="email" label="Email" error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('text-destructive');
  });

  it('should display description when provided', () => {
    const description = 'We will use this for important updates';
    render(<TestForm fieldName="email" label="Email" description={description} />);
    
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('should display hint when provided and no error', () => {
    const hint = 'Enter your primary email address';
    render(<TestForm fieldName="email" label="Email" hint={hint} />);
    
    expect(screen.getByText(hint)).toBeInTheDocument();
  });

  it('should not display hint when error is present', () => {
    const hint = 'Enter your primary email address';
    const error = 'Invalid email';
    
    render(<TestForm fieldName="email" label="Email" hint={hint} error={error} />);
    
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.queryByText(hint)).not.toBeInTheDocument();
  });

  it('should disable input when disabled is true', () => {
    render(<TestForm fieldName="email" label="Email" disabled />);
    
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toBeDisabled();
  });

  it('should render without label when label is not provided', () => {
    render(<TestForm fieldName="email" />);
    
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('should handle form validation errors', async () => {
    const TestFormWithValidation = () => {
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
        defaultValues: { email: 'invalid-email', name: 'a' },
        mode: 'onChange',
      });

      return (
        <form>
          <FormField
            name="email"
            label="Email"
            control={form.control}
            error={form.formState.errors.email?.message}
          >
            {({ field }) => <Input {...field} />}
          </FormField>
          <FormField
            name="name"
            label="Name"
            control={form.control}
            error={form.formState.errors.name?.message}
          >
            {({ field }) => <Input {...field} />}
          </FormField>
        </form>
      );
    };

    render(<TestFormWithValidation />);

    // Wait for validation errors to appear
    await screen.findByText('Please enter a valid email');
    await screen.findByText('Name must be at least 2 characters');
  });

  it('should apply custom className', () => {
    const TestFormWithClassName = () => {
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
        defaultValues: { email: '', name: '' },
      });

      return (
        <FormField
          name="email"
          label="Email"
          control={form.control}
          className="custom-class"
        >
          {({ field }) => <Input {...field} />}
        </FormField>
      );
    };

    render(<TestFormWithClassName />);
    
    const fieldContainer = screen.getByText('Email').closest('div');
    expect(fieldContainer).toHaveClass('custom-class');
  });

  it('should handle field state changes', () => {
    const TestFormWithState = () => {
      const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
        defaultValues: { email: '', name: '' },
      });

      return (
        <FormField
          name="email"
          label="Email"
          control={form.control}
        >
          {({ field, disabled }) => (
            <Input
              {...field}
              disabled={disabled}
              data-testid="email-input"
            />
          )}
        </FormField>
      );
    };

    render(<TestFormWithState />);
    
    const input = screen.getByTestId('email-input');
    expect(input).toBeInTheDocument();
  });
}); 
