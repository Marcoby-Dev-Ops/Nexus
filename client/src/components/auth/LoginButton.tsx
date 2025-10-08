/**
 * Login Button Component
 * Provides Authentik OAuth2 login functionality
 */

import React from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { Button } from '../ui/button';
import { Loader2, LogIn } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  className,
  variant = 'default',
  size = 'default',
  children,
}) => {
  const { signIn, loading, error } = useAuthentikAuth();

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleLogin}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting to Authentik...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            {children || 'Login with Authentik'}
          </>
        )}
      </Button>
      
      {error && (
        <div className="text-sm text-red-600 text-center max-w-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default LoginButton;
