import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Trophy, 
  Star,
  Users,
  Zap,
  BarChart3,
  User,
  Settings,
  Building2,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Calendar,
  MessageSquare,
  Bell,
  Plus,
  Play
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useJourneySteps, type JourneyStep, type WorkspaceMission } from '@/hooks/workspace/useJourneySteps';

const WorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { setHeaderContent } = useHeaderContext();
  const [activeTab, setActiveTab] = useState<'journey' | 'missions' | 'achievements'>('journey');

  const {
    journeySteps,
    missions,
    loading,
    error,
    journeyProgress,
    missionProgress,
    completedJourneySteps,
    totalJourneySteps,
    completedMissions,
    totalMissions,
    updateJourneyStep,
    updateMission,
    refresh
  } = useJourneySteps();

  // Set header content
  useEffect(() => {
    setHeaderContent('My Workspace', 'Your personalized productivity hub');
    
    return () => {
      setHeaderContent(null, null);
    };
  }, []);

  const handleStepComplete = (stepId: string) => {
    updateJourneyStep(stepId, true);
  };

  const handleMissionComplete = (missionId: string) => {
    updateMission(missionId, true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'journey':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'daily':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'weekly':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'achievement':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Map step IDs to icons
  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'profile-setup':
        return <User className="w-5 h-5" />;
      case 'first-integration':
        return <Zap className="w-5 h-5" />;
      case 'business-assessment':
        return <Building2 className="w-5 h-5" />;
      case 'team-invite':
        return <Users className="w-5 h-5" />;
      case 'first-automation':
        return <Zap className="w-5 h-5" />;
      case 'analytics-setup':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  // Map mission IDs to icons
  const getMissionIcon = (missionId: string) => {
    switch (missionId) {
      case 'daily-checkin':
        return <Calendar className="w-5 h-5" />;
      case 'weekly-review':
        return <TrendingUp className="w-5 h-5" />;
      case 'ai-conversation':
        return <MessageSquare className="w-5 h-5" />;
      case 'integration-sync':
        return <Settings className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">My Workspace</h1>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">My Workspace</h1>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg">Error loading workspace: {error}</p>
            <Button onClick={refresh}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">My Workspace</h1>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your personalized productivity hub for achieving operational excellence
          </p>
        </motion.div>

        {/* Journey Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold">Journey to Operational Excellence</h2>
                </div>
                <Badge variant="outline" className="text-sm">
                  {completedJourneySteps}/{totalJourneySteps} Complete
                </Badge>
              </div>
              <Progress value={journeyProgress} className="h-3 mb-4" />
              <p className="text-sm text-muted-foreground">
                {journeyProgress === 100 
                  ? "🎉 Congratulations! You've achieved operational excellence!"
                  : `Complete ${totalJourneySteps - completedJourneySteps} more steps to reach operational excellence`
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mx-auto"
        >
          {[
            { id: 'journey', label: 'Journey Steps', icon: <Target className="w-4 h-4" /> },
            { id: 'missions', label: 'Daily Missions', icon: <Star className="w-4 h-4" /> },
            { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content Based on Active Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {journeySteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full transition-all hover:shadow-md ${
                    step.completed ? 'border-green-200 bg-green-50/50' : 'border-border'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            step.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.completed ? <CheckCircle className="w-5 h-5" /> : getStepIcon(step.id)}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {step.title}
                              {step.required && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Time</span>
                          <span className="font-medium">{step.estimatedTime}</span>
                        </div>
                        {step.difficulty && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Difficulty</span>
                            <Badge variant="outline" className={`text-xs ${getDifficultyColor(step.difficulty)}`}>
                              {step.difficulty}
                            </Badge>
                          </div>
                        )}
                        {step.rewards && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Rewards:</span>
                            <div className="flex flex-wrap gap-1">
                              {step.rewards.map((reward, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {reward}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {step.completed ? (
                            <Button variant="outline" className="w-full" disabled>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Completed
                            </Button>
                          ) : (
                            <>
                              {step.actionLink && (
                                <Button className="flex-1" onClick={() => window.location.href = step.actionLink!}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                onClick={() => handleStepComplete(step.id)}
                                className="px-3"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {missions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full transition-all hover:shadow-md ${
                    mission.completed ? 'border-green-200 bg-green-50/50' : 'border-border'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            mission.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            {mission.completed ? <CheckCircle className="w-5 h-5" /> : getMissionIcon(mission.id)}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {mission.title}
                              <Badge variant="outline" className={`text-xs ${getCategoryColor(mission.category)}`}>
                                {mission.category}
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {mission.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{mission.progress}/{mission.maxProgress}</span>
                          </div>
                          <Progress value={(mission.progress / mission.maxProgress) * 100} className="h-2" />
                        </div>
                        {mission.rewards && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Rewards:</span>
                            <div className="flex flex-wrap gap-1">
                              {mission.rewards.map((reward, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {reward}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {mission.completed ? (
                            <Button variant="outline" className="w-full" disabled>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Completed
                            </Button>
                          ) : (
                            <>
                              {mission.actionLink && (
                                <Button className="flex-1" onClick={() => window.location.href = mission.actionLink!}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                onClick={() => handleMissionComplete(mission.id)}
                                className="px-3"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Achievements Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Track your progress and unlock achievements as you complete missions and reach milestones in your Nexus journey.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkspacePage;
