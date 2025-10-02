import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import App from './App';
import { logger } from '@/shared/utils/logger';
import { initializeStorageCleanup } from '@/shared/utils/storageUtils';

// Import global styles
import '@/shared/assets/index.css';

// Initialize i18n
import '@/shared/services/i18n';

// Initialize storage cleanup to fix potential localStorage corruption
initializeStorageCleanup();

// QueryClient removed for now to isolate React hooks issue

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
    
    const AppWrapper = () => (
      <ErrorBoundary>
        <Router>
          <ThemeProvider defaultTheme="system">
            <App />
          </ThemeProvider>
        </Router>
      </ErrorBoundary>
    );
    
    root.render(
      enableStrictMode ? (
        <React.StrictMode>
          <AppWrapper />
        </React.StrictMode>
      ) : (
        <AppWrapper />
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
