import { useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/ui/AuthForm';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSuccess = () => {
    navigate(from);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-card rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="mb-8">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="NEXUS Logo"
              className="w-16 h-16 mb-6 filter brightness-0 invert"
            />
            <h1 className="text-4xl font-bold mb-4">
              Welcome back to Nexus
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Your AI-powered business operating system that transforms how you work, analyze, and grow.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-primary-foreground/80">Unified dashboard for all business operations</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-primary-foreground/80">AI-powered analytics and automation</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-card/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <span className="text-primary-foreground/80">Team collaboration and workflow management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background dark:bg-background">
        <div className="max-w-md w-full">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="NEXUS Logo"
              className="w-12 h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground dark:text-primary-foreground">
              Welcome back
            </h1>
          </div>

          {/* Auth Form */}
          <AuthForm
            onSuccess={handleSuccess}
            onError={(error) => console.error('Login error:', error)}
          />

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground space-x-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Help Center</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 