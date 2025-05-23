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
    <div className="flex h-screen bg-background text-foreground overflow-x-hidden">
      {/* Sidebar (Zone 1) */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-hidden="true"
        ></div>
      )}
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ml-0 md:ml-64">
        {/* Top Bar (Zone 2) */}
        <Header toggleSidebar={toggleSidebar} onToggleTheme={toggleTheme} isDark={isDark} breadcrumbs={breadcrumbs} subtitle={subtitle} />
        {/* Main content (Zones 3-5) */}
        <main className="flex-1 min-h-0 overflow-x-auto bg-background p-2 sm:p-4">
          {/* Adjust ml-64 if sidebar width changes. This is for when sidebar is static. */}
          {/* On mobile, when sidebar is an overlay, main content should not have margin. */}
          {/* We need to conditionally apply margin or adjust layout if sidebar is an overlay vs static. */}
          {/* For now, let's adjust main content padding/margin based on screen size, assuming sidebar is static on md+ */} 
          {children}
        </main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  breadcrumbs: PropTypes.array,
  subtitle: PropTypes.string,
};

export default Layout; 