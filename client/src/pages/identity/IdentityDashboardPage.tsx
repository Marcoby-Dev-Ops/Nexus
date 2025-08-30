import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Badge } from '@/shared/components/ui/Badge';
import { useCompany } from '@/shared/contexts/CompanyContext';
import { useAuth } from '@/hooks/index';
import { 
  Building2, 
  Users, 
  Palette, 
  Brain, 
  Target, 
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface IdentitySection {
  id: string;
  name: string;
  description: string;
  completion: number;
  health: number;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  status: 'complete' | 'in-progress' | 'not-started';
}

interface HealthMetric {
  name: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

export function IdentityDashboardPage() {
  const navigate = useNavigate();
  const { company, loading: isLoadingCompany } = useCompany();
  const { user } = useAuth();
  const [overallHealth, setOverallHealth] = useState(72);

  const identitySections: IdentitySection[] = [
    {
      id: 'profile',
      name: 'Company Profile',
      description: 'Core business identity and positioning',
      completion: 85,
      health: 78,
      icon: Building2,
      path: '/quantum/identity/profile',
      status: 'complete'
    },
    {
      id: 'team',
      name: 'Team & Culture',
      description: 'People, roles, and organizational culture',
      completion: 60,
      health: 65,
      icon: Users,
      path: '/quantum/identity/team',
      status: 'in-progress'
    },
    {
      id: 'brand',
      name: 'Brand & Values',
      description: 'Brand positioning and core values',
      completion: 45,
      health: 58,
      icon: Palette,
      path: '/quantum/identity/brand',
      status: 'not-started'
    }
  ];

  const healthMetrics: HealthMetric[] = [
    {
      name: 'Brand Awareness',
      value: 78,
      target: 85,
      status: 'good'
    },
    {
      name: 'Employee Satisfaction',
      value: 65,
      target: 80,
      status: 'warning'
    },
    {
      name: 'Mission Alignment',
      value: 72,
      target: 90,
      status: 'warning'
    },
    {
      name: 'Value Consistency',
      value: 58,
      target: 85,
      status: 'critical'
    }
  ];

  const nextActions = [
    {
      id: 'mission',
      title: 'Complete mission statement',
      description: 'Define your core purpose and reason for existence',
      priority: 'high',
      path: '/quantum/identity/profile'
    },
    {
      id: 'values',
      title: 'Define core values',
      description: 'Establish fundamental beliefs and principles',
      priority: 'high',
      path: '/quantum/identity/brand'
    },
    {
      id: 'team-structure',
      title: 'Set up team structure',
      description: 'Define roles and organizational hierarchy',
      priority: 'medium',
      path: '/quantum/identity/team'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'not-started':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Identity Dashboard</h1>
        <p className="text-muted-foreground">
          Who you are, mission, vision, values, and the people who make it happen
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {identitySections.map((section) => (
              <div key={section.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(section.status)}
                  <span className="text-sm">{section.name}</span>
                </div>
                <span className="text-sm font-medium">{section.completion}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealth}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall identity health</p>
            <div className="mt-3 space-y-2">
              {healthMetrics.slice(0, 2).map((metric) => (
                <div key={metric.name} className="flex justify-between text-sm">
                  <span>{metric.name}</span>
                  <span className={getHealthStatusColor(metric.status)}>{metric.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextActions.slice(0, 2).map((action) => (
              <div key={action.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(action.priority)}>
                    {action.priority}
                  </Badge>
                  <span className="text-sm">{action.title}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your business identity across all areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {identitySections.map((section) => (
              <Button
                key={section.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2"
                onClick={() => navigate(section.path)}
              >
                <section.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{section.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {section.completion}% complete
                  </div>
                </div>
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/chat?context=identity-analysis')}
            >
              <Brain className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">AI Insights</div>
                <div className="text-xs text-muted-foreground">
                  Get analysis
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Identity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission & Vision */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Mission & Vision</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Mission Statement</h4>
              <p className="text-sm text-muted-foreground">
                {company?.mission_statement || "Define your core purpose and reason for existence"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Vision Statement</h4>
              <p className="text-sm text-muted-foreground">
                {company?.vision_statement || "Describe your future aspirations and goals"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Core Values</h4>
              <div className="flex flex-wrap gap-2">
                {company?.core_values ? (
                  company.core_values.split(',').map((value, index) => (
                    <Badge key={index} variant="secondary">
                      {value.trim()}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Define your fundamental beliefs and principles
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/quantum/identity/profile')}
            >
              Edit Mission & Vision
            </Button>
          </CardContent>
        </Card>

        {/* Team Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Company Size</h4>
              <p className="text-sm text-muted-foreground">
                {company?.size || "Define your team size and structure"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key Roles</h4>
              <p className="text-sm text-muted-foreground">
                {company?.key_roles || "Define important team members and their roles"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Company Culture</h4>
              <p className="text-sm text-muted-foreground">
                {company?.culture_description || "Describe your work environment and values"}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/quantum/identity/team')}
            >
              Setup Team & Culture
            </Button>
          </CardContent>
        </Card>

        {/* Brand Positioning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Brand Positioning</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Brand Voice</h4>
              <p className="text-sm text-muted-foreground">
                {company?.brand_voice || "Define your brand personality and tone"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Target Market</h4>
              <p className="text-sm text-muted-foreground">
                {company?.target_market || "Define your ideal customer profiles"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Unique Value Proposition</h4>
              <p className="text-sm text-muted-foreground">
                {company?.value_proposition || "What makes your business different"}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/quantum/identity/brand')}
            >
              Define Brand & Values
            </Button>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Health Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <span className={`text-sm font-medium ${getHealthStatusColor(metric.status)}`}>
                    {metric.value}%
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {metric.value}%</span>
                  <span>Target: {metric.target}%</span>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/chat?context=identity-health-analysis')}
            >
              Get Health Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
