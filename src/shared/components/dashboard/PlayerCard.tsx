import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Award, 
  ArrowRight, 
  CheckCircle,
  Users,
  DollarSign,
  Zap,
  Star,
  AlertCircle
} from 'lucide-react';

interface PlayerCardProps {
  stats: {
    efficiency: number;
    team: number;
    finance: number;
    growth: number;
  };
  nextMission: {
    id: string;
    title: string;
    impact: string;
    statGained: number;
    statTarget: string;
  };
  recentProgress: Array<{
    stat: string;
    change: number;
    message: string;
  }>;
  level: number;
  experience: number;
  experienceToNext: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  stats,
  nextMission,
  recentProgress,
  level,
  experience,
  experienceToNext
}) => {
  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'efficiency': return <Zap className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTopStrengths = () => {
    return Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([stat, value]) => ({ stat, value }));
  };

  const getNeedsFocus = () => {
    return Object.entries(stats)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 1)
      .map(([stat, value]) => ({ stat, value }))[0];
  };

  const topStrengths = getTopStrengths();
  const needsFocus = getNeedsFocus();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Main Player Card */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Level {level} Business Owner
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Here's where your business stands today
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{level}</div>
              <div className="text-sm text-gray-500">Level</div>
            </div>
          </div>
          
          {/* Experience Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Experience</span>
              <span>{experience} / {experience + experienceToNext}</span>
            </div>
            <Progress value={(experience / (experience + experienceToNext)) * 100} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center space-y-2">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-200 flex items-center justify-center bg-white shadow-sm">
                    <span className={`text-lg font-bold ${getStatColor(value)}`}>
                      {value}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    {value >= 80 && <Award className="h-5 w-5 text-yellow-500" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium capitalize text-gray-700">
                    {key}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getStatIcon(key)}
                    <span className={`text-xs ${getStatColor(value)}`}>
                      {value >= 80 ? 'Excellent' : value >= 60 ? 'Good' : value >= 40 ? 'Needs Focus' : 'Critical'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Doing Well */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-800">Doing Well</h4>
                </div>
                <div className="space-y-2">
                  {topStrengths.map(({ stat, value }) => (
                    <div key={stat} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-green-700">{stat}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Needs Focus */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Needs Focus</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm capitalize text-yellow-700">{needsFocus.stat}</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {needsFocus.value}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Mission - "Am I doing the right things?" */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-600" />
                Your Next Best Move
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium text-gray-900">{nextMission.title}</p>
                    <p className="text-sm text-gray-600">{nextMission.impact}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Will push your {nextMission.statTarget} stat closer to 60
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    +{nextMission.statGained}
                  </Badge>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start Mission
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Progress - "What am I doing well?" */}
          {recentProgress.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentProgress.map((progress, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">{progress.message}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        +{progress.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comfort Message */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto" />
                <h3 className="text-base font-semibold text-gray-900">
                  You're on the right track
                </h3>
                <p className="text-sm text-gray-600">
                  Most businesses at your stage focus on {needsFocus.stat} next. 
                  Want to see how to get there faster?
                </p>
                <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                  View Growth Path
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

// Example usage with sample data
export const PlayerCardExample: React.FC = () => {
  const sampleData: PlayerCardProps = {
    stats: {
      efficiency: 82,
      team: 70,
      finance: 46,
      growth: 58
    },
    nextMission: {
      id: '1',
      title: 'Implement expense tracking',
      impact: 'Get real-time financial visibility',
      statGained: 15,
      statTarget: 'Finance'
    },
    recentProgress: [
      {
        stat: 'efficiency',
        change: 10,
        message: 'Automated invoicing system'
      },
      {
        stat: 'team',
        change: 8,
        message: 'Set up customer feedback loop'
      }
    ],
    level: 3,
    experience: 750,
    experienceToNext: 250
  };

  return <PlayerCard {...sampleData} />;
};
