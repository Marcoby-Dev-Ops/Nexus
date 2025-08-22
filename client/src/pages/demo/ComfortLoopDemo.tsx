import React, { useState } from 'react';
import { PlayerCard, PlayerCardExample } from '@/shared/components/dashboard/PlayerCard';
import { CoachReportScreen, CoachReportExample } from '@/shared/components/onboarding/CoachReportScreen';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Target, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  Users,
  DollarSign,
  Zap,
  Award
} from 'lucide-react';

export const ComfortLoopDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('player-card');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Comfort Loop in Action
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            How Nexus answers the three key questions through design and microcopy, 
            creating comfort and clarity in every interaction.
          </p>
        </div>

        {/* Key Questions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Target className="h-8 w-8 text-blue-600 mx-auto" />
                <h3 className="font-semibold text-blue-900">Where am I?</h3>
                <p className="text-sm text-blue-700">
                  Clear position showing current stats, level, and progress
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="font-semibold text-green-900">What am I doing well?</h3>
                <p className="text-sm text-green-700">
                  Celebrations, progress tracking, and strength recognition
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto" />
                <h3 className="font-semibold text-purple-900">How can I get better?</h3>
                <p className="text-sm text-purple-700">
                  Next best moves, personalized insights, and growth paths
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="player-card">Player Card (Daily View)</TabsTrigger>
            <TabsTrigger value="coach-report">Coach's Report (Weekly)</TabsTrigger>
          </TabsList>

          <TabsContent value="player-card" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Player Card - First Impression
                </CardTitle>
                <p className="text-gray-600">
                  The main dashboard that users see every day. Notice how it answers all three questions 
                  at a glance through visual design and microcopy.
                </p>
              </CardHeader>
              <CardContent>
                <PlayerCardExample />
              </CardContent>
            </Card>

            {/* Comfort Loop Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-blue-900 mb-2">"Where am I?"</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Level 3 Business Owner</li>
                    <li>• Stats: Efficiency (82), Team (70), Finance (46), Growth (58)</li>
                    <li>• "Here's where your business stands today"</li>
                    <li>• Experience bar showing progress</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-green-900 mb-2">"What am I doing well?"</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• "Doing Well" section with top strengths</li>
                    <li>• Recent progress with checkmarks</li>
                    <li>• Award icons for excellent stats</li>
                    <li>• "You're on the right track" message</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-purple-900 mb-2">"How can I get better?"</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• "Your Next Best Move" card</li>
                    <li>• "Needs Focus" section</li>
                    <li>• Specific impact predictions</li>
                    <li>• "View Growth Path" button</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coach-report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Coach's Report - Weekly Reflection
                </CardTitle>
                <p className="text-gray-600">
                  The weekly summary that reinforces progress and provides direction. 
                  This creates a loop of comfort + clarity + direction.
                </p>
              </CardHeader>
              <CardContent>
                <CoachReportExample />
              </CardContent>
            </Card>

            {/* Comfort Loop Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-blue-900 mb-2">"Where am I?"</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• "Here's where your business stands today"</li>
                    <li>• Visual stat rings with labels</li>
                    <li>• Clear performance indicators</li>
                    <li>• Progress since last report</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-green-900 mb-2">"What am I doing well?"</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• "What you accomplished this week"</li>
                    <li>• Coach's insights highlighting strengths</li>
                    <li>• "You made 3 big moves this week"</li>
                    <li>• Specific improvements listed</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-purple-900 mb-2">"How can I get better?"</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• "Your next best moves"</li>
                    <li>• Prioritized mission recommendations</li>
                    <li>• "Most businesses at your stage focus on..."</li>
                    <li>• Clear next steps with impact</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Key UX Principles */}
        <Card className="mt-8 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Target className="h-5 w-5" />
              The Comfort Loop UX Principle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900">Show Position</h4>
                <p className="text-sm text-gray-600">
                  Clear stats, level, and progress indicators
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900">Suggest Next Move</h4>
                <p className="text-sm text-gray-600">
                  Prioritized missions with clear impact
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900">Reinforce Progress</h4>
                <p className="text-sm text-gray-600">
                  Celebrations and strength recognition
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
              <p className="text-center text-gray-700">
                <strong>Every screen answers:</strong> "Am I doing what I should? How do I get better? What am I doing well?"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
