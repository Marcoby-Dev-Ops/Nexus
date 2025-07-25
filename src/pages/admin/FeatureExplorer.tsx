import React from 'react';
import { Search, Zap, BarChart2, Users, MessageSquare, FileText, Settings, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button,
  Badge,
  Input
} from '@/shared/components/ui';

/**
 * FeatureExplorer - Showcases all available features in the application
 * 
 * Provides a central hub for discovering and accessing all Nexus capabilities
 */
export const FeatureExplorer: React.FC = () => {
  const navigate = useNavigate();

  // Feature categories
  const featureCategories = [
    {
      name: 'Core Features',
      features: [
        { 
          name: 'Dashboard', 
          description: 'Overview of key metrics and performance indicators', 
          icon: <BarChart2 className="h-5 w-5" />, 
          path: '/dashboard',
          color: 'bg-primary'
        },
        { 
          name: 'AI Hub', 
          description: 'AI-powered insights and automation tools', 
          icon: <Zap className="h-5 w-5" />, 
          path: '/ai-hub',
          color: 'bg-secondary',
          new: true
        },
      ]
    },
    {
      name: 'Departments',
      features: [
        { 
          name: 'Sales', 
          description: 'Manage leads, deals and sales processes', 
          icon: <CreditCard className="h-5 w-5" />, 
          path: '/sales',
          color: 'bg-success'
        },
        { 
          name: 'Finance', 
          description: 'Financial reports, invoices and budgets', 
          icon: <CreditCard className="h-5 w-5" />, 
          path: '/finance',
          color: 'bg-warning'
        },
        { 
          name: 'Operations', 
          description: 'Workflow management and operational metrics', 
          icon: <BarChart2 className="h-5 w-5" />, 
          path: '/operations',
          color: 'bg-warning'
        },
      ]
    },
    {
      name: 'Tools',
      features: [
        { 
          name: 'Messaging', 
          description: 'Internal communication and team chat', 
          icon: <MessageSquare className="h-5 w-5" />, 
          path: '/messages',
          color: 'bg-primary'
        },
        { 
          name: 'Documents', 
          description: 'Create and manage documents and files', 
          icon: <FileText className="h-5 w-5" />, 
          path: '/documents',
          color: 'bg-destructive'
        },
        { 
          name: 'Team', 
          description: 'Manage users, roles and permissions', 
          icon: <Users className="h-5 w-5" />, 
          path: '/team',
          color: 'bg-cyan-500'
        },
      ]
    },
    {
      name: 'Settings & Administration',
      features: [
        { 
          name: 'Settings', 
          description: 'Configure application preferences and account settings', 
          icon: <Settings className="h-5 w-5" />, 
          path: '/settings',
          color: 'bg-gray-500'
        },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feature Explorer</h1>
          <p className="text-muted-foreground">Discover all capabilities of Nexus</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      {featureCategories.map((category) => (
        <div key={category.name} className="space-y-4">
          <h2 className="text-xl font-semibold">{category.name}</h2>
          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-4">
            {category.features.map((feature) => (
              <Card 
                key={feature.name} 
                className="overflow-hidden hover: shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div className={`h-1 ${feature.color}`}></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-md ${feature.color} bg-opacity-10`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                    {feature.new && (
                      <Badge className="bg-secondary">New</Badge>
                    )}
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="pl-0 hover: pl-2 transition-all">
                    Explore <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 