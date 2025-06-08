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

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profile: any) => {
    if (!profile) return 0;
    
    const fields = [
      'first_name', 'last_name', 'avatar_url', 'bio', 'phone', 
      'job_title', 'department', 'location', 'timezone'
    ];
    
    const completedFields = fields.filter(field => {
      const value = profile[field];
      return value && value !== '';
    }).length;
    
    return Math.round((completedFields / fields.length) * 100);
  };

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
                          <div className="flex items-start space-x-4">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.type === 'success' ? 'bg-success' :
                              notification.type === 'warning' ? 'bg-warning' :
                              notification.type === 'error' ? 'bg-destructive' :
                              'bg-primary'
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
                    <div className="p-4 border-t border-border">
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
                <div className="absolute right-0 top-full mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-semibold text-xl">
                        {enhancedUser?.initials || basicUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-foreground truncate">
                          {enhancedUser?.full_name || enhancedUser?.profile?.display_name || basicUser?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {enhancedUser?.email || basicUser?.email}
                        </p>
                        {enhancedUser?.profile?.job_title && (
                          <p className="text-sm text-muted-foreground truncate font-medium">
                            {enhancedUser.profile.job_title}
                            {enhancedUser?.profile?.department && (
                              <span className="text-xs"> • {enhancedUser.profile.department}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Profile Info */}
                    <div className="mt-4 space-y-4">
                      {/* Company Info */}
                      {enhancedUser?.company && (
                        <div className="flex items-center space-x-4 p-2 bg-muted/30 rounded-md">
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {enhancedUser.company.name}
                            </p>
                            {enhancedUser.company.industry && (
                              <p className="text-xs text-muted-foreground truncate">
                                {enhancedUser.company.industry} • {enhancedUser.company.size}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Info */}
                      {(enhancedUser?.profile?.phone || enhancedUser?.profile?.location) && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {enhancedUser?.profile?.phone && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{enhancedUser.profile.phone}</span>
                            </div>
                          )}
                          {enhancedUser?.profile?.location && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{enhancedUser.profile.location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Role Badge */}
                      {enhancedUser?.profile?.role && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground capitalize">
                              {enhancedUser.profile.role}
                            </span>
                          </div>
                          {enhancedUser.profile.work_location && (
                            <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                              {enhancedUser.profile.work_location === 'remote' ? '🏠 Remote' :
                               enhancedUser.profile.work_location === 'hybrid' ? '🏢 Hybrid' : '🏢 Office'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Profile Completion */}
                      {enhancedUser?.profile && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Profile Completion</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-1 bg-muted rounded-full">
                              <div 
                                className="h-1 bg-primary rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${calculateProfileCompletion(enhancedUser.profile)}%` 
                                }}
                              />
                            </div>
                            <span className="text-muted-foreground font-medium">
                              {calculateProfileCompletion(enhancedUser.profile)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile
                        window.location.href = '/profile';
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-foreground bg-transparent hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <User className="w-4 h-4 mr-3" />
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to settings
                        window.location.href = '/settings';
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-foreground bg-transparent hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-foreground bg-transparent hover:bg-muted/50 rounded-md transition-colors"
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