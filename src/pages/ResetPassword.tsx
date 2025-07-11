import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/core/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

/**
 * ResetPassword - Allows users to set a new password after requesting a reset
 */
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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
      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }

      // Success
      setSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

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
              You will be redirected to the dashboard in a few seconds...
            </p>
            <Button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full"
            >
              Go to Dashboard Now
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
              isLoading={loading}
              disabled={loading}
            >
              Reset Password
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