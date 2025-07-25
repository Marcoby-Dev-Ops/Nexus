import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronRight, Users, Brain } from 'lucide-react';
import { getCoreNavItems, getNavItemsByCategory } from './navConfig.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { useAuth } from '@/hooks/index';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { user } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExpert, setShowExpert] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Get user journey stage (simplified - could be enhanced with actual user data)
  const getUserJourneyStage = () => {
    // This could be enhanced with actual user data from the database
    const daysSinceSignup = user?.created_at ? 
      Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (daysSinceSignup < 7) return 'novice';
    if (daysSinceSignup < 30) return 'intermediate';
    return 'advanced';
  };

  const journeyStage = getUserJourneyStage();
  const coreItems = getCoreNavItems();
  const advancedItems = getNavItemsByCategory('advanced');
  const expertItems = getNavItemsByCategory('expert');



  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'advanced': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'expert': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link to="/dashboard/home" className="flex items-center">
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

        {/* User Journey Indicator */}
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Your Journey</span>
            <Badge variant="outline" className={`text-xs ${getCategoryColor(journeyStage === 'novice' ? 'core' : journeyStage === 'intermediate' ? 'advanced' : 'expert')}`}>
              {journeyStage === 'novice' ? 'Getting Started' : journeyStage === 'intermediate' ? 'Growing' : 'Expert'}
            </Badge>
          </div>
        </div>

        <nav className="mt-2 px-2 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {/* Core Journey Items */}
          <div className="space-y-1">
            {coreItems.map((item) => (
              <div
                key={item.name}
                className="relative group"
                onMouseEnter={() => setHovered(item.name)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover: bg-muted'
                  }`}
                  title={item.description}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.children && (
                    <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </Link>
                
                {/* Tooltip for description */}
                {hovered === item.name && item.description && (
                  <div className="absolute left-full top-0 mt-0 ml-2 w-48 bg-card border border-border rounded-md shadow-lg p-2 z-50">
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                )}

                {/* Submenu */}
                {item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onClose}
                        className={`block px-4 py-2 text-xs rounded-md transition-colors ${
                          isActive(child.path)
                            ? 'bg-primary/5 text-primary'
                            : 'text-muted-foreground hover: text-foreground hover:bg-muted/50'
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
                )}
              </div>
            ))}
          </div>

          {/* Advanced Features Section */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-muted-foreground hover: text-foreground transition-colors"
            >
              <Brain className="h-4 w-4 mr-3" />
              <span>Advanced Features</span>
              <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>
            
            {showAdvanced && (
              <div className="mt-2 space-y-1">
                {advancedItems.map((item) => (
                  <div
                    key={item.name}
                    className="relative group"
                    onMouseEnter={() => setHovered(item.name)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover: bg-muted'
                      }`}
                      title={item.description}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                      {item.children && (
                        <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </Link>
                    
                    {/* Tooltip for description */}
                    {hovered === item.name && item.description && (
                      <div className="absolute left-full top-0 mt-0 ml-2 w-48 bg-card border border-border rounded-md shadow-lg p-2 z-50">
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    )}

                    {/* Submenu */}
                    {item.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={onClose}
                            className={`block px-4 py-2 text-xs rounded-md transition-colors ${
                              isActive(child.path)
                                ? 'bg-primary/5 text-primary'
                                : 'text-muted-foreground hover: text-foreground hover:bg-muted/50'
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expert Features Section */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setShowExpert(!showExpert)}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-muted-foreground hover: text-foreground transition-colors"
            >
              <Users className="h-4 w-4 mr-3" />
              <span>Expert Tools</span>
              <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${showExpert ? 'rotate-90' : ''}`} />
            </button>
            
            {showExpert && (
              <div className="mt-2 space-y-1">
                {expertItems.map((item) => (
                  <div
                    key={item.name}
                    className="relative group"
                    onMouseEnter={() => setHovered(item.name)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover: bg-muted'
                      }`}
                      title={item.description}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                      {item.children && (
                        <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </Link>
                    
                    {/* Tooltip for description */}
                    {hovered === item.name && item.description && (
                      <div className="absolute left-full top-0 mt-0 ml-2 w-48 bg-card border border-border rounded-md shadow-lg p-2 z-50">
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    )}

                    {/* Submenu */}
                    {item.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={onClose}
                            className={`block px-4 py-2 text-xs rounded-md transition-colors ${
                              isActive(child.path)
                                ? 'bg-primary/5 text-primary'
                                : 'text-muted-foreground hover: text-foreground hover:bg-muted/50'
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg: hidden"
          onClick={onClose}
        />
      )}
    </>
  );
} 