import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useToast } from '@/shared/components/ui/use-toast';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { Search, Settings, User, Calendar, FileText, BarChart3, Zap, Mail, MessageSquare, Users, Building, CreditCard, Shield, HelpCircle, LogOut } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  category: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const commandItems: CommandItem[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your account settings',
      icon: User,
      action: () => {
        toast({ title: 'Profile Settings', description: 'Opening profile settings...' });
      },
      category: 'Account'
    },
    {
      id: 'settings',
      title: 'General Settings',
      description: 'Configure application settings',
      icon: Settings,
      action: () => {
        toast({ title: 'Settings', description: 'Opening settings...' });
      },
      category: 'System'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'View and manage your calendar',
      icon: Calendar,
      action: () => {
        toast({ title: 'Calendar', description: 'Opening calendar...' });
      },
      category: 'Productivity'
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Access your documents',
      icon: FileText,
      action: () => {
        toast({ title: 'Documents', description: 'Opening documents...' });
      },
      category: 'Productivity'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View business analytics',
      icon: BarChart3,
      action: () => {
        toast({ title: 'Analytics', description: 'Opening analytics...' });
      },
      category: 'Business'
    },
    {
      id: 'automation',
      title: 'Automation',
      description: 'Manage automated workflows',
      icon: Zap,
      action: () => {
        toast({ title: 'Automation', description: 'Opening automation...' });
      },
      category: 'Business'
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Check your email',
      icon: Mail,
      action: () => {
        toast({ title: 'Email', description: 'Opening email...' });
      },
      category: 'Communication'
    },
    {
      id: 'chat',
      title: 'Chat',
      description: 'Open chat interface',
      icon: MessageSquare,
      action: () => {
        toast({ title: 'Chat', description: 'Opening chat...' });
      },
      category: 'Communication'
    },
    {
      id: 'team',
      title: 'Team Management',
      description: 'Manage your team',
      icon: Users,
      action: () => {
        toast({ title: 'Team Management', description: 'Opening team management...' });
      },
      category: 'Business'
    },
    {
      id: 'company',
      title: 'Company Profile',
      description: 'Manage company information',
      icon: Building,
      action: () => {
        navigate('/quantum/identity/profile');
        toast({ title: 'Company Profile', description: 'Opening company profile...' });
      },
      category: 'Business'
    },
    {
      id: 'billing',
      title: 'Billing',
      description: 'Manage billing and subscriptions',
      icon: CreditCard,
      action: () => {
        toast({ title: 'Billing', description: 'Opening billing...' });
      },
      category: 'Account'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Security settings and preferences',
      icon: Shield,
      action: () => {
        toast({ title: 'Security', description: 'Opening security settings...' });
      },
      category: 'Account'
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and support',
      icon: HelpCircle,
      action: () => {
        toast({ title: 'Help & Support', description: 'Opening help...' });
      },
      category: 'System'
    },
    {
      id: 'signout',
      title: 'Sign Out',
      description: 'Sign out of your account',
      icon: LogOut,
      action: () => {
        signOut();
        toast({ title: 'Signed Out', description: 'You have been signed out successfully.' });
      },
      category: 'Account'
    }
  ];

  const filteredItems = commandItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      setIsOpen(true);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = useCallback((item: CommandItem) => {
    item.action();
    setIsOpen(false);
    setSearch('');
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search or jump to...
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0">
          <DialogHeader className="px-4 py-3">
            <DialogTitle>Search Commands</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4"
            />
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No results found.
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center space-x-3 p-3 text-left rounded-md hover:bg-muted transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 
