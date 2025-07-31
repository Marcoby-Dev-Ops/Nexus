import React from 'react';
import { Controller } from 'react-hook-form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/shared/components/ui/Label';
import { cn } from '@/shared/utils/styles';

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  control: Control<TFieldValues>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: (field: any) => React.ReactNode;
  description?: string;
  hint?: string;
}

/**
 * Reusable form field component with consistent styling and error handling
 * 
 * @example
 * ```tsx
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   control={control}
 *   error={errors.email?.message}
 *   required
 * >
 *   {({ field }) => (
 *     <Input
 *       {...field}
 *       type="email"
 *       placeholder="Enter your email"
 *     />
 *   )}
 * </FormField>
 * ```
 */
export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  control,
  error,
  required = false,
  disabled = false,
  className,
  children,
  description,
  hint,
}: FormFieldProps<TFieldValues, TName>) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            {children({
              ...field,
              disabled: disabled || fieldState.disabled,
            })}
            
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            
            {hint && !error && (
              <p className="text-sm text-muted-foreground">{hint}</p>
            )}
          </div>
        )}
      />
    </div>
  );
};

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form section component for grouping related fields
 * 
 * @example
 * ```tsx
 * <FormSection
 *   title="Personal Information"
 *   description="Tell us about yourself"
 * >
 *   <FormField name="firstName" label="First Name" control={control}>
 *     {({ field }) => <Input {...field} />}
 *   </FormField>
 *   <FormField name="lastName" label="Last Name" control={control}>
 *     {({ field }) => <Input {...field} />}
 *   </FormField>
 * </FormSection>
 * ```
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold leading-none">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}; 