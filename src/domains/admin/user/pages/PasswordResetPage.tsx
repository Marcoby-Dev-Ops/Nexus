import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Alert } from '@/shared/components/ui/Alert';
import { Card } from '@/shared/components/ui/Card';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const result = await resetPassword(email);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
          <div className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            
            <Alert variant="success" className="mb-6">
              If you don't see the email, check your spam folder.
            </Alert>

            <div className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Send Another Email
              </Button>

              <Link
                to="/login"
                className="block w-full h-12 text-base font-medium border border-border hover:bg-muted rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 bg-card shadow-xl border-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <div className="relative">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-12 h-12 text-base border-border focus:border-primary focus:ring-primary rounded-xl transition-all duration-200"
              autoComplete="email"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
} 