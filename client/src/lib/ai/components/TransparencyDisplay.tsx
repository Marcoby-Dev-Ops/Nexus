import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/button';
import { 
  Info, 
  TrendingUp, 
  Clock, 
  Star, 
  CheckCircle, 
  Brain,
  BarChart3,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface TransparencyDisplayProps {
  transparency: {
    decisionExplanation: {
      reasoning: string;
      methodology: string;
      confidence: number;
      alternatives: string[];
      dataSources: string[];
      impact: string;
    };
    personalityType: string;
    contextAnalysis: {
      isFavorableDecision: boolean;
      isHighPressure: boolean;
      isSensitiveTopic: boolean;
      isTechnicalTask: boolean;
      userExperienceLevel: string;
    };
    performanceMetrics: {
      accuracy: string;
      responseTime: string;
      userSatisfaction: string;
      successRate: string;
    };
    agentInfo: {
      name: string;
      background: string;
      transparencyStyle: string;
    };
  };
  className?: string;
}

const TransparencyDisplay: React.FC<TransparencyDisplayProps> = ({ 
  transparency, 
  className = '' 
}) => {
  const [expanded, setExpanded] = useState(false);

  const getPersonalityIcon = (type: string) => {
    return type === 'human-like' ? <Brain className="w-4 h-4" /> : <Zap className="w-4 h-4" />;
  };

  const getPersonalityColor = (type: string) => {
    return type === 'human-like' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">
              AI Decision Transparency
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {expanded ? 'Show Less' : 'Show Details'}
          </Button>
        </div>
        
        {/* Agent Info */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {transparency.agentInfo.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{transparency.agentInfo.name}</p>
              <p className="text-xs text-gray-600">{transparency.agentInfo.background}</p>
            </div>
          </div>
          
          <Badge className={getPersonalityColor(transparency.personalityType)}>
            <div className="flex items-center gap-1">
              {getPersonalityIcon(transparency.personalityType)}
              {transparency.personalityType}
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Level */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Confidence Level</span>
          </div>
          <span className={`font-bold ${getConfidenceColor(transparency.decisionExplanation.confidence)}`}>
            {Math.round(transparency.decisionExplanation.confidence * 100)}%
          </span>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Accuracy</p>
              <p className="font-semibold text-sm">{transparency.performanceMetrics.accuracy}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Response Time</p>
              <p className="font-semibold text-sm">{transparency.performanceMetrics.responseTime}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
            <Star className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-xs text-gray-600">Satisfaction</p>
              <p className="font-semibold text-sm">{transparency.performanceMetrics.userSatisfaction}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Success Rate</p>
              <p className="font-semibold text-sm">{transparency.performanceMetrics.successRate}</p>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Reasoning */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Why this recommendation?
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {transparency.decisionExplanation.reasoning}
              </p>
            </div>

            {/* Methodology */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Methodology
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {transparency.decisionExplanation.methodology}
              </p>
            </div>

            {/* Data Sources */}
            {transparency.decisionExplanation.dataSources.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Data Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {transparency.decisionExplanation.dataSources.map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Impact Assessment */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Expected Impact</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {transparency.decisionExplanation.impact}
              </p>
            </div>

            {/* Context Analysis */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Context Analysis</h4>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant={transparency.contextAnalysis.isFavorableDecision ? "default" : "secondary"}>
                  {transparency.contextAnalysis.isFavorableDecision ? "Favorable Decision" : "Neutral Decision"}
                </Badge>
                <Badge variant={transparency.contextAnalysis.isHighPressure ? "destructive" : "secondary"}>
                  {transparency.contextAnalysis.isHighPressure ? "High Pressure" : "Normal Pressure"}
                </Badge>
                <Badge variant={transparency.contextAnalysis.isSensitiveTopic ? "destructive" : "secondary"}>
                  {transparency.contextAnalysis.isSensitiveTopic ? "Sensitive Topic" : "Standard Topic"}
                </Badge>
                <Badge variant={transparency.contextAnalysis.isTechnicalTask ? "default" : "secondary"}>
                  {transparency.contextAnalysis.isTechnicalTask ? "Technical Task" : "General Task"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                User Experience Level: {transparency.contextAnalysis.userExperienceLevel}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransparencyDisplay;
