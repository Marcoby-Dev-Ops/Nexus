import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users } from 'lucide-react';

const adminNavItems = [
  { name: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> }
];

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-muted/40 border-r border-border p-4">
        <h2 className="text-lg font-semibold mb-4">Admin</h2>
        <nav className="space-y-2">
          {adminNavItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 text-sm py-2 px-4 rounded-md transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}; 
