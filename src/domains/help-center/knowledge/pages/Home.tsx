import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Lightbulb, 
  Users, 
  DollarSign,
  BarChart3,
  Zap,
  ArrowRight,
  Plus
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/core/auth/AuthProvider';

interface PriorityItem {
  id: string;
  title: string;
  description: string;
  category: 'urgent' | 'important' | 'opportunity' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  estimatedTime?: string;
  progress?: number;
  impact: 'revenue' | 'operations' | 'team' | 'customer';
  actionUrl?: string;
}

interface DailyInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  action?: string;
  actionUrl?: string;
}

const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const [integrationMessage, setIntegrationMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Handle integration callback messages
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const integration = searchParams.get('integration');
    const status = searchParams.get('status');

    if (integration && status) {
      if (status === 'connected') {
        setIntegrationMessage({
          type: 'success',
          message: `${integration.charAt(0).toUpperCase() + integration.slice(1)} has been successfully connected!`
        });
      } else if (status === 'error') {
        setIntegrationMessage({
          type: 'error',
          message: `Failed to connect ${integration}. Please try again.`
        });
      }

      // Clear the URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('integration');
      newUrl.searchParams.delete('status');
      window.history.replaceState({}, '', newUrl.toString());

      // Clear the message after 5 seconds
      setTimeout(() => {
        setIntegrationMessage(null);
      }, 5000);
    }
  }, []);
  const [priorities, setPriorities] = useState<PriorityItem[]>([
    {
      id: '1',
      title: 'Review Q4 Revenue Strategy',
      description: 'Analyze current revenue trends and adjust Q4 strategy based on market conditions',
      category: 'urgent',
      priority: 'high',
      dueDate: '2024-01-15',
      estimatedTime: '2 hours',
      progress: 0,
      impact: 'revenue',
      actionUrl: '/workspace/analytics'
    },
    {
      id: '2',
      title: 'Customer Feedback Analysis',
      description: 'Review recent customer feedback and identify improvement opportunities',
      category: 'important',
      priority: 'high',
      dueDate: '2024-01-16',
      estimatedTime: '1.5 hours',
      progress: 30,
      impact: 'customer',
      actionUrl: '/workspace/customer-insights'
    },
    {
      id: '3',
      title: 'Team Performance Review',
      description: 'Monthly team performance review and goal setting for next month',
      category: 'maintenance',
      priority: 'medium',
      dueDate: '2024-01-17',
      estimatedTime: '1 hour',
      progress: 0,
      impact: 'team',
      actionUrl: '/workspace/team'
    },
    {
      id: '4',
      title: 'Process Automation Opportunity',
      description: 'Identify manual processes that can be automated to improve efficiency',
      category: 'opportunity',
      priority: 'medium',
      dueDate: '2024-01-20',
      estimatedTime: '3 hours',
      progress: 0,
      impact: 'operations',
      actionUrl: '/workspace/automation'
    }
  ]);

  const [insights, setInsights] = useState<DailyInsight[]>([
    {
      id: '1',
      title: 'Revenue Growth Opportunity',
      description: 'Your customer acquisition cost has decreased by 15% this month. Consider increasing marketing spend.',
      type: 'opportunity',
      action: 'Review Marketing Strategy',
      actionUrl: '/workspace/marketing'
    },
    {
      id: '2',
      title: 'Customer Satisfaction Alert',
      description: 'Response times have increased by 20% this week. Consider adding support staff.',
      type: 'warning',
      action: 'Review Support Process',
      actionUrl: '/workspace/support'
    },
    {
      id: '3',
      title: 'Team Productivity Up',
      description: 'Your team has completed 25% more tasks this week compared to last week.',
      type: 'success',
      action: 'Celebrate Success',
      actionUrl: '/workspace/team'
    }
  ]);

  const getDisplayName = (profile: any, user: any): string => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.first_name) return profile.first_name;
    if (user?.email) {
      const username = user.email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
    }
    return 'User';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'text-red-600';
      case 'important': return 'text-orange-600';
      case 'opportunity': return 'text-green-600';
      case 'maintenance': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'revenue': return <DollarSign className="w-4 h-4" />;
      case 'operations': return <Zap className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'info': return <Lightbulb className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'success': return 'border-blue-200 bg-blue-50';
      case 'info': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handlePriorityClick = (priority: PriorityItem) => {
    if (priority.actionUrl) {
      window.location.href = priority.actionUrl;
    }
  };

  const handleInsightAction = (insight: DailyInsight) => {
    if (insight.actionUrl) {
      window.location.href = insight.actionUrl;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Integration Success/Error Message */}
      {integrationMessage && (
        <div className={`rounded-lg p-4 ${
          integrationMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 dark: bg-green-950/20 dark:border-green-800' 
            : 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            {integrationMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            )}
            <span className={`font-medium ${
              integrationMessage.type === 'success' ? 'text-green-800 dark: text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {integrationMessage.message}
            </span>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark: from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Good morning, {getDisplayName(profile, user)}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what you should focus on today
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{priorities.filter(p => p.priority === 'high').length}</div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {priorities.reduce((total, p) => {
                    const time = parseInt(p.estimatedTime?.split(' ')[0] || '0');
                    return total + time;
                  }, 0)}h
                </div>
                <div className="text-sm text-muted-foreground">Estimated Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {priorities.filter(p => p.progress === 100).length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{insights.length}</div>
                <div className="text-sm text-muted-foreground">Insights</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
        {/* Today's Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Today's Priorities
              </div>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorities.map((priority) => (
                <motion.div
                  key={priority.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    priority.category === 'urgent' ? 'border-red-200 bg-red-50' :
                    priority.category === 'important' ? 'border-orange-200 bg-orange-50' :
                    priority.category === 'opportunity' ? 'border-green-200 bg-green-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => handlePriorityClick(priority)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-sm">{priority.title}</h3>
                        <Badge variant="outline" className={getPriorityColor(priority.priority)}>
                          {priority.priority}
                        </Badge>
                        <Badge variant="outline" className={getCategoryColor(priority.category)}>
                          {priority.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{priority.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          {priority.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(priority.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {priority.estimatedTime && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {priority.estimatedTime}
                            </div>
                          )}
                          <div className="flex items-center">
                            {getImpactIcon(priority.impact)}
                            <span className="ml-1 capitalize">{priority.impact}</span>
                          </div>
                        </div>
                        {priority.progress !== undefined && (
                          <div className="flex items-center space-x-2">
                            <Progress value={priority.progress} className="w-16 h-2" />
                            <span>{priority.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Today's Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight) => (
                <motion.div
                  key={insight.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      {insight.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInsightAction(insight)}
                          className="text-xs p-0 h-auto"
                        >
                          {insight.action} →
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => window.location.href = '/workspace'}
            >
              <div className="flex items-center space-x-2 w-full">
                <BarChart3 className="w-4 h-4" />
                <Badge variant="outline">Analytics</Badge>
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">View Business Dashboard</div>
                <div className="text-xs text-muted-foreground">Check your business metrics and performance</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start space-y-2"
              onClick={() => window.location.href = '/workspace/inbox'}
            >
              <div className="flex items-center space-x-2 w-full">
                <Users className="w-4 h-4" />
                <Badge variant="outline">Communication</Badge>
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Check Unified Inbox</div>
                <div className="text-xs text-muted-foreground">Review emails and messages from all accounts</div>
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
    </div>
  );
};

export default Home; 