import React from 'react';
import { Brain, Lightbulb, TrendingUp, BookOpen, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

interface BrainAnalysisProps {
  previousActions?: string[];
  businessContext: string;
  expertKnowledge: string;
  learningOpportunity: string;
  patternRecognition?: string;
  confidence?: number;
  className?: string;
}

export const BrainAnalysis: React.FC<BrainAnalysisProps> = ({
  previousActions = [],
  businessContext,
  expertKnowledge,
  learningOpportunity,
  patternRecognition,
  confidence = 85,
  className
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-600 bg-green-50 dark:bg-green-950';
    if (conf >= 75) return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
    if (conf >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
    return 'text-red-600 bg-red-50 dark:bg-red-950';
  };

  return (
    <Card className={cn("border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100">
              🧠 BRAIN ANALYSIS
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getConfidenceColor(confidence)}>
                {confidence}% Confidence
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Previous Actions */}
        {previousActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Target className="w-4 h-4" />
              Previous Actions
            </div>
            <div className="pl-6 space-y-1">
              {previousActions.map((action, index) => (
                <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {action}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Context */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            Business Context
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {businessContext}
            </p>
          </div>
        </div>

        {/* Expert Knowledge Applied */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <BookOpen className="w-4 h-4" />
            Expert Knowledge Applied
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {expertKnowledge}
            </p>
          </div>
        </div>

        {/* Pattern Recognition */}
        {patternRecognition && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Zap className="w-4 h-4" />
              Pattern Recognition
            </div>
            <div className="pl-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {patternRecognition}
              </p>
            </div>
          </div>
        )}

        {/* Learning Opportunity */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Lightbulb className="w-4 h-4" />
            Learning Opportunity
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {learningOpportunity}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
