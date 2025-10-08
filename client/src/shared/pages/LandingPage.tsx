import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { PublicHeader } from '@/shared/components/layout/PublicHeader';
import { 
  Brain, 
  Eye, 
  Zap, 
  TrendingUp, 
  Users, 
  Target, 
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  Workflow,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Star
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const painPoints = [
    {
      icon: AlertTriangle,
      problem: "Data scattered across 15+ tools",
      solution: "Unified dashboard connects everything",
      benefit: "See the full picture instantly"
    },
    {
      icon: Clock,
      problem: "Spending 20+ hours weekly on reports",
      solution: "AI generates insights automatically",
      benefit: "Focus on decisions, not data entry"
    },
    {
      icon: DollarSign,
      problem: "Missing revenue opportunities",
      solution: "Predictive analytics spots trends",
      benefit: "Act before competitors do"
    }
  ];

  const useCases = [
    {
      type: "E-commerce Store",
      scenario: "Sales dropping but can't see why",
      solution: "Nexus connects Shopify, Google Analytics, and email data to show exactly where customers are abandoning",
      result: "Recovered $45K in lost revenue"
    },
    {
      type: "SaaS Startup",
      scenario: "Growing but churn is high",
      solution: "AI analyzes user behavior patterns to predict who will cancel and why",
      result: "Reduced churn by 32%"
    },
    {
      type: "Service Business",
      scenario: "Team overwhelmed with manual processes",
      solution: "Automated workflows handle repetitive tasks while you focus on clients",
      result: "Saved 25 hours per week"
    }
  ];

  const integrations = [
    { name: "Shopify", category: "E-commerce" },
    { name: "Salesforce", category: "CRM" },
    { name: "QuickBooks", category: "Accounting" },
    { name: "Slack", category: "Communication" },
    { name: "Google Analytics", category: "Analytics" },
    { name: "Mailchimp", category: "Marketing" },
    { name: "Zapier", category: "Automation" },
    { name: "Stripe", category: "Payments" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
<<<<<<< Updated upstream
              The Future of Business Intelligence
=======
              Your Business Command Center
>>>>>>> Stashed changes
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Your Business's
              <span className="text-primary"> Operating System</span>
            </h1>
<<<<<<< Updated upstream
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Stop juggling 15+ tools. Nexus connects everything into one intelligent system that 
              predicts problems, automates solutions, and grows your business while you sleep.
=======
            <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
              Nexus brings every department into the same workspace, keeping your documentation and playbooks centralized with an AI partner that understands your business.
>>>>>>> Stashed changes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="w-full sm:w-auto">
                <Link to="/signup" className="flex items-center justify-center w-full">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
<<<<<<< Updated upstream
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/demo/nexus-operating-system" className="flex items-center justify-center w-full">
                  <Play className="mr-2 h-4 w-4" />
                  See It In Action
=======
              <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                <Link to="/demo/assistant" className="flex items-center justify-center w-full">
                  See the Workspace
>>>>>>> Stashed changes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Sound Familiar?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These are the problems Nexus was built to solve
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <item.icon className="w-6 h-6 text-red-500 mr-3" />
                    <CardTitle className="text-lg text-red-600">{item.problem}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <ArrowRight className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{item.solution}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.benefit}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
<<<<<<< Updated upstream
              Real Results, Real Businesses
=======
              Your team is an organization, work like one with Nexus
>>>>>>> Stashed changes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how different businesses use Nexus to solve their biggest challenges
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-3">{useCase.type}</Badge>
                  <CardTitle className="text-lg">{useCase.scenario}</CardTitle>
                </CardHeader>
<<<<<<< Updated upstream
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">{useCase.solution}</p>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
=======
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <p className="text-muted-foreground text-sm">{useCase.solution}</p>
                  <div className="flex items-center pt-4">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
>>>>>>> Stashed changes
                    <span className="text-sm font-medium text-green-600">{useCase.result}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Trinity Framework */}
      <div className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              The Trinity Framework
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three interconnected systems that transform your business into an intelligent, self-optimizing entity
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>THINK</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  AI analyzes your data to predict trends, identify opportunities, and generate actionable insights.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center">
<<<<<<< Updated upstream
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Predict customer churn before it happens
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Identify revenue opportunities in your data
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Generate weekly performance reports automatically
=======
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Dedicated workspaces for each function
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Shared metrics and health checks across the company
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    RBAC and audit history built in
>>>>>>> Stashed changes
                  </li>
                </ul>
                <Button variant="ghost" size="sm">
                  <Link to="/demo/trinity-brain" className="flex items-center">
                    See AI in Action
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>SEE</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Real-time dashboards show you exactly what's happening across your entire business.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center">
<<<<<<< Updated upstream
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Live sales, marketing, and operations data
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Cross-department performance insights
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Custom alerts for critical metrics
=======
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Chat that understands your org structure and priorities
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Instant summaries and follow-up questions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Actionable insights generated from your knowledge base
>>>>>>> Stashed changes
                  </li>
                </ul>
                <Button variant="ghost" size="sm">
                  <Link to="/demo/cross-departmental-intelligence" className="flex items-center">
                    View Dashboard Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>ACT</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Automated workflows handle repetitive tasks and take action based on your business rules.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center">
<<<<<<< Updated upstream
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Auto-send follow-ups to leads
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Schedule team tasks based on workload
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Reorder inventory when stock is low
=======
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Structured spaces for SOPs, meeting notes, and decision logs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Search that understands business context
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Reference documentation live inside chat
>>>>>>> Stashed changes
                  </li>
                </ul>
                <Button variant="ghost" size="sm">
                  <Link to="/demo/automated-workflow" className="flex items-center">
                    Watch Automation Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Connect Everything
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nexus integrates with 100+ tools you already use. No more data silos, no more manual work.
            </p>
          </div>

          {/* Integration Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">E-commerce</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Shopify, WooCommerce, Stripe, PayPal
                </p>
<<<<<<< Updated upstream
                <Badge variant="secondary" className="text-xs">Real-time sync</Badge>
=======
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Live inside the OS—no more buried docs</span>
                </div>
>>>>>>> Stashed changes
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">CRM & Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Salesforce, HubSpot, Pipedrive, Zoho
                </p>
<<<<<<< Updated upstream
                <Badge variant="secondary" className="text-xs">Lead tracking</Badge>
=======
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Keeps conversations grounded in fact</span>
                </div>
>>>>>>> Stashed changes
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Google Analytics, Mixpanel, Amplitude
                </p>
<<<<<<< Updated upstream
                <Badge variant="secondary" className="text-xs">Data insights</Badge>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Workflow className="w-6 h-6 text-orange-600 dark:text-orange-400" />
=======
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-600">Nothing gets lost between teams</span>
>>>>>>> Stashed changes
                </div>
                <CardTitle className="text-lg">Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Zapier, n8n, Make, Microsoft Power Automate
                </p>
                <Badge variant="secondary" className="text-xs">Workflow builder</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Integration Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {integrations.map((integration, index) => (
              <div key={index} className="flex flex-col items-center p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center mb-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-center">{integration.name}</span>
                <span className="text-xs text-muted-foreground">{integration.category}</span>
              </div>
            ))}
          </div>

          {/* Integration Benefits */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Zap className="w-6 h-6 text-primary mr-3" />
                  <CardTitle className="text-lg">One-Click Setup</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Connect your tools in minutes with our guided setup process. No technical expertise required.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    OAuth 2.0 secure authentication
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Pre-built data mappings
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Real-time sync capabilities
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Shield className="w-6 h-6 text-primary mr-3" />
                  <CardTitle className="text-lg">Enterprise Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Enterprise-grade security with encryption, audit logging, and role-based access control.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    AES-256 encryption at rest
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    TLS 1.3 encryption in transit
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Role-based access control
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    SSO & MFA support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Audit logging
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Smartphone className="w-6 h-6 text-primary mr-3" />
                  <CardTitle className="text-lg">Mobile Ready</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access your unified business data anywhere with our responsive mobile interface.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Native mobile app
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Offline capability
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Push notifications
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA for Integrations */}
          <div className="text-center mt-12">
            <Button size="lg" className="mr-4">
              <Link to="/integrations" className="flex items-center">
                View All Integrations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Link to="/demo/integrations" className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                See Integration Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From startup to enterprise, Nexus grows with your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Predictive Analytics",
                description: "Forecast trends and opportunities before they happen",
                example: "Predict which customers will churn next month"
              },
              {
                icon: Users,
                title: "Team Coordination",
                description: "Seamless collaboration across all departments",
                example: "Automatically assign tasks based on workload"
              },
              {
                icon: Target,
                title: "Goal Optimization",
                description: "Automatically adjust strategies to hit targets",
                example: "AI suggests marketing budget reallocation"
              },
              {
                icon: Sparkles,
                title: "AI-Powered Insights",
                description: "Get actionable recommendations 24/7",
                example: "Daily email with 3 priority actions"
              },
              {
                icon: Eye,
                title: "Real-time Monitoring",
                description: "Track performance across all business metrics",
                example: "Live dashboard updates every 5 minutes"
              },
              {
                icon: Zap,
                title: "Automated Workflows",
                description: "Eliminate repetitive tasks and focus on growth",
                example: "Auto-follow up with leads after 24 hours"
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{feature.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {feature.example}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses already using Nexus to scale intelligently
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Link to="/signup" className="flex items-center justify-center w-full">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Link to="/pricing" className="flex items-center justify-center w-full">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="/Nexus/nexus-horizontal-160x48-transparent.png" 
                  alt="Nexus by Marcoby" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Nexus is the operating system for modern business—a unified, secure, and scalable platform to run your entire company.
              </p>
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} Marcoby. All rights reserved.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/demo/nexus-operating-system" className="text-muted-foreground hover:text-primary transition-colors">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/help" className="text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/help/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/help/faq" className="text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/help/documentation" className="text-muted-foreground hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Links */}
          <div className="border-t mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <Link to="/legal/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/legal/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link to="/legal/cookies" className="hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
                <Link to="/legal/security" className="hover:text-primary transition-colors">
                  Security
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="https://twitter.com/marcobyhq" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link to="https://linkedin.com/company/marcoby" className="text-muted-foreground hover:text-primary transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 
