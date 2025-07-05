import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ui/theme-provider';
import { useNotifications } from '@/contexts/NotificationContext';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { QuickChatTrigger } from '@/components/ai/QuickChatTrigger';
import { Menu, Bell, Sun, Moon, User, Settings, Search } from 'lucide-react';
import { navItems } from './navConfig';
import { features as featureRegistry } from '@/lib/ui/featureRegistry';

type NavItem = import('./navConfig').NavItem;

interface FeatureItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
}

export function Header({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  
  const results: (NavItem | FeatureItem)[] = [
    ...navItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
    ...featureRegistry.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter' && results[searchIndex]) {
      const targetPath = results[searchIndex].path;
      if (targetPath) {
        window.location.href = targetPath;
      }
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

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
  
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-card shadow-sm z-30 border-b border-border">
      <div className="flex h-16 items-center justify-between px-4">
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
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            aria-label="Open global search"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </button>
          <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Global Search">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, features..."
              aria-label="Search"
              className="mb-4"
            />
            <ul role="listbox" aria-label="Search results">
              {results.length === 0 && <li className="p-4 text-center text-muted-foreground">No results found.</li>}
              {results.map((item, i) => (
                <li
                  key={item.path || (item as FeatureItem).id}
                  role="option"
                  aria-selected={i === searchIndex}
                  className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${i === searchIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onMouseEnter={() => setSearchIndex(i)}
                  onClick={() => {
                    if (item.path) {
                      window.location.href = item.path;
                    }
                    setSearchOpen(false);
                    setSearchQuery('');
                    setSearchIndex(0);
                  }}
                >
                  {item.icon && <span className="mr-3 text-muted-foreground">{item.icon}</span>}
                  {item.name}
                </li>
              ))}
            </ul>
          </Modal>

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
                <div className="p-3 border-b border-border flex items-center justify-between">
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
                        className={`p-3 border-b border-border last:border-b-0 ${!notification.read ? 'bg-muted/50' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'error' ? 'bg-red-500' :
                            'bg-blue-500'
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
          
          <QuickChatTrigger position="bottom-right" theme="vibrant" showBadge={false} />

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
                <div className="p-4 border-b border-border flex items-center space-x-3">
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
                    className="w-full flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-muted-foreground" />
                    View Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
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
                    className="w-full flex items-center px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
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