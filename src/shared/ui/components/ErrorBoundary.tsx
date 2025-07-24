import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * @name ErrorBoundary
 * @description Error boundary component to catch and handle React errors gracefully.
 * @param {Props} props - The props for the component.
 * @returns {JSX.Element} The rendered ErrorBoundary component.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error details
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error: ', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = (): void => {
    // Clear any potentially corrupted localStorage data
    try {
      // Clear specific keys that might be causing JSON parsing issues
      const keysToCheck = [
        'vite-ui-theme',
        'nexus_n8n_config_',
        'nexus_onboarding_state'
      ];
      
      Object.keys(localStorage).forEach(key => {
        keysToCheck.forEach(checkKey => {
          if (key.includes(checkKey)) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                JSON.parse(value); // Test if it's valid JSON
              }
            } catch {
              // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`Removing corrupted localStorage key: ${key}`);
              localStorage.removeItem(key);
            }
          }
        });
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('Error cleaning localStorage: ', error);
    }
    
    // Reset state and reload
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    // Reset state and navigate to dashboard home
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
          window.location.href = '/dashboard/home';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark: from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-card dark:bg-background rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-destructive/10 dark:bg-destructive/20">
                <AlertTriangle className="w-8 h-8 text-destructive dark:text-destructive" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-4">
              Something went wrong
            </h1>
            
            <p className="text-muted-foreground dark:text-muted-foreground mb-6">
              An unexpected error occurred while loading the application. This might be due to a temporary issue.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-muted dark: bg-muted/20 rounded-lg p-4 text-xs font-mono overflow-auto max-h-40">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm: flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors duration-200 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-muted text-foreground hover:bg-muted/80 dark:bg-muted/20 dark:hover:bg-muted/30 rounded-lg transition-colors duration-200 font-medium"
              >
                <Home className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 