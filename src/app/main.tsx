import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

// Core providers and services
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { ToastProvider } from '@/shared/ui/components/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/domains/admin/user/hooks/AuthContext';

// Core services initialization
import { logger } from '@/core/auth/logger';
import { validateEnvironment } from '@/core/environment';
import { initializeAuth } from '@/shared/services/authService';

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
    
    // Step 1: Initialize authentication service
    await initializeAuth();
    logger.info('Authentication service initialized successfully');
    
    // Step 2: Initialize callback system
    await initializeCallbackSystem();
    
    // Step 3: Initialize module registry (core only)
    initializeModuleRegistry(); // Only loads core modules, others loaded on-demand
    
    logger.info('All app services initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize some app services');
    // Continue with app startup even if some services fail
  }
};

// Initialize services
initializeCoreServices().catch(error => {
  logger.error({ error }, 'Failed to initialize app services');
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

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
              <ThemeProvider defaultTheme="light">
        <ToastProvider>
          <Router>
            <AuthProvider>
              <App />
            </AuthProvider>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
