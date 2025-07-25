/**
 * Backend Error Boundary
 * Catches and handles backend connection errors gracefully
 */

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class BackendErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Backend Error Boundary caught an error: ', error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Wait a bit to allow for potential network recovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false
      });
    } catch (error) {
      this.setState({ isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isConnectionError = this.state.error?.message?.includes('network') ||
                               this.state.error?.message?.includes('fetch') ||
                               this.state.error?.message?.includes('timeout') ||
                               this.state.error?.message?.includes('offline');

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <div className="flex items-center space-x-2">
              {isConnectionError ? (
                <WifiOff className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <CardTitle className="text-lg">
                {isConnectionError ? 'Connection Error' : 'Backend Error'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {isConnectionError 
                  ? 'Unable to connect to backend services. Please check your internet connection and try again.'
                  : 'An error occurred while communicating with backend services.'
                }
              </p>
              
              {this.state.error && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={isConnectionError ? 'destructive' : 'secondary'}>
                {isConnectionError ? 'Offline' : 'Error'}
              </Badge>
              
              <Button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                size="sm"
                variant="outline"
              >
                {this.state.isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
} 