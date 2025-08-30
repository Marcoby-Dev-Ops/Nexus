import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronRight, Home, Workflow, Settings, Grid3X3 } from 'lucide-react';
import { getOverviewItems, getBuildingBlocksItems, getToolsItems, getSettingsItems } from './navConfig';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/hooks/index';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { user: _user } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const overviewItems = getOverviewItems();
  const buildingBlocksItems = getBuildingBlocksItems();
  const toolsItems = getToolsItems();
  const settingsItems = getSettingsItems();

  // Close expanded items when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setExpandedItems(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const isExpanded = (itemName: string) => expandedItems.has(itemName);

  const renderNavItem = (item: any, _level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = isExpanded(item.name);

    return (
      <div key={item.name} className="relative">
        <div
          className="group"
          onMouseEnter={() => setHovered(item.name)}
          onMouseLeave={() => setHovered(null)}
        >
          {hasChildren ? (
            // Parent item with children - clickable to expand/collapse and navigate
            <div className="flex items-center w-full">
              <Link
                to={item.path}
                onClick={onClose}
                className={`flex items-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
                title={item.description}
              >
                {item.icon}
                <span className="ml-3 flex-1 text-left">{item.name}</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpanded(item.name);
                }}
                className="px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
                title="Toggle submenu"
              >
                <ChevronRight 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    expanded ? 'rotate-90' : ''
                  }`} 
                />
              </button>
            </div>
          ) : (
            // Leaf item - direct link
            <Link
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
              title={item.description}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
          
          {/* Tooltip for description */}
          {hovered === item.name && item.description && (
            <div className="absolute left-full top-0 mt-0 ml-2 w-48 bg-popover border border-border rounded-md shadow-lg p-2 z-dropdown">
              <p className="text-xs text-popover-foreground">{item.description}</p>
            </div>
          )}
        </div>

        {/* Submenu - animated accordion */}
        {hasChildren && (
          <div 
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-4 mt-1 space-y-1 pb-2">
              {item.children.map((child: any) => (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={onClose}
                  className={`block px-4 py-2 text-xs rounded-md transition-colors ${
                    isActive(child.path)
                      ? 'bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  title={child.description}
                >
                  {child.name}
                  {child.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {child.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, items: any[], icon: React.ReactNode) => (
    <div className="border-b border-border pb-4 last:border-b-0">
      <div className="px-4 py-2">
        <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {icon}
          <span className="ml-2">{title}</span>
        </div>
      </div>
      <div className="space-y-1">
        {items.map((item) => renderNavItem(item))}
      </div>
    </div>
  );

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/home" className="flex items-center">
            <img 
              src="/Nexus/nexus-horizontal-160x48-transparent.png" 
              alt="Nexus by Marcoby" 
              className="h-8 w-auto"
            />
          </Link>
          <button className="lg:hidden p-2" onClick={onClose} aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="overflow-y-auto h-[calc(100vh-4rem)]">
          {renderSection('Overview', overviewItems, <Home className="h-3 w-3" />)}
          {renderSection('Building Blocks', buildingBlocksItems, <Grid3X3 className="h-3 w-3" />)}
          {renderSection('Tools & Workflow', toolsItems, <Workflow className="h-3 w-3" />)}
          {renderSection('Settings', settingsItems, <Settings className="h-3 w-3" />)}
        </nav>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
} 
