// Core UI Components
export { Button } from './Button';
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './Card';
export { Input } from './Input';
export { Label } from './Label';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
export { Separator } from './Separator';
export { Alert, AlertDescription } from './Alert';
export { Badge } from './Badge';
export { Textarea } from './Textarea';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
export { Progress } from './Progress';
export { Spinner } from './Spinner';
export { default as Skeleton } from './Skeleton';
export { Avatar } from './Avatar';
export { AuthForm } from './AuthForm';
export { Checkbox } from './Checkbox';
export { RadioGroup, RadioGroupItem } from './RadioGroup';
export { Switch } from './Switch';
export { Dialog } from './Dialog';

// Missing exports for 1.0
export { default as Breadcrumbs } from './Breadcrumbs';
export { default as Dropdown } from './Dropdown';
export { default as Form, FormField } from './Form';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip';

// Types
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { InputProps } from './Input';
export type { LabelProps } from './Label';
export type { SelectProps, SelectTriggerProps, SelectValueProps, SelectContentProps, SelectItemProps } from './Select';
export type { SeparatorProps } from './Separator';
export type { AlertProps } from './Alert';
export type { BadgeProps } from './Badge';
export type { TextareaProps } from './Textarea';
export type { SpinnerProps } from './Spinner';
export type { AvatarProps } from './Avatar';

// Additional component types
export type { BreadcrumbItem, BreadcrumbsProps } from './Breadcrumbs';
export type { DropdownItem, DropdownProps } from './Dropdown';
export type { FormProps, FormFieldProps } from './Form';
export type { RadioGroupProps, RadioGroupItemProps } from './RadioGroup';
// Modal and Table types are exported with their components
// export type { TooltipProps } from '@shared/components/ui/Tooltip';

// Re-export hooks
export { useToast } from './use-toast';

// Re-export styling utilities
export {
  cn,
  getButtonClasses,
  getCardClasses,
  getTextClasses,
  buttonVariants,
  buttonSizes,
  cardVariants,
  textVariants,
  statusColors,
  statusBackgrounds,
  interactiveStyles,
} from '@/shared/utils/styles'; 