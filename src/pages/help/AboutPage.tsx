import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { 
  Brain, 
  Target, 
  Users, 
  Zap, 
  Shield, 
  Building2, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const coreValues = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'Democratize Business Expertise',
      description: 'Make 20+ years of business expertise accessible to anyone, regardless of their background or experience level.'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Unified Intelligence',
      description: 'Create a single, intelligent operating system that considers every action and analyzes all business data.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Empower Innovation',
      description: 'Enable entrepreneurs and innovators to start and grow businesses without formal business education barriers.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Trust & Transparency',
      description: 'Build trust through transparent AI, secure data handling, and clear explanations of our recommendations.'
    }
  ];

  const keyFeatures = [
    {
      feature: 'AI-First Business Brain',
      description: 'Every action analyzed, all data considered, expert advice provided',
      icon: <Brain className="h-5 w-5" />
    },
    {
      feature: 'Complete Operating System',
      description: 'Unified platform for sales, finance, operations, marketing, and more',
      icon: <Building2 className="h-5 w-5" />
    },
    {
      feature: 'Smart Integrations',
      description: 'Connect Microsoft 365, PayPal, CRM systems, and 50+ business tools',
      icon: <Zap className="h-5 w-5" />
    },
    {
      feature: 'Business Intelligence',
      description: 'Real-time KPI tracking, predictive analytics, and actionable insights',
      icon: <Target className="h-5 w-5" />
    }
  ];

  const companyStats = [
    { label: 'Business Integrations', value: '50+', description: 'Connected platforms' },
    { label: 'AI Models', value: '12+', description: 'Specialized business agents' },
    { label: 'Data Points', value: '1M+', description: 'Analyzed daily' },
    { label: 'Response Time', value: '<100ms', description: 'Average AI response' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-primary/10 text-primary">
            <Brain className="h-12 w-12" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">About Nexus</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          The world's first unified business brain that democratizes business expertise, 
          giving anyone the collective intelligence of seasoned business experts.
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Star className="h-3 w-3 mr-1" />
            AI-First Platform
          </Badge>
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete OS
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Lightbulb className="h-3 w-3 mr-1" />
            Innovation Ready
          </Badge>
        </div>
      </div>

      {/* Mission Statement */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <blockquote className="text-lg italic text-muted-foreground border-l-4 border-primary pl-4">
              "A person with no business skill should have the opportunity of a seasoned business person 
              because of the organization and insights provided by Nexus."
            </blockquote>
            <p className="text-muted-foreground">
              We believe that business expertise should not be a barrier to innovation. 
              Nexus democratizes 20+ years of business knowledge through AI, making it accessible to everyone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Core Values */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreValues.map((value, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-semibold">{value.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Key Features */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">What Makes Nexus Different</h2>
        <div className="space-y-4">
          {keyFeatures.map((feature, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{feature.feature}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Company Stats */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">Platform Scale</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {companyStats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="font-medium">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Technology Stack */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Built for the Future</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI & Machine Learning
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Advanced natural language processing</li>
                  <li>• Predictive business analytics</li>
                  <li>• Contextual recommendation engine</li>
                  <li>• Multi-agent AI architecture</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security & Compliance
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Enterprise-grade encryption (AES-256)</li>
                  <li>• GDPR and SOC 2 Type II compliant</li>
                  <li>• Zero-trust security architecture</li>
                  <li>• Continuous security monitoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Get Started */}
      <div className="text-center space-y-6">
        <h2 className="text-2xl font-semibold">Ready to Transform Your Business?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join thousands of entrepreneurs and business leaders who are using Nexus to democratize business expertise 
          and unlock their full potential.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/workspace')} size="lg">
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/help/user-guide')} size="lg">
            View User Guide
          </Button>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">Get in Touch</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="font-semibold mb-2">General Inquiries</h3>
                <p className="text-sm text-muted-foreground">
                  hello@nexus.com<br />
                  For partnership and business opportunities
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-sm text-muted-foreground">
                  support@nexus.com<br />
                  24/7 technical assistance
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Product Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  feedback@nexus.com<br />
                  Help us improve Nexus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 