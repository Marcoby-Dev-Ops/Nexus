import React from 'react';
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
  CheckCircle,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              The Future of Business Intelligence
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Your Business's
              <span className="text-primary"> Operating System</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Nexus transforms your business into a self-optimizing, intelligent organism. 
              No degree required – just the vision to grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/demo/nexus-operating-system">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trinity Framework */}
      <div className="py-16 bg-muted/30">
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
                  Advanced AI analyzes patterns, predicts outcomes, and generates insights across all business operations.
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/demo/trinity-brain">
                    Explore Brain Demo
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
                  Real-time visibility into every aspect of your business with predictive analytics and trend detection.
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/demo/cross-departmental-intelligence">
                    Explore Vision Demo
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
                  Automated workflows and intelligent actions that optimize operations without human intervention.
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/demo/automated-workflow">
                    Explore Action Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
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
                description: "Forecast trends and opportunities before they happen"
              },
              {
                icon: Users,
                title: "Team Coordination",
                description: "Seamless collaboration across all departments"
              },
              {
                icon: Target,
                title: "Goal Optimization",
                description: "Automatically adjust strategies to hit targets"
              },
              {
                icon: Sparkles,
                title: "AI-Powered Insights",
                description: "Get actionable recommendations 24/7"
              },
              {
                icon: Eye,
                title: "Real-time Monitoring",
                description: "Track performance across all business metrics"
              },
              {
                icon: Zap,
                title: "Automated Workflows",
                description: "Eliminate repetitive tasks and focus on growth"
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
                  <p className="text-muted-foreground">{feature.description}</p>
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
            <Button size="lg" asChild>
              <Link to="/signup">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 