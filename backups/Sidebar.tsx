import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/Badge';
import { useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, Banknote, Settings, Store, Bot, BarChart2, Users, DollarSign, Truck, X, Building2, Plug, Brain, Sparkles } from 'lucide-react';
import { useSupabase } from '@/lib/SupabaseProvider';
import { useNavigate } from 'react-router-dom';
import { useEnhancedUser } from '@/contexts/EnhancedUserContext';
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
 * @description Interface for sidebar navigation items.
 * @property {string} label - The display label for the nav item.
 * @property {string} href - The navigation path.
 * @property {React.ReactNode} icon - The icon component for the nav item.
 * @property {string} [badge] - Optional badge text.
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const overview: NavItem[] = [
  { label: 'Command Center', href: '/nexus', icon: <Brain className="w-5 h-5" />, badge: 'TRINITY' },
  { label: 'Business Overview', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
];

const departments: NavItem[] = [
  { label: 'Sales', href: '/sales', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Finance', href: '/finance', icon: <Banknote className="w-5 h-5" /> },
  { label: 'Operations', href: '/operations', icon: <Truck className="w-5 h-5" /> },
  { label: 'Data Warehouse', href: '/data-warehouse', icon: <BarChart2 className="w-5 h-5" /> },
];

const aiPowered: NavItem[] = [
  { label: 'AI Chat', href: '/chat', icon: <Bot className="w-5 h-5" /> },
  { label: 'AI Transformation', href: '/ai-transformation', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart2 className="w-5 h-5" /> },
  { label: 'Automation', href: '/automation', icon: <Settings className="w-5 h-5" /> },
];

const marketplace: NavItem[] = [
  { label: 'Pulse', href: '/marketplace', icon: <Store className="w-5 h-5" />, badge: '3 new' },
  { label: 'Add-ons', href: '/add-ons', icon: <Settings className="w-5 h-5" />, badge: 'New' },
  { label: 'Integrations', href: '/integrations', icon: <Plug className="w-5 h-5" /> },
];

const admin: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: <Users className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

/**
 * @name Sidebar
 * @description The main sidebar navigation for the application.
 * @param {SidebarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Sidebar component.
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user: authUser, signOut } = useSupabase();
  const { user: enhancedUser, loading: userLoading } = useEnhancedUser();
  const navigate = useNavigate();

  // Generate personalized navigation based on user role and access
  const getPersonalizedNavigation = () => {
    const userRole = enhancedUser?.profile?.role || 'user';
    const department = enhancedUser?.profile?.department?.toLowerCase();
    const primaryDepartments = enhancedUser?.company?.settings?.primary_departments;
    
    // Add department-specific highlights
    let personalizedDepartments = departments;

    if (primaryDepartments && primaryDepartments.length > 0) {
      personalizedDepartments = departments.filter(d => primaryDepartments.includes(d.label));
    }
    
    personalizedDepartments = personalizedDepartments.map(module => {
      if (department === 'sales' && module.href === '/sales') {
        return { ...module, badge: 'Your Dept' };
      }
      if (department === 'finance' && module.href === '/finance') {
        return { ...module, badge: 'Your Dept' };
      }
      if (department === 'operations' && module.href === '/operations') {
        return { ...module, badge: 'Your Dept' };
      }
      return module;
    });

    // Filter admin section based on role
    let personalizedAdmin = [...admin];
    if (userRole === 'user') {
      personalizedAdmin = personalizedAdmin.filter(item => item.href !== '/admin');
    }

    return {
      overview,
      departments: personalizedDepartments,
      aiPowered,
      marketplace,
      admin: personalizedAdmin
    };
  };

  const personalizedNav = getPersonalizedNavigation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div className="mb-8">
      <h3 className="px-6 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <nav className="space-y-1 px-4">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={toggleSidebar}
              className={`group flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-colors duration-200 ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span className="mr-3 flex-shrink-0">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge className={`ml-2 ${isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen w-80 z-[70] bg-background border-r border-border shadow-lg flex flex-col
        transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      role="navigation"
      aria-modal={isOpen ? 'true' : undefined}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className="p-4.5 bg-transparent rounded-xl">
            <img
              src={enhancedUser?.company?.logo_url || "/Nexus/nexus-square-40x40-transparent.svg"}
              alt={enhancedUser?.company?.name ? `${enhancedUser.company.name} Logo` : "NEXUS Logo"}
              className="w-7 h-7"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {enhancedUser?.company?.name || "NEXUS"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {enhancedUser?.company ? 'Business Management' : 'Business Operating System'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-4 bg-transparent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search pages..."
            className="w-full pl-10 pr-4 py-4 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-6 overflow-y-auto">
        {renderNavSection('Overview', personalizedNav.overview)}
        {renderNavSection('Departments', personalizedNav.departments)}
        {renderNavSection('AI-Powered', personalizedNav.aiPowered)}
        {renderNavSection('Marketplace', personalizedNav.marketplace)}
        {personalizedNav.admin.length > 0 && renderNavSection('Administration', personalizedNav.admin)}
      </div>

      {/* User Profile Section */}
      {(enhancedUser || authUser) && (
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-accent-foreground font-semibold">
              {enhancedUser?.initials || authUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {enhancedUser?.full_name || enhancedUser?.profile?.display_name || authUser?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {enhancedUser?.email || authUser?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {enhancedUser?.profile?.role || authUser?.app_metadata?.role || 'User'}
              </p>
            </div>
          </div>

          {/* Company Info */}
          {enhancedUser?.company && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {enhancedUser.company.name}
                </span>
              </div>
              {enhancedUser.profile?.department && (
                <p className="text-xs text-muted-foreground">
                  {enhancedUser.profile.department}
                </p>
              )}
            </div>
          )}

          {/* Active Integrations */}
          {enhancedUser?.integrations && enhancedUser.integrations.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Plug className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Integrations ({enhancedUser.integrations.filter(i => i.status === 'active').length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {enhancedUser.integrations
                  .filter(i => i.status === 'active')
                  .slice(0, 4)
                  .map((integration) => (
                    <Badge 
                      key={integration.id} 
                      className="text-xs bg-success/10 text-success border-success/20"
                    >
                      {integration.integration?.name || integration.name}
                    </Badge>
                  ))}
                {enhancedUser.integrations.filter(i => i.status === 'active').length > 4 && (
                  <Badge className="text-xs bg-muted text-muted-foreground">
                    +{enhancedUser.integrations.filter(i => i.status === 'active').length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center px-4 py-4 text-sm bg-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Account Settings
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-4 text-sm bg-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
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
  toggleSidebar: () => void;
  bottom?: boolean;
}
const SidebarGroup: React.FC<SidebarGroupProps> = ({ title, items, activeItem, toggleSidebar, bottom }) => (
  <div className={bottom ? 'mt-auto' : ''}>
    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{title}</div>
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = item.label === activeItem;
        return (
          <li key={item.label} className="flex items-center justify-between">
            <NavLink
              to={item.href}
              className={
                `flex items-center gap-2 px-4 py-4 rounded-lg transition-colors outline-none ` +
                (isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')
              }
              aria-current={isActive ? 'page' : undefined}
              tabIndex={0}
              onClick={toggleSidebar}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </NavLink>
            {item.badge && (
              <Badge className={`ml-2 ${isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'}`}>
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
