import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Target, 
  Search, 
  Database
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';

interface QuickAccessItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  color: string;
}

export const QuickAccessBar: React.FC = () => {
  const quickAccessItems: QuickAccessItem[] = [
    {
      name: 'Home',
      path: '/dashboard/home',
      icon: <Home className="h-4 w-4" />,
      description: 'What\'s going on in my world?',
      color: 'bg-blue-500'
    },
    {
      name: 'Workspace',
      path: '/tasks/workspace/actions',
      icon: <Search className="h-4 w-4" />,
      description: 'How do I want to address what\'s going on?',
      color: 'bg-green-500'
    },
    {
      name: 'FIRE Cycle',
      path: '/business/fire-cycle',
      icon: <Target className="h-4 w-4" />,
      description: 'Thought/Idea/Initiative Management',
      color: 'bg-purple-500'
    },
    {
      name: 'Knowledge',
      path: '/integrations/knowledge',
      icon: <Database className="h-4 w-4" />,
      description: 'Pull in data to enhance my knowledge',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="hidden lg:flex items-center space-x-2">
      {quickAccessItems.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 px-3 py-2 hover: bg-muted transition-colors"
            title={item.description}
          >
            <div className={`p-1 rounded ${item.color} text-white`}>
              {item.icon}
            </div>
            <span className="text-sm font-medium">{item.name}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-1">
                {item.badge}
              </Badge>
            )}
          </Button>
        </Link>
      ))}
    </div>
  );
}; 