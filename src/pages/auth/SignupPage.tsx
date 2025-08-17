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
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground mt-2">
              Start your journey with Nexus
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
              className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
                             {loading ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                   Redirecting to Marcoby...
                 </>
               ) : (
                 'Create Account with Marcoby'
               )}
            </button>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Link to="/" className="text-primary hover:text-primary/80">
                ← Back to home page
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 