import React from 'react';
import { GraduationCap, Target, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

interface ExpertAdviceProps {
  businessPrinciple: string;
  expertTactic: string;
  implementation: string;
  commonMistake: string;
  expectedOutcome: string;
  timeToImpact?: string;
  confidence?: number;
  expertiseYears?: number;
  className?: string;
}

export const ExpertAdvice: React.FC<ExpertAdviceProps> = ({
  businessPrinciple,
  expertTactic,
  implementation,
  commonMistake,
  expectedOutcome,
  timeToImpact = "30-60 days",
  confidence = 95,
  expertiseYears = 20,
  className
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 95) return 'text-green-600 bg-green-50 dark:bg-green-950';
    if (conf >= 85) return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
    if (conf >= 75) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
    return 'text-red-600 bg-red-50 dark:bg-red-950';
  };

  return (
    <Card className={cn("border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-green-900 dark:text-green-100">
              🎓 EXPERT ADVICE
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getConfidenceColor(confidence)}>
                {confidence}% Confidence
              </Badge>
              <Badge className="text-orange-600 bg-orange-50 dark:bg-orange-950">
                {expertiseYears}+ Years Experience
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Business Principle */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Target className="w-4 h-4" />
            Business Principle
          </div>
          <div className="pl-6">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              "{businessPrinciple}"
            </p>
          </div>
        </div>

        {/* Expert Tactic */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            Expert Tactic
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {expertTactic}
            </p>
          </div>
        </div>

        {/* Implementation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <CheckCircle className="w-4 h-4" />
            Implementation
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {implementation}
            </p>
          </div>
        </div>

        {/* Common Mistake */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <AlertTriangle className="w-4 h-4" />
            Common Mistake
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {commonMistake}
            </p>
          </div>
        </div>

        {/* Expected Outcome */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <DollarSign className="w-4 h-4" />
            Expected Outcome
          </div>
          <div className="pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {expectedOutcome}
            </p>
          </div>
        </div>

        {/* Time to Impact */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Expected impact within: <strong>{timeToImpact}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
};
