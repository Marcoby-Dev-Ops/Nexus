import React, { useState, useEffect } from 'react';
import { Progress } from '@/shared/components/ui/Progress';
import { Badge } from '@/shared/components/ui/Badge';
import { Trophy, Star, Target, TrendingUp } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'business' | 'personal' | 'technical';
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward?: string;
  icon: React.ComponentType<any>;
}

interface SuccessMetrics {
  totalAchievements: number;
  completedAchievements: number;
  completionRate: number;
  recentAchievements: Achievement[];
  upcomingAchievements: Achievement[];
}

export const SuccessTracker: React.FC = () => {
  const [metrics, setMetrics] = useState<SuccessMetrics>({
    totalAchievements: 0,
    completedAchievements: 0,
    completionRate: 0,
    recentAchievements: [],
    upcomingAchievements: [],
  });

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Integration',
      description: 'Successfully connect your first external service',
      category: 'business',
      progress: 1,
      maxProgress: 1,
      completed: true,
      reward: 'Integration Expert Badge',
      icon: Trophy,
    },
    {
      id: '2',
      title: 'Revenue Milestone',
      description: 'Reach your first revenue milestone',
      category: 'business',
      progress: 0.7,
      maxProgress: 1,
      completed: false,
      reward: 'Revenue Champion Badge',
      icon: Star,
    },
    {
      id: '3',
      title: 'Team Growth',
      description: 'Build a team of 5+ members',
      category: 'business',
      progress: 0.4,
      maxProgress: 1,
      completed: false,
      reward: 'Team Leader Badge',
      icon: Target,
    },
    {
      id: '4',
      title: 'Productivity Master',
      description: 'Complete 50 tasks in a single week',
      category: 'personal',
      progress: 0.8,
      maxProgress: 1,
      completed: false,
      reward: 'Productivity Master Badge',
      icon: TrendingUp,
    },
  ];

  useEffect(() => {
    const totalAchievements = mockAchievements.length;
    const completedAchievements = mockAchievements.filter(a => a.completed).length;
    const completionRate = totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0;
    const recentAchievements = mockAchievements.filter(a => a.completed).slice(-3);
    const upcomingAchievements = mockAchievements.filter(a => !a.completed).slice(0, 3);

    setMetrics({
      totalAchievements,
      completedAchievements,
      completionRate,
      recentAchievements,
      upcomingAchievements,
    });
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'business':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Achievements</p>
              <p className="text-2xl font-bold">{metrics.totalAchievements}</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{metrics.completedAchievements}</p>
            </div>
            <Star className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {metrics.recentAchievements.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
          <div className="space-y-4">
            {metrics.recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <achievement.icon className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <Badge variant="secondary" className={getCategoryColor(achievement.category)}>
                      {achievement.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.reward && (
                    <p className="text-xs text-green-600 mt-1">Reward: {achievement.reward}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Achievements */}
      {metrics.upcomingAchievements.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Upcoming Achievements</h3>
          <div className="space-y-4">
            {metrics.upcomingAchievements.map((achievement) => (
              <div key={achievement.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <achievement.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <Badge variant="secondary" className={getCategoryColor(achievement.category)}>
                          {achievement.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(achievement.progress * 100)}%
                  </div>
                </div>
                <Progress 
                  value={achievement.progress * 100} 
                  className="h-2"
                />
                {achievement.reward && (
                  <p className="text-xs text-muted-foreground">Reward: {achievement.reward}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 
