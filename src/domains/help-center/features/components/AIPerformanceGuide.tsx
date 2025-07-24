import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { 
  TrendingUp, 
  DollarSign, 
  Star, 
  Settings, 
  Brain, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Target,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIPerformanceGuide: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Performance Dashboard",
      description: "Monitor your AI usage, costs, and performance metrics in real-time",
      path: "/ai-performance",
      icon: <TrendingUp className="w-5 h-5" />,
      highlights: [
        "Health score tracking",
        "Monthly spend monitoring", 
        "User satisfaction ratings",
        "Token usage analytics"
      ]
    },
    {
      title: "Settings Integration",
      description: "Configure AI models and view performance analytics from settings",
      path: "/settings/ai-performance",
      icon: <Settings className="w-5 h-5" />,
      highlights: [
        "AI model configuration",
        "Performance analytics",
        "Usage monitoring",
        "Improvement tracking"
      ]
    },
    {
      title: "Dashboard Widget",
      description: "Quick AI performance overview on your main dashboard",
      path: "/dashboard",
      icon: <BarChart3 className="w-5 h-5" />,
      highlights: [
        "Health score at a glance",
        "Monthly spend summary",
        "Quick access buttons",
        "Real-time status"
      ]
    },
    {
      title: "Chat Feedback",
      description: "Rate AI responses to help improve performance",
      path: "/chat",
      icon: <Star className="w-5 h-5" />,
      highlights: [
        "1-5 star ratings",
        "Instant feedback",
        "Improvement tracking",
        "Quality metrics"
      ]
    }
  ];

  const quickActions = [
    {
      title: "View AI Performance",
      description: "See detailed analytics and metrics",
      action: () => navigate('/ai-performance'),
      icon: <Brain className="w-4 h-4" />,
      color: "bg-primary/5 text-primary border-border"
    },
    {
      title: "Configure Models",
      description: "Manage AI models and settings",
      action: () => navigate('/settings/ai-models'),
      icon: <Settings className="w-4 h-4" />,
      color: "bg-secondary/5 text-secondary border-purple-200"
    },
    {
      title: "View Dashboard",
      description: "Check your main dashboard widget",
      action: () => navigate('/dashboard'),
      icon: <BarChart3 className="w-4 h-4" />,
      color: "bg-success/5 text-success border-green-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          AI Performance & Billing Features
        </h1>
        <p className="text-muted-foreground">
          Everything you need to monitor, optimize, and improve your AI usage
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={action.action}
                className={`h-auto p-4 flex flex-col items-start space-y-2 ${action.color}`}
              >
                <div className="flex items-center space-x-2">
                  {action.icon}
                  <span className="font-semibold">{action.title}</span>
                </div>
                <p className="text-xs text-left opacity-75">
                  {action.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover: shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {feature.icon}
                {feature.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {feature.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground/90">{highlight}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate(feature.path)}
                className="w-full"
              >
                Access Feature
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            How to Get Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-foreground">Check Your Dashboard</h4>
                <p className="text-sm text-muted-foreground">
                  Visit your main dashboard to see the AI Performance widget with your current health score and spending.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-secondary/10 text-secondary rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-foreground">Explore AI Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to AI Performance from the main menu to see detailed analytics, billing information, and improvement recommendations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-success/10 text-success rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-foreground">Configure Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Use Settings → AI Performance to configure your preferences and view detailed analytics.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-warning/10 text-warning rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium text-foreground">Provide Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  Rate AI responses in chat to help improve performance and see your impact on the improvement dashboard.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-border">
        <CardHeader>
          <CardTitle className="text-blue-900">Why Use These Features?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost Optimization
              </h4>
              <p className="text-sm text-primary">
                Track spending, get cost recommendations, and optimize your AI usage for maximum ROI.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Insights
              </h4>
              <p className="text-sm text-primary">
                Monitor AI performance trends, user satisfaction, and system health in real-time.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Continuous Improvement
              </h4>
              <p className="text-sm text-primary">
                Get AI-powered recommendations to improve performance and reduce costs automatically.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Transparency
              </h4>
              <p className="text-sm text-primary">
                Full visibility into AI model selection, costs, and performance for complete accountability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 