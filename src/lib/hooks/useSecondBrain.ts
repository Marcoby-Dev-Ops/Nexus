/**
 * Second Brain Hook - Core Intelligence System for Nexus
 * Provides contextual insights, progressive actions, and automation opportunities
 * on every page based on user behavior and integration data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { googleAnalyticsService } from '@/lib/services/googleAnalyticsService';
import { callEdgeFunction } from '@/lib/services/supabaseFunctions';
import type { 
  UseSecondBrainReturn,
  SecondBrainContext,
  BusinessInsight,
  ProgressiveAction,
  AutomationOpportunity,
  LearningEvent,
  UserProfile,
  IntegrationDataPoint,
  ActionSuggestion
} from '@/lib/types/learning-system';

export function useSecondBrain(pageId: string): UseSecondBrainReturn {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [actions, setActions] = useState<ProgressiveAction[]>([]);
  const [automationOpportunities, setAutomationOpportunities] = useState<AutomationOpportunity[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [integrationData, setIntegrationData] = useState<IntegrationDataPoint[]>([]);
  const [recentEvents, setRecentEvents] = useState<LearningEvent[]>([]);

  // Load user profile and context on mount
  useEffect(() => {
    loadUserProfile();
    loadIntegrationData();
    loadRecentEvents();
  }, []);

  // Generate insights and actions when context changes
  useEffect(() => {
    if (userProfile && integrationData.length > 0) {
      generateContextualInsights();
      generateProgressiveActions();
      identifyAutomationOpportunities();
    }
  }, [pageId, userProfile, integrationData]);

  const loadUserProfile = async () => {
    try {
      // Fetch the current authenticated user
      const { data: { user }, error: userError } = await import('@/lib/core/supabase').then(m => m.supabase.auth.getUser());
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Fetch the user profile from Supabase
      const { data, error } = await import('@/lib/core/supabase').then(m => m.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      );
      if (error) throw error;
      if (data) {
        setUserProfile(data as UserProfile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile(null);
    }
  };

  const loadIntegrationData = async () => {
    try {
      const integrationData: IntegrationDataPoint[] = [];

      // Load Google Analytics data
      const analyticsData = await loadGoogleAnalyticsData();
      if (analyticsData) {
        integrationData.push(analyticsData);
      }

      // Load Slack data
      const slackData = await loadSlackData();
      if (slackData) {
        integrationData.push(slackData);
      }

      // Load HubSpot data
      const hubspotData = await loadHubSpotData();
      if (hubspotData) {
        integrationData.push(hubspotData);
      }

      // Load Stripe data
      const stripeData = await loadStripeData();
      if (stripeData) {
        integrationData.push(stripeData);
      }

      setIntegrationData(integrationData);
    } catch (error) {
      console.error('Failed to load integration data:', error);
      // Fallback to empty array
      setIntegrationData([]);
    }
  };

  const loadGoogleAnalyticsData = async (): Promise<IntegrationDataPoint | null> => {
    try {
      // Use the Google Analytics service directly
      if (!googleAnalyticsService.isAuthenticated()) {
        return null;
      }

      const data = await googleAnalyticsService.getAnalyticsData('last7Days');
      return {
        source: 'google-analytics',
        type: 'metric',
        value: {
          sessions: parseInt(data.overview.sessions.value.replace(/[^\d]/g, '')) || 0,
          pageviews: parseInt(data.overview.pageViews.value.replace(/[^\d]/g, '')) || 0,
          bounceRate: parseFloat(data.overview.bounceRate.value.replace('%', '')) || 0,
          avgSessionDuration: data.overview.avgSessionDuration.value || '0:00',
          totalUsers: parseInt(data.overview.totalUsers.value.replace(/[^\d]/g, '')) || 0,
          realTimeUsers: data.realTimeUsers || 0
        },
        timestamp: new Date().toISOString(),
        metadata: { 
          period: '7d', 
          reportType: 'overview',
          topPages: data.topPages.slice(0, 3),
          topSources: data.topSources.slice(0, 3)
        },
        relevanceScore: 0.9
      };
    } catch (error) {
      console.warn('Failed to load Google Analytics data:', error);
      return null;
    }
  };

  const loadSlackData = async (): Promise<IntegrationDataPoint | null> => {
    try {
      const data = await callEdgeFunction<any>('slack_metrics');

      return {
        source: 'slack',
        type: 'activity',
        value: {
          messagesCount: data?.messagesCount || 0,
          activeUsers: data?.activeUsers || 0,
          channels: data?.channels || 0,
          responseTime: data?.avgResponseTime || 0,
        },
        timestamp: new Date().toISOString(),
        metadata: { period: '24h', workspaceId: data?.workspaceId },
        relevanceScore: 0.7,
      };
    } catch (error) {
      console.warn('Failed to load Slack data:', error);
      return null;
    }
  };

  const loadHubSpotData = async (): Promise<IntegrationDataPoint | null> => {
    try {
      const data = await callEdgeFunction<any>('hubspot_metrics');

      return {
        source: 'hubspot',
        type: 'crm',
        value: {
          newContacts: data?.newContacts || 0,
          deals: data?.deals || 0,
          dealValue: data?.totalDealValue || 0,
          conversionRate: data?.conversionRate || 0,
        },
        timestamp: new Date().toISOString(),
        metadata: { period: '7d', portalId: data?.portalId },
        relevanceScore: 0.8,
      };
    } catch (error) {
      console.warn('Failed to load HubSpot data:', error);
      return null;
    }
  };

  const loadStripeData = async (): Promise<IntegrationDataPoint | null> => {
    try {
      const data = await callEdgeFunction<any>('stripe_metrics');

      return {
        source: 'stripe',
        type: 'financial',
        value: {
          revenue: data?.revenue || 0,
          transactions: data?.transactions || 0,
          customers: data?.customers || 0,
          mrr: data?.mrr || 0,
        },
        timestamp: new Date().toISOString(),
        metadata: { period: '30d', currency: data?.currency || 'usd' },
        relevanceScore: 0.95,
      };
    } catch (error) {
      console.warn('Failed to load Stripe data:', error);
      return null;
    }
  };

  const loadRecentEvents = async () => {
    try {
      // Load events from Supabase analytics tables
      const response = await fetch('/api/analytics/events', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        setRecentEvents([]);
        return;
      }

      const data = await response.json();
      const events = data.events || [];
      
      setRecentEvents(events.map((event: any) => ({
        id: event.id,
        type: event.event_type || 'user_action',
        description: event.description || event.event_name,
        timestamp: event.created_at || event.timestamp,
        metadata: event.metadata || {},
        impact: event.impact || 'low',
        source: event.source || 'system'
      })));
    } catch (error) {
      console.error('Failed to load recent events:', error);
      setRecentEvents([]);
    }
  };

  const generateContextualInsights = useCallback(() => {
    if (!userProfile || integrationData.length === 0) return;

    setIsLearning(true);
    
    const newInsights: BusinessInsight[] = [];

    // Example: Website traffic insight
    const analyticsData = integrationData.find(d => d.source === 'google-analytics');
    if (analyticsData && pageId === 'dashboard') {
      const metrics = analyticsData.value;
      if (metrics.bounceRate > 0.5) {
        newInsights.push({
          id: `insight-${Date.now()}-bounce-rate`,
          type: 'risk',
          priority: 'high',
          category: 'Website Performance',
          title: 'High Bounce Rate Detected',
          description: `Your website bounce rate is ${(metrics.bounceRate * 100).toFixed(1)}%, which is above the recommended 40% threshold.`,
          dataSource: ['google-analytics'],
          metrics: {
            impact: 8,
            confidence: 0.9,
            timeToValue: 30,
            effort: 3
          },
          suggestedActions: [
            {
              id: 'action-improve-landing-pages',
              type: 'guided_workflow',
              title: 'Optimize Landing Pages',
              description: 'Review and improve your top landing pages to reduce bounce rate',
              estimatedTime: 45,
              difficulty: 'medium',
              prerequisites: ['Google Analytics access'],
              steps: [
                {
                  id: 'step-1',
                  title: 'Analyze Top Landing Pages',
                  description: 'Identify pages with highest bounce rates',
                  type: 'navigation',
                  automatable: false
                },
                {
                  id: 'step-2',
                  title: 'Review Page Speed',
                  description: 'Check page load times using PageSpeed Insights',
                  type: 'external_action',
                  automatable: true
                }
              ],
              expectedOutcome: 'Reduce bounce rate by 10-15%',
              trackingMetrics: ['bounce_rate', 'page_speed', 'user_engagement']
            }
          ],
          automationPotential: {
            id: 'auto-page-speed-monitoring',
            title: 'Automated Page Speed Monitoring',
            description: 'Set up automated alerts when page speed drops below threshold',
            type: 'trigger_based',
            complexity: 'simple',
            estimatedSetupTime: 15,
            estimatedTimeSavings: 60,
            requiredIntegrations: ['google-analytics', 'pagespeed-insights'],
            workflow: {
              trigger: {
                type: 'threshold',
                config: { metric: 'page_speed', threshold: 3000 },
                description: 'When page load time exceeds 3 seconds'
              },
              actions: [
                {
                  type: 'notification',
                  config: { channel: 'slack', message: 'Page speed alert triggered' },
                  description: 'Send notification to development team'
                }
              ]
            },
            riskLevel: 'low',
            testingRequired: false
          },
          context: {
            pageRelevance: ['dashboard', 'analytics', 'website'],
            triggerConditions: { bounceRate: { operator: 'greater_than', value: 0.4 } },
            historicalData: []
          },
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    }

    // Example: Team collaboration insight
    const slackData = integrationData.find(d => d.source === 'slack');
    if (slackData && (pageId === 'dashboard' || pageId === 'team')) {
      const activity = slackData.value;
      if (activity.messagesCount < 100) {
        newInsights.push({
          id: `insight-${Date.now()}-low-communication`,
          type: 'opportunity',
          priority: 'medium',
          category: 'Team Collaboration',
          title: 'Low Team Communication Detected',
          description: `Only ${activity.messagesCount} messages in the last 24 hours. Consider ways to improve team communication.`,
          dataSource: ['slack'],
          metrics: {
            impact: 6,
            confidence: 0.7,
            timeToValue: 15,
            effort: 2
          },
          suggestedActions: [
            {
              id: 'action-daily-standup',
              type: 'automation',
              title: 'Schedule Daily Standup Reminders',
              description: 'Set up automated daily standup reminders in Slack',
              estimatedTime: 10,
              difficulty: 'easy',
              prerequisites: ['Slack admin access'],
              steps: [
                {
                  id: 'step-1',
                  title: 'Create Standup Bot',
                  description: 'Set up a bot to send daily standup reminders',
                  type: 'api_call',
                  automatable: true
                }
              ],
              expectedOutcome: 'Increase daily team communication by 50%',
              trackingMetrics: ['daily_messages', 'standup_participation']
            }
          ],
          automationPotential: null,
          context: {
            pageRelevance: ['dashboard', 'team', 'communication'],
            triggerConditions: { dailyMessages: { operator: 'less_than', value: 100 } },
            historicalData: []
          },
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
    }

    setInsights(newInsights);
    setIsLearning(false);
  }, [pageId, userProfile, integrationData]);

  const generateProgressiveActions = useCallback(() => {
    if (!userProfile) return;

    const newActions: ProgressiveAction[] = [];

    // Page-specific progressive actions
    if (pageId === 'dashboard') {
      newActions.push({
        id: 'action-connect-integration',
        pageId,
        position: 'header',
        trigger: {
          type: 'page_load',
          conditions: { integrationCount: { operator: 'less_than', value: 3 } }
        },
        action: {
          id: 'quick-connect-integration',
          type: 'quick_action',
          title: 'Connect Your First Integration',
          description: 'Connect Google Analytics to start seeing real insights',
          estimatedTime: 5,
          difficulty: 'easy',
          prerequisites: [],
          steps: [
            {
              id: 'step-1',
              title: 'Go to Integrations',
              description: 'Navigate to the integrations page',
              type: 'navigation',
              automatable: false
            }
          ],
          expectedOutcome: 'Access to real business data and insights',
          trackingMetrics: ['integration_connected', 'data_points_available']
        },
        displayConfig: {
          style: 'button',
          variant: 'primary',
          dismissible: true,
          persistent: false
        },
        analytics: {
          impressions: 0,
          clicks: 0,
          completions: 0,
          dismissals: 0,
          avgTimeToAction: 0
        }
      });
    }

    if (pageId === 'integrations') {
      newActions.push({
        id: 'action-automation-suggestion',
        pageId,
        position: 'contextual',
        trigger: {
          type: 'user_behavior',
          conditions: { connectedIntegrations: { operator: 'greater_than', value: 2 } }
        },
        action: {
          id: 'suggest-automation',
          type: 'guided_workflow',
          title: 'Create Your First Automation',
          description: 'You have enough integrations to create powerful automations',
          estimatedTime: 15,
          difficulty: 'medium',
          prerequisites: ['Multiple integrations connected'],
          steps: [
            {
              id: 'step-1',
              title: 'Choose Automation Type',
              description: 'Select from suggested automation templates',
              type: 'form_fill',
              automatable: false
            }
          ],
          expectedOutcome: 'Save 2+ hours per week on manual tasks',
          trackingMetrics: ['automation_created', 'time_saved']
        },
        displayConfig: {
          style: 'card',
          variant: 'accent',
          dismissible: true,
          persistent: true
        },
        analytics: {
          impressions: 0,
          clicks: 0,
          completions: 0,
          dismissals: 0,
          avgTimeToAction: 0
        }
      });
    }

    setActions(newActions);
  }, [pageId, userProfile]);

  const identifyAutomationOpportunities = useCallback(() => {
    if (!userProfile || integrationData.length < 2) return;

    const opportunities: AutomationOpportunity[] = [
      {
        id: 'auto-weekly-report',
        title: 'Automated Weekly Performance Report',
        description: 'Generate and send weekly performance reports automatically',
        type: 'scheduled_task',
        complexity: 'moderate',
        estimatedSetupTime: 20,
        estimatedTimeSavings: 120,
        requiredIntegrations: ['google-analytics', 'slack'],
        workflow: {
          trigger: {
            type: 'schedule',
            config: { cron: '0 9 * * MON' },
            description: 'Every Monday at 9 AM'
          },
          actions: [
            {
              type: 'api_call',
              config: { service: 'google-analytics', endpoint: 'weekly-summary' },
              description: 'Fetch weekly analytics data'
            },
            {
              type: 'report_generation',
              config: { template: 'weekly-performance', format: 'pdf' },
              description: 'Generate formatted report'
            },
            {
              type: 'notification',
              config: { channel: 'slack', mentions: ['@leadership'] },
              description: 'Send report to leadership team'
            }
          ]
        },
        riskLevel: 'low',
        testingRequired: true
      }
    ];

    setAutomationOpportunities(opportunities);
  }, [userProfile, integrationData]);

  const recordEvent = useCallback(async (event: Omit<LearningEvent, 'id' | 'userId'>) => {
    if (!userProfile) return;

    const fullEvent: LearningEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: userProfile.id,
      ...event
    };

    setRecentEvents(prev => [fullEvent, ...prev.slice(0, 99)]); // Keep last 100 events
    
    // Send to analytics service
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullEvent)
      });
    } catch (error) {
      console.warn('Failed to send event to analytics service:', error);
    }
    
    console.log('Learning event recorded:', fullEvent);
  }, [userProfile]);

  const dismissInsight = useCallback((insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'dismissed' as const }
        : insight
    ));

    recordEvent({
      type: 'insight_dismissed',
      data: { insightId },
      context: {
        page: pageId,
        sessionId: 'current-session',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  }, [pageId, recordEvent]);

  const executeAction = useCallback(async (actionId: string) => {
    const action = actions.find(a => a.action.id === actionId);
    if (!action) return;

    recordEvent({
      type: 'action_taken',
      data: { actionId, actionType: action.action.type },
      context: {
        page: pageId,
        sessionId: 'current-session',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });

    // Execute action via API
    try {
      const response = await fetch('/api/ai/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          actionType: action.action.type,
          actionData: action.action
        })
      });

      if (!response.ok) {
        throw new Error('Action execution failed');
      }

      const result = await response.json();
      console.log('Action executed successfully:', result);
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  }, [actions, pageId, recordEvent]);

  const createAutomation = useCallback(async (opportunityId: string) => {
    const opportunity = automationOpportunities.find(o => o.id === opportunityId);
    if (!opportunity) return;

    recordEvent({
      type: 'automation_created',
      data: { opportunityId, automationType: opportunity.type },
      context: {
        page: pageId,
        sessionId: 'current-session',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });

    // Create automation via API
    try {
      const response = await fetch('/api/automations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          automationType: opportunity.type,
          workflow: opportunity.workflow,
          metadata: {
            estimatedSetupTime: opportunity.estimatedSetupTime,
            estimatedTimeSavings: opportunity.estimatedTimeSavings,
            requiredIntegrations: opportunity.requiredIntegrations
          }
        })
      });

      if (!response.ok) {
        throw new Error('Automation creation failed');
      }

      const result = await response.json();
      console.log('Automation created successfully:', result);
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  }, [automationOpportunities, pageId, recordEvent]);

  const updatePreferences = useCallback(async (preferences: Partial<UserProfile['preferences']>) => {
    if (!userProfile) return;

    setUserProfile(prev => prev ? {
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    } : null);

    // Persist preferences to backend
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
    } catch (error) {
      console.warn('Failed to persist preferences to backend:', error);
    }

    recordEvent({
      type: 'action_taken',
      data: { action: 'preferences_updated', preferences },
      context: {
        page: pageId,
        sessionId: 'current-session',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  }, [userProfile, pageId, recordEvent]);

  return {
    insights: insights.filter(i => i.status === 'active'),
    actions,
    automationOpportunities,
    isLearning,
    recordEvent,
    dismissInsight,
    executeAction,
    createAutomation,
    updatePreferences
  };
} 