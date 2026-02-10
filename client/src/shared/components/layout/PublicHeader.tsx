import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/shared/components/ui/theme-context';
import { Sun, Moon } from 'lucide-react';

export function PublicHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-background/95 border-b border-border shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/Nexus/nexus-horizontal-160x48-transparent.png" 
            alt="Nexus by Marcoby" 
            className="h-8 w-auto"
          />
        </Link>

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
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Login button */}
          <Link to="/login">
            <Button variant="ghost" className="font-medium">
              Log In
            </Button>
          </Link>

          {/* Sign up button */}
          <Link to="/signup">
            <Button className="font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
} 
