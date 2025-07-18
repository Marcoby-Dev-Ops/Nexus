import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Seo } from '@/shared/components/Seo';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Seo
        title="Login – Nexus Platform | Marcoby"
        description="Login to your Nexus account to access your business dashboard and tools."
        canonical="https://nexus.marcoby.com/login"
        image="https://nexus.marcoby.com/og-image.png"
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <div className="font-semibold text-lg">Error</div>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button variant="link" onClick={() => navigate('/signup')}>
            Don't have an account? Sign up
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate('/password-reset')}>
            Forgot your password?
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 