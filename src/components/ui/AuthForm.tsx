import React, { useState } from 'react';
import { supabase } from '../../lib/core/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { handleCompletePasskeySignIn, handlePasskeyError, isPasskeySupported } from '@/lib/utils/passkey';

type AuthMode = 'login' | 'signup' | 'reset';

interface AuthFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  initialMode?: AuthMode;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onError, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      switch (mode) {
        case 'login':
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          onSuccess?.();
          break;

        case 'signup':
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (signUpError) throw signUpError;
          setMessage('Check your email for the confirmation link.');
          break;

        case 'reset':
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          });
          if (resetError) throw resetError;
          setMessage('Check your email for the password reset link.');
          break;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Passkey Sign-in
  // -------------------------------------------------------------
  const handlePasskeySignIn = async () => {
    try {
      if (!email) {
        setError('Enter email first so we can locate your account');
        return;
      }
      
      if (!isPasskeySupported()) {
        setError('Your browser does not support passkeys');
        return;
      }
      
      setError(null);
      setPasskeyLoading(true);

      // Use centralized passkey sign-in flow
      await handleCompletePasskeySignIn(email, undefined, onSuccess);
      
    } catch (err: any) {
      handlePasskeyError(err, 'authentication');
      setError(err?.message ?? 'Passkey sign-in failed');
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-8 bg-card shadow-xl border-0">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          {mode === 'login' && 'Welcome back'}
          {mode === 'signup' && 'Create account'}
          {mode === 'reset' && 'Reset password'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {mode === 'login' && 'Enter your credentials to access your account'}
          {mode === 'signup' && 'Start your journey with Nexus today'}
          {mode === 'reset' && 'Enter your email to reset your password'}
        </p>
      </div>

      {/* Microsoft 365 OAuth - Coming Soon */}
      {mode !== 'reset' && (
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                // Always use window.location.origin for redirect
                const redirectTo = `${window.location.origin}/auth/callback`;
                const { error: oauthErr } = await supabase.auth.signInWithOAuth({
                  provider: 'azure',
                  options: {
                    scopes: 'openid profile email offline_access',
                    redirectTo,
                  },
                });
                if (oauthErr) throw oauthErr;
                // If the OAuth flow does not redirect, show an error
                setTimeout(() => {
                  if (!window.location.href.includes('/microsoft365/callback')) {
                    setError('Microsoft sign-in did not redirect. Please check your popup blocker or try again.');
                  }
                }, 3000);
              } catch (err) {
                console.error('[AuthForm] Microsoft sign-in failed', err);
                setError(err instanceof Error ? err.message : 'Microsoft sign-in failed');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full h-12 text-base font-semibold rounded-xl shadow-lg mb-4 flex items-center justify-center space-x-4"
          >
            <div className="flex items-center justify-center w-5 h-5 bg-white rounded-sm">
              <svg width="16" height="16" viewBox="0 0 21 21" className="text-black">
                <rect x="1" y="1" width="9" height="9" fill="currentColor" opacity="0.9"/>
                <rect x="12" y="1" width="9" height="9" fill="currentColor" opacity="0.9"/>
                <rect x="1" y="12" width="9" height="9" fill="currentColor" opacity="0.9"/>
                <rect x="12" y="12" width="9" height="9" fill="currentColor" opacity="0.9"/>
              </svg>
            </div>
            <span>Sign in with Microsoft 365</span>
          </Button>
          {/* Show error if OAuth fails */}
          {error && (
            <Alert variant="error" className="animate-in slide-in-from-top-2 duration-300 mt-2">
              {error}
            </Alert>
          )}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">
                Or
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Email/Password Form - Secondary Method */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
              data-testid="email-input"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
          
          {mode !== 'reset' && (
            <div className="relative">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="error" className="animate-in slide-in-from-top-2 duration-300">
            {error}
          </Alert>
        )}

        {message && (
          <Alert variant="success" className="animate-in slide-in-from-top-2 duration-300">
            {message}
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          isLoading={loading}
          disabled={loading}
        >
          {mode === 'login' && 'Sign in with email'}
          {mode === 'signup' && 'Create account with email'}
          {mode === 'reset' && 'Send reset link'}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium"
          isLoading={passkeyLoading}
          disabled={passkeyLoading}
          onClick={handlePasskeySignIn}
          data-testid="passkey-signin-button"
        >
          Sign in with Passkey
        </Button>

        <div className="text-center space-y-4">
          {mode === 'login' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                disabled={loading}
              >
                Don't have an account? Sign up
              </button>
              <br />
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-sm text-muted-foreground hover:text-foreground/90 transition-colors duration-200"
                disabled={loading}
              >
                Forgot your password?
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              disabled={loading}
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              disabled={loading}
            >
              Back to sign in
            </button>
          )}
        </div>
      </form>

      {/* Business Account Notice */}
      {mode === 'signup' && (
        <div className="mt-8 p-4 bg-primary/5 border border-border rounded-xl">
          <div className="flex items-start space-x-4">
            <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary mb-1">
                Microsoft 365 Integration
              </p>
              <p className="text-xs text-primary">
                Using Microsoft 365 provides enhanced security and seamless integration with your business tools.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}; 