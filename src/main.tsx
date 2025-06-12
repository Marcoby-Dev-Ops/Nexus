import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/theme-provider'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { initializeStorageCleanup } from './lib/storageUtils'

// Initialize localStorage cleanup to prevent JSON parsing errors
initializeStorageCleanup();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
