/**
 * Living Business Assessment Dashboard
 * Comprehensive view of business health with peer comparisons, trends, and achievements
 * Provides motivation and insights for continuous improvement
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Users, 
  Target, 
  Award, 
  BarChart3, 
  Calendar,
  Zap,
  ChevronRight,
  Star,
  Crown,
  Medal
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';

// Mock types and services for now
interface LivingAssessment {
  currentScore: number;
  benchmarks: {
    totalBusinesses: number;
    percentile: number;
    yourRank: number;
    industryAverage: number;
    topPerformers: number;
  };
  peerComparison: {
    similarBusinesses: number;
    scoreComparison: any[];
  };
  trends: {
    monthlyChange: number;
  };
  achievements: any[];
  nextMilestones: any[];
}

const businessBenchmarkingService = {
  getLivingAssessment: async (userId: string, profile: any): Promise<LivingAssessment> => {
    // Mock implementation
    return {
      currentScore: 75,
      benchmarks: {
        totalBusinesses: 1000,
        percentile: 85,
        yourRank: 150
      },
      peerComparison: {
        similarBusinesses: 50
      },
      trends: {
        monthlyChange: 5
      },
      achievements: []
    };
  }
};

const logger = {
  error: (message: string, error: any) => // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(message, error)
};

interface LivingBusinessAssessmentProps {
  className?: string;
}

const LivingBusinessAssessment: React.FC<LivingBusinessAssessmentProps> = ({ 
  className = '' 
}) => {
  // Component temporarily disabled due to missing dependencies
  return (
    <div className={`p-6 text-center text-muted-foreground ${className}`}>
      <p>Living Business Assessment component is temporarily unavailable.</p>
      <p className="text-sm">Missing dependencies need to be implemented.</p>
    </div>
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'above':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'below':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <BarChart3 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <BarChart3 className="w-4 h-4 text-muted-foreground" />;
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'Getting Started':
        return <Star className="w-5 h-5 text-primary" />;
      case 'Verification':
        return <Medal className="w-5 h-5 text-success" />;
      case 'Milestones':
        return <Trophy className="w-5 h-5 text-warning" />;
      case 'Category Excellence':
        return <Crown className="w-5 h-5 text-secondary" />;
      default: return <Award className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="text-muted-foreground">Loading your business assessment...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !assessment) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive">Failed to load business assessment</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Score and Quick Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Living Business Assessment</h1>
              <p className="text-muted-foreground mt-1">
                Your real-time business health compared to {assessment.benchmarks.totalBusinesses - 1} other businesses
              </p>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(assessment.currentScore)}`}>
                {assessment.currentScore}
              </div>
              <div className="text-sm text-muted-foreground">Business Health Score</div>
              <Badge variant="outline" className="mt-2">
                {assessment.benchmarks.percentile}th percentile
              </Badge>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md: grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <div className="text-2xl font-bold">#{assessment.benchmarks.yourRank}</div>
              <div className="text-sm text-muted-foreground">Your Rank</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{assessment.peerComparison.similarBusinesses}</div>
              <div className="text-sm text-muted-foreground">Similar Businesses</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(assessment.trends.monthlyChange)}
              </div>
              <div className="text-2xl font-bold">
                {assessment.trends.monthlyChange > 0 ? '+' : ''}{assessment.trends.monthlyChange}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Change</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold">{assessment.achievements.length}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-2 p-1 bg-muted rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'peers', label: 'Peer Comparison', icon: Users },
          { id: 'achievements', label: 'Achievements', icon: Trophy }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab(tab.id as any)}
            className="flex items-center gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
          {/* Benchmark Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Your Score</span>
                  <span className={`font-bold ${getScoreColor(assessment.currentScore)}`}>
                    {assessment.currentScore}
                  </span>
                </div>
                <Progress value={assessment.currentScore} className="h-2" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Industry Average</span>
                  <span className="font-medium">{assessment.benchmarks.industryAverage}</span>
                </div>
                <Progress value={assessment.benchmarks.industryAverage} className="h-2 opacity-60" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Top Performers</span>
                  <span className="font-medium">{assessment.benchmarks.topPerformers}</span>
                </div>
                <Progress value={assessment.benchmarks.topPerformers} className="h-2 opacity-60" />
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  You're in the <span className="font-semibold text-foreground">
                    {assessment.benchmarks.percentile}th percentile
                  </span> of all businesses on Nexus
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Next Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.nextMilestones.map((milestone, index) => (
                <div key={index} className="p-4 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{milestone.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {milestone.pointsNeeded > 0 ? `${milestone.pointsNeeded} pts` : milestone.estimatedTime}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {milestone.description}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                    <Calendar className="w-3 h-3" />
                    {milestone.estimatedTime}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'peers' && (
        <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
          {/* Peer Score Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Score Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">{assessment.peerComparison.similarBusinesses}</div>
                <div className="text-sm text-muted-foreground">Similar Businesses</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 dark:bg-success/20">
                  <span className="text-sm">Businesses you outperform</span>
                  <span className="font-bold text-success">
                    {assessment.peerComparison.scoreComparison.lower}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-warning/5 dark:bg-yellow-900/20">
                  <span className="text-sm">Similar performing businesses</span>
                  <span className="font-bold text-warning">
                    {assessment.peerComparison.scoreComparison.similar}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 dark:bg-destructive/20">
                  <span className="text-sm">Businesses ahead of you</span>
                  <span className="font-bold text-destructive">
                    {assessment.peerComparison.scoreComparison.higher}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance vs Peers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(assessment.peerComparison.categoryComparisons).map(([category, comp]: [string, any]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      {getPerformanceIcon(comp.performance)}
                      <span className="text-sm">{comp.yourScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Peer average: {comp.peerAverage}%</span>
                    <Badge 
                      variant={comp.performance === 'above' ? 'default' : comp.performance === 'below' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {comp.performance}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'achievements' && (
        <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-4">
          {assessment.achievements.map((achievement, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-4">
                {getAchievementIcon(achievement.category)}
                <div className="flex-1">
                  <div className="font-semibold">{achievement.title}</div>
                  <div className="text-sm text-muted-foreground">{achievement.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{achievement.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Industry Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {assessment.industryInsights.industry} Industry Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold">{assessment.industryInsights.averageScore}</div>
              <div className="text-sm text-muted-foreground">Industry Average</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Top Categories</div>
              <div className="flex flex-wrap gap-1">
                {assessment.industryInsights.topCategories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">{category}</Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Common Connections</div>
              <div className="flex flex-wrap gap-1">
                {assessment.industryInsights.commonConnections.map((connection, index) => (
                  <Badge key={index} variant="outline" className="text-xs">{connection}</Badge>
                ))}
              </div>
            </div>
          </div>

          {assessment.industryInsights.growthOpportunities.length > 0 && (
            <div className="mt-4 p-4 bg-primary/5 dark: bg-blue-900/20 rounded-lg">
              <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Growth Opportunities in Your Industry
              </div>
              <ul className="space-y-1 text-sm text-primary dark:text-blue-200">
                {assessment.industryInsights.growthOpportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LivingBusinessAssessment; 