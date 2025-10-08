/**
 * Journey Knowledge Panel
 * 
 * Displays knowledge enhancements and context notes generated from journey completion
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Zap,
  Award
} from 'lucide-react';
import { journeyKnowledgeEnhancer } from '@/services/knowledge/JourneyKnowledgeEnhancer';
import type { JourneyContextNote, KnowledgeEnhancement } from '@/services/knowledge/JourneyKnowledgeEnhancer';

interface JourneyKnowledgePanelProps {
  companyId: string;
  journeyId: string;
  userId: string;
}

export const JourneyKnowledgePanel: React.FC<JourneyKnowledgePanelProps> = ({
  companyId,
  journeyId,
  userId
}) => {
  const [knowledgeEnhancement, setKnowledgeEnhancement] = useState<KnowledgeEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadKnowledgeEnhancement();
  }, [companyId, journeyId]);

  const loadKnowledgeEnhancement = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll generate a mock enhancement
      // In production, this would fetch from the database
      const mockEnhancement: KnowledgeEnhancement = {
        companyId,
        journeyId,
        contextNotes: [
          {
            id: '1',
            companyId,
            journeyId,
            stepId: 'business-identity',
            noteType: 'insight',
            title: 'Mission Evolution Detected',
            content: 'Business mission has evolved from "undefined" to "Empower entrepreneurs with AI-driven business tools". This suggests strategic direction refinement.',
            confidence: 0.85,
            metadata: {
              journeyTemplate: 'quantum-building-blocks',
              stepType: 'business-identity',
              userResponse: { mission: 'Empower entrepreneurs with AI-driven business tools' },
              businessContext: {}
            },
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            companyId,
            journeyId,
            stepId: 'quantum-blocks',
            noteType: 'learning',
            title: 'Strong Business Foundation',
            content: 'Business health score of 85% indicates solid foundation. Ready for growth and scaling initiatives.',
            confidence: 0.85,
            metadata: {
              journeyTemplate: 'quantum-building-blocks',
              stepType: 'quantum-blocks',
              userResponse: { healthScore: 0.85 },
              businessContext: {}
            },
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            companyId,
            journeyId,
            stepId: 'pattern-analysis',
            noteType: 'pattern',
            title: 'Journey Pattern: Fast Learner',
            content: 'User shows Fast Learner behavior with 90% confidence. Examples: quantum-building-blocks, mvp-onboarding',
            confidence: 0.9,
            metadata: {
              journeyTemplate: 'pattern_analysis',
              stepType: 'pattern',
              userResponse: {},
              businessContext: {}
            },
            created_at: new Date().toISOString()
          }
        ],
        knowledgeUpdates: {
          companyName: 'Nexus AI',
          industry: 'Technology',
          mission: 'Empower entrepreneurs with AI-driven business tools',
          uniqueValueProposition: 'AI-powered business intelligence that democratizes entrepreneurship'
        },
        brainInsights: {
          businessMetrics: {
            efficiency: 85,
            growth: 12,
            innovation: 90
          },
          recommendations: [
            { action: 'Implement advanced automation workflows', priority: 'high', impact: 0.8 },
            { action: 'Scale customer success operations', priority: 'medium', impact: 0.6 }
          ]
        },
        recommendations: [
          'Consider starting the "Business Strategy Development" journey next (80% confidence)',
          'Focus on improving weakest building blocks',
          'Implement advanced automation workflows',
          'Scale customer success operations'
        ]
      };

      setKnowledgeEnhancement(mockEnhancement);
    } catch (error) {
      console.error('Failed to load knowledge enhancement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const getNoteIcon = (noteType: string) => {
    switch (noteType) {
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Target className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getNoteColor = (noteType: string) => {
    switch (noteType) {
      case 'insight': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pattern': return 'bg-green-50 text-green-700 border-green-200';
      case 'recommendation': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'learning': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Knowledge Enhancements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!knowledgeEnhancement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Knowledge Enhancements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No knowledge enhancements available for this journey.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Knowledge Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Knowledge Enhancements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {knowledgeEnhancement.contextNotes.length}
              </div>
              <div className="text-sm text-muted-foreground">Context Notes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {knowledgeEnhancement.recommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(knowledgeEnhancement.knowledgeUpdates).length}
              </div>
              <div className="text-sm text-muted-foreground">Knowledge Updates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Context Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {knowledgeEnhancement.contextNotes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    {getNoteIcon(note.noteType)}
                    <Badge className={getNoteColor(note.noteType)}>
                      {note.noteType}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(note.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNoteExpansion(note.id)}
                  >
                    {expandedNotes.has(note.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <h4 className="font-semibold mb-2">{note.title}</h4>
                
                {expandedNotes.has(note.id) ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      <div><strong>Step:</strong> {note.stepId}</div>
                      <div><strong>Created:</strong> {new Date(note.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {knowledgeEnhancement.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Updates */}
      {Object.keys(knowledgeEnhancement.knowledgeUpdates).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Knowledge Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(knowledgeEnhancement.knowledgeUpdates).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm text-muted-foreground max-w-xs truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
