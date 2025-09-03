/**
 * Knowledge Update Demo
 * 
 * Demonstrates how the knowledge update identification system works
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface KnowledgeUpdateDemoProps {
  companyId: string;
}

export const KnowledgeUpdateDemo: React.FC<KnowledgeUpdateDemoProps> = ({
  companyId
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const demoSteps = [
    {
      title: "Layer 1: Direct Field Mapping",
      description: "Extract explicit business information from journey responses",
      icon: <Zap className="h-5 w-5" />,
      details: [
        "Compare new values with existing knowledge",
        "Use text similarity (Levenshtein distance)",
        "Update if similarity < 80%",
        "Handle arrays and complex data types"
      ],
      example: {
        field: "Mission",
        before: "Help businesses grow",
        after: "Empower entrepreneurs with AI-driven business tools",
        similarity: "15%",
        action: "UPDATE"
      }
    },
    {
      title: "Layer 2: Derived Knowledge",
      description: "Generate insights from patterns and context notes",
      icon: <TrendingUp className="h-5 w-5" />,
      details: [
        "Extract insights from context notes",
        "Analyze business health scores",
        "Identify strengths and opportunities",
        "Generate recommendations"
      ],
      example: {
        field: "Business Health",
        before: "Not assessed",
        after: "85% - Strong foundation",
        similarity: "0%",
        action: "UPDATE"
      }
    },
    {
      title: "Layer 3: Strategic Updates",
      description: "Leverage Unified Brain for strategic positioning",
      icon: <Brain className="h-5 w-5" />,
      details: [
        "Brain-powered strategic insights",
        "Market position analysis",
        "Competitive advantage identification",
        "Growth strategy recommendations"
      ],
      example: {
        field: "Market Position",
        before: "Not defined",
        after: "Technology innovator in business intelligence",
        similarity: "0%",
        action: "UPDATE"
      }
    },
    {
      title: "Layer 4: Validation & Prioritization",
      description: "Ensure updates are meaningful and high-quality",
      icon: <Target className="h-5 w-5" />,
      details: [
        "Validate non-empty values",
        "Check for significant changes",
        "Ensure type consistency",
        "Prioritize high-impact updates"
      ],
      example: {
        field: "Validation",
        before: "Raw updates",
        after: "Validated knowledge",
        similarity: "N/A",
        action: "QUALITY CHECK"
      }
    }
  ];

  const finalResults = {
    totalUpdates: 8,
    highPriority: 3,
    mediumPriority: 3,
    lowPriority: 2,
    updates: [
      { field: "Mission", priority: "high", confidence: 95 },
      { field: "Industry", priority: "high", confidence: 90 },
      { field: "Unique Value Proposition", priority: "high", confidence: 88 },
      { field: "Business Health Score", priority: "medium", confidence: 85 },
      { field: "Market Position", priority: "medium", confidence: 82 },
      { field: "Competitive Advantages", priority: "medium", confidence: 80 },
      { field: "Challenges", priority: "low", confidence: 75 },
      { field: "Opportunities", priority: "low", confidence: 70 }
    ]
  };

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setShowResults(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (showResults) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Knowledge Update Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{finalResults.totalUpdates}</div>
              <div className="text-sm text-blue-700">Total Updates</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{finalResults.highPriority}</div>
              <div className="text-sm text-red-700">High Priority</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{finalResults.mediumPriority}</div>
              <div className="text-sm text-yellow-700">Medium Priority</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{finalResults.lowPriority}</div>
              <div className="text-sm text-green-700">Low Priority</div>
            </div>
          </div>

          <Separator />

          {/* Update Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Identified Updates</h3>
            <div className="space-y-3">
              {finalResults.updates.map((update, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{update.field}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(update.priority)}>
                      {update.priority}
                    </Badge>
                    <Badge variant="outline">
                      {update.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={handleReset} variant="outline">
              Run Demo Again
            </Button>
            <Button>
              Apply Updates to Knowledge Base
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = demoSteps[currentStep];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Knowledge Update Identification Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {demoSteps.length}
          </span>
        </div>

        <Separator />

        {/* Current Step */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>

          {/* Details */}
          <div className="pl-8">
            <h4 className="font-medium mb-2">Process:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {currentStepData.details.map((detail, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>

          {/* Example */}
          <div className="pl-8 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-3">Example:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">Field:</span>
                <span>{currentStepData.example.field}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Before:</span>
                <span className="text-muted-foreground">{currentStepData.example.before}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">After:</span>
                <span className="text-muted-foreground">{currentStepData.example.after}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Similarity:</span>
                <span className="text-muted-foreground">{currentStepData.example.similarity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Action:</span>
                <Badge className={currentStepData.example.action === 'UPDATE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                  {currentStepData.example.action}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === demoSteps.length - 1 ? 'View Results' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
