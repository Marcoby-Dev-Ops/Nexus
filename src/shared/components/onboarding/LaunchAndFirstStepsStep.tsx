import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Rocket, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';

interface LaunchAndFirstStepsStepProps {
  onNext: (data: Record<string, unknown>) => void;
  onSkip: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
  currentStep: number;
  totalSteps: number;
}

export const LaunchAndFirstStepsStep: React.FC<LaunchAndFirstStepsStepProps> = ({ 
  onNext, 
  onSkip, 
  data 
}) => {
  const handleLaunch = () => {
    // Structure data for home page population
    const homePageData = {
      ...data,
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
      // User preferences and business context
      userPreferences: {
        industry: data.industry,
        companySize: data.companySize,
        tools: data.tools,
        priorities: data.priorities,
        challenges: data.challenges
      },
      // Selected opportunities for home page
      selectedOpportunities: data.discoveredOpportunities || [],
      // FIRE concepts data
      fireConcepts: data.fireConceptsData || {},
      // Home page sections to populate
      homePageSections: {
        opportunities: data.discoveredOpportunities || [],
        recentActivity: [],
        quickActions: [
          'Review Opportunities',
          'Track Progress',
          'Generate Insights'
        ],
        businessContext: {
          industry: data.industry,
          size: data.companySize,
          focusAreas: data.priorities
        }
      }
    };

    onNext(homePageData);
  };

  const selectedOpportunities = data.discoveredOpportunities || [];
  const selectedCount = selectedOpportunities.length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Success Header */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          You're All Set!
        </motion.h1>
        <motion.p 
          className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Your personalized Nexus dashboard is ready with {selectedCount} opportunities based on your AI foundation
        </motion.p>
      </motion.div>

      {/* What's Next */}
      <motion.div 
        className="mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              What's Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-medium mb-2">1. Explore Opportunities</h4>
                <p className="text-sm text-muted-foreground">
                  Review your {selectedCount} selected opportunities and start tracking progress
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-medium mb-2">2. Track Progress</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor your business transformation with real-time analytics
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-medium mb-2">3. Execute & Scale</h4>
                <p className="text-sm text-muted-foreground">
                  Implement your FIRE initiatives and scale your success
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Opportunities Summary */}
      {selectedOpportunities.length > 0 && (
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Selected Opportunities
                <Badge variant="secondary" className="ml-2">
                  {selectedCount} Ready
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedOpportunities.slice(0, 3).map((opportunity: any, index: number) => (
                  <div key={opportunity.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{opportunity.title}</h4>
                      <p className="text-xs text-muted-foreground">{opportunity.estimatedValue}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {opportunity.impact} Impact
                    </Badge>
                  </div>
                ))}
                {selectedOpportunities.length > 3 && (
                  <div className="text-center p-3 text-sm text-muted-foreground">
                    +{selectedOpportunities.length - 3} more opportunities ready to explore
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Launch Button */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Button 
          onClick={handleLaunch}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
        >
          Launch Nexus Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          Start your business transformation journey
        </p>
      </motion.div>
    </div>
  );
};
