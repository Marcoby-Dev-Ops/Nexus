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
import { OnboardingProvider } from './contexts/OnboardingContext'

// Initialize localStorage cleanup to prevent JSON parsing errors
initializeStorageCleanup();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseProvider>
      <EnhancedUserProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="system">
            <UserProvider>
              <NotificationProvider>
                <OnboardingProvider>
                  <App />
                </OnboardingProvider>
              </NotificationProvider>
            </UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </EnhancedUserProvider>
    </SupabaseProvider>
  </StrictMode>,
)
