import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { useTheme } from '@/shared/components/ui/theme-provider.tsx';
import { useNotifications } from '@/core/hooks/NotificationContext.tsx';
import { CommandPalette } from '@/shared/components/layout/CommandPalette.tsx';
import { Menu, Bell, Sun, Moon, User, Settings, Search, Lightbulb } from 'lucide-react';
import { navItems } from '@/shared/components/layout/navConfig.tsx';
import { useThoughtAssistantStore } from '@/shared/stores/thoughtAssistantStore.ts';

type NavItem = import('./navConfig').NavItem;

export function Header({ onSidebarToggle }: { onSidebarToggle: () => void; }) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { open } = useThoughtAssistantStore();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const displayName = user?.profile?.first_name || user?.profile?.display_name || user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-card shadow-sm z-30 border-b border-border">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left Section: Menu, Title */}
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden mr-2 p-2"
            onClick={onSidebarToggle}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">
            {navItems.find((item: NavItem) => isActive(item.path))?.name || 'Dashboard'}
          </h1>
        </div>
        
        {/* Right Section: Essential Actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <button
            aria-label="Open command palette"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </button>
          <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

          {/* Global Capture Thought Button */}
          <button
            aria-label="Capture Thought"
            className="hidden md: inline-flex p-2 rounded-full text-warning hover:text-foreground hover:bg-warning/20 transition-colors"
            onClick={open}
            title="Capture Thought (Global)"
            type="button"
          >
            <Lightbulb className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full text-muted-foreground hover: text-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              title="Notifications"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center text-[10px] pointer-events-none">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        notifications.forEach(n => !n.read && markAsRead(n.id));
                        setShowNotifications(false);
                      }}
                      className="text-xs text-primary hover: underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">You're all caught up!</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-border last: border-b-0 ${!notification.read ? 'bg-muted/50' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notification.type === 'success' ? 'bg-success' :
                            notification.type === 'warning' ? 'bg-warning' :
                            notification.type === 'error' ? 'bg-destructive' :
                            'bg-primary'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs text-primary hover: underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-full hover: bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    to="/settings/profile"
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground hover: bg-muted rounded-md transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground hover: bg-muted rounded-md transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 