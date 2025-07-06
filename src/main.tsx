import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import AuthProvider from './contexts/AuthContext';
import { ThemeProvider } from './components/ui/theme-provider';
import { ToastProvider } from './components/ui/Toast';
import { initializeStorageCleanup } from './lib/utils/storageUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './lib/i18n';

// Initialize localStorage cleanup to prevent JSON parsing errors
initializeStorageCleanup();

const queryClient = new QueryClient();

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
      (message.includes('VM') && message.includes('SyntaxError'))) {
    return; // Suppress these errors
  }
  
  originalConsoleError.apply(console, args);
};

// Configure Lit for better Microsoft Graph Toolkit compatibility
if (import.meta.env.PROD) {
  // Set production environment for Lit components
  window.process = { env: { NODE_ENV: 'production' } };
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
