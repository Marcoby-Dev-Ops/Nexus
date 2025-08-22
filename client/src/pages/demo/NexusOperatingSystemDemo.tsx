import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
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
  BarChart3,
  Workflow,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Star,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  MessageSquare,
  Settings,
  ShoppingCart
} from 'lucide-react';

export default function NexusOperatingSystemDemo() {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Every department gets a personalized AI assistant",
      benefit: "Save 25+ hours per week",
      example: "AI predicts which leads will convert and automatically prioritizes follow-ups"
    },
    {
      icon: Workflow,
      title: "Smart Automation", 
      description: "Workflows that adapt and optimize themselves",
      benefit: "98% accuracy, 24/7 operation",
      example: "Automatically reorders inventory when stock drops below threshold"
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      description: "See what's coming next with AI predictions",
      benefit: "85% prediction accuracy",
      example: "Forecasts next month's revenue based on current trends and seasonality"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with role-based access",
      benefit: "SOC 2 compliant",
      example: "Granular permissions ensure team members only see relevant data"
    },
    {
      icon: Globe,
      title: "Global Integration",
      description: "Connect all your tools in one place",
      benefit: "100+ integrations",
      example: "Syncs data from Shopify, QuickBooks, and Slack in real-time"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Work from anywhere with responsive design",
      benefit: "99.9% uptime",
      example: "Approve invoices and view dashboards from your phone"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechStart Inc.",
      role: "CEO",
      quote: "Nexus transformed our operations completely. We're now 3x more efficient.",
      avatar: "SC",
      rating: 5,
      specific: "Recovered $45K in lost revenue by identifying abandoned cart patterns"
    },
    {
      name: "Marcus Johnson", 
      company: "Growth Digital",
      role: "Operations Director",
      quote: "The AI automation saves us 25+ hours per week. Game changer.",
      avatar: "MJ",
      rating: 5,
      specific: "Automated lead scoring reduced follow-up time by 60%"
    },
    {
      name: "Emily Rodriguez",
      company: "Innovate Labs",
      role: "CTO",
      quote: "Finally, a platform that grows with our business. Highly recommend.",
      avatar: "ER",
      rating: 5,
      specific: "Predictive analytics helped us reduce churn by 32%"
    }
  ];

  const stats = [
    { number: "340%", label: "Average ROI" },
    { number: "25+", label: "Hours Saved" },
    { number: "98%", label: "Accuracy Rate" },
    { number: "60%", label: "Tool Reduction" }
  ];

  const demoScenarios = [
    {
      title: "E-commerce Store",
      problem: "Sales dropping but can't see why",
      solution: "Nexus connects Shopify, Google Analytics, and email data to show exactly where customers are abandoning",
      result: "Recovered $45K in lost revenue",
      icon: ShoppingCart
    },
    {
      title: "SaaS Startup", 
      problem: "Growing but churn is high",
      solution: "AI analyzes user behavior patterns to predict who will cancel and why",
      result: "Reduced churn by 32%",
      icon: Users
    },
    {
      title: "Service Business",
      problem: "Team overwhelmed with manual processes", 
      solution: "Automated workflows handle repetitive tasks while you focus on clients",
      result: "Saved 25 hours per week",
      icon: Workflow
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 border-b border-border shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/Nexus/nexus-horizontal-160x48-transparent.png" 
              alt="Nexus by Marcoby" 
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Interactive Demo
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Experience the
              <span className="text-primary"> Business Operating System</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              See how Nexus transforms your business into a self-optimizing, intelligent organism. 
              Stop juggling 15+ tools. Start growing intelligently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="w-full sm:w-auto">
                <Link to="/signup" className="flex items-center justify-center w-full">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/login" className="flex items-center justify-center w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Try Demo Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Scenarios */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              See Nexus in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real scenarios showing how different businesses use Nexus to solve their biggest challenges
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {demoScenarios.map((scenario, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <scenario.icon className="w-6 h-6 text-primary mr-3" />
                    <Badge variant="outline">{scenario.title}</Badge>
                  </div>
                  <CardTitle className="text-lg text-red-600">{scenario.problem}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">{scenario.solution}</p>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-600">{scenario.result}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Badge variant="secondary" className="text-xs mb-3">
                    {feature.benefit}
                  </Badge>
                  <p className="text-sm text-muted-foreground italic">
                    "{feature.example}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Trinity Framework */}
      <div className="py-16">
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

      {/* Testimonials */}
      <div className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our customers say about their transformation with Nexus
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary font-semibold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-green-700 font-medium">{testimonial.specific}</p>
                </div>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
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
              <Link to="/login" className="flex items-center justify-center w-full">
                Try Demo Account
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
        </div>
      </footer>
    </div>
  );
}
