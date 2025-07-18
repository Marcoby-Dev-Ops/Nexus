import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { useTheme } from '@/shared/components/ui/theme-provider';
import { useNotifications } from '@/core/hooks/NotificationContext';
import { CommandPalette } from '@/shared/components/layout/CommandPalette';
import { QuickChatTrigger } from '@/domains/ai/components/QuickChatTrigger';
import { Menu, Bell, Sun, Moon, User, Settings, Search, Palette, Mail, Calendar as CalendarIcon, MessageSquare, Lightbulb, Home } from 'lucide-react';
import { navItems } from '@/shared/components/layout/navConfig';
import { features as featureRegistry } from '@/shared/components/ui/featureRegistry';
import { useThoughtAssistantStore } from '@/shared/stores/thoughtAssistantStore';

type NavItem = import('./navConfig').NavItem;

interface FeatureItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
}

export function Header({ onSidebarToggle, onThemePanelToggle }: { onSidebarToggle: () => void; onThemePanelToggle: () => void; }) {
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

  const displayName = user?.name || user?.profile?.display_name || user?.email?.split('@')[0] || 'User';
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
        <div className="flex items-center gap-2">
          <Link to="/home" className="flex items-center mr-2">
            <img src="/Nexus/nexus-horizontal-160x48-transparent.png" alt="Nexus by Marcoby" className="h-8 w-auto" />
          </Link>
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
        {/* Persistent Workspace Shortcuts */}
        <nav className="flex items-center gap-2 md:gap-4">
          <Link to="/workspace" className="flex flex-col items-center px-2 py-1 hover:bg-muted rounded transition-colors" title="Workspace">
            <Home className="w-5 h-5" />
            <span className="text-xs hidden md:block">Workspace</span>
          </Link>
          <Link to="/workspace/inbox" className="flex flex-col items-center px-2 py-1 hover:bg-muted rounded transition-colors font-semibold text-primary" title="Unified Inbox">
            <Mail className="w-5 h-5" />
            <span className="text-xs hidden md:block">Inbox</span>
          </Link>
          <Link to="/workspace/calendar-unified" className="flex flex-col items-center px-2 py-1 hover:bg-muted rounded transition-colors font-semibold text-primary" title="Unified Calendar">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs hidden md:block">Calendar</span>
          </Link>
          <Link to="/chat" className="flex flex-col items-center px-2 py-1 hover:bg-muted rounded transition-colors" title="Chat">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs hidden md:block">Chat</span>
          </Link>
        </nav>
        {/* End Workspace Shortcuts */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            aria-label="Open command palette"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </button>
          <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

          {/* Global Capture Thought Button (desktop only) */}
          <button
            aria-label="Capture Thought"
            className="hidden md:inline-flex p-2 rounded-full text-warning hover:text-foreground hover:bg-warning/20 transition-colors"
            onClick={open}
            title="Capture Thought (Global)"
            type="button"
          >
            <Lightbulb className="w-5 h-5" />
          </button>

          <button
            onClick={onThemePanelToggle}
            title="Customize Theme"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Palette className="w-5 h-5" />
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

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
                      className="text-xs text-primary hover:underline"
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
                        className={`p-4 border-b border-border last:border-b-0 ${!notification.read ? 'bg-muted/50' : ''}`}
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
                              className="text-xs text-primary hover:underline"
                            >
                              Mark read
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
          
          <QuickChatTrigger />

          <div className="relative" ref={userMenuRef}>
            <button
              title="User Profile"
              className="w-8 h-8 rounded-full bg-accent hover:opacity-90 transition-opacity flex items-center justify-center"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="text-sm font-semibold text-accent-foreground">{initials}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-border flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-lg font-semibold text-accent-foreground">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-muted-foreground" />
                    View Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                    Account Settings
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3v1" /></svg>
                    Sign Out
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