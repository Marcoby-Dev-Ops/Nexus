import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { Card } from '@/shared/components/ui/Card';

/**
 * SignupPage - Redirects to Authentik for user registration
 * 
 * Since Authentik handles user registration, this page provides
 * information about the registration process and redirects users.
 */
export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuthentikAuth();

  const handleSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      // For Authentik, signup is typically handled through the same OAuth flow
      // Users will be redirected to Authentik where they can register if needed
      const result = await signIn();
      
      if (!result.success) {
        setError(result.error || 'Failed to initiate registration');
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
          <h1 className="text-3xl font-bold text-card-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up to get started with Nexus
          </p>
        </div>

        <div className="space-y-6">
                     <div className="text-center">
             <p className="text-sm text-muted-foreground mb-6">
               Create your account through Marcoby
             </p>
             <p className="text-sm text-muted-foreground mb-6">
               You'll be redirected to Marcoby where you can register your account securely.
             </p>
           </div>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
                         {loading ? (
               <div className="flex items-center justify-center">
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                 Redirecting to Marcoby...
               </div>
             ) : (
               'Create Account with Marcoby'
             )}
          </button>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 