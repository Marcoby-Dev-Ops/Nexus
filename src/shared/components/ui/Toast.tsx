import React from "react";
import { useToast as useToastHook } from '@/shared/components/ui/use-toast';

export const useToast = useToastHook;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add your toast logic here later (e.g., context, toasts, etc.)
  return <>{children}</>;
}; 