import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { Button } from '@/shared/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { OrganizationSelector } from '@/shared/components/organization/OrganizationSelector';
import { User, Settings, LogOut, Menu, Sparkles, Building2, Shield, Brain, ChevronDown } from 'lucide-react';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';

interface HeaderProps {
  onSidebarToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { pageTitle, pageSubtitle } = useHeaderContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    // Handle sign out logic
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
          
          {/* Page-specific header content */}
          {pageTitle && (
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold">{pageTitle}</h1>
              {pageSubtitle && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Organization Selector */}
          <OrganizationSelector />
          
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
               
               {isDropdownOpen && createPortal(
                 <div 
                   className="fixed inset-0 z-[9999]"
                   onClick={() => setIsDropdownOpen(false)}
                 >
                   <div 
                     className="absolute right-4 top-16 w-72 bg-background border border-border rounded-lg shadow-2xl animate-in fade-in-0 zoom-in-95"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <div className="p-3 border-b border-border">
                       <div className="flex flex-col space-y-2">
                         <div className="flex items-center gap-3">
                           <Sparkles className="w-4 h-4 text-primary" />
                           <p className="text-sm font-semibold leading-none text-foreground">{getDisplayName()}</p>
                         </div>
                         <p className="text-xs leading-none text-muted-foreground ml-7">
                           {user.email}
                         </p>
                       </div>
                     </div>
                     
                     <div className="p-2">
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors text-left"
                         onClick={() => setIsDropdownOpen(false)}
                       >
                         <User className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">My Profile</span>
                       </button>
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors text-left"
                         onClick={() => setIsDropdownOpen(false)}
                       >
                         <Building2 className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">Company Settings</span>
                       </button>
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors text-left"
                         onClick={() => setIsDropdownOpen(false)}
                       >
                         <Brain className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">AI Assistant</span>
                       </button>
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors text-left"
                         onClick={() => setIsDropdownOpen(false)}
                       >
                         <Shield className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">Security</span>
                       </button>
                       
                       <div className="h-px bg-border my-2" />
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors text-left"
                         onClick={() => setIsDropdownOpen(false)}
                       >
                         <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                         <span className="font-medium">Preferences</span>
                       </button>
                       
                       <div className="h-px bg-border my-2" />
                       
                       <button 
                         className="w-full flex items-center px-3 py-2.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                         onClick={() => {
                           handleSignOut();
                           setIsDropdownOpen(false);
                         }}
                       >
                         <LogOut className="mr-3 h-4 w-4" />
                         <span className="font-medium">Sign Out</span>
                       </button>
                     </div>
                   </div>
                 </div>,
                 document.body
               )}
             </div>
           ) : (
            <Button variant="outline">Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
}; 