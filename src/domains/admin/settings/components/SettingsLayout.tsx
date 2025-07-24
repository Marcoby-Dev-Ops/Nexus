import React from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Shield, Users, CreditCard, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import Breadcrumbs from '../ui/Breadcrumbs';
import type { BreadcrumbItem } from '../ui/Breadcrumbs';

interface SettingsLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  isAdmin?: boolean;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  title,
  description,
  isAdmin = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Settings navigation items
  const settingsNavItems: { title: string; icon: React.ReactNode; path: string; admin?: boolean }[] = [
    {
      title: 'Profile',
      icon: <User className="h-4 w-4" />,
      path: '/settings',
    },
    {
      title: 'Security',
      icon: <Shield className="h-4 w-4" />,
      path: '/settings',
    },
    {
      title: 'Billing',
      icon: <CreditCard className="h-4 w-4" />,
      path: '/settings',
    },
    {
      title: 'Team',
      icon: <Users className="h-4 w-4" />,
      path: '/settings',
      admin: true,
    },
  ];
  
  // Filter nav items based on admin status
  const filteredNavItems = settingsNavItems.filter(item => 
    !item.admin || (item.admin && isAdmin)
  );
  
  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Settings', href: '/settings' },
  ];
  
  // If on nested route, append its label
  const currentNav = filteredNavItems.find(item => item.path === location.pathname);
  if (currentNav && currentNav.path !== '/settings') {
    breadcrumbItems.push({ label: currentNav.title, current: true });
  }
  
  // Check if a nav item is active
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="flex flex-col space-y-8 lg: flex-row lg:space-x-12 lg:space-y-0">
      <aside className="-mx-4 lg:w-1/5 lg:min-w-[250px]">
        <div className="lg:pr-4 lg:sticky lg:top-16 lg:h-[calc(100vh-120px)] overflow-auto">
          <div className="px-4 py-2">
            <div className="flex items-center space-x-2 mb-4">
              <SettingsIcon className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Settings</h2>
            </div>
            <div className="space-y-1">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start ${isActive(item.path) ? 'bg-muted' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                  {isActive(item.path) && (
                    <ChevronRight className="h-4 w-4 ml-auto opacity-60" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 lg: max-w-3xl">
        <div className="space-y-6">
          <Breadcrumbs items={breadcrumbItems} />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Separator />
          <div className="pb-16">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}; 