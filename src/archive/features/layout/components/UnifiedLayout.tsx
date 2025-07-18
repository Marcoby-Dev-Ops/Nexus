import React, { type ReactNode, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, Bell, User, Sun, Moon, Sparkles } from 'lucide-react';
import { navItems } from './navConfig.tsx';
import { useTheme } from '@/shared/components/ui/theme-provider';
import { useNotifications } from '@/shared/core/hooks/NotificationContext';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { QuickChatTrigger } from '@/shared/ai/components/QuickChatTrigger';
import { OrgSwitcher } from './OrgSwitcher';
import { Settings } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { features as featureRegistry } from '@/shared/lib/ui/featureRegistry';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { OnboardingChecklist } from '../onboarding/OnboardingChecklist';
import { ThemePanel } from '../theme/ThemePanel';
type NavItem = import("./navConfig").NavItem;

interface UnifiedLayoutProps {
  children: ReactNode;
}

/**
 * UnifiedLayout
 * Main application shell with sidebar, topbar, and global search.
 * - Keyboard accessible
 * - ARIA labels and roles
 * - Focus management for modals and menus
 * - Uses only design tokens/Tailwind
 * @param {UnifiedLayoutProps} props
 * @returns {JSX.Element}
 */
export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { user, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  // Determine if a nav item is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  // Derive display name and initials from auth user
  const displayName = user?.name || user?.profile?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2) || 'U';

  // Close menus on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu, showNotifications]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when modal opens
  React.useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Search results: navItems + featureRegistry
  const navResults = navItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const featureResults = featureRegistry.filter((f: { name: string }) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const results = [...navResults, ...featureResults];

  // Keyboard navigation in results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSearchIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSearchIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[searchIndex]) {
      window.location.href = results[searchIndex].path;
      setSearchOpen(false);
      setSearchQuery('');
      setSearchIndex(0);
    }
  };

  return (
    <div className="flex h-screen text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onSidebarToggle={() => setSidebarOpen(true)} onThemePanelToggle={() => setIsThemePanelOpen(!isThemePanelOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <OnboardingChecklist />
      {isThemePanelOpen && <ThemePanel />}
    </div>
  );
}; 