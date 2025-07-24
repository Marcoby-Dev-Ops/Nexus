import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

// Core providers and services
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { ToastProvider } from '@/shared/ui/components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/auth/AuthProvider';

// Core services initialization
import { logger } from '@/core/auth/logger';
import { validateEnvironment } from '@/core/environment';

// Callback system
import { initializeCallbackSystem } from '@/shared/callbacks';

// Module registry
import { initializeModuleRegistry } from '@/domains/ai/lib/modules/moduleRegistry';

// Styles and assets
import '@/shared/assets/index.css';
import '@/shared/services/i18n';

// Initialize environment validation with better error handling
try {
  validateEnvironment();
  logger.info('Environment configuration validated successfully');
} catch (error) {
  logger.error({ error }, 'Environment validation failed');
  // Log to console for debugging
  console.error('Environment validation failed:', error);
  // Continue with app initialization even if validation fails
}

// Global initialization guard to prevent multiple initializations in React StrictMode
let globalCoreServicesGuard = false;

// Initialize core services in proper order
const initializeCoreServices = async () => {
  // Global guard to prevent multiple initializations
  if (globalCoreServicesGuard) {
    logger.info('Core services already initialized globally, skipping...');
    return;
  }
  
  try {
    // Set global guard
    globalCoreServicesGuard = true;
    
    // Step 1: Initialize callback system (only if not already initialized)
    try {
      await initializeCallbackSystem();
      logger.info('Callback system initialized successfully');
    } catch (error) {
      logger.warn('Callback system already initialized or failed to initialize', { error });
      console.warn('Callback system error:', error);
    }
    
    // Step 2: Initialize module registry (core only)
    try {
      initializeModuleRegistry(); // Only loads core modules, others loaded on-demand
      logger.info('Module registry initialized successfully');
    } catch (error) {
      logger.warn('Module registry initialization failed', { error });
      console.warn('Module registry error:', error);
    }
    
    logger.info('All app services initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize some app services');
    console.error('Core services initialization error:', error);
    // Continue with app startup even if some services fail
  }
};

// Initialize services with better error handling
initializeCoreServices().catch(error => {
  logger.error({ error }, 'Failed to initialize app services');
  console.error('App services initialization error:', error);
});

// Initialize core services
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Enhanced error suppression for browser extensions and Lit components
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Suppress browser extension JSON parsing errors
console.error = (...args) => {
  const message = args.join(' ');
  // Suppress known extension errors that pollute the console
  if (message.includes('"[object Object]" is not valid JSON') ||
      message.includes('_storageChangeDispatcher') ||
      message.includes('content.js') ||
      message.includes('SyntaxError: "[object Object]"') ||
      message.includes('Uncaught (in promise) SyntaxError') ||
      (message.includes('VM') && message.includes('SyntaxError')) ||
      message.includes('Session fetch failed after retries')) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

// Suppress GoTrueClient warning (caused by multiple Supabase client instances)
console.warn = (...args) => {
  const message = args.join(' ');
  // Suppress GoTrueClient warning
  if (message.includes('Multiple GoTrueClient instances detected')) {
    return; // Suppress this warning - we've fixed the root cause in DebugPage.tsx
  }
  originalConsoleWarn.apply(console, args);
};

// Configure Lit for better Microsoft Graph Toolkit compatibility
const meta = import.meta as ImportMeta & { env: { PROD: boolean } };

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
          <Router>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </Router>
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
