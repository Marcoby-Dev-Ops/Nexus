import { useCallback } from 'react';
import { useToast as useToastContext } from '@/shared/ui/components/Toast';

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

const mapVariantToType = (variant?: ToastVariant) => {
  switch (variant) {
    case 'destructive':
      return 'error' as const;
    case 'success':
      return 'success' as const;
    case 'warning':
      return 'warning' as const;
    case 'info':
      return 'info' as const;
    default:
      return 'info' as const;
  }
};

export function useToast() {
  const { toast: showToast, showToast: showToastAlias, dismiss } = useToastContext();

  const toast = useCallback(({ title, description, variant }: ToastInput) => {
    showToast({
      title: title ?? '',
      description: description ?? '',
      type: mapVariantToType(variant),
    });
  }, [showToast]);

  const showToastCompat = useCallback(({ title, description, variant }: ToastInput) => {
    showToastAlias({
      title: title ?? '',
      description: description ?? '',
      type: mapVariantToType(variant),
    });
  }, [showToastAlias]);

  return {
    toast,
    showToast: showToastCompat,
    dismiss,
    toasts: [],
  };
}
