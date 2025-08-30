import React from 'react';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Users, Building, Shield, Settings, BarChart3, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: <Users className="w-6 h-6" />,
      path: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tenant Management',
      description: 'Manage tenant organizations and their settings',
      icon: <Building className="w-6 h-6" />,
      path: '/admin/tenants',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Role Management',
      description: 'Configure user roles and access levels',
      icon: <Shield className="w-6 h-6" />,
      path: '/admin/roles',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'System Settings',
      description: 'Configure application-wide settings',
      icon: <Settings className="w-6 h-6" />,
      path: '/admin/settings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Analytics',
      description: 'View system usage and performance metrics',
      icon: <BarChart3 className="w-6 h-6" />,
      path: '/admin/analytics',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'System Health',
      description: 'Monitor system status and health',
      icon: <Activity className="w-6 h-6" />,
      path: '/admin/health',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'AI Usage Monitoring',
      description: 'Monitor OpenAI and OpenRouter API usage and costs',
      icon: <Zap className="w-6 h-6" />,
      path: '/admin/ai-usage',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Policy Management',
      description: 'Manage RLS policies and database security',
      icon: <Shield className="w-6 h-6" />,
      path: '/admin/policy-management',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <PageLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Admin Dashboard</CardTitle>
            <CardDescription>
              Manage users, tenants, and system configuration from this central location.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">0</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">0</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span className="text-2xl font-bold">100%</span>
              </div>
              <p className="text-sm text-muted-foreground">System Health</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Administrative Tools</CardTitle>
            <CardDescription>
              Access various administrative functions to manage the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminFeatures.map((feature, index) => (
                <Link key={index} to={feature.path}>
                  <Card className="hover: shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                          <div className={feature.color}>
                            {feature.icon}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/users">
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link to="/admin/tenants">
                <Button variant="outline">
                  <Building className="w-4 h-4 mr-2" />
                  Manage Tenants
                </Button>
              </Link>
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                View System Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}; 
