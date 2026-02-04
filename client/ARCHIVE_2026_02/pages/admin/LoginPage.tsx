import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { Card } from '@/shared/components/ui/Card';

/**
 * Modernized LoginPage using Authentik OAuth
 * 
 * Features:
 * - Single-click OAuth authentication
 * - Automatic redirect to Authentik
 * - Unified error handling and loading states
 * - Consistent styling with other auth forms
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuthentikAuth();

  // Debug: Log environment variables
      // Debug logging removed for security

  const handleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn();
      
      if (!result.success) {
        setError(result.error || 'Failed to initiate authentication');
      }
      // If successful, the user will be redirected to Authentik automatically
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-card-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Debug section - remove in production */}
        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info (Development Only)</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>VITE_AUTHENTIK_CLIENT_ID: {import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'NOT SET'}</div>
              <div>Client ID Length: {(import.meta.env.VITE_AUTHENTIK_CLIENT_ID || '').length}</div>
              <div>All VITE_ vars: {Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ')}</div>
            </div>
          </div>
        )}

        <div className="space-y-6">
                     <div className="text-center">
             <p className="text-sm text-muted-foreground mb-6">
               Sign in with your Marcoby account
             </p>
           </div>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
                         {loading ? (
               <div className="flex items-center justify-center">
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                 Redirecting to Marcoby...
               </div>
             ) : (
               'Sign in with Marcoby'
             )}
          </button>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="text-center space-y-2">
                         <div className="text-sm text-muted-foreground">
               Don't have an account? Contact your administrator to get access to Marcoby.
             </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 
