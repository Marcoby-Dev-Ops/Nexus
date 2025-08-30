import type { QuantumBlockId, QuantumBlockProfile, QuantumImprovePlan, QuantumHealth } from '../types/quantum';
import { getAllQuantumBlocks, getQuantumBlock } from '../config/quantumBusinessModel';

// Mock data generator for development
export class QuantumMockService {
  private generateHealth(): QuantumHealth {
    return {
      strength: Math.floor(Math.random() * 40) + 30, // 30-70
      health: Math.floor(Math.random() * 30) + 60, // 60-90
      maturity: ['seed', 'grow', 'scale', 'optimize'][Math.floor(Math.random() * 4)] as any
    };
  }

  private generateInsights(blockName: string): string[] {
    return [
      `${blockName} is performing well with strong fundamentals`,
      'Opportunity to optimize processes for better efficiency',
      'Consider expanding capabilities in this area',
      'Good alignment with overall business strategy'
    ];
  }

  private generateRecommendations(): Array<{ id: string; title: string; impact: 'low' | 'med' | 'high'; effort: 'low' | 'med' | 'high' }> {
    return [
      {
        id: '1',
        title: 'Implement Process Optimization',
        impact: 'high',
        effort: 'med'
      },
      {
        id: '2',
        title: 'Enhance Team Training',
        impact: 'med',
        effort: 'low'
      },
      {
        id: '3',
        title: 'Deploy Advanced Analytics',
        impact: 'high',
        effort: 'high'
      }
    ];
  }

  async getBlock(blockId: QuantumBlockId): Promise<QuantumBlockProfile> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const block = getQuantumBlock(blockId);
    if (!block) {
      throw new Error(`Block ${blockId} not found`);
    }

    return {
      id: blockId,
      title: block.name,
      description: block.description,
      properties: block.properties,
      relationships: block.relationships || [],
      health: this.generateHealth(),
      insights: this.generateInsights(block.name),
      recommendations: this.generateRecommendations(),
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        currentScore: Math.floor(Math.random() * 40) + 30,
        targetScore: 85,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        improvement: Math.floor(Math.random() * 20) - 10
      }
    };
  }

  async planStrengthening(blockId: QuantumBlockId, target?: Partial<QuantumHealth>): Promise<QuantumImprovePlan> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const current = this.generateHealth();
    const targetHealth: QuantumHealth = {
      strength: target?.strength || Math.min(90, current.strength + 20),
      health: target?.health || Math.min(95, current.health + 15),
      maturity: target?.maturity || 'optimize'
    };

    return {
      current,
      target: targetHealth,
      actions: [
        {
          id: '1',
          title: 'Optimize Core Processes',
          description: 'Streamline and automate key processes to improve efficiency and reduce errors',
          category: 'process',
          priority: 'high',
          estimatedEffort: 12,
          expectedImpact: '25% efficiency improvement',
          currentScore: 65,
          targetScore: 85,
          status: 'not-started',
          dependencies: [],
          resources: ['Process mapping tools', 'Team training'],
          steps: ['Map current processes', 'Identify bottlenecks', 'Implement improvements'],
          etaDays: 14
        },
        {
          id: '2',
          title: 'Enhance Team Capabilities',
          description: 'Provide specialized training and development opportunities for team members',
          category: 'people',
          priority: 'medium',
          estimatedEffort: 8,
          expectedImpact: 'Improved team performance and retention',
          currentScore: 70,
          targetScore: 85,
          status: 'not-started',
          dependencies: ['1'],
          resources: ['Training programs', 'Mentorship'],
          steps: ['Assess skill gaps', 'Design training program', 'Implement training'],
          etaDays: 10
        },
        {
          id: '3',
          title: 'Implement Advanced Analytics',
          description: 'Deploy data-driven insights and predictive analytics for better decision making',
          category: 'technology',
          priority: 'high',
          estimatedEffort: 16,
          expectedImpact: '30% improvement in decision accuracy',
          currentScore: 55,
          targetScore: 90,
          status: 'not-started',
          dependencies: ['1'],
          resources: ['Analytics platform', 'Data integration'],
          steps: ['Select analytics platform', 'Integrate data sources', 'Deploy dashboards'],
          etaDays: 20
        }
      ],
      timeline: [
        {
          phase: 'Foundation (Weeks 1-2)',
          duration: '2 weeks',
          actions: ['1']
        },
        {
          phase: 'Enhancement (Weeks 3-6)',
          duration: '4 weeks',
          actions: ['2', '3']
        },
        {
          phase: 'Optimization (Weeks 7-8)',
          duration: '2 weeks',
          actions: ['Review and refine']
        }
      ],
      metrics: {
        overallImprovement: 35,
        timeToTarget: '8 weeks',
        confidence: 85
      }
    };
  }

  async saveOnboarding(payload: Record<string, unknown>): Promise<{ ok: boolean }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('Saving quantum onboarding data:', payload);
    return { ok: true };
  }

  async commitPlan(blockId: QuantumBlockId, planId: string): Promise<{ ok: boolean; planId: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    console.log('Committing improvement plan:', { blockId, planId });
    return { ok: true, planId };
  }
}

// Export singleton instance
export const quantumMockService = new QuantumMockService();
