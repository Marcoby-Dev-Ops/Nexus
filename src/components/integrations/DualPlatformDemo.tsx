/**
 * Dual Platform Communication Demo
 * Showcases the power of having both Slack and Teams integrated
 * Demonstrates cross-platform insights and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Badge,
  Progress,
  Alert, AlertDescription,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Button
} from '@/components/ui';
import { 
  MessageSquare, 
  Video,
  Users, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  Zap,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  Hash,
  FileText,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';

interface PlatformMetrics {
  platform: 'slack' | 'teams';
  connected: boolean;
  data: {
    totalMessages: number;
    totalUsers: number;
    averageResponseTime: number;
    peakHour: string;
    mostActiveChannel: string;
    engagementScore: number;
  };
}

interface CrossPlatformInsight {
  id: string;
  type: 'optimization' | 'pattern' | 'recommendation' | 'automation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  savings: {
    time: number;
    unit: 'minutes' | 'hours';
    period: 'day' | 'week' | 'month';
  };
  implementation: string;
  platforms: string[];
}

interface UsagePattern {
  time: string;
  slack: number;
  teams: number;
}

const DualPlatformDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [currentInsight, setCurrentInsight] = useState(0);

  // Mock data for demo
  const platformMetrics: PlatformMetrics[] = [
    {
      platform: 'slack',
      connected: true,
      data: {
        totalMessages: 2847,
        totalUsers: 12,
        averageResponseTime: 15,
        peakHour: '10:00 AM',
        mostActiveChannel: '#development',
        engagementScore: 87
      }
    },
    {
      platform: 'teams',
      connected: true,
      data: {
        totalMessages: 1923,
        totalUsers: 15,
        averageResponseTime: 35,
        peakHour: '2:00 PM',
        mostActiveChannel: 'General',
        engagementScore: 72
      }
    }
  ];

  const crossPlatformInsights: CrossPlatformInsight[] = [
    {
      id: 'response-time-optimization',
      type: 'optimization',
      priority: 'high',
      title: 'Optimize Response Times Across Platforms',
      description: 'Your team responds 57% faster on Slack (15min avg) vs Teams (35min avg). Route urgent communications through Slack for faster resolution.',
      impact: 'Reduce average response time by 20 minutes per urgent request',
      savings: {
        time: 3,
        unit: 'hours',
        period: 'day'
      },
      implementation: 'Set up auto-routing rules for urgent messages',
      platforms: ['slack', 'teams']
    },
    {
      id: 'meeting-vs-chat',
      type: 'pattern',
      priority: 'medium',
      title: 'Communication Medium Preferences',
      description: 'Quick decisions happen 70% faster on Slack, but formal planning is 40% more effective on Teams with meeting integration.',
      impact: 'Optimize workflow by using the right platform for the right purpose',
      savings: {
        time: 45,
        unit: 'minutes',
        period: 'week'
      },
      implementation: 'Create communication guidelines based on message type',
      platforms: ['slack', 'teams']
    },
    {
      id: 'peak-hour-coordination',
      type: 'recommendation',
      priority: 'medium',
      title: 'Coordinate Peak Communication Hours',
      description: 'Slack peak activity is 10-11 AM, Teams peak is 2-4 PM. Minimal overlap indicates missed collaboration opportunities.',
      impact: 'Increase cross-platform collaboration by 25%',
      savings: {
        time: 2,
        unit: 'hours',
        period: 'week'
      },
      implementation: 'Schedule cross-platform sync meetings during overlap hours',
      platforms: ['slack', 'teams']
    },
    {
      id: 'automation-bridge',
      type: 'automation',
      priority: 'high',
      title: 'Cross-Platform Message Bridge',
      description: 'Important decisions in Slack channels aren\'t always visible to Teams-heavy team members, creating information silos.',
      impact: 'Eliminate information silos and improve team alignment',
      savings: {
        time: 5,
        unit: 'hours',
        period: 'week'
      },
      implementation: 'Auto-sync critical messages between platforms',
      platforms: ['slack', 'teams']
    }
  ];

  const usagePatterns: UsagePattern[] = [
    { time: '9 AM', slack: 85, teams: 25 },
    { time: '10 AM', slack: 95, teams: 45 },
    { time: '11 AM', slack: 78, teams: 60 },
    { time: '12 PM', slack: 45, teams: 40 },
    { time: '1 PM', slack: 35, teams: 55 },
    { time: '2 PM', slack: 55, teams: 90 },
    { time: '3 PM', slack: 65, teams: 85 },
    { time: '4 PM', slack: 45, teams: 70 },
    { time: '5 PM', slack: 25, teams: 45 }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Cycle through insights every 5 seconds for demo
    const interval = setInterval(() => {
      setCurrentInsight(prev => (prev + 1) % crossPlatformInsights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10';
    if (score >= 60) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning/80';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return TrendingUp;
      case 'pattern': return BarChart3;
      case 'recommendation': return Lightbulb;
      case 'automation': return Zap;
      default: return Activity;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dual Platform Intelligence</h2>
          <p className="text-muted-foreground">
            Live demo of Slack + Teams unified analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-success/5 text-success">
            <Activity className="w-3 h-3 mr-1" />
            Live Demo
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platformMetrics.map((platform) => (
          <Card key={platform.platform}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {platform.platform === 'slack' ? (
                    <MessageSquare className="w-5 h-5 text-secondary" />
                  ) : (
                    <Video className="w-5 h-5 text-primary" />
                  )}
                  <span className="capitalize">{platform.platform}</span>
                </div>
                <Badge className="bg-success/10 text-success">Connected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold">{platform.data.totalMessages.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{platform.data.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="font-medium">{platform.data.averageResponseTime}min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Peak Hour</span>
                  <span className="font-medium">{platform.data.peakHour}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engagement Score</span>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getHealthColor(platform.data.engagementScore)}`}>
                    {platform.data.engagementScore}/100
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Insights Carousel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            <span>Live Cross-Platform Insights</span>
            <Badge variant="outline" className="ml-2">
              {currentInsight + 1} of {crossPlatformInsights.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {crossPlatformInsights.map((insight, index) => {
              const Icon = getTypeIcon(insight.type);
              const isActive = index === currentInsight;
              
              return (
                <div 
                  key={insight.id} 
                  className={`p-4 border rounded-lg transition-all duration-500 ${
                    isActive ? 'border-primary bg-primary/5' : 'border-transparent opacity-30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <Icon className="w-6 h-6 text-primary mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority} priority
                        </Badge>
                        <div className="flex space-x-1">
                          {insight.platforms.map(platform => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3">{insight.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Expected Impact:</span>
                          <p className="font-medium text-success">{insight.impact}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time Savings:</span>
                          <p className="font-medium text-primary">
                            {insight.savings.time} {insight.savings.unit}/{insight.savings.period}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Implementation:</span>
                          <p className="font-medium">{insight.implementation}</p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="mt-4 flex space-x-2">
                          <Button size="sm">
                            Take Action <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                          <Button variant="outline" size="sm">
                            Learn More
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Patterns Comparison */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Communication Flow</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare when your team uses Slack vs Teams throughout the day
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usagePatterns.map((pattern, index) => (
                  <div key={pattern.time} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{pattern.time}</span>
                      <span className="text-muted-foreground">
                        Slack: {pattern.slack}% | Teams: {pattern.teams}%
                      </span>
                    </div>
                    <div className="flex space-x-1 h-2">
                      <div 
                        className="bg-secondary rounded-l"
                        style={{ width: `${pattern.slack}%` }}
                      />
                      <div 
                        className="bg-primary rounded-r"
                        style={{ width: `${pattern.teams}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-secondary rounded"></div>
                    <span>Slack Usage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Teams Usage</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Response Times</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slack Average</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={75} className="w-20 h-2" />
                      <span className="text-sm font-medium">15min</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Teams Average</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={35} className="w-20 h-2" />
                      <span className="text-sm font-medium">35min</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-2 text-success">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">57% faster on Slack</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Engagement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slack Engagement</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={87} className="w-20 h-2" />
                      <span className="text-sm font-medium">87%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Teams Engagement</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={72} className="w-20 h-2" />
                      <span className="text-sm font-medium">72%</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-2 text-primary">
                      <Target className="w-4 h-4" />
                      <span className="text-sm font-medium">Combined: 82%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Platform Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quick Decisions</span>
                    <span className="text-sm font-medium text-secondary">Slack +70%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Formal Planning</span>
                    <span className="text-sm font-medium text-primary">Teams +40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">File Collaboration</span>
                    <span className="text-sm font-medium text-primary">Teams +60%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-2 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Optimized Usage</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid gap-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>Quick Win:</strong> Move urgent communications to Slack to reduce average response time by 20 minutes per request.
              </AlertDescription>
            </Alert>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Automation Opportunity:</strong> Set up cross-platform message bridging to eliminate information silos between team members.
              </AlertDescription>
            </Alert>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>Coordination Improvement:</strong> Schedule team syncs during 11 AM-1 PM overlap hours for maximum cross-platform collaboration.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to Optimize Your Team's Communication?</h3>
            <p className="text-muted-foreground">
              Connect both Slack and Teams to unlock these powerful insights for your organization
            </p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-secondary hover:bg-secondary/90">
                <MessageSquare className="w-4 h-4 mr-2" />
                Connect Slack
              </Button>
              <Button variant="outline" className="border-blue-600 text-primary hover:bg-primary/5">
                <Video className="w-4 h-4 mr-2" />
                Connect Teams
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DualPlatformDemo; 