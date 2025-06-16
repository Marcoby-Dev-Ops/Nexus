import { useState } from 'react';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { QuickChatTrigger } from '@/components/ai/QuickChatTrigger';
import { useAuth } from '@/contexts/AuthContext';

const AppShell = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    if (pathnames.length === 0) {
      return [{ label: 'Dashboard' }];
    }

    const crumbs = pathnames.map((name, index) => {
      const href = '/' + pathnames.slice(0, index + 1).join('/');
      const label = name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { label, href };
    });

    return [{ label: 'Home', href: '/dashboard' }, ...crumbs];
  };

  const getPageTitle = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    if (pathnames.length > 0) {
      return pathnames[pathnames.length - 1].charAt(0).toUpperCase() + pathnames[pathnames.length - 1].slice(1);
    }
    return 'Welcome to NEXUS';
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <Header 
          pageTitle={getPageTitle()}
          breadcrumbs={generateBreadcrumbs()}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* <DebugOnboardingTrigger /> */}
      <QuickChatTrigger />
    </div>
  );
};

export default AppShell; 