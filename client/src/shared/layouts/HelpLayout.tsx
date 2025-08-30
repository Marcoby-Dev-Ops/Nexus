import { HelpSidebar } from '@/components/help-center/HelpSidebar';
import { Outlet } from 'react-router-dom';

export function HelpLayout() {
  return (
    <div className="flex h-screen bg-background">
      <HelpSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
} 
