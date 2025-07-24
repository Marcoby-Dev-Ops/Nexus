import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/core/supabase";
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Alert } from '@/shared/components/ui/Alert';
import { Card } from '@/shared/components/ui/Card';

/**
 * ResetPassword - Allows users to set a new password after requesting a reset
 */
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for valid session or reset token on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setHasValidSession(true);
        } else {
          // Check if we have a reset token in the URL
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Try to set the session with the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (!error && data.session) {
              setHasValidSession(true);
            } else {
              console.warn('Failed to set session from reset tokens:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Password updated successfully');
      
      // Try to get the current session after password update
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('✅ User has active session after password reset');
        setSuccess(true);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        console.log('⚠️ No active session after password reset, redirecting to login');
        setSuccess(true);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying reset link...</p>
          </div>
        </Card>
      </div>
    );
  }

  // If no valid session, show error message
  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Invalid Reset Link</h2>
            <p className="text-muted-foreground mt-2">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <Alert variant="error" className="mb-6">
            Please request a new password reset link.
          </Alert>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/password-reset')}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Request New Password Reset
            </Button>

            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full h-12 text-base font-medium border-border hover:bg-muted rounded-xl transition-all duration-200"
            >
              Back to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Reset Your Password</h2>
          <p className="text-muted-foreground mt-2">
            Please enter your new password below
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <Alert variant="success" className="mb-4">
              Password has been reset successfully!
            </Alert>
            <p className="text-muted-foreground mb-4">
              You will be redirected to the login page in a few seconds...
            </p>
            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full"
            >
              Go to Login Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                  autoComplete="new-password"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
                  autoComplete="new-password"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                disabled={loading}
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
} 