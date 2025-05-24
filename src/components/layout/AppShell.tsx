import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Placeholder breadcrumbs and subtitle; in a real app, these would be dynamic
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    // You could add more based on route here
  ];
  const subtitle = 'Welcome to NEXUS - Your business operating system';

  return (
    <div className="min-h-screen h-full flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((v) => !v)} />
      <main className="flex-1 bg-background">
        <Header
          toggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleTheme={() => setIsDark((v) => !v)}
          breadcrumbs={breadcrumbs}
          subtitle={subtitle}
          isDark={isDark}
        />
        <Outlet />
      </main>
    </div>
  );
} 