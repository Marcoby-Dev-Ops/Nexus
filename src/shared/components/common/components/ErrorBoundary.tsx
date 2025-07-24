import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Optionally log error to a monitoring service
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error: ", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-destructive/5 border border-red-200 rounded text-destructive text-center">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <p className="mb-4">An unexpected error occurred. Please try again.</p>
          <button
            className="px-4 py-2 bg-destructive text-primary-foreground rounded hover: bg-red-700"
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
} 