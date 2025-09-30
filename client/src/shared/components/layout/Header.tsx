import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { Button } from '@/shared/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { CompanySelector } from '@/shared/components/organization/CompanySelector';
import { User, Settings, LogOut, Menu, Sparkles, Building2, Shield, Brain, Bell, Palette } from 'lucide-react';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';

interface HeaderProps {
  onSidebarToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { user, signIn } = useAuth();
  const { profile } = useUserProfile();
  const { pageTitle, pageSubtitle } = useHeaderContext();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    try {
      // Clear all auth-related storage
      localStorage.removeItem('authentik_session');
      localStorage.removeItem('authentik_token');
      localStorage.removeItem('authentik_refresh_token');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      localStorage.removeItem('supabase.auth.expiresAt');
      localStorage.removeItem('supabase.auth.expiresIn');
      localStorage.removeItem('supabase.auth.tokenType');
      localStorage.removeItem('supabase.auth.user');
      localStorage.removeItem('supabase.auth.session');
      
      // Clear session storage
      sessionStorage.clear();
      
      // Force redirect to login
      window.location.href = '/login';
    } catch (_error) {
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (_error) {
      // Handle sign in error silently
    }
  };

  // Navigation handlers for dropdown items
  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    navigate('/settings');
  };

  const handleAIAssistantClick = () => {
    setIsDropdownOpen(false);
    navigate('/ai-hub');
  };

  const handleSecurityClick = () => {
    setIsDropdownOpen(false);
    navigate('/settings/security');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to get display name with priority for display_name
  const getDisplayName = () => {
    if (!user) return 'User';
    
    // 1. Use display_name from profile if available (user's preferred name)
    if (profile?.display_name) {
      return profile.display_name;
    }
    
    // 2. Use full_name from profile if available
    if (profile?.full_name) {
      return profile.full_name;
    }
    
    // 3. Use first_name and last_name from profile
    if (profile?.first_name || profile?.last_name) {
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      return `${firstName} ${lastName}`.trim();
    }
    
    // 4. Try to get name from AuthUser properties
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    
    if (user.firstName) {
      return user.firstName;
    }
    
    if (user.lastName) {
      return user.lastName;
    }
    
    // 5. Use email username as fallback
    if (user.email) {
      const username = user.email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
    }
    
    return 'User';
  };

  // Helper function to get initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    
    // 1. Try to get initials from profile display_name
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    
    // 2. Try to get initials from profile first_name
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    
    // 3. Try to get initials from AuthUser properties
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    if (user.lastName) {
      return user.lastName.charAt(0).toUpperCase();
    }
    
    // 4. Use email first character as fallback
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Page title (optional) + always-on ticker/subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            {pageTitle ? (
              <h1 className="text-lg font-semibold whitespace-nowrap">{pageTitle}</h1>
            ) : null}
            {pageTitle && pageSubtitle ? (
              <span className="text-muted-foreground">•</span>
            ) : null}
            {pageSubtitle ? (
              <span className="text-sm text-muted-foreground truncate">{pageSubtitle}</span>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Company Selector */}
          <CompanySelector />
          
                                {user ? (
             <div className="relative" ref={dropdownRef}>
               <Button 
                 variant="ghost" 
                 className="relative h-8 w-8 rounded-full hover:bg-muted/50 transition-colors"
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 aria-expanded={isDropdownOpen}
                 aria-haspopup="true"
               >
                 <Avatar className="h-8 w-8 ring-2 ring-border hover:ring-primary/40 transition-all">
                   <AvatarImage src={undefined} alt={getDisplayName()} />
                   <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                     {getInitials()}
                   </AvatarFallback>
                 </Avatar>
               </Button>
               
                               {isDropdownOpen && (
                  <div 
                    className="absolute right-0 top-12 w-72 bg-popover border border-border rounded-lg shadow-lg z-dropdown"
                  >
                     <div className="p-3 border-b border-border">
                       <div className="flex flex-col space-y-2">
                         <div className="flex items-center gap-3">
                           <Sparkles className="w-4 h-4 text-primary" />
                           <p className="text-sm font-semibold leading-none text-popover-foreground">{getDisplayName()}</p>
                         </div>
                         <p className="text-xs leading-none text-muted-foreground ml-7">
                           {user.email}
                         </p>
                       </div>
                     </div>
                     
                     <div className="p-2">
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                         onClick={handleSettingsClick}
                       >
                                                   <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">Settings</span>
                       </button>
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                         onClick={handleAIAssistantClick}
                       >
                         <Brain className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">AI Assistant</span>
                       </button>
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                         onClick={handleSecurityClick}
                       >
                         <Shield className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">Security</span>
                       </button>
                       
                       <div className="h-px bg-border my-2" />
                       

                       
                       <div className="h-px bg-border my-2" />
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md text-destructive hover:text-destructive-foreground hover:bg-destructive/10 transition-colors text-left"
                         onClick={handleSignOut}
                       >
                         <LogOut className="mr-3 h-4 w-4" />
                         <span className="font-medium">Sign Out</span>
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <Button variant="outline" onClick={handleSignIn}>Sign In</Button>
             )}
           </div>
         </div>
       </header>
     );
   }; 
