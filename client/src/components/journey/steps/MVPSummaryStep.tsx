/**
 * MVP Journey - Summary Step
 * 
 * Final summary step showing MVP setup results and next steps.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  CheckCircle, 
  ArrowRight, 
  Rocket, 
  Target,
  Zap,
  TrendingUp,
  Users,
  Building,
  Lightbulb,
  Star,
  Award,
  Play
} from 'lucide-react';
import type { JourneyStepProps } from '../types';

export default function MVPSummaryStep({ onStepComplete, onStepBack, journeyData }: JourneyStepProps) {
  // Extract data from journey steps
  const businessUnits = journeyData?.['mvp-business-units']?.businessUnits || [];
  const integrations = journeyData?.['mvp-integrations']?.integrations || [];
  const maturityAssessment = journeyData?.['mvp-maturity-assessment'] || {};

  const setupScore = calculateSetupScore(businessUnits, integrations);
  const nextSteps = generateNextSteps(businessUnits, integrations, maturityAssessment);

  const handleComplete = () => {
    onStepComplete({
      setupComplete: true,
      setupScore,
      businessUnits,
      integrations,
      maturityAssessment,
      nextSteps
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Rocket className="w-16 h-16 text-primary mb-4" />
        </div>
        <h2 className="text-2xl font-bold">MVP Setup Complete! 🎉</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Congratulations! Your business is now set up with the essential foundations. 
          Here's what we've accomplished and what's next.
        </p>
      </div>

      {/* Setup Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Setup Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Setup Progress</span>
              <span className="text-sm font-semibold">{setupScore}%</span>
            </div>
            <Progress value={setupScore} className="h-3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{businessUnits.length}</div>
                <div className="text-sm text-green-700">Business Units</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{integrations.length}</div>
                <div className="text-sm text-blue-700">Integrations</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {maturityAssessment.maturityLevel || 'N/A'}
                </div>
                <div className="text-sm text-purple-700">Maturity Level</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Units Summary */}
      {businessUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Units Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {businessUnits.map((unit: string) => (
                <div key={unit} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium capitalize">{unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations Summary */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Integrations Set Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {integrations.map((integration: string) => (
                <div key={integration} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium capitalize">{integration.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maturity Assessment Summary */}
      {maturityAssessment.maturityLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Maturity Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    Level {maturityAssessment.maturityLevel}: {maturityAssessment.maturityLabel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Score: {maturityAssessment.averageScore?.toFixed(1)}/5
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < maturityAssessment.maturityLevel
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {maturityAssessment.recommendations && (
                <div>
                  <h4 className="font-medium mb-2">Key Recommendations:</h4>
                  <ul className="space-y-1">
                    {maturityAssessment.recommendations.slice(0, 3).map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={step.priority === 'high' ? 'destructive' : 'secondary'}>
                      {step.priority} priority
                    </Badge>
                    {step.estimatedTime && (
                      <Badge variant="outline">
                        {step.estimatedTime}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Complete Business Profile</div>
                <div className="text-xs text-muted-foreground">Add more details about your business</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Target className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Start Quantum Journey</div>
                <div className="text-xs text-muted-foreground">Configure your business building blocks</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Zap className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Set Up Automations</div>
                <div className="text-xs text-muted-foreground">Create automated workflows</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">View Dashboard</div>
                <div className="text-xs text-muted-foreground">See your business overview</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onStepBack}>
          Review Setup
        </Button>

        <Button onClick={handleComplete} className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          Complete MVP Setup
        </Button>
      </div>
    </div>
  );
}

function calculateSetupScore(businessUnits: string[], integrations: string[]): number {
  const maxUnits = 5; // Expected business units
  const maxIntegrations = 7; // Expected integrations
  
  const unitScore = (businessUnits.length / maxUnits) * 40; // 40% weight
  const integrationScore = (integrations.length / maxIntegrations) * 40; // 40% weight
  const maturityScore = 20; // 20% weight for completing assessment
  
  return Math.round(unitScore + integrationScore + maturityScore);
}

function generateNextSteps(businessUnits: string[], integrations: string[], maturityAssessment: any) {
  const steps = [];

  // Always recommend completing business profile
  steps.push({
    title: 'Complete Business Profile',
    description: 'Add detailed information about your business, team, and goals',
    priority: 'high' as const,
    estimatedTime: '15-30 min'
  });

  // Recommend quantum journey if not many business units
  if (businessUnits.length < 3) {
    steps.push({
      title: 'Configure Business Building Blocks',
      description: 'Set up the 7 fundamental building blocks of your business',
      priority: 'high' as const,
      estimatedTime: '45-60 min'
    });
  }

  // Recommend automations if integrations are set up
  if (integrations.length >= 3) {
    steps.push({
      title: 'Create Automated Workflows',
      description: 'Set up automations to streamline your business processes',
      priority: 'medium' as const,
      estimatedTime: '20-30 min'
    });
  }

  // Recommend based on maturity level
  if (maturityAssessment.maturityLevel && maturityAssessment.maturityLevel <= 2) {
    steps.push({
      title: 'Develop Customer Personas',
      description: 'Create detailed customer profiles to better understand your market',
      priority: 'medium' as const,
      estimatedTime: '30-45 min'
    });
  }

  // Recommend financial planning
  steps.push({
    title: 'Set Up Financial Planning',
    description: 'Create budgets, forecasts, and financial tracking systems',
    priority: 'medium' as const,
    estimatedTime: '30-45 min'
  });

  return steps.slice(0, 5); // Limit to 5 steps
}
