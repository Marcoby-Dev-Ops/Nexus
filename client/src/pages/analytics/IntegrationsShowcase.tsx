/**
 * Integrations Showcase Page
 * Demonstrates the power of dual Slack + Teams integration
 * Shows real-world scenarios and benefits of cross-platform intelligence
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { MessageSquare, Video, Users, TrendingUp, BarChart3, Zap, Lightbulb, CheckCircle2, Play, Shield, Globe, Building } from 'lucide-react';
import DualPlatformDemo from '@/components/integrations/DualPlatformDemo';
import UnifiedCommunicationDashboard from '@/components/dashboard/UnifiedCommunicationDashboard';

interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  metrics: {
    label: string;
    value: string;
    change: number;
  }[];
  industry: string;
  teamSize: string;
}

const IntegrationsShowcase: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentView, setCurrentView] = useState<'scenarios' | 'demo' | 'dashboard'>('scenarios');

  const demoScenarios: DemoScenario[] = [
    {
      id: 'startup-optimization',
      title: 'Startup Team Optimization',
      subtitle: 'Fast-moving startup optimizes communication efficiency',
      description: 'A 15-person startup uses both Slack for quick coordination and Teams for client meetings. Cross-platform insights revealed communication bottlenecks and optimization opportunities.',
      benefits: [
        'Reduced average response time by 40%',
        'Increased team collaboration score to 89%',
        'Eliminated information silos between platforms',
        'Optimized meeting vs chat communication'
      ],
      metrics: [
        { label: 'Response Time', value: '12 min', change: -40 },
        { label: 'Team Efficiency', value: '89%', change: 23 },
        { label: 'Cross-Platform Sync', value: '94%', change: 67 },
        { label: 'Meeting Effectiveness', value: '86%', change: 18 }
      ],
      industry: 'Technology',
      teamSize: '15 people'
    },
    {
      id: 'enterprise-scaling',
      title: 'Enterprise Communication Scaling',
      subtitle: 'Global enterprise streamlines multi-platform communication',
      description: 'A 500+ person company with distributed teams across timezones uses unified analytics to coordinate communication and reduce redundancy across Slack and Teams.',
      benefits: [
        'Coordinated global team communication',
        'Reduced duplicate conversations by 60%',
        'Optimized timezone-based communication',
        'Improved executive visibility into team dynamics'
      ],
      metrics: [
        { label: 'Communication Efficiency', value: '78%', change: 45 },
        { label: 'Global Coordination', value: '82%', change: 34 },
        { label: 'Executive Insights', value: '91%', change: 67 },
        { label: 'Platform Utilization', value: '85%', change: 29 }
      ],
      industry: 'Financial Services',
      teamSize: '500+ people'
    },
    {
      id: 'hybrid-workflow',
      title: 'Hybrid Team Workflow',
      subtitle: 'Remote and in-office teams coordinate seamlessly',
      description: 'A hybrid team uses Slack for daily async coordination and Teams for structured meetings. Analytics revealed optimal communication patterns for different work styles.',
      benefits: [
        'Balanced async and sync communication',
        'Improved remote team inclusion',
        'Optimized meeting schedules',
        'Enhanced project coordination'
      ],
      metrics: [
        { label: 'Remote Inclusion', value: '92%', change: 38 },
        { label: 'Async Efficiency', value: '87%', change: 42 },
        { label: 'Meeting Quality', value: '84%', change: 26 },
        { label: 'Project Velocity', value: '89%', change: 33 }
      ],
      industry: 'Design & Marketing',
      teamSize: '30 people'
    }
  ];

  const platformBenefits = [
    {
      title: 'Cross-Platform Intelligence',
      description: 'Unified insights across Slack and Teams reveal communication patterns impossible to see with single-platform analytics.',
      icon: BarChart3,
      features: [
        'Response time comparison',
        'Platform preference analysis',
        'Communication flow optimization',
        'Cross-team collaboration insights'
      ]
    },
    {
      title: 'Smart Automation',
      description: 'AI-powered automations bridge communication gaps and optimize workflow between platforms.',
      icon: Zap,
      features: [
        'Auto-routing based on urgency',
        'Cross-platform message bridging',
        'Smart notification management',
        'Workflow optimization suggestions'
      ]
    },
    {
      title: 'Enterprise Security',
      description: 'Enterprise-grade security with read-only access, encryption, and compliance standards.',
      icon: Shield,
      features: [
        'OAuth 2.0 authentication',
        'Encrypted data processing',
        'GDPR & SOC 2 compliance',
        'Role-based access controls'
      ]
    },
    {
      title: 'Global Coordination',
      description: 'Optimize communication across timezones, teams, and departments with intelligent insights.',
      icon: Globe,
      features: [
        'Timezone optimization',
        'Global team coordination',
        'Cultural communication patterns',
        'Multi-language support'
      ]
    }
  ];

  const currentScenario = demoScenarios[selectedScenario];

  const renderScenarioView = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Slack + Teams = <span className="text-primary">Exponential Intelligence</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Don't just connect your communication platforms—unlock cross-platform insights that 
          transform how your team collaborates, responds, and performs.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" onClick={() => setCurrentView('demo')}>
            <Play className="w-4 h-4 mr-2" />
            See Live Demo
          </Button>
          <Button variant="outline" size="lg" onClick={() => setCurrentView('dashboard')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Dashboard
          </Button>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-6">
        {platformBenefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <Card key={benefit.title} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Icon className="w-6 h-6 text-primary" />
                  <span>{benefit.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">{benefit.description}</p>
                <ul className="space-y-1">
                  {benefit.features.map((feature) => (
                    <li key={feature} className="text-sm flex items-center space-x-2">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scenario Showcase */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Real-World Success Stories</h2>
          <p className="text-muted-foreground">
            See how teams across industries leverage dual-platform intelligence
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="flex justify-center space-x-2 mb-6">
          {demoScenarios.map((scenario, index) => (
            <Button
              key={scenario.id}
              variant={selectedScenario === index ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScenario(index)}
            >
              {scenario.title}
            </Button>
          ))}
        </div>

        {/* Selected Scenario */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{currentScenario.title}</CardTitle>
                <p className="text-muted-foreground">{currentScenario.subtitle}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline">
                    <Building className="w-3 h-3 mr-1" />
                    {currentScenario.industry}
                  </Badge>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {currentScenario.teamSize}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg: grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Challenge & Solution</h3>
                  <p className="text-muted-foreground">{currentScenario.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Key Benefits Achieved</h3>
                  <ul className="space-y-2">
                    {currentScenario.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Performance Metrics</h3>
                {currentScenario.metrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{metric.label}</div>
                      <div className="text-2xl font-bold text-primary">{metric.value}</div>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      metric.change > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">+{metric.change}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-primary-foreground">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Team Communication?</h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Join hundreds of teams who've unlocked exponential communication intelligence 
            with dual-platform analytics. See the difference in under 15 minutes.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" variant="secondary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Connect Slack
            </Button>
            <Button size="lg" variant="outline" className="border-white text-primary-foreground hover: bg-card hover:text-secondary">
              <Video className="w-4 h-4 mr-2" />
              Connect Teams
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">Communication Intelligence</h1>
            <nav className="flex space-x-4">
              <Button 
                variant={currentView === 'scenarios' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('scenarios')}
              >
                Scenarios
              </Button>
              <Button 
                variant={currentView === 'demo' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('demo')}
              >
                Live Demo
              </Button>
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </Button>
            </nav>
          </div>
          <Badge variant="outline" className="bg-success/5 text-success">
            <Lightbulb className="w-3 h-3 mr-1" />
            Interactive Demo
          </Badge>
        </div>

        {/* Content */}
        {currentView === 'scenarios' && renderScenarioView()}
        {currentView === 'demo' && <DualPlatformDemo />}
        {currentView === 'dashboard' && <UnifiedCommunicationDashboard />}
      </div>
    </div>
  );
};

export default IntegrationsShowcase; 
