import { useAuth } from '@/core/auth/AuthProvider';
import { Button } from '@/shared/components/ui/Button';

export default function EmailNotVerified() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-primary mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Verify Your Email</h2>
        <p className="text-muted-foreground mb-6">
          A confirmation link has been sent to your email address. Please click the link to complete your registration.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Didn't get the email? Check your spam folder or request a new one.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={signOut}>Back to Login</Button>
        </div>
      </div>
    </div>
  );
} 