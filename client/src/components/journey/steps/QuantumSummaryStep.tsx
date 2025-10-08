/**
 * Quantum Journey - Summary Step
 * 
 * Final step that shows the business snapshot and recommendations.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/progress';
import { CheckCircle, AlertCircle, Zap, Target } from 'lucide-react';
import { getQuantumBlock, calculateBusinessHealth, generateQuantumInsights, generateQuantumRecommendations, type QuantumBusinessProfile } from '@/core/config/quantumBusinessModel';
import type { JourneyStepProps } from '../types';

interface QuantumSummaryStepProps extends JourneyStepProps {
  onComplete: () => void;
  journeyData: {
    identity?: {
      mission: string;
      vision: string;
      values: Array<{ name: string; description: string }>;
    };
    blocks: Array<{
      blockId: string;
      properties: Record<string, any>;
      strength: number;
      health: number;
    }>;
  };
}

export default function QuantumSummaryStep({ onComplete, journeyData }: QuantumSummaryStepProps) {
  // Build quantum profile for analysis
  const quantumProfile: QuantumBusinessProfile = {
    id: `quantum-${Date.now()}`,
    companyId: 'temp',
    blocks: journeyData.blocks.map(block => ({
      blockId: block.blockId,
      strength: block.strength,
      health: block.health,
      properties: block.properties,
      healthIndicators: {},
      aiCapabilities: [],
      marketplaceIntegrations: []
    })),
    relationships: [],
    healthScore: calculateBusinessHealth({
      id: '',
      companyId: '',
      blocks: journeyData.blocks.map(block => ({
        blockId: block.blockId,
        strength: block.strength,
        health: block.health,
        properties: block.properties,
        healthIndicators: {},
        aiCapabilities: [],
        marketplaceIntegrations: []
      })),
      relationships: [],
      healthScore: 0,
      maturityLevel: 'startup',
      lastUpdated: new Date().toISOString()
    }),
    maturityLevel: 'startup',
    lastUpdated: new Date().toISOString(),
    identity: journeyData.identity
  };

  const insights = generateQuantumInsights(quantumProfile);
  const recommendations = generateQuantumRecommendations(quantumProfile);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Your Business Snapshot</h1>
        <p className="text-xl text-muted-foreground">
          Here's what we've discovered about your business and our recommendations
        </p>
      </div>

      {/* Business Identity */}
      {journeyData.identity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Business Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-primary">Mission</h3>
                <p className="text-sm text-muted-foreground">{journeyData.identity.mission}</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-primary">Vision</h3>
                <p className="text-sm text-muted-foreground">{journeyData.identity.vision}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Core Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {journeyData.identity.values.map((value, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium">{value.name}</div>
                    <div className="text-sm text-muted-foreground">{value.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Business Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journeyData.blocks.map(blockData => {
              const block = getQuantumBlock(blockData.blockId);
              if (!block) return null;
              
              return (
                <div key={blockData.blockId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <block.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{block.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Strength</span>
                      <span>{blockData.strength}%</span>
                    </div>
                    <Progress value={blockData.strength} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Health</span>
                      <span>{blockData.health}%</span>
                    </div>
                    <Progress value={blockData.health} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 5).map(insight => (
                <div key={insight.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={insight.type === 'risk' ? 'destructive' : 'default'}>
                      {insight.type}
                    </Badge>
                    <span className="font-medium">{insight.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  <div className="text-xs text-muted-foreground">
                    Priority: {insight.priority} | Impact: {insight.impact}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{rec.type.replace('_', ' ')}</Badge>
                    <span className="font-medium">{rec.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  <div className="text-xs text-muted-foreground">
                    Impact: {rec.impact} | Effort: {rec.effort} | Est. Value: ${rec.estimatedValue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button onClick={onComplete} size="lg" className="px-8">
          Complete Setup & Launch Nexus
        </Button>
      </div>
    </div>
  );
}
