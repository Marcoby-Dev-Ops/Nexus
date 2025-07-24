import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthForm } from '@/shared/components/ui/AuthForm';

export const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect URL from query parameters or state
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || 
                     (location.state as { from?: { pathname: string } })?.from?.pathname || 
                     '/home';

  const handleSuccess = () => {
    // Navigate to the intended destination after successful authentication
    navigate(redirectUrl, { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg: flex lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-primary/80 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-card rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-8 text-primary-foreground">
          <div className="mb-8">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="NEXUS Logo"
              className="w-16 h-16 mb-6 filter brightness-0 invert"
            />
            <h1 className="text-4xl font-bold mb-4">
              Join the Future of Business
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Transform your business operations with AI-powered tools designed for modern teams and scalable growth.
            </p>
          </div>
          
          {/* Key Benefits */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Smart Analytics</h3>
                <p className="text-primary-foreground/70 text-sm">Get insights that matter with AI-powered business intelligence</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Process Automation</h3>
                <p className="text-primary-foreground/70 text-sm">Streamline workflows and eliminate repetitive tasks</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Team Collaboration</h3>
                <p className="text-primary-foreground/70 text-sm">Unite your team with integrated communication tools</p>
              </div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-primary-foreground/70 text-sm mb-4">Trusted by forward-thinking businesses</p>
            <div className="flex items-center space-x-6 text-xs text-primary-foreground/60">
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Enterprise Security</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>99.9% Uptime</span>
              </span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>24/7 Support</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background dark:bg-background">
        <div className="max-w-md w-full">
          {/* Mobile Header (visible only on small screens) */}
          <div className="lg: hidden text-center mb-8">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="NEXUS Logo"
              className="w-12 h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
              Welcome to Nexus
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Your AI-Powered Business Operating System
            </p>
          </div>

          {/* Auth Form */}
          <AuthForm
            initialMode="signup"
            onSuccess={handleSuccess}
            onError={(error) => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Sign up error: ', error)}
          />

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-primary/5 dark: bg-primary/10 border border-border dark:border-primary/20 rounded-lg">
            <div className="flex items-start space-x-4">
              <svg className="w-5 h-5 text-primary dark:text-primary mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-primary mb-1">
                  Quick Setup Process
                </p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  After registration, you'll be guided through a personalized onboarding to configure your business workspace in minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
                          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <Link to="/legal/privacy" className="hover: text-primary transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link to="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                <span>•</span>
                <Link to="/help" className="hover:text-primary transition-colors">Help Center</Link>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 