import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { ToastProvider } from '@/shared/ui/components/Toast';
import { NotificationProvider } from '@/shared/hooks/NotificationContext';
import App from './App';
import { logger } from '@/shared/utils/logger.ts';
import { initializeStorageCleanup } from '@/shared/utils/storageUtils.ts';

// Import global styles
import '@/shared/assets/index.css';

// Initialize i18n
import '@/shared/services/i18n';

// Initialize storage cleanup to fix potential localStorage corruption
initializeStorageCleanup();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Initialize environment validation
try {
  // Simple environment check
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  logger.info('Environment configuration validated successfully');
} catch (error) {
  logger.error({ error }, 'Environment validation failed');
  console.error('Environment validation failed:', error);
}

// Enhanced error boundary for the root
const RootErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Root error caught:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h1 style={{ color: '#dc3545', marginBottom: '10px' }}>Application Error</h1>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            The application encountered an error during startup.
          </p>
          {error && (
            <details style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>Error Details</summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {error.toString()}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Enhanced React app initialization with error handling
const initializeApp = () => {
  try {
    console.log('Starting application initialization...');
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = ReactDOM.createRoot(rootElement);
    
    console.log('Rendering application...');
    root.render(
      <React.StrictMode>
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
      </React.StrictMode>
    );
    
    console.log('Application rendered successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Fallback error display
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h1 style="color: #dc3545;">Application Startup Error</h1>
          <p style="color: #6c757d;">Failed to initialize the application.</p>
          <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px;">
            ${error instanceof Error ? error.toString() : 'Unknown error'}
          </pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Application
          </button>
        </div>
      `;
    }
  }
};

// Start the application
initializeApp();
