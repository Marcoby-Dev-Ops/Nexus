import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import PropTypes from 'prop-types';

/**
 * @interface LayoutProps
 * @description Props for the Layout component.
 * @property {React.ReactNode} children - The content to be rendered within the layout.
 * @property {Array} breadcrumbs - An array of breadcrumb objects.
 * @property {string} subtitle - The subtitle for the layout.
 */
interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  subtitle?: string;
}

/**
 * @name useDarkMode
 * @description Custom hook to manage dark mode state and persistence.
 * @returns {[boolean, () => void]} - [isDark, toggleTheme]
 */
function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = React.useCallback(() => setIsDark((prev) => !prev), []);
  return [isDark, toggleTheme];
}

/**
 * @name Layout
 * @description The main application layout, including Sidebar, Header, and content area.
 * @param {LayoutProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Layout component.
 */
const Layout: React.FC<LayoutProps> = ({ children, breadcrumbs = [], subtitle }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, toggleTheme] = useDarkMode();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative bg-background text-foreground">
      {/* Sidebar: popout overlay */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/50"
          aria-hidden="true"
        ></div>
      )}
      {/* Header: fixed at top */}
      <Header toggleSidebar={toggleSidebar} onToggleTheme={toggleTheme} isDark={isDark} />
      {/* Spacer for fixed header */}
      <div className="h-16" />
      {/* Main content: no top padding needed */}
      <main className="p-4 transition-all">
        {/* Navigation (breadcrumbs, subtitle) at top of main content */}
        {(breadcrumbs.length > 0 || subtitle) && (
          <div className="mb-4">
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center text-sm text-muted-foreground truncate mb-1" aria-label="Breadcrumb">
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
            )}
            {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  breadcrumbs: PropTypes.array,
  subtitle: PropTypes.string,
};

export default Layout; 