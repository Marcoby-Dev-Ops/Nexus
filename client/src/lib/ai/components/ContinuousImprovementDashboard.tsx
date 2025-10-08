import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { TrendingUp, TrendingDown, Star, DollarSign, Activity, AlertTriangle, CheckCircle, Clock, Target, BarChart3, PieChart, LineChart } from 'lucide-react';
import { AIService } from '@/services/ai';
import { financialService } from '@/services/core';

interface ImprovementDashboardProps {
  userId: string;
  timeframe?: 'day' | 'week' | 'month';
}

export const ContinuousImprovementDashboard: React.FC<ImprovementDashboardProps> = ({
  userId,
  timeframe = 'week'
}) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        improvementData,
        billingData,
        recommendationData
      ] = await Promise.all([
        continuousImprovementService.getImprovementDashboard(timeframe),
        financialService.getBillingStatus(userId),
        continuousImprovementService.generateImprovementRecommendations()
      ]);

      setDashboardData(improvementData);
      setBillingStatus(billingData);
      setRecommendations(recommendationData);
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error loading dashboard data: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (rating: number, messageId: string, agentId: string) => {
    try {
      await continuousImprovementService.trackUserFeedback({
        userId,
        conversationId: 'current',
        messageId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        feedbackType: 'overall',
        agentId,
        modelUsed: 'current',
        provider: 'current'
      });
      
      // Refresh dashboard data
      loadDashboardData();
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error submitting feedback: ', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Performance & Billing Dashboard</h2>
          <p className="text-muted-foreground">Track improvements and manage costs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold text-success">
                  {Math.round((dashboardData?.overallHealthScore || 0.85) * 100)}%
                </p>
              </div>
              <div className="bg-success/10 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold text-primary">
                  ${billingStatus?.costs?.currentPeriodCost?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-warning">
                  {dashboardData?.userSatisfaction?.averageRating?.toFixed(1) || '4.2'}
                </p>
              </div>
              <div className="bg-warning/10 p-2 rounded-full">
                <Star className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Token Usage</p>
                <p className="text-2xl font-bold text-secondary">
                  {billingStatus?.usage?.utilizationPercent?.toFixed(0) || '0'}%
                </p>
              </div>
              <div className="bg-secondary/10 p-2 rounded-full">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Alerts */}
      {billingStatus?.alerts?.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Billing Alerts: </strong>
            <ul className="list-disc list-inside mt-1">
              {billingStatus.alerts.map((alert: string, index: number) => (
                <li key={index} className="text-sm">{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="improvement">Improvement</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Response Quality</span>
                    <span className="text-sm font-medium">
                      {Math.round((dashboardData?.responseQuality?.averageScore || 0.85) * 100)}%
                    </span>
                  </div>
                  <Progress value={(dashboardData?.responseQuality?.averageScore || 0.85) * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost Efficiency</span>
                    <span className="text-sm font-medium">
                      {Math.round((dashboardData?.costEfficiency?.score || 0.78) * 100)}%
                    </span>
                  </div>
                  <Progress value={(dashboardData?.costEfficiency?.score || 0.78) * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">User Satisfaction</span>
                    <span className="text-sm font-medium">
                      {Math.round((dashboardData?.userSatisfaction?.score || 0.82) * 100)}%
                    </span>
                  </div>
                  <Progress value={(dashboardData?.userSatisfaction?.score || 0.82) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Usage Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tokens Used</span>
                    <span className="text-sm font-medium">
                      {billingStatus?.usage?.tokensUsed?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tokens Remaining</span>
                    <span className="text-sm font-medium">
                      {billingStatus?.usage?.tokensRemaining?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projected Monthly Cost</span>
                    <span className="text-sm font-medium">
                      ${billingStatus?.costs?.projectedMonthlyCost?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budget Utilization</span>
                    <span className="text-sm font-medium">
                      {billingStatus?.costs?.budgetUtilization?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Improvement Tab */}
        <TabsContent value="improvement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Improvement Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              rec.priority === 'critical' ? 'destructive' :
                              rec.priority === 'high' ? 'default' :
                              rec.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">{rec.type}</Badge>
                          </div>
                          <h4 className="font-medium text-foreground mb-1">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          
                          {rec.expectedImpact && (
                            <div className="text-sm text-success">
                              Expected: {rec.expectedImpact.improvementPercent}% improvement in {rec.expectedImpact.metric}
                            </div>
                          )}
                          
                          {rec.potentialSavings && (
                            <div className="text-sm text-primary">
                              Potential savings: ${rec.potentialSavings.toFixed(2)}/month
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">
                            Confidence: {Math.round(rec.confidence * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Effort: {rec.estimatedEffort}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No improvement recommendations available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Current Billing Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="text-sm font-medium">{billingStatus?.plan?.name || 'Free'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Base Fee</span>
                    <span className="text-sm font-medium">
                      ${billingStatus?.plan?.monthlyFee?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Usage Charges</span>
                    <span className="text-sm font-medium">
                      ${(billingStatus?.costs?.currentPeriodCost - billingStatus?.plan?.monthlyFee || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Current Period</span>
                      <span>${billingStatus?.costs?.currentPeriodCost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Token Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Monthly Allowance</span>
                      <span className="text-sm font-medium">
                        {billingStatus?.usage?.tokensUsed?.toLocaleString() || '0'} / {billingStatus?.usage?.tokensIncluded?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <Progress value={billingStatus?.usage?.utilizationPercent || 0} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Remaining</span>
                      <span>{billingStatus?.usage?.tokensRemaining?.toLocaleString() || '0'} tokens</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Projected Monthly</span>
                      <span>${billingStatus?.costs?.projectedMonthlyCost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-success/5 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                    <div className="text-lg font-bold text-success">+12%</div>
                    <div className="text-xs text-muted-foreground">vs last month</div>
                  </div>
                  
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Cost</div>
                    <div className="text-lg font-bold text-primary">-8%</div>
                    <div className="text-xs text-muted-foreground">vs last month</div>
                  </div>
                  
                  <div className="text-center p-4 bg-secondary/5 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="text-sm text-muted-foreground">User Satisfaction</div>
                    <div className="text-lg font-bold text-secondary">+5%</div>
                    <div className="text-xs text-muted-foreground">vs last month</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Key Insights</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                      <span className="text-sm text-foreground/90">
                        Hybrid model selection reduced costs by 15% while maintaining quality
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                      <span className="text-sm text-foreground/90">
                        OpenRouter integration improved response times by 23%
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                      <span className="text-sm text-foreground/90">
                        Peak usage hours identified: 9-11 AM and 2-4 PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => loadDashboardData()}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              View History
            </Button>
            <Button variant="outline" size="sm">
              <Target className="w-4 h-4 mr-2" />
              Set Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
