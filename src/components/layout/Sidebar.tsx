import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '../Badge';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Handshake, Banknote, Settings, Store, Bot, BarChart2, Users, Layers } from 'lucide-react';
// import { Badge } from 'shadcn/ui'; // Uncomment if Badge is available

/**
 * @interface SidebarProps
 * @description Props for the Sidebar component.
 * @property {boolean} isOpen - Whether the sidebar is open (on small screens).
 * @property {() => void} toggleSidebar - Function to toggle the sidebar visibility.
 * @property {string} activeItem - The label of the currently active nav item.
 */
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeItem?: string;
}

/**
 * @interface NavItem
 * @description Navigation item for the sidebar.
 * @property {string} label - The display label for the nav item.
 * @property {string} href - The link URL.
 * @property {JSX.Element} icon - The icon for the nav item.
 * @property {string} badge - The badge for the nav item.
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const coreModules: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Sales', href: '/sales', icon: <Handshake className="w-5 h-5" /> },
  { label: 'Finance', href: '/finance', icon: <Banknote className="w-5 h-5" /> },
  { label: 'Operations', href: '/operations', icon: <Layers className="w-5 h-5" /> },
  { label: 'Data Warehouse', href: '/data-warehouse', icon: <BarChart2 className="w-5 h-5" /> },
];
const marketplace: NavItem[] = [
  { label: 'Pulse', href: '/pulse', icon: <Store className="w-5 h-5" />, badge: '3 new' },
  { label: 'Add-ons', href: '/add-ons', icon: <Settings className="w-5 h-5" />, badge: 'New' },
  { label: 'Integrations', href: '/integrations', icon: <Bot className="w-5 h-5" /> },
];
const aiAssistants: NavItem[] = [
  { label: 'Chat', href: '/chat', icon: <Bot className="w-5 h-5" /> },
  { label: 'Automation', href: '/automation', icon: <Settings className="w-5 h-5" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart2 className="w-5 h-5" /> },
];
const admin: NavItem[] = [
  { label: 'Tenants', href: '/tenants', icon: <Users className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

/**
 * @name Sidebar
 * @description The main sidebar navigation for the application.
 * @param {SidebarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Sidebar component.
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const activeItem =
    coreModules.concat(marketplace, aiAssistants, admin).find((item) => item.href === location.pathname)?.label || 'Dashboard';
  return (
    <aside
      className={`flex flex-col h-full w-64 bg-card text-card-foreground p-4 shadow-lg border-r border-primary/20 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-full md:w-64`}
      role="dialog"
      aria-modal={isOpen && window.innerWidth < 768 ? 'true' : undefined}
    >
      {/* Brand block */}
      <div className="flex items-center gap-2 mb-6">
        {/* Nexus logo */}
        <img
          src="/Nexus/nexus-square-40x40-transparent.svg"
          alt="NEXUS Logo"
          className="w-8 h-8 rounded shadow"
        />
        <span className="text-xl font-bold text-primary">NEXUS</span>
      </div>
      {/* Search bar */}
      <div className="mb-4">
        <input type="text" placeholder="Search modules…" className="w-full px-3 py-2 rounded bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      {/* Navigation groups */}
      <nav className="flex flex-col gap-4 flex-1">
        <SidebarGroup title="Core Modules" items={coreModules} activeItem={activeItem} />
        <SidebarGroup title="Marketplace" items={marketplace} activeItem={activeItem} />
        <SidebarGroup title="AI Assistants" items={aiAssistants} activeItem={activeItem} />
        <SidebarGroup title="Admin" items={admin} activeItem={activeItem} bottom />
      </nav>
      {/* User avatar block at bottom */}
      <div className="sticky bottom-4 left-4 right-4 flex items-center gap-3 p-2 bg-muted rounded shadow mt-auto">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">V</div>
        <div className="flex-1">
          <div className="text-sm font-medium">vonj@email.com</div>
        </div>
        <button className="p-2 hover:bg-accent rounded-full transition-colors" aria-label="Settings">
          {/* Settings gear icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  activeItem: PropTypes.string,
};

// SidebarGroup helper component
interface SidebarGroupProps {
  title: string;
  items: NavItem[];
  activeItem: string;
  bottom?: boolean;
}
const SidebarGroup: React.FC<SidebarGroupProps> = ({ title, items, activeItem, bottom }) => (
  <div className={bottom ? 'mt-auto' : ''}>
    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{title}</div>
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = item.label === activeItem;
        return (
          <li key={item.label} className="flex items-center justify-between">
            <Link
              to={item.href}
              className={
                `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors outline-none ` +
                (isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-sm'
                  : 'hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary')
              }
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </Link>
            {item.badge && (
              <Badge variant="secondary" size="xs" className="ml-2">
                {item.badge}
              </Badge>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

export default Sidebar;
