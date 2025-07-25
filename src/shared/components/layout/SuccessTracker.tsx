import React, { useState, useEffect } from 'react';
import {
  Star,
  Users,
  Database,
  Brain,
  Target,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Zap,
  Award,
  Trophy,
  Crown,
  CheckCircle,
  Circle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';

import { useAuth } from '@/hooks/index';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'onboarding' | 'productivity' | 'business' | 'expert';
  points: number;
  isCompleted: boolean;
  completedAt?: Date;
  progress?: number;
}

interface SuccessTrackerProps {
  className?: string;
}

export const SuccessTracker: React.FC<SuccessTrackerProps> = ({ className = '' }) => {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);

  // Define achievements
  const allAchievements: Achievement[] = [
    // Onboarding Achievements
    {
      id: 'first-login',
      title: 'First Steps',
      description: 'Successfully logged into Nexus',
      icon: <Star className="h-5 w-5" />,
      category: 'onboarding',
      points: 10,
      isCompleted: false
    },
    {
      id: 'profile-complete',
      title: 'Profile Master',
      description: 'Completed your business profile',
      icon: <Users className="h-5 w-5" />,
      category: 'onboarding',
      points: 25,
      isCompleted: false
    },
    {
      id: 'first-integration',
      title: 'Connected',
      description: 'Connected your first business tool',
      icon: <Database className="h-5 w-5" />,
      category: 'onboarding',
      points: 50,
      isCompleted: false
    },

    // Productivity Achievements
    {
      id: 'first-thought',
      title: 'Thought Capturer',
      description: 'Captured your first business thought',
      icon: <Brain className="h-5 w-5" />,
      category: 'productivity',
      points: 30,
      isCompleted: false
    },
    {
      id: 'first-action',
      title: 'Action Taker',
      description: 'Created your first action item',
      icon: <Target className="h-5 w-5" />,
      category: 'productivity',
      points: 40,
      isCompleted: false
    },
    {
      id: 'fire-cycle-user',
      title: 'Strategic Thinker',
      description: 'Used the FIRE cycle for decision making',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'productivity',
      points: 75,
      isCompleted: false
    },

    // Business Achievements
    {
      id: 'ai-chat-user',
      title: 'AI Collaborator',
      description: 'Had your first conversation with AI',
      icon: <MessageSquare className="h-5 w-5" />,
      category: 'business',
      points: 60,
      isCompleted: false
    },
    {
      id: 'calendar-integration',
      title: 'Time Master',
      description: 'Integrated your calendar for better scheduling',
      icon: <Clock className="h-5 w-5" />,
      category: 'business',
      points: 45,
      isCompleted: false
    },
    {
      id: 'knowledge-base',
      title: 'Knowledge Builder',
      description: 'Started building your knowledge base',
      icon: <Brain className="h-5 w-5" />,
      category: 'business',
      points: 80,
      isCompleted: false
    },

    // Expert Achievements
    {
      id: 'automation-creator',
      title: 'Automation Expert',
      description: 'Created your first automation workflow',
      icon: <Zap className="h-5 w-5" />,
      category: 'expert',
      points: 100,
      isCompleted: false
    },
    {
      id: 'team-leader',
      title: 'Team Leader',
      description: 'Invited team members to collaborate',
      icon: <Users className="h-5 w-5" />,
      category: 'expert',
      points: 150,
      isCompleted: false
    },
    {
      id: 'business-analyst',
      title: 'Business Analyst',
      description: 'Created comprehensive business analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'expert',
      points: 200,
      isCompleted: false
    }
  ];

  // Check achievement completion
  useEffect(() => {
    const updatedAchievements = allAchievements.map(achievement => {
      let isCompleted = false;
      const progress = 0;

      switch (achievement.id) {
        case 'first-login':
          isCompleted = !!user;
          break;
        case 'profile-complete':
          isCompleted = !!(profile?.first_name && profile?.last_name);
          break;
        case 'first-integration':
          // Simplified check - in real app, check actual integrations
          isCompleted = !!(profile?.preferences?.integrations);
          break;
        case 'first-thought':
          // Check if user has created thoughts
          isCompleted = false; // Would check thoughts table
          break;
        case 'first-action':
          // Check if user has created actions
          isCompleted = false; // Would check actions table
          break;
        case 'fire-cycle-user':
          // Check if user has used FIRE cycle
          isCompleted = false; // Would check fire_cycle_logs
          break;
        case 'ai-chat-user':
          // Check if user has used AI chat
          isCompleted = false; // Would check chat history
          break;
        case 'calendar-integration':
          // Check if calendar is integrated
          isCompleted = false; // Would check integrations
          break;
        case 'knowledge-base':
          // Check if knowledge base has content
          isCompleted = false; // Would check knowledge table
          break;
        case 'automation-creator':
          // Check if user has created automations
          isCompleted = false; // Would check automations
          break;
        case 'team-leader':
          // Check if user has invited team members
          isCompleted = false; // Would check team members
          break;
        case 'business-analyst':
          // Check if user has created analytics
          isCompleted = false; // Would check analytics usage
          break;
      }

      return {
        ...achievement,
        isCompleted,
        progress: isCompleted ? 100 : progress
      };
    });

    setAchievements(updatedAchievements);

    // Calculate total points and level
    const completedAchievements = updatedAchievements.filter(a => a.isCompleted);
    const totalPointsEarned = completedAchievements.reduce((sum, a) => sum + a.points, 0);
    setTotalPoints(totalPointsEarned);
    setLevel(Math.floor(totalPointsEarned / 100) + 1);
  }, [user, profile]);

  const getLevelTitle = (level: number) => {
    if (level <= 2) return 'Business Novice';
    if (level <= 4) return 'Business Apprentice';
    if (level <= 6) return 'Business Professional';
    if (level <= 8) return 'Business Expert';
    return 'Business Master';
  };



  const completedAchievements = achievements.filter(a => a.isCompleted);
  const recentAchievements = completedAchievements.slice(-3);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level and Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Success Journey
          </CardTitle>
          <CardDescription>
            Track your progress and celebrate your achievements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{getLevelTitle(level)}</h3>
              <p className="text-sm text-muted-foreground">Level {level}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Next Level</span>
              <span>{totalPoints % 100}/100 points</span>
            </div>
            <Progress value={(totalPoints % 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        +{achievement.points} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Categories */}
      <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
        {['onboarding', 'productivity', 'business', 'expert'].map((category) => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const completed = categoryAchievements.filter(a => a.isCompleted).length;
          const total = categoryAchievements.length;
          const progress = total > 0 ? (completed / total) * 100: 0;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-sm capitalize">{category} Achievements</CardTitle>
                <CardDescription>
                  {completed} of {total} completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  <div className="grid grid-cols-2 gap-2">
                    {categoryAchievements.slice(0, 4).map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-2 p-2 rounded text-xs ${
                          achievement.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {achievement.isCompleted ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-current" />
                        )}
                        <span className="truncate">{achievement.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Next Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements
              .filter(a => !a.isCompleted)
              .slice(0, 3)
              .map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-muted rounded-lg">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    +{achievement.points} pts
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 