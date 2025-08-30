import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { ToastProvider } from '@/shared/ui/components/Toast';
import { NotificationProvider } from '@/shared/hooks/NotificationContext';
import App from './App';
import { logger } from '@/shared/utils/logger';
import { initializeStorageCleanup } from '@/shared/utils/storageUtils';

// Import global styles
import '@/shared/assets/index.css';

// Initialize i18n
import '@/shared/services/i18n';

// Initialize storage cleanup to fix potential localStorage corruption
initializeStorageCleanup();

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Add performance optimizations
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Initialize environment validation
const validateEnvironment = async () => {
  try {
    // Check for required environment variables
    const requiredEnvVars = [
      'VITE_AUTHENTIK_CLIENT_ID',
      'VITE_AUTHENTIK_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(
      varName => !import.meta.env[varName]
    );
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Note: DATABASE_URL is only needed for server-side operations
    // Frontend database access goes through API endpoints
    
    logger.info('Environment configuration validated successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Environment validation failed', { error: errorMessage });
  }
};

// Enhanced error boundary with better UX
const RootErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.error('Root error caught', { error: event.error });
      setError(event.error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', { reason: event.reason });
      setError(new Error(event.reason));
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Application Error</h1>
            <p className="text-muted-foreground">
              The application encountered an error during startup.
            </p>
          </div>
          
          {error && (
            <details className="text-left">
              <summary className="cursor-pointer text-primary hover:text-primary/80">
                Error Details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                {error.toString()}
              </pre>
            </details>
          )}
          
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

  return <>{children}</>;
};

// Enhanced React app initialization with error handling and performance monitoring
const initializeApp = async () => {
  try {
    logger.info('Starting application initialization...');
    
    // Initialize environment validation
    await validateEnvironment();
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = ReactDOM.createRoot(rootElement);
    
    logger.info('Rendering application...');
    
    // Conditionally enable StrictMode based on environment
    // Disable in development to reduce double rendering during debugging
    const enableStrictMode = import.meta.env.PROD || import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';
    
    const appElement = (
      <RootErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <ThemeProvider defaultTheme="system">
              <NotificationProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </NotificationProvider>
            </ThemeProvider>
          </Router>
        </QueryClientProvider>
      </RootErrorBoundary>
    );
    
    root.render(
      enableStrictMode ? (
        <React.StrictMode>
          {appElement}
        </React.StrictMode>
      ) : (
        appElement
      )
    );
    
    logger.info('Application rendered successfully');
  } catch (error) {
    logger.error('Failed to initialize application', { error });
    // Fallback error display
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="min-h-screen bg-background flex items-center justify-center p-4">
          <div class="max-w-md w-full space-y-4 text-center">
            <h1 class="text-2xl font-bold text-destructive">Application Startup Error</h1>
            <p class="text-muted-foreground">Failed to initialize the application.</p>
            <pre class="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
              ${error instanceof Error ? error.toString() : 'Unknown error'}
            </pre>
            <button onclick="window.location.reload()" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Reload Application
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Start the application
initializeApp();
