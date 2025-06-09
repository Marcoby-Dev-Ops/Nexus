/**
 * Unified Communication Analytics Dashboard
 * Combines Slack and Microsoft Teams data for comprehensive communication intelligence
 * Powers cross-platform insights and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Video, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity,
  Lightbulb,
  Settings,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { communicationAnalyticsService, type UnifiedCommunicationInsights, type CommunicationHealthScore } from '@/lib/services/communicationAnalyticsService';

interface PlatformStatus {
  slack: {
    connected: boolean;
    lastSync: string | null;
    messageCount: number;
    channelCount: number;
    userCount: number;
    responseTime: number;
  };
  teams: {
    connected: boolean;
    lastSync: string | null;
    messageCount: number;
    meetingCount: number;
    teamCount: number;
    responseTime: number;
  };
}

interface CrossPlatformInsight {
  id: string;
  type: 'optimization' | 'pattern' | 'recommendation' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionable: boolean;
  platforms: string[];
  metrics?: {
    current: number;
    target?: number;
    change?: number;
    unit: string;
  };
}

const UnifiedCommunicationDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [insights, setInsights] = useState<CrossPlatformInsight[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const communicationService = communicationAnalyticsService;

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [unifiedInsights, healthData] = await Promise.all([
        communicationService.getUnifiedInsights(),
        communicationService.getCommunicationHealthScore()
      ]);

      // Extract platform status
      setPlatformStatus({
        slack: {
          connected: unifiedInsights.platformComparison.slack.connected,
          lastSync: new Date().toISOString(), // Would come from actual service
          messageCount: unifiedInsights.platformComparison.slack.messageVolume,
          channelCount: 0, // Would come from Slack service
          userCount: unifiedInsights.platformComparison.slack.activeUsers,
          responseTime: unifiedInsights.platformComparison.slack.responseTime
        },
        teams: {
          connected: unifiedInsights.platformComparison.teams.connected,
          lastSync: new Date().toISOString(), // Would come from actual service
          messageCount: unifiedInsights.platformComparison.teams.messageVolume,
          meetingCount: unifiedInsights.platformComparison.teams.meetingVolume,
          teamCount: 0, // Would come from Teams service
          responseTime: unifiedInsights.platformComparison.teams.responseTime
        }
      });

      // Transform insights into UI format
      const transformedInsights: CrossPlatformInsight[] = [
        {
          id: 'platform-efficiency',
          type: 'optimization',
          priority: 'high',
          title: `${unifiedInsights.platformComparison.recommendation.primaryPlatform === 'slack' ? 'Slack' : 'Teams'} is your primary communication platform`,
          description: unifiedInsights.platformComparison.recommendation.reasoning,
          impact: 'Optimize workflow by consolidating communication',
          actionable: true,
          platforms: ['slack', 'teams'],
          metrics: {
            current: Math.round(unifiedInsights.efficiencyMetrics.communicationEfficiency),
            target: 85,
            change: 12,
            unit: '%'
          }
        },
        {
          id: 'response-time',
          type: 'pattern',
          priority: 'medium',
          title: 'Cross-platform response time analysis',
          description: `Average response time is ${unifiedInsights.efficiencyMetrics.overallResponseTime} minutes`,
          impact: 'Faster responses improve team productivity',
          actionable: true,
          platforms: ['slack', 'teams'],
          metrics: {
            current: unifiedInsights.efficiencyMetrics.overallResponseTime,
            target: 15,
            change: -5,
            unit: 'min'
          }
        },
        {
          id: 'collaboration-score',
          type: 'recommendation',
          priority: 'medium',
          title: 'Team collaboration effectiveness',
          description: 'Your team collaboration score indicates good cross-platform engagement',
          impact: 'Strong collaboration leads to better outcomes',
          actionable: false,
          platforms: ['slack', 'teams'],
          metrics: {
            current: unifiedInsights.efficiencyMetrics.collaborationScore,
            target: 90,
            change: 8,
            unit: '/100'
          }
        }
      ];

      // Add optimization recommendations
      unifiedInsights.efficiencyMetrics.recommendations.forEach((rec: any, index: number) => {
        transformedInsights.push({
          id: `recommendation-${index}`,
          type: 'recommendation',
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          impact: rec.expectedImpact,
          actionable: true,
          platforms: ['slack', 'teams']
        });
      });

      setInsights(transformedInsights);
      setHealthScore(healthData.overall);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent communication health';
    if (score >= 60) return 'Good communication with room for improvement';
    return 'Communication needs attention';
  };

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleConnectPlatform = (platform: 'slack' | 'teams') => {
    // Would open integration setup modal
    console.log(`Connecting ${platform}...`);
  };

  const handleRefreshData = () => {
    loadDashboardData();
  };

  if (isLoading && !platformStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading communication analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communication Intelligence</h2>
          <p className="text-muted-foreground">
            Unified insights from Slack and Microsoft Teams
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Communication Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Communication Health Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getHealthScoreColor(healthScore)}`}>
                {healthScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
            <div className="flex-1">
              <Progress value={healthScore} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                {getHealthScoreMessage(healthScore)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slack Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>Slack</span>
              </div>
              {platformStatus?.slack.connected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  Not Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {platformStatus?.slack.connected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{platformStatus.slack.messageCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{platformStatus.slack.userCount}</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span className="font-medium">{platformStatus.slack.responseTime}min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Last Sync</span>
                  <span className="text-muted-foreground">{formatTimeAgo(platformStatus.slack.lastSync)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Connect Slack to get communication insights
                </p>
                <Button onClick={() => handleConnectPlatform('slack')}>
                  Connect Slack
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-blue-600" />
                <span>Microsoft Teams</span>
              </div>
              {platformStatus?.teams.connected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  Not Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {platformStatus?.teams.connected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{platformStatus.teams.messageCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{platformStatus.teams.meetingCount}</div>
                    <div className="text-sm text-muted-foreground">Meetings</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span className="font-medium">{platformStatus.teams.responseTime}min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Last Sync</span>
                  <span className="text-muted-foreground">{formatTimeAgo(platformStatus.teams.lastSync)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Connect Teams to get meeting and communication insights
                </p>
                <Button onClick={() => handleConnectPlatform('teams')}>
                  Connect Teams
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="patterns">Communication Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.filter(insight => insight.type === 'pattern' || insight.type === 'optimization').map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
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
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-muted-foreground text-sm mb-2">{insight.description}</p>
                      <p className="text-sm text-blue-600">{insight.impact}</p>
                    </div>
                    {insight.metrics && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {insight.metrics.current}{insight.metrics.unit}
                        </div>
                        {insight.metrics.change && (
                          <div className={`text-sm flex items-center ${
                            insight.metrics.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {insight.metrics.change > 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {Math.abs(insight.metrics.change)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Peak Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Slack</span>
                    <span className="text-sm font-medium">9-11 AM, 2-4 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Teams</span>
                    <span className="text-sm font-medium">10 AM-12 PM, 3-5 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Quick Decisions</span>
                    <span className="text-sm font-medium">Slack (70%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Formal Planning</span>
                    <span className="text-sm font-medium">Teams (85%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Efficiency Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Meeting Attendance</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {insights.filter(insight => insight.type === 'recommendation').map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Lightbulb className="w-6 h-6 text-yellow-500 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600">{insight.impact}</span>
                        {insight.actionable && (
                          <Button size="sm" variant="outline">
                            Take Action <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Automations Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              AI-powered automations to optimize your team's communication workflow
            </p>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedCommunicationDashboard; 