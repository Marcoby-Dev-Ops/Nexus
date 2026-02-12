import React from 'react';
import { Button } from './Button';
import { Moon, Sun } from 'lucide-react';

export function PublicHeader() {
  const appPortalBase = String(import.meta.env.VITE_APP_PORTAL_URL || '').trim().replace(/\/+$/, '');
  const toPortalHref = (path: string) => (appPortalBase ? `${appPortalBase}${path}` : path);
  const identityLoginUrl = String(import.meta.env.VITE_IDENTITY_LOGIN_URL || '').trim();
  const identitySignupUrl = String(import.meta.env.VITE_IDENTITY_SIGNUP_URL || '').trim();
  const loginHref = identityLoginUrl || toPortalHref('/login');
  const signupHref = identitySignupUrl || toPortalHref('/signup');
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-30 bg-background/95 border-b border-border shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img 
            src="/Nexus/nexus-horizontal-160x48-transparent.png" 
            alt="Nexus by Marcoby" 
            className="h-8 w-auto"
          />
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="/#platform"
            className="text-foreground/90 hover:text-primary transition-colors font-medium"
          >
            Platform
          </a>
          <a
            href="/#knowledge"
            className="text-foreground/90 hover:text-primary transition-colors font-medium"
          >
            Knowledge
          </a>
          <a
            href="/#trust"
            className="text-foreground/90 hover:text-primary transition-colors font-medium"
          >
            Trust
          </a>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Login button */}
          <Button asChild variant="ghost" className="font-medium">
            <a href={loginHref}>
              Log In
            </a>
          </Button>

          {/* Sign up button */}
          <Button asChild className="font-medium">
            <a href={signupHref}>
              Get Started
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
} 
