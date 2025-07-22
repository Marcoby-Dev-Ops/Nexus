import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings, 
  Zap, 
  FileText, 
  MessageSquare,
  Building2,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Plus,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { useZustandAuth } from '@/shared/hooks/useZustandAuth';

interface WorkTool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'communication' | 'analytics' | 'management' | 'automation';
  status: 'available' | 'coming-soon' | 'beta';
  url: string;
  badge?: string;
}

const WorkspacePage: React.FC = () => {
  const { user, profile } = useZustandAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const workTools: WorkTool[] = [
    {
      id: 'unified-inbox',
      title: 'Unified Inbox',
      description: 'Manage emails from all your connected accounts in one place',
      icon: <Mail className="w-6 h-6" />,
      category: 'communication',
      status: 'available',
      url: '/workspace/inbox',
      badge: 'New'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'View and manage your schedule across all connected calendars',
      icon: <Calendar className="w-6 h-6" />,
      category: 'communication',
      status: 'available',
      url: '/workspace/calendar'
    },
    {
      id: 'business-dashboard',
      title: 'Business Dashboard',
      description: 'Real-time business metrics and performance analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      category: 'analytics',
      status: 'available',
      url: '/workspace/dashboard'
    },
    {
      id: 'team-management',
      title: 'Team Management',
      description: 'Manage team performance, goals, and collaboration',
      icon: <Users className="w-6 h-6" />,
      category: 'management',
      status: 'available',
      url: '/workspace/team'
    },
    {
      id: 'customer-insights',
      title: 'Customer Insights',
      description: 'Analyze customer behavior and satisfaction metrics',
      icon: <Users className="w-6 h-6" />,
      category: 'analytics',
      status: 'available',
      url: '/workspace/customer-insights'
    },
    {
      id: 'automation',
      title: 'Process Automation',
      description: 'Automate repetitive tasks and workflows',
      icon: <Zap className="w-6 h-6" />,
      category: 'automation',
      status: 'beta',
      url: '/workspace/automation',
      badge: 'Beta'
    },
    {
      id: 'document-management',
      title: 'Document Management',
      description: 'Organize and collaborate on business documents',
      icon: <FileText className="w-6 h-6" />,
      category: 'management',
      status: 'coming-soon',
      url: '/workspace/documents'
    },
    {
      id: 'messaging',
      title: 'Team Messaging',
      description: 'Real-time team communication and collaboration',
      icon: <MessageSquare className="w-6 h-6" />,
      category: 'communication',
      status: 'coming-soon',
      url: '/workspace/messaging'
    },
    {
      id: 'company-status',
      title: 'Company Status',
      description: 'Real-time overview of your business health and metrics',
      icon: <Building2 className="w-6 h-6" />,
      category: 'analytics',
      status: 'available',
      url: '/workspace/company-status'
    },
    {
      id: 'goal-tracking',
      title: 'Goal Tracking',
      description: 'Track and manage business goals and objectives',
      icon: <Target className="w-6 h-6" />,
      category: 'management',
      status: 'available',
      url: '/workspace/goals'
    },
    {
      id: 'trends',
      title: 'Trend Analysis',
      description: 'Identify and analyze business trends and patterns',
      icon: <TrendingUp className="w-6 h-6" />,
      category: 'analytics',
      status: 'available',
      url: '/workspace/trends'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'AI-powered business insights and recommendations',
      icon: <Lightbulb className="w-6 h-6" />,
      category: 'analytics',
      status: 'beta',
      url: '/workspace/ai-insights',
      badge: 'AI'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Tools', icon: <Settings className="w-4 h-4" /> },
    { id: 'communication', label: 'Communication', icon: <Mail className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'management', label: 'Management', icon: <Users className="w-4 h-4" /> },
    { id: 'automation', label: 'Automation', icon: <Zap className="w-4 h-4" /> }
  ];

  const filteredTools = selectedCategory === 'all' 
    ? workTools 
    : workTools.filter(tool => tool.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'beta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coming-soon': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisplayName = (profile: any, user: any): string => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.first_name) return profile.first_name;
    if (user?.email) {
      const username = user.email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
    }
    return 'User';
  };

  const handleToolClick = (tool: WorkTool) => {
    if (tool.status === 'available' || tool.status === 'beta') {
      window.location.href = tool.url;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Workspace
            </h1>
            <p className="text-muted-foreground mt-1">
              Tools and resources to help you work efficiently, {getDisplayName(profile, user)}
            </p>
          </div>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Tool
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            {category.icon}
            <span>{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                tool.status === 'coming-soon' ? 'opacity-60' : ''
              }`}
              onClick={() => handleToolClick(tool)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      tool.category === 'communication' ? 'bg-blue-100 text-blue-600' :
                      tool.category === 'analytics' ? 'bg-purple-100 text-purple-600' :
                      tool.category === 'management' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {tool.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{tool.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(tool.status)}>
                          {tool.status === 'coming-soon' ? 'Coming Soon' : 
                           tool.status === 'beta' ? 'Beta' : 'Available'}
                        </Badge>
                        {tool.badge && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                            {tool.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {(tool.status === 'available' || tool.status === 'beta') && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => window.location.href = '/workspace/inbox'}
            >
              <div className="flex items-center space-x-2 w-full">
                <Mail className="w-4 h-4" />
                <Badge variant="outline">Communication</Badge>
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Check Inbox</div>
                <div className="text-xs text-muted-foreground">Review your latest emails and messages</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => window.location.href = '/workspace/dashboard'}
            >
              <div className="flex items-center space-x-2 w-full">
                <BarChart3 className="w-4 h-4" />
                <Badge variant="outline">Analytics</Badge>
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">View Dashboard</div>
                <div className="text-xs text-muted-foreground">Check your business metrics and performance</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => window.location.href = '/workspace/calendar'}
            >
              <div className="flex items-center space-x-2 w-full">
                <Calendar className="w-4 h-4" />
                <Badge variant="outline">Schedule</Badge>
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">View Calendar</div>
                <div className="text-xs text-muted-foreground">Check your schedule and upcoming meetings</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">New email from client</div>
                <div className="text-xs text-muted-foreground">2 minutes ago</div>
              </div>
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Revenue target updated</div>
                <div className="text-xs text-muted-foreground">15 minutes ago</div>
              </div>
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Team meeting scheduled</div>
                <div className="text-xs text-muted-foreground">1 hour ago</div>
              </div>
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspacePage; 