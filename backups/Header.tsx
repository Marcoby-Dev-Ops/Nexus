import React from 'react';
import PropTypes from 'prop-types';
import DatetimeTicker from '../lib/DatetimeTicker';
// Removed imports for deleted components
import { useTheme } from '@/components/ui/theme-provider';
import MultiAgentPanel from '../dashboard/MultiAgentPanel';
import { useNotifications, formatTimeAgo } from '@/contexts/NotificationContext';
import { useUser } from '@/contexts/UserContext';
import { useEnhancedUser } from '@/contexts/EnhancedUserContext';
import { Menu, Sun, Moon, Bell, Sparkles, Building2, User, Settings } from 'lucide-react';



/**
 * @interface HeaderProps
 * @description Props for the Header component.
 * @property {() => void} toggleSidebar - Function to toggle the sidebar visibility.
 * @property {Array<{label: string, href?: string}>} [breadcrumbs] - Breadcrumb navigation items.
 * @property {() => void} [onToggleTheme] - Optional function to toggle theme.
 * @property {boolean} [isDark] - Optional dark mode state.
 */
interface HeaderProps {
  toggleSidebar: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

/**
 * @name Header
 * @description The main header for the application content area.
 * @param {HeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Header component.
 */
const Header: React.FC<HeaderProps> = ({ toggleSidebar, breadcrumbs, onToggleTheme, isDark: isDarkProp }) => {
  const [isAssistantOpen, setIsAssistantOpen] = React.useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = React.useState<boolean>(false);
  const [showNotifications, setShowNotifications] = React.useState<boolean>(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { user: basicUser, logout } = useUser();
  const { user: enhancedUser, loading: userLoading } = useEnhancedUser();

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu, showNotifications]);
  
  // Use prop if provided, otherwise fallback to context
  const isDark = typeof isDarkProp === 'boolean'
    ? isDarkProp
    : theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const openAssistant = () => setIsAssistantOpen(true);
  const closeAssistant = () => setIsAssistantOpen(false);

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-6 sm:px-8">
          {/* Left side: Menu button + Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1">
            {/* Hamburger menu button */}
            <button
              onClick={toggleSidebar}
              title="Open sidebar"
              className="p-2 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="hidden md:flex items-center text-sm" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.label} className="flex items-center">
                    {idx > 0 && (
                      <svg className="w-4 h-4 text-muted-foreground mx-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-foreground font-medium">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Center: Logo */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              <img
                src="/Nexus/nexus-square-40x40-transparent.svg"
                alt="NEXUS Logo"
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-foreground">NEXUS</span>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-4 sm:gap-4 flex-1 justify-end">
            {/* Date/Time */}
            <div className="hidden lg:block text-right mr-2">
              <div className="text-xs text-muted-foreground">
                <DatetimeTicker />
              </div>
            </div>

            {/* Theme toggle */}
            <button
              onClick={handleToggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                title="Notifications"
                className="p-2 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                  {unreadCount}
                </span>
              )}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            notifications.forEach(n => !n.read && markAsRead(n.id));
                          }}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'error' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground font-medium">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-border">
                      <button className="w-full text-sm text-center text-primary hover:text-primary/80 transition-colors">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Assistant */}
            <button
              onClick={openAssistant}
              title="Open AI Assistant"
              className="p-2 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                title="User Profile"
                className="p-2 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-semibold text-sm">
                  {enhancedUser?.initials || basicUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-semibold text-lg">
                        {enhancedUser?.initials || basicUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {enhancedUser?.full_name || enhancedUser?.profile?.display_name || basicUser?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {enhancedUser?.email || basicUser?.email}
                        </p>
                        {enhancedUser?.profile?.job_title && (
                          <p className="text-xs text-muted-foreground truncate">
                            {enhancedUser.profile.job_title}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Company Info */}
                    {enhancedUser?.company && (
                      <div className="mt-3 p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {enhancedUser.company.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground capitalize">
                            {enhancedUser.profile?.role || 'User'}
                          </span>
                          {enhancedUser.profile?.department && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {enhancedUser.profile.department}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to settings
                        window.location.href = '/settings';
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-foreground bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-foreground bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* AI Assistant Panel */}
      <MultiAgentPanel open={isAssistantOpen} onClose={closeAssistant} />
    </>
  );
};

Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
    })
  ),
  onToggleTheme: PropTypes.func,
  isDark: PropTypes.bool,
};

export default Header; 