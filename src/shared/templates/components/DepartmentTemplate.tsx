import React, { type ReactNode } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  Bell
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';

export interface DepartmentAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  primary?: boolean;
}

export interface SummaryMetric {
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon?: ReactNode;
}

export interface DepartmentTemplateProps {
  /** Department name (e.g. "Sales", "Finance") */
  title: string;
  /** Optional subtitle or description */
  description?: string;
  /** Department icon */
  icon?: ReactNode;
  /** Primary actions for this department */
  actions?: DepartmentAction[];
  /** Summary metrics to display */
  metrics?: SummaryMetric[];
  /** Tab definitions */
  tabs?: {
    id: string;
    label: string;
    content: ReactNode;
  }[];
  /** Default active tab */
  defaultTab?: string;
  /** Main content */
  children?: ReactNode;
  /** Whether to show the search bar */
  showSearch?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DepartmentTemplate - A standardized template for department pages
 * 
 * Provides consistent layout for all department pages including:
 * - Header with title, description and actions
 * - Summary metrics
 * - Tabbed interface
 * - Standardized search and filters
 */
export const DepartmentTemplate: React.FC<DepartmentTemplateProps> = ({
  title,
  description,
  icon,
  actions = [],
  metrics = [],
  tabs = [],
  defaultTab,
  children,
  showSearch = true,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Department Header */}
      <div className="rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            {icon && (
              <div className="mr-3 h-10 w-10 rounded-full flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && <p>{description}</p>}
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex items-center space-x-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.primary ? 'default' : 'outline'}
                  className={action.primary ? '' : ''}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {/* Department Metrics */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      {metric.change && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${metric.change.positive ? '' : ''}`}
                        >
                          {metric.change.positive ? '↑' : '↓'} {metric.change.value}
                        </Badge>
                      )}
                    </div>
                    {metric.icon && (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center">
                        {metric.icon}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Search and Filter Bar */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="h-10">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>
      )}
      {/* Tabbed Interface */}
      {tabs.length > 0 ? (
        <Tabs defaultValue={defaultTab || tabs[0].id}>
          <TabsList className="mb-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        children
      )}
    </div>
  );
}; 