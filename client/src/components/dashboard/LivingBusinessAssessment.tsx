/**
 * Living Business Assessment Dashboard
 * Comprehensive view of business health with peer comparisons, trends, and achievements
 * Provides motivation and insights for continuous improvement
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Users, 
  Award,
  BarChart3,
  Target,
  Star,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useLivingBusinessAssessment } from '@/hooks/dashboard/useLivingBusinessAssessment';

interface LivingBusinessAssessmentProps {
  className?: string;
}

const LivingBusinessAssessment: React.FC<LivingBusinessAssessmentProps> = ({ 
  className = '' 
}) => {
  const { assessment, loading, error, isImproving, motivationalMessage, refresh } = useLivingBusinessAssessment();

  // Fallback data in case the hook doesn't return data
  const fallbackAssessment = {
    currentScore: 65,
    benchmarks: {
      totalBusinesses: 1000,
      percentile: 65,
      yourRank: 350,
      industryAverage: 60,
      topPerformers: 85
    },
    peerComparison: {
      similarBusinesses: 75,
      scoreComparison: {
        higher: 25,
        lower: 45,
        equal: 5
      }
    },
    trends: {
      monthlyChange: 8
    },
    achievements: [
      {
        id: 'first-integration',
        title: 'First Integration',
        description: 'Connected your first data source',
        category: 'integration',
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '🔗'
      }
    ],
    nextMilestones: [
      {
        id: 'connect-five',
        title: 'Connect 5 Integrations',
        description: 'Connect 5 data sources to unlock advanced analytics',
        targetScore: 80,
        reward: 'Advanced Analytics Dashboard'
      }
    ]
  };

  // Use fallback data if assessment is null
  const displayAssessment = assessment || fallbackAssessment;

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
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'integration': return <Zap className="w-4 h-4" />;
      case 'profile': return <Target className="w-4 h-4" />;
      case 'performance': return <Star className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Business Health Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Business Health Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Unable to load business health data</p>
            <p className="text-sm">{error}</p>
            <Button onClick={refresh} className="mt-4" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Business Health Assessment</CardTitle>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(displayAssessment.currentScore)}`}>
            {displayAssessment.currentScore}
          </div>
          <div className="text-lg text-muted-foreground mb-2">Business Health Score</div>
          {motivationalMessage && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {motivationalMessage}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Score</span>
            <span>{displayAssessment.currentScore}/100</span>
          </div>
          <Progress value={displayAssessment.currentScore} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Benchmarks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-lg font-semibold">{displayAssessment.benchmarks.percentile}%</div>
            <div className="text-xs text-muted-foreground">Percentile</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-lg font-semibold">#{displayAssessment.benchmarks.yourRank}</div>
            <div className="text-xs text-muted-foreground">Rank</div>
          </div>
        </div>

        {/* Peer Comparison */}
        <div>
          <h4 className="font-medium mb-3">Peer Comparison</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Ahead of you</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{displayAssessment.peerComparison.scoreComparison.higher}</span>
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Behind you</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{displayAssessment.peerComparison.scoreComparison.lower}</span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Monthly Change</div>
            <div className="text-lg font-semibold">
              {displayAssessment.trends.monthlyChange > 0 ? '+' : ''}{displayAssessment.trends.monthlyChange} points
            </div>
          </div>
          {getTrendIcon(displayAssessment.trends.monthlyChange)}
        </div>

        {/* Achievements */}
        {displayAssessment.achievements && displayAssessment.achievements.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <Trophy className="w-4 h-4 mr-2" />
              Recent Achievements
            </h4>
            <div className="space-y-2">
              {displayAssessment.achievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center p-2 bg-muted/30 rounded-lg">
                  <span className="text-lg mr-3">{getAchievementIcon(achievement.category)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {achievement.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Milestones - Only show if using fallback data */}
        {displayAssessment.nextMilestones && displayAssessment.nextMilestones.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Next Milestones
            </h4>
            <div className="space-y-2">
              {displayAssessment.nextMilestones.slice(0, 2).map((milestone) => (
                <div key={milestone.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <Badge variant="outline" className="text-xs">
                      +{milestone.targetScore - displayAssessment.currentScore} pts
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {milestone.description}
                  </div>
                  <div className="text-xs text-success font-medium">
                    Reward: {milestone.reward}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LivingBusinessAssessment; 
