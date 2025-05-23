import React from 'react';
import PropTypes from 'prop-types';
import AssistantPanel from '../dashboard/AssistantPanel';
import { Tooltip } from '../Tooltip';
import DatetimeTicker from '../lib/DatetimeTicker';

/**
 * @interface HeaderProps
 * @description Props for the Header component.
 * @property {() => void} toggleSidebar - Function to toggle the sidebar visibility.
 * @property {() => void} onToggleTheme - Function to toggle the theme (dark/light).
 * @property {({ label: string; href?: string })[]} breadcrumbs - Array of breadcrumb objects.
 * @property {string} subtitle - Optional subtitle for the header.
 * @property {boolean} isDark - Indicates whether the current theme is dark.
 */
interface HeaderProps {
  toggleSidebar: () => void;
  onToggleTheme: () => void;
  breadcrumbs?: { label: string; href?: string }[];
  subtitle?: string;
  isDark: boolean;
}

/**
 * @name Header
 * @description The main header for the application content area.
 * @param {HeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Header component.
 */
const Header: React.FC<HeaderProps> = ({ toggleSidebar, onToggleTheme, breadcrumbs = [], subtitle, isDark }) => {
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
  const [, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openAssistant = () => setIsAssistantOpen(true);
  const closeAssistant = () => setIsAssistantOpen(false);

  // Add a notification count for demo
  const notificationCount = 3; // Replace with real state as needed

  return (
    <header className="bg-card text-card-foreground shadow p-2 sm:p-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button 
          onClick={toggleSidebar} 
          className="text-primary hover:text-primary-focus md:hidden focus-visible:ring-2 focus-visible:ring-primary transition-colors mr-2"
          aria-label="Open sidebar"
        >
          {/* Hamburger Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        {/* Breadcrumbs: hidden on mobile */}
        <nav className="hidden sm:flex items-center text-sm text-muted-foreground truncate" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.label} className="flex items-center">
              {crumb.href ? (
                <a href={crumb.href} className="hover:underline text-primary font-medium">{crumb.label}</a>
              ) : (
                <span className="font-semibold text-foreground">{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
            </span>
          ))}
        </nav>
        {/* Subtitle: hidden on mobile */}
        {subtitle && <div className="hidden sm:block text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Date and Clock: hidden on mobile */}
        <span className="hidden sm:flex"><DatetimeTicker /></span>
        {/* Theme toggle and bell: always visible */}
        <Tooltip content="Toggle dark mode">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-muted text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} />
                <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
            )}
          </button>
        </Tooltip>
        {/* Notification bell with count badge */}
        <Tooltip content="Notifications">
          <button
            className="relative p-2 rounded-full bg-muted text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label="Notifications"
            onClick={() => alert('Show notifications')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-emerald-500 text-white rounded-full ring-2 ring-background dark:ring-card shadow animate-in">
                {notificationCount}
              </span>
            )}
          </button>
        </Tooltip>
        {/* Chat and grid: hidden on mobile */}
        <Tooltip content="Quick chat">
          <button onClick={openAssistant} className="p-2 rounded-full bg-muted text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary transition-colors hidden sm:inline-flex" aria-label="Quick chat">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.248-.938l-4.272 1.07a.75.75 0 01-.908-.908l1.07-4.272A9.77 9.77 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip content="App launcher">
          <button className="p-2 rounded-full bg-muted text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary transition-colors" aria-label="App launcher">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h.008v.008H4.5V6.75zm7.5 0h.008v.008H12V6.75zm7.5 0h.008v.008H19.5V6.75zM4.5 12h.008v.008H4.5V12zm7.5 0h.008v.008H12V12zm7.5 0h.008v.008H19.5V12zM4.5 17.25h.008v.008H4.5v-.008zm7.5 0h.008v.008H12v-.008zm7.5 0h.008v.008H19.5v-.008z" />
            </svg>
          </button>
        </Tooltip>
      </div>
      {/* Floating chat button for mobile */}
      <button
        onClick={openAssistant}
        className="fixed bottom-4 right-4 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-lg sm:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
        aria-label="Open chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4.248-.938l-4.272 1.07a.75.75 0 01-.908-.908l1.07-4.272A9.77 9.77 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
      {/* Assistant Panel */}
      <AssistantPanel open={isAssistantOpen} onClose={closeAssistant} />
    </header>
  );
};

Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  breadcrumbs: PropTypes.array,
  subtitle: PropTypes.string,
  isDark: PropTypes.bool.isRequired,
};

export default Header; 