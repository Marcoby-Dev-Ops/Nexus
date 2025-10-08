import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Users, Building, Settings, Activity, Bell } from 'lucide-react';

const adminFeatures = [
  {
    title: 'User Management',
    description: 'Manage user accounts, roles, and permissions.',
    icon: <Users className="w-6 h-6" />,
    path: '/admin/users',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'System Settings',
    description: 'Configure application-wide settings and policies.',
    icon: <Settings className="w-6 h-6" />,
    path: '/settings',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Notifications',
    description: 'Review and adjust notification preferences.',
    icon: <Bell className="w-6 h-6" />,
    path: '/notifications',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
];

export const AdminPage: React.FC = () => {
  return (
    <PageLayout title="Admin Dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Admin Dashboard</CardTitle>
            <CardDescription>
              Manage users and core settings for the Nexus platform.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-sm text-muted-foreground">Active Organizations</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Administrative Tools</CardTitle>
            <CardDescription>
              Quick access to the areas we actively support today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminFeatures.map((feature) => (
                <Link key={feature.title} to={feature.path}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                          <div className={feature.color}>{feature.icon}</div>
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

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks for day-to-day operations.
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
              <Link to="/settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Settings
                </Button>
              </Link>
              <Link to="/notifications">
                <Button variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};
