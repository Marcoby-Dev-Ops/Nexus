import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/shared/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', { error: error.message, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground">
              An error occurred while loading the application.
            </p>
            <details className="mt-2 p-3 bg-muted rounded-md text-xs">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}