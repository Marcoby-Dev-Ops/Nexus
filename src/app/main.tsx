import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

// Core providers and services
import { AuthProvider } from '@/domains/admin/user/hooks/AuthContext';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { ToastProvider } from '@/shared/components/ui/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Initialize environment validation
try {
  validateEnvironment();
  logger.info('Environment configuration validated successfully');
} catch (error) {
  logger.error({ error }, 'Environment validation failed');
  // Continue with app initialization even if validation fails
}



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
if (meta.env && meta.env.PROD) {
  // Set production environment for Lit components
  (window as Window & typeof globalThis).process = { env: { NODE_ENV: 'production' } } as unknown as NodeJS.Process;
} else {
  // In development, suppress Lit warnings but keep functionality
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('Lit is in dev mode') ||
        message.includes('Multiple versions of Lit loaded') ||
        message.includes('lit-element') ||
        message.includes('lit-html')) {
      return; // Suppress Lit dev mode warnings
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Handle global unhandled promise rejections from extensions
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason?.toString() || '';
  if (message.includes('"[object Object]" is not valid JSON') ||
      message.includes('_storageChangeDispatcher') ||
      message.includes('content.js')) {
    event.preventDefault(); // Prevent the error from showing in console
    return;
  }
});

// Initialize services on app startup
const initializeAppServices = async () => {
  try {
    // Initialize callback system
    await initializeCallbackSystem();
    
    // Initialize module registry
    initializeModuleRegistry();
    
    logger.info('All app services initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize some app services');
    // Continue with app startup even if some services fail
  }
};

// Initialize services
initializeAppServices().catch(error => {
  logger.error({ error }, 'Failed to initialize app services');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
