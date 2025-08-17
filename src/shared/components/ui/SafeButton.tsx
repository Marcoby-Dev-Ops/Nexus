import React from 'react';
import { Button, type ButtonProps } from './Button';
import { ButtonErrorBoundary } from './ButtonErrorBoundary';
import { logger } from '@/shared/utils/logger';

/**
 * SafeButton component that wraps Button with error boundary
 * Prevents button errors from crashing the application
 */
export const SafeButton: React.FC<ButtonProps> = (props) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('SafeButton caught an error', { 
      error: error.message, 
      componentStack: errorInfo.componentStack,
      buttonProps: props 
    });
  };

  return (
    <ButtonErrorBoundary onError={handleError}>
      <Button {...props} />
    </ButtonErrorBoundary>
  );
};

export default SafeButton;
