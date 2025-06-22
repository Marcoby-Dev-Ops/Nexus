import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const EmailNotVerified: React.FC = () => {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    if (!user?.email) return;
    setError(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        We&apos;ve sent a confirmation link to <strong>{user?.email}</strong>. Please click the link in that email to activate your account.
      </p>
      <Button onClick={resend} disabled={sent}>
        {sent ? 'Verification email sent' : 'Resend email'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default EmailNotVerified; 