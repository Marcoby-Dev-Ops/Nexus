import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/Button';
import { 
  TrendingUp, 
  Target, 
  Award, 
  ArrowRight, 
  CheckCircle,
  Lightbulb,
  Users,
  DollarSign,
  Zap
} from 'lucide-react';

interface CoachReportProps {
  period: 'week' | 'month';
  stats: {
    efficiency: number;
    team: number;
    finance: number;
    growth: number;
  };
  completedMissions: Array<{
    id: string;
    title: string;
    impact: string;
    statGained: number;
  }>;
  nextMissions: Array<{
    id: string;
    title: string;
    impact: string;
    statGained: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  insights: Array<{
    type: 'strength' | 'opportunity' | 'warning';
    message: string;
    icon: React.ReactNode;
  }>;
}

export const CoachReportScreen: React.FC<CoachReportProps> = ({
  period,
  stats,
  completedMissions,
  nextMissions,
  insights
}) => {
  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Needs Focus';
    return 'Critical';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with comfort messaging */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Your {period === 'week' ? 'Weekly' : 'Monthly'} Coach's Report
        </h1>
        <p className="text-lg text-gray-600">
          You made {completedMissions.length} big moves this {period}. Here's what improved.
        </p>
      </div>

      {/* Stats Overview - "Where am I?" */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Here's where your business stands today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center space-y-2">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-200 flex items-center justify-center">
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
                  <p className={`text-xs ${getStatColor(value)}`}>
                    {getStatLabel(value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completed Missions - "What am I doing well?" */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What you accomplished this {period}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedMissions.map((mission) => (
              <div key={mission.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{mission.title}</p>
                    <p className="text-sm text-gray-600">{mission.impact}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  +{mission.statGained}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights - "How can I get better?" */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Your coach's insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.type === 'strength' ? 'bg-green-50 border border-green-200' :
                insight.type === 'opportunity' ? 'bg-blue-50 border border-blue-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`mt-1 ${
                  insight.type === 'strength' ? 'text-green-600' :
                  insight.type === 'opportunity' ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {insight.icon}
                </div>
                <p className="text-sm text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Missions - "Am I doing the right things?" */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Your next best moves
          </CardTitle>
          <p className="text-sm text-gray-600">
            These missions will have the biggest impact on your business right now
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextMissions.map((mission) => (
              <div key={mission.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    mission.priority === 'high' ? 'bg-red-500' :
                    mission.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{mission.title}</p>
                    <p className="text-sm text-gray-600">{mission.impact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    +{mission.statGained}
                  </Badge>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start Mission
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comfort Message */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">
              You're on the right track
            </h3>
            <p className="text-gray-600">
              Most businesses at your stage focus on {stats.finance < 60 ? 'Finance' : stats.team < 60 ? 'Team' : 'Growth'} next. 
              Want to see how to get there faster?
            </p>
            <Button className="mt-3 bg-green-600 hover:bg-green-700">
              View Growth Path
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Example usage with sample data
export const CoachReportExample: React.FC = () => {
  const sampleData: CoachReportProps = {
    period: 'week',
    stats: {
      efficiency: 82,
      team: 70,
      finance: 46,
      growth: 58
    },
    completedMissions: [
      {
        id: '1',
        title: 'Automated invoicing system',
        impact: 'Reduced manual work by 3 hours/week',
        statGained: 10
      },
      {
        id: '2',
        title: 'Set up customer feedback loop',
        impact: 'Improved customer satisfaction tracking',
        statGained: 8
      },
      {
        id: '3',
        title: 'Created team onboarding process',
        impact: 'Standardized new hire training',
        statGained: 12
      }
    ],
    nextMissions: [
      {
        id: '4',
        title: 'Implement expense tracking',
        impact: 'Get real-time financial visibility',
        statGained: 15,
        priority: 'high'
      },
      {
        id: '5',
        title: 'Set up automated reporting',
        impact: 'Save 2 hours on monthly reports',
        statGained: 8,
        priority: 'medium'
      }
    ],
    insights: [
      {
        type: 'strength',
        message: 'Your team efficiency is excellent! You\'re automating well.',
        icon: <Zap className="h-4 w-4" />
      },
      {
        type: 'opportunity',
        message: 'Focus on Finance next - it\'s your biggest growth opportunity.',
        icon: <DollarSign className="h-4 w-4" />
      },
      {
        type: 'strength',
        message: 'Your team building is strong. You\'re creating a solid foundation.',
        icon: <Users className="h-4 w-4" />
      }
    ]
  };

  return <CoachReportScreen {...sampleData} />;
};
