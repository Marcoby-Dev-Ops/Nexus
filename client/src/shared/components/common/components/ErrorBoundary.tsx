import React, { useState, useEffect } from 'react';
import { logger } from '@/shared/utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Functional Error Boundary Component
 * Replaces class-based error boundary with hooks-based implementation
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback: FallbackComponent 
}) => {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null
  });

  useEffect(() => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      logger.error('ErrorBoundary caught an error', { error, errorInfo });
      setState({ hasError: true, error });
    };

    // Add global error handler
    window.addEventListener('error', (event) => {
      handleError(event.error, { componentStack: '' });
    });

    return () => {
      window.removeEventListener('error', (event) => {
        handleError(event.error, { componentStack: '' });
      });
    };
  }, []);

  const handleRetry = () => {
    setState({ hasError: false, error: null });
  };

  if (state.hasError) {
    if (FallbackComponent) {
      return <FallbackComponent error={state.error!} retry={handleRetry} />;
    }

    return (
      <div className="p-6 bg-destructive/5 border border-red-200 rounded text-destructive text-center">
        <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
        <p className="mb-4">An unexpected error occurred. Please try again.</p>
        <button
          className="px-4 py-2 bg-destructive text-primary-foreground rounded hover:bg-red-700"
          onClick={handleRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}; 
