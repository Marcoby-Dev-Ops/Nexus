import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/theme-provider'
import { EnhancedUserProvider } from './contexts/EnhancedUserContext'
import { initializeStorageCleanup } from './lib/storageUtils'

// Initialize localStorage cleanup to prevent JSON parsing errors
initializeStorageCleanup();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <EnhancedUserProvider>
        <App />
      </EnhancedUserProvider>
    </ThemeProvider>
  </StrictMode>,
)
