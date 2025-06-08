import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/dashboard' }];

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      // Convert segment to title case and remove hyphens
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  // Get subtitle based on current route
  const getSubtitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Welcome to NEXUS - Your business operating system';
    if (path === '/sales') return 'Sales Dashboard - Track and manage your sales pipeline';
    if (path === '/finance') return 'Finance Hub - Manage your financial operations';
    if (path === '/operations') return 'Operations Center - Streamline your business processes';
    if (path === '/marketplace') return 'Pulse Marketplace - Discover and install business apps';
    if (path === '/data-warehouse') return 'Data Warehouse - Access and analyze your business data';
    if (path === '/admin') return 'Admin Panel - Manage your NEXUS settings';
    return 'Welcome to NEXUS';
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
      <Header
        toggleSidebar={() => setSidebarOpen((v) => !v)}
        breadcrumbs={generateBreadcrumbs()}
      />
      <main className="pt-16 transition-all duration-300 ease-in-out">
        <div className="p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
} 