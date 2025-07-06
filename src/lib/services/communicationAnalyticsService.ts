/**
 * Unified Communication Analytics Service
 * Combines insights from Slack and Microsoft Teams for comprehensive communication intelligence
 * Powers the learning system with cross-platform pattern recognition
 */

import type { TeamsAnalytics } from './microsoftTeamsService';

// Slack types (simplified for this service)
interface SlackAnalytics {
  overview: {
    totalChannels: number;
    totalMessages: number;
    activeUsers: number;
    averageResponseTime: number;
    lastUpdated: string;
  };
  messageActivity: {
    totalMessages: number;
    messagesThisWeek: number;
    messagesLastWeek: number;
    averageMessagesPerDay: number;
    peakActivityHours: string[];
  };
  channelActivity: {
    mostActiveChannels: Array<{ name: string; messageCount: number }>;
    quietChannels: Array<{ name: string; messageCount: number }>;
  };
}

interface UnifiedCommunicationInsights {
  platformComparison: {
    slack: {
      connected: boolean;
      messageVolume: number;
      activeUsers: number;
      responseTime: number;
      preferredFor: string[];
    };
    teams: {
      connected: boolean;
      messageVolume: number;
      meetingVolume: number;
      activeUsers: number;
      responseTime: number;
      preferredFor: string[];
    };
    recommendation: {
      primaryPlatform: 'slack' | 'teams' | 'balanced';
      reasoning: string;
      optimizations: string[];
    };
  };
  crossPlatformPatterns: {
    communicationFlow: {
      quickDecisions: 'slack' | 'teams' | 'both';
      formalCommunications: 'slack' | 'teams' | 'both';
      teamMeetings: 'slack' | 'teams' | 'both';
      projectDiscussions: 'slack' | 'teams' | 'both';
    };
    userBehavior: {
      platformSwitchers: number;
      slackOnlyUsers: number;
      teamsOnlyUsers: number;
      averagePlatformsPerUser: number;
    };
    timePatterns: {
      slackPeakHours: string[];
      teamsPeakHours: string[];
      overlapHours: string[];
      platformByTimeOfDay: Record<string, 'slack' | 'teams' | 'equal'>;
    };
  };
  efficiencyMetrics: {
    overallResponseTime: number;
    communicationEfficiency: number; // 0-100 score
    collaborationScore: number; // 0-100 score
    toolUtilizationScore: number; // 0-100 score
    recommendations: Array<{
      type: 'optimization' | 'consolidation' | 'workflow';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      expectedImpact: string;
      estimatedEffort: number; // minutes
    }>;
  };
  teamInsights: {
    mostCollaborativeTeams: Array<{
      teamName: string;
      crossPlatformActivity: number;
      communicationHealth: number;
    }>;
    communicationGaps: Array<{
      department: string;
      issue: string;
      suggestedSolution: string;
      platforms: string[];
    }>;
    bestPractices: Array<{
      practice: string;
      adoptionRate: number;
      impact: string;
      howToScale: string;
    }>;
  };
}

interface CommunicationHealthScore {
  overall: number; // 0-100
  breakdown: {
    responseTime: number;
    platformUtilization: number;
    crossTeamCollaboration: number;
    meetingEfficiency: number;
    messageQuality: number;
  };
  trends: {
    direction: 'improving' | 'declining' | 'stable';
    changePercent: number;
    keyFactors: string[];
  };
  benchmarks: {
    industry: number;
    teamSize: number;
    recommended: number;
  };
}

class CommunicationAnalyticsService {
  
  /**
   * Get unified insights from both Slack and Teams
   */
  async getUnifiedInsights(): Promise<UnifiedCommunicationInsights> {
    try {
      const [slackData, teamsData] = await Promise.all([
        this.getSlackAnalytics(),
        this.getTeamsAnalytics()
      ]);

      return this.generateUnifiedInsights(slackData, teamsData);
    } catch (error) {
      console.error('Failed to get unified communication insights:', error);
      throw error;
    }
  }

  /**
   * Calculate overall communication health score
   */
  async getCommunicationHealthScore(): Promise<CommunicationHealthScore> {
    const insights = await this.getUnifiedInsights();
    
    return {
      overall: insights.efficiencyMetrics.collaborationScore,
      breakdown: {
        responseTime: this.scoreResponseTime(insights.efficiencyMetrics.overallResponseTime),
        platformUtilization: insights.efficiencyMetrics.toolUtilizationScore,
        crossTeamCollaboration: insights.efficiencyMetrics.collaborationScore,
        meetingEfficiency: this.calculateMeetingEfficiency(insights),
        messageQuality: this.calculateMessageQuality(insights)
      },
      trends: {
        direction: 'stable', // Would be calculated from historical data
        changePercent: 0,
        keyFactors: ['Recent platform consolidation', 'Improved response times']
      },
      benchmarks: {
        industry: 72,
        teamSize: 68,
        recommended: 85
      }
    };
  }

  /**
   * Generate actionable recommendations based on communication patterns
   */
  async getActionableRecommendations(): Promise<Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    category: 'optimization' | 'workflow' | 'training' | 'tools';
    title: string;
    description: string;
    expectedOutcome: string;
    estimatedTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
    steps: string[];
    automationPotential: boolean;
  }>> {
    const insights = await this.getUnifiedInsights();
    const recommendations = [];

    // Platform consolidation recommendations
    if (insights.platformComparison.recommendation.primaryPlatform !== 'balanced') {
      recommendations.push({
        id: 'platform-consolidation',
        priority: 'high' as const,
        category: 'optimization' as const,
        title: 'Optimize Communication Platform Usage',
        description: `Your team primarily uses ${insights.platformComparison.recommendation.primaryPlatform} but has scattered activity across platforms.`,
        expectedOutcome: 'Reduce context switching and improve team coordination by 25%',
        estimatedTime: 45,
        difficulty: 'medium' as const,
        steps: [
          'Analyze current platform usage patterns',
          'Define clear use cases for each platform',
          'Create team guidelines for platform selection',
          'Set up automated cross-platform notifications',
          'Train team on optimized workflows'
        ],
        automationPotential: true
      });
    }

    // Response time optimization
    if (insights.efficiencyMetrics.overallResponseTime > 60) {
      recommendations.push({
        id: 'response-time-optimization',
        priority: 'high' as const,
        category: 'workflow' as const,
        title: 'Improve Team Response Times',
        description: `Average response time of ${insights.efficiencyMetrics.overallResponseTime} minutes is above optimal range.`,
        expectedOutcome: 'Reduce response times by 40% and improve customer satisfaction',
        estimatedTime: 30,
        difficulty: 'easy' as const,
        steps: [
          'Set up response time alerts',
          'Create escalation workflows',
          'Implement status indicators',
          'Establish response time SLAs'
        ],
        automationPotential: true
      });
    }

    // Cross-platform workflow automation
    if (insights.platformComparison.slack.connected && insights.platformComparison.teams.connected) {
      recommendations.push({
        id: 'cross-platform-automation',
        priority: 'medium' as const,
        category: 'tools' as const,
        title: 'Set Up Cross-Platform Automation',
        description: 'Automate information flow between Slack and Teams to reduce duplicate communication.',
        expectedOutcome: 'Save 3+ hours per week and eliminate information silos',
        estimatedTime: 60,
        difficulty: 'medium' as const,
        steps: [
          'Identify key information flows',
          'Set up bidirectional sync for critical channels',
          'Create automated meeting summaries',
          'Implement unified notification system'
        ],
        automationPotential: true
      });
    }

    // Meeting efficiency improvements
    const meetingEfficiency = this.calculateMeetingEfficiency(insights);
    if (meetingEfficiency < 70) {
      recommendations.push({
        id: 'meeting-efficiency',
        priority: 'medium' as const,
        category: 'workflow' as const,
        title: 'Optimize Meeting Effectiveness',
        description: 'Your team meetings could be more efficient based on duration and follow-up patterns.',
        expectedOutcome: 'Reduce meeting time by 20% while improving outcomes',
        estimatedTime: 25,
        difficulty: 'easy' as const,
        steps: [
          'Implement meeting agenda templates',
          'Set up automated meeting summaries',
          'Create follow-up task automation',
          'Establish meeting-free focus blocks'
        ],
        automationPotential: true
      });
    }

    return recommendations;
  }

  /**
   * Get Slack analytics (mock implementation)
   */
  private async getSlackAnalytics(): Promise<SlackAnalytics | null> {
    try {
      // In real implementation, this would call the Slack service
      return {
        overview: {
          totalChannels: 45,
          totalMessages: 2847,
          activeUsers: 18,
          averageResponseTime: 25,
          lastUpdated: new Date().toISOString()
        },
        messageActivity: {
          totalMessages: 2847,
          messagesThisWeek: 456,
          messagesLastWeek: 398,
          averageMessagesPerDay: 65,
          peakActivityHours: ['10:00', '14:00', '16:00']
        },
        channelActivity: {
          mostActiveChannels: [
            { name: 'general', messageCount: 234 },
            { name: 'development', messageCount: 189 },
            { name: 'sales-team', messageCount: 156 }
          ],
          quietChannels: [
            { name: 'archive-old', messageCount: 2 },
            { name: 'temp-project', messageCount: 8 }
          ]
        }
      };
    } catch (error) {
      console.warn('Slack analytics not available:', error);
      return null;
    }
  }

  /**
   * Get Teams analytics (mock implementation)
   */
  private async getTeamsAnalytics(): Promise<TeamsAnalytics | null> {
    try {
      // In real implementation, this would call the Teams service
      return {
        overview: {
          totalTeams: 8,
          totalChannels: 24,
          totalMessages: 1456,
          totalMeetings: 67,
          activeUsers: 15,
          averageResponseTime: 35,
          lastUpdated: new Date().toISOString()
        },
        messageActivity: {
          totalMessages: 1456,
          messagesThisWeek: 234,
          messagesLastWeek: 198,
          averageMessagesPerDay: 33,
          peakActivityHours: ['09:00', '11:00', '15:00'],
          topActiveUsers: []
        },
        channelActivity: {
          channels: [],
          mostActiveChannels: [],
          quietChannels: []
        },
        meetingInsights: {
          totalMeetings: 67,
          meetingsThisWeek: 12,
          averageMeetingDuration: 45,
          attendanceRate: 0.87,
          recordedMeetings: 23,
          topMeetingOrganizers: []
        },
        collaborationPatterns: {
          crossTeamCollaboration: [],
          communicationPreferences: {
            chatVsMeeting: {
              chatMessages: 1456,
              meetings: 67,
              preferredMedium: 'chat'
            },
            formalVsInformal: {
              formalChannels: 8,
              informalChannels: 16,
              communicationStyle: 'mixed'
            }
          }
        }
      };
    } catch (error) {
      console.warn('Teams analytics not available:', error);
      return null;
    }
  }

  /**
   * Generate unified insights from platform data
   */
  private generateUnifiedInsights(
    slackData: SlackAnalytics | null, 
    teamsData: TeamsAnalytics | null
  ): UnifiedCommunicationInsights {
    const slackConnected = slackData !== null;
    const teamsConnected = teamsData !== null;

    // Calculate platform comparison
    const slackMessages = slackData?.messageActivity.totalMessages || 0;
    const teamsMessages = teamsData?.messageActivity.totalMessages || 0;
    
    let primaryPlatform: 'slack' | 'teams' | 'balanced' = 'balanced';
    let reasoning = 'Both platforms are used equally';

    if (slackMessages > teamsMessages * 1.5) {
      primaryPlatform = 'slack';
      reasoning = 'Slack dominates with 60%+ of team communications';
    } else if (teamsMessages > slackMessages * 1.5) {
      primaryPlatform = 'teams';
      reasoning = 'Teams dominates with 60%+ of team communications';
    }

    // Calculate efficiency metrics
    const avgResponseTime = slackConnected && teamsConnected
      ? ((slackData!.overview.averageResponseTime + teamsData!.overview.averageResponseTime) / 2)
      : slackConnected 
        ? slackData!.overview.averageResponseTime
        : teamsData?.overview.averageResponseTime || 0;

    const collaborationScore = this.calculateCollaborationScore(slackData, teamsData);
    const toolUtilizationScore = this.calculateToolUtilizationScore(slackConnected, teamsConnected);

    // Cross-Platform Patterns
    const crossPlatformPatterns = {
      communicationFlow: {
        quickDecisions: primaryPlatform === 'slack' || primaryPlatform === 'balanced' ? 'slack' : 'teams',
        formalCommunications: primaryPlatform === 'teams' || primaryPlatform === 'balanced' ? 'teams' : 'slack',
        teamMeetings: 'teams',
        projectDiscussions: slackMessages > teamsMessages ? 'slack' : 'teams',
      },
      userBehavior: {
        platformSwitchers: Math.min(slackData?.overview.activeUsers || 0, teamsData?.overview.activeUsers || 0),
        slackOnlyUsers: Math.max(0, slackData?.overview.activeUsers || 0 - teamsData?.overview.activeUsers || 0),
        teamsOnlyUsers: Math.max(0, teamsData?.overview.activeUsers || 0 - slackData?.overview.activeUsers || 0),
        averagePlatformsPerUser: (slackData?.overview.activeUsers || 0 > 0 && teamsData?.overview.activeUsers || 0 > 0) ? 1.5 : 1
      },
      timePatterns: {
        slackPeakHours: slackData?.messageActivity.peakActivityHours || [],
        teamsPeakHours: teamsData?.messageActivity.peakActivityHours || [],
        overlapHours: this.findOverlapHours(
          slackData?.messageActivity.peakActivityHours || [],
          teamsData?.messageActivity.peakActivityHours || []
        ),
        platformByTimeOfDay: {
          'morning': 'teams',
          'afternoon': 'slack',
          'evening': 'slack'
        }
      }
    };

    return {
      platformComparison: {
        slack: {
          connected: slackConnected,
          messageVolume: slackMessages,
          activeUsers: slackData?.overview.activeUsers || 0,
          responseTime: avgResponseTime,
          preferredFor: ['Quick Syncs', 'DevOps Alerts', 'Social Banter']
        },
        teams: {
          connected: teamsConnected,
          messageVolume: teamsMessages,
          meetingVolume: teamsData?.meetingInsights.totalMeetings || 0,
          activeUsers: teamsData?.overview.activeUsers || 0,
          responseTime: avgResponseTime,
          preferredFor: ['Scheduled Meetings', 'Formal Announcements', 'Project Planning']
        },
        recommendation: {
          primaryPlatform,
          reasoning,
          optimizations: this.generateOptimizations(slackData, teamsData)
        }
      },
      crossPlatformPatterns,
      efficiencyMetrics: {
        overallResponseTime: avgResponseTime,
        communicationEfficiency: Math.min(100, Math.max(0, 100 - (avgResponseTime / 2))),
        collaborationScore,
        toolUtilizationScore,
        recommendations: []
      },
      teamInsights: {
        mostCollaborativeTeams: [],
        communicationGaps: [],
        bestPractices: [
          {
            practice: 'Cross-platform status sync',
            adoptionRate: 0.65,
            impact: 'Reduced duplicate status updates by 40%',
            howToScale: 'Implement automated status synchronization'
          }
        ]
      }
    };
  }

  private calculateCollaborationScore(
    slackData: SlackAnalytics | null, 
    teamsData: TeamsAnalytics | null
  ): number {
    let score = 50; // Base score

    // Boost for having both platforms
    if (slackData && teamsData) score += 20;

    // Boost for balanced usage
    if (slackData && teamsData) {
      const slackMsg = slackData.messageActivity.totalMessages;
      const teamsMsg = teamsData.messageActivity.totalMessages;
      const ratio = Math.min(slackMsg, teamsMsg) / Math.max(slackMsg, teamsMsg);
      score += ratio * 20;
    }

    // Response time factor
    const avgResponseTime = slackData && teamsData
      ? (slackData.overview.averageResponseTime + teamsData.overview.averageResponseTime) / 2
      : slackData?.overview.averageResponseTime || teamsData?.overview.averageResponseTime || 60;

    if (avgResponseTime < 30) score += 10;
    else if (avgResponseTime > 60) score -= 10;

    return Math.min(100, Math.max(0, score));
  }

  private calculateToolUtilizationScore(slackConnected: boolean, teamsConnected: boolean): number {
    if (slackConnected && teamsConnected) return 95;
    if (slackConnected || teamsConnected) return 65;
    return 0;
  }

  private calculateMeetingEfficiency(insights: UnifiedCommunicationInsights): number {
    // Simplified calculation based on meeting patterns
    const teamsData = insights.platformComparison.teams;
    if (!teamsData.connected || teamsData.meetingVolume === 0) return 50;

    // Base efficiency score
    let efficiency = 70;

    // Adjust based on meeting volume vs message volume ratio
    const meetingToMessageRatio = teamsData.meetingVolume / Math.max(1, teamsData.messageVolume);
    if (meetingToMessageRatio > 0.1) efficiency -= 20; // Too many meetings
    if (meetingToMessageRatio < 0.02) efficiency += 10; // Good balance

    return Math.min(100, Math.max(0, efficiency));
  }

  private calculateMessageQuality(insights: UnifiedCommunicationInsights): number {
    // Simplified quality score based on response times and activity patterns
    const responseTime = insights.efficiencyMetrics.overallResponseTime;
    
    let quality = 80;
    if (responseTime < 20) quality += 15;
    else if (responseTime > 60) quality -= 25;

    return Math.min(100, Math.max(0, quality));
  }

  private scoreResponseTime(responseTime: number): number {
    if (responseTime < 15) return 100;
    if (responseTime < 30) return 85;
    if (responseTime < 60) return 70;
    if (responseTime < 120) return 50;
    return 25;
  }

  private generateOptimizations(
    slackData: SlackAnalytics | null, 
    teamsData: TeamsAnalytics | null
  ): string[] {
    const optimizations = [];

    if (slackData && teamsData) {
      optimizations.push('Set up cross-platform notifications');
      optimizations.push('Create unified communication guidelines');
      optimizations.push('Implement automated status synchronization');
    }

    if (slackData && slackData.overview.averageResponseTime > 45) {
      optimizations.push('Improve Slack response time monitoring');
    }

    if (teamsData && teamsData.meetingInsights.averageMeetingDuration > 60) {
      optimizations.push('Optimize meeting durations and agendas');
    }

    return optimizations;
  }

  private findOverlapHours(slackHours: string[], teamsHours: string[]): string[] {
    return slackHours.filter(hour => teamsHours.includes(hour));
  }
}

export const communicationAnalyticsService = new CommunicationAnalyticsService();
export type { UnifiedCommunicationInsights, CommunicationHealthScore }; 