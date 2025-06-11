import React, { type ReactNode, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, Search, Bell, Settings, User, Home, LayoutDashboard, Banknote, Truck, BarChart2, Brain, Bot, Sparkles, LineChart, Store, Plug, Users } from 'lucide-react';

interface UnifiedLayoutProps {
  children: ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Navigation items updated to match Sidebar.tsx and App.tsx routes
  const navItems = [
    // { name: 'Command Center', path: '/nexus', icon: <Brain className="h-5 w-5" /> }, // Hidden until ready
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Workspace', path: '/workspace', icon: <Search className="h-5 w-5" /> },
    { name: 'Sales', path: '/departments/sales/performance', icon: <Users className="h-5 w-5" /> },
    { name: 'Finance', path: '/departments/finance/operations', icon: <Banknote className="h-5 w-5" /> },
    { name: 'Operations', path: '/departments/operations/analytics', icon: <Truck className="h-5 w-5" /> },
    { name: 'Data Warehouse', path: '/data-warehouse', icon: <BarChart2 className="h-5 w-5" /> },
    { name: 'AI Hub', path: '/ai-hub', icon: <Brain className="h-5 w-5" /> },
    { name: 'AI Chat', path: '/chat', icon: <Bot className="h-5 w-5" /> },
    { name: 'Marketplace', path: '/marketplace', icon: <Store className="h-5 w-5" /> },
    { name: 'Integrations', path: '/integrations', icon: <Plug className="h-5 w-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  // Determine if a nav item is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for larger screens */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/" className="text-xl font-bold">Nexus</Link>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-5 px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card shadow z-10 border-b border-border">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold">
                {navItems.find(item => isActive(item.path))?.name || 'Nexus'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-foreground p-1 rounded-full hover:bg-muted">
                <Bell className="h-6 w-6" />
              </button>
              <button className="text-foreground p-1 rounded-full hover:bg-muted">
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 