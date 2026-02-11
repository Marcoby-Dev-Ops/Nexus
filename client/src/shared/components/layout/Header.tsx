import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/shared/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { Settings, LogOut, Search, PanelLeftOpen, PanelLeftClose, User } from 'lucide-react';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { useHeaderContext, HeaderProvider } from '@/shared/hooks/useHeaderContext';
import { GlobalSearch } from './GlobalSearch';
import { navItems } from './navConfig';

interface HeaderProps {
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSidebarToggle, isSidebarOpen }) => {
  const { user, signOut } = useAuth();
  const { pageTitle, pageSubtitle } = useHeaderContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = 'https://identity.marcoby.com/if/flow/default-invalidation-flow/';
    } catch {
      window.location.href = '/login';
    }
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    navigate('/settings');
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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-14 items-center gap-2 px-3 sm:px-6 lg:px-8 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* Global Search Component */}
        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* LEFT: Toggle, Logo, Breadcrumbs */}
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title={isSidebarOpen ? "Close utility panel" : "Open utility panel"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          <Link to="/" className="mr-1 shrink-0 md:mr-4 flex items-center gap-2 font-heading text-base md:text-lg tracking-tight">
            <span className="text-primary">Nexus</span>
          </Link>

          {/* Breadcrumbs / Page Title */}
          {(pageTitle || pageSubtitle) && (
            <div className="hidden md:flex min-w-0 items-center text-sm text-muted-foreground border-l pl-4 h-6">
              <span className="truncate">{pageTitle}</span>
              {pageSubtitle && (
                <>
                  <span className="mx-2 shrink-0">/</span>
                  <span className="truncate text-foreground font-emphasis">{pageSubtitle}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* CENTER: Main Navigation + Search Launcher */}
        <div className="hidden md:flex justify-self-center max-w-[48vw] lg:max-w-[44rem] overflow-x-auto">
          <nav className="flex items-center justify-center gap-1 whitespace-nowrap">
            {navItems.filter(item => item.category === 'overview' || item.name === 'Settings').map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative inline-flex h-9 items-center rounded-md px-4 text-sm font-emphasis transition-colors
                  ${isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                  }
                `}
              >
                {item.name}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] rounded-full" />
                )}
              </Link>
            ))}
            <Button
              variant="ghost"
              className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setIsSearchOpen(true)}
              title="Search conversations (CMD+K)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden xl:inline pointer-events-none select-none rounded border border-border/70 bg-muted/70 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
          </nav>
        </div>

        {/* RIGHT: Status, Profile */}
        <div className="ml-auto flex items-center justify-self-end gap-1 sm:gap-2 md:gap-4">
          {/* System Status */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground" title="System Healthy">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="hidden xl:inline">System Healthy</span>
          </div>

          {/* Mobile Search Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setIsSearchOpen(true)}
            title="Search conversations"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 outline-none p-1 rounded-full hover:bg-muted transition-colors"
            >
              <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-border">
                <AvatarImage src={/* user?.avatar_url || */ undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 z-50">
                <div className="p-2 border-b">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Appearance</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
                <div className="p-1 border-t">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <div className="md:hidden border-t border-border/60 px-2 py-1.5">
        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          {navItems.filter(item => item.category === 'overview' || item.name === 'Settings').map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                inline-flex h-9 items-center px-3 rounded-md text-xs font-medium transition-colors
                ${isActive(item.path)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }
              `}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};
