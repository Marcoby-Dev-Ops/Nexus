import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { SupabaseProvider } from '@/lib/SupabaseProvider'
import { EnhancedUserProvider } from '@/contexts/EnhancedUserContext'
import { AuthProvider } from '@/lib/auth'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { UserProvider } from '@/contexts/UserContext'
import { initializeStorageCleanup, safeSetLocalStorage } from '@/lib/storageUtils'

// Initialize localStorage cleanup to prevent JSON parsing errors
initializeStorageCleanup();

// Force light theme by clearing any existing theme and setting light mode
localStorage.removeItem('vite-ui-theme');
safeSetLocalStorage('vite-ui-theme', 'light');

// Also force light mode on the document element immediately
document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseProvider>
      <EnhancedUserProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <UserProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </EnhancedUserProvider>
    </SupabaseProvider>
  </StrictMode>,
)
