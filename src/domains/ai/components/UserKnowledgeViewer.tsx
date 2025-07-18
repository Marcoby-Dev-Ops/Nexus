import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Progress } from '@/shared/components/ui/Progress';
import { Separator } from '@/shared/components/ui/Separator';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/core/supabase';
import { ContextualRAG } from '@/domains/ai/lib/contextualRAG';
import { thoughtsService } from '@/domains/services/thoughtsService';
import {
  Brain,
  User,
  Building2,
  Target,
  Activity,
  Lightbulb,
  BarChart3,
  Settings,
  Eye,
  RefreshCw,
  Download,
  Clock,
  TrendingUp,
  MessageSquare,
  MapPin,
  Mail,
  Phone,
  Globe,
  Award,
  Briefcase,
  Heart,
  Zap,
  Database,
  Shield,
  ChevronRight,
  Info
} from 'lucide-react';

interface UserKnowledge {
  profile: {
    basic: Record<string, any>;
    professional: Record<string, any>;
    preferences: Record<string, any>;
    completeness: number;
  };
  business_context: {
    company: Record<string, any>;
    role_context: Record<string, any>;
    goals: Record<string, any>;
    challenges: string[];
  };
  activity_patterns: {
    session_data: Record<string, any>;
    usage_patterns: Record<string, any>;
    feature_usage: string[];
    productivity_metrics: Record<string, any>;
  };
  ai_insights: {
    thoughts_captured: number;
    interactions_count: number;
    learning_progress: Record<string, any>;
    personalization_score: number;
  };
  integrations: {
    connected_services: any[];
    data_sources: string[];
    sync_status: Record<string, any>;
  };
  memory_bank: {
    personal_thoughts: any[];
    business_observations: any[];
    contextual_insights: any[];
    conversation_history: any[];
  };
}

interface UserKnowledgeViewerProps {
  className?: string;
}

export const UserKnowledgeViewer: React.FC<UserKnowledgeViewerProps> = ({ 
  className = '' 
}) => {
  const { user } = useAuth();
  const [knowledge, setKnowledge] = useState<UserKnowledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserKnowledge();
    }
  }, [user]);

  const loadUserKnowledge = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch comprehensive user knowledge from multiple sources
      const [
        profileData,
        thoughtsData,
        interactionsData,
        integrationsData,
        conversationsData
      ] = await Promise.all([
        fetchProfileKnowledge(),
        fetchThoughtsKnowledge(),
        fetchInteractionsKnowledge(),
        fetchIntegrationsKnowledge(),
        fetchConversationKnowledge()
      ]);

      const compiledKnowledge: UserKnowledge = {
        profile: profileData,
        business_context: await fetchBusinessContext(),
        activity_patterns: await fetchActivityPatterns(),
        ai_insights: {
          thoughts_captured: thoughtsData.total || 0,
          interactions_count: interactionsData.total || 0,
          learning_progress: thoughtsData.metrics || {},
          personalization_score: calculatePersonalizationScore(profileData, thoughtsData, interactionsData)
        },
        integrations: integrationsData,
        memory_bank: {
          personal_thoughts: thoughtsData.recent || [],
          business_observations: interactionsData.observations || [],
          contextual_insights: await fetchContextualInsights(),
          conversation_history: conversationsData.recent || []
        }
      };

      setKnowledge(compiledKnowledge);
    } catch (error) {
      console.error('Error loading user knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileKnowledge = async () => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    const basicFields = ['first_name', 'last_name', 'display_name', 'bio', 'location'];
    const professionalFields = ['job_title', 'department', 'role', 'skills', 'hire_date'];
    const preferenceFields = ['preferences', 'timezone', 'work_location'];

    const basic = basicFields.reduce((acc, field) => {
      if (profile?.[field]) acc[field] = profile[field];
      return acc;
    }, {} as Record<string, any>);

    const professional = professionalFields.reduce((acc, field) => {
      if (profile?.[field]) acc[field] = profile[field];
      return acc;
    }, {} as Record<string, any>);

    const preferences = preferenceFields.reduce((acc, field) => {
      if (profile?.[field]) acc[field] = profile[field];
      return acc;
    }, {} as Record<string, any>);

    const totalFields = [...basicFields, ...professionalFields, ...preferenceFields];
    const completedFields = totalFields.filter(field => profile?.[field]);
    const completeness = Math.round((completedFields.length / totalFields.length) * 100);

    return { basic, professional, preferences, completeness };
  };

  const fetchBusinessContext = async () => {
    // Get company data
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', user?.profile?.company_id)
      .single();

    // Define an interface for the expected preferences shape
    interface UserPreferences {
      user_context?: any;
    }

    // Get user context from onboarding
    const preferences = user?.profile?.preferences as UserPreferences | null;
    const userContext = preferences?.user_context || {};

    return {
      company: company || {},
      role_context: userContext,
      goals: {
        immediate_goals: userContext.ideal_outcome || '',
        biggest_challenge: userContext.biggest_challenge || '',
        daily_frustration: userContext.daily_frustration || ''
      },
      challenges: [
        userContext.biggest_challenge,
        userContext.daily_frustration
      ].filter(Boolean)
    };
  };

  const fetchActivityPatterns = async () => {
    // Get recent activity from ai_interactions
    const { data: interactions } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(100);

    const sessionData = calculateSessionMetrics(interactions || []);
    const usagePatterns = calculateUsagePatterns(interactions || []);
    const featureUsage = extractFeatureUsage(interactions || []);

    return {
      session_data: sessionData,
      usage_patterns: usagePatterns,
      feature_usage: featureUsage,
      productivity_metrics: calculateProductivityMetrics(interactions || [])
    };
  };

  const fetchThoughtsKnowledge = async () => {
    try {
      const [thoughts, metrics] = await Promise.all([
        thoughtsService.getThoughts({}, 10),
        thoughtsService.getMetrics()
      ]);

      return {
        total: thoughts.thoughts.length,
        recent: thoughts.thoughts.slice(0, 5),
        metrics: metrics
      };
    } catch (error) {
      return { total: 0, recent: [], metrics: {} };
    }
  };

  const fetchInteractionsKnowledge = async () => {
    const { data: interactions } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      total: interactions?.length || 0,
      observations: extractBusinessObservations(interactions || []),
      patterns: analyzeInteractionPatterns(interactions || [])
    };
  };

  const fetchIntegrationsKnowledge = async () => {
    const { data: integrations } = await supabase
      .from('user_integrations')
      .select(`
        *,
        integrations!inner(category, name, slug)
      `)
      .eq('user_id', user?.id);

    return {
      connected_services: integrations || [],
      data_sources: (integrations || []).map(i => {
        const integrationInfo = Array.isArray(i.integrations) ? i.integrations[0] : i.integrations;
        return integrationInfo?.category || integrationInfo?.name || 'unknown';
      }),
      sync_status: (integrations || []).reduce((acc, integration) => {
        const integrationInfo = Array.isArray(integration.integrations) ? integration.integrations[0] : integration.integrations;
        const key = integrationInfo?.category || integrationInfo?.name || 'unknown';
        acc[key] = integration.status;
        return acc;
      }, {} as Record<string, any>)
    };
  };

  const fetchConversationKnowledge = async () => {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*, chat_messages(*)')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    return {
      recent: conversations || [],
      total_conversations: conversations?.length || 0,
      total_messages: conversations?.reduce((acc, conv) => acc + (conv.chat_messages?.length || 0), 0) || 0
    };
  };

  const fetchContextualInsights = async () => {
    // Initialize ContextualRAG to get insights
    const rag = new ContextualRAG();
    await rag.initialize(user?.id || '');
    
    // Extract personalization insights
    const insights = rag.generatePersonalizationInsights();
    
    return [
      {
        type: 'personalization',
        content: insights,
        generated_at: new Date().toISOString()
      }
    ];
  };

  // Helper functions
  const calculatePersonalizationScore = (profile: any, thoughts: any, interactions: any): number => {
    let score = 0;
    
    // Profile completeness (40 points)
    score += (profile.completeness / 100) * 40;
    
    // Thoughts captured (30 points)
    if (thoughts.total > 0) score += Math.min(thoughts.total * 2, 30);
    
    // Interaction history (30 points)
    if (interactions.total > 0) score += Math.min(interactions.total * 1, 30);
    
    return Math.min(Math.round(score), 100);
  };

  const calculateSessionMetrics = (interactions: any[]) => {
    if (interactions.length === 0) return {};
    
    const sessions = groupInteractionsBySessions(interactions);
    const avgSessionLength = sessions.reduce((acc, session) => acc + session.duration, 0) / sessions.length;
    
    return {
      total_sessions: sessions.length,
      avg_session_duration: Math.round(avgSessionLength / 60), // minutes
      last_active: interactions[0]?.created_at,
      most_active_time: findMostActiveTimeOfDay(interactions)
    };
  };

  const calculateUsagePatterns = (interactions: any[]) => {
    const patterns = {
      daily_usage: calculateDailyUsage(interactions),
      feature_preferences: calculateFeaturePreferences(interactions),
      interaction_types: calculateInteractionTypes(interactions)
    };
    
    return patterns;
  };

  const extractFeatureUsage = (interactions: any[]): string[] => {
    const features = new Set<string>();
    interactions.forEach(interaction => {
      if (interaction.metadata?.feature) {
        features.add(interaction.metadata.feature);
      }
      if (interaction.metadata?.agent_id) {
        features.add(interaction.metadata.agent_id);
      }
    });
    return Array.from(features);
  };

  const calculateProductivityMetrics = (interactions: any[]) => {
    return {
      questions_asked: interactions.filter(i => i.interaction_type === 'question').length,
      actions_taken: interactions.filter(i => i.interaction_type === 'action').length,
      insights_generated: interactions.filter(i => i.interaction_type === 'insight').length,
      avg_response_satisfaction: calculateAverageRating(interactions)
    };
  };

  // UI Helper functions
  const groupInteractionsBySessions = (interactions: any[]) => {
    // Group interactions into sessions (30 min gaps = new session)
    const sessions: any[] = [];
    let currentSession: any = null;
    
    interactions.forEach(interaction => {
      const timestamp = new Date(interaction.created_at).getTime();
      
      if (!currentSession || (timestamp - currentSession.lastActivity) > 30 * 60 * 1000) {
        currentSession = {
          start: timestamp,
          end: timestamp,
          lastActivity: timestamp,
          interactions: [interaction],
          duration: 0
        };
        sessions.push(currentSession);
      } else {
        currentSession.interactions.push(interaction);
        currentSession.end = timestamp;
        currentSession.lastActivity = timestamp;
        currentSession.duration = currentSession.end - currentSession.start;
      }
    });
    
    return sessions;
  };

  const findMostActiveTimeOfDay = (interactions: any[]): string => {
    const hourCounts = new Array(24).fill(0);
    interactions.forEach(interaction => {
      const hour = new Date(interaction.created_at).getHours();
      hourCounts[hour]++;
    });
    
    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    return `${maxHour}:00`;
  };

  const calculateDailyUsage = (interactions: any[]) => {
    const dailyCounts: Record<string, number> = {};
    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return dailyCounts;
  };

  const calculateFeaturePreferences = (interactions: any[]) => {
    const featureCounts: Record<string, number> = {};
    interactions.forEach(interaction => {
      const feature = interaction.metadata?.agent_id || 'general';
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });
    return featureCounts;
  };

  const calculateInteractionTypes = (interactions: any[]) => {
    const typeCounts: Record<string, number> = {};
    interactions.forEach(interaction => {
      const type = interaction.interaction_type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return typeCounts;
  };

  const extractBusinessObservations = (interactions: any[]) => {
    return interactions
      .filter(i => i.metadata?.business_observation)
      .map(i => ({
        observation: i.metadata.business_observation,
        context: i.metadata.context,
        timestamp: i.created_at
      }))
      .slice(0, 5);
  };

  const analyzeInteractionPatterns = (interactions: any[]) => {
    return {
      most_common_topics: extractCommonTopics(interactions),
      preferred_interaction_style: determineInteractionStyle(interactions),
      learning_progression: trackLearningProgression(interactions)
    };
  };

  const extractCommonTopics = (interactions: any[]): string[] => {
    const topics: Record<string, number> = {};
    interactions.forEach(interaction => {
      if (interaction.metadata?.topic_tags) {
        interaction.metadata.topic_tags.forEach((topic: string) => {
          topics[topic] = (topics[topic] || 0) + 1;
        });
      }
    });
    
    return Object.entries(topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  };

  const determineInteractionStyle = (interactions: any[]): string => {
    const styles = analyzeInteractionPatterns(interactions);
    if (Object.values(styles).every(v => v === 0)) return 'balanced';
    
    type StyleKey = keyof typeof styles;
    const maxStyle = Object.entries(styles).reduce((a, b) => 
      styles[a[0] as StyleKey] > styles[b[0] as StyleKey] ? a : b
    );
    return maxStyle[0];
  };

  const trackLearningProgression = (interactions: any[]) => {
    // Analyze how user's questions/interactions have evolved over time
    const early = interactions.slice(-Math.floor(interactions.length * 0.7));
    const recent = interactions.slice(0, Math.floor(interactions.length * 0.3));
    
    return {
      early_topics: extractCommonTopics(early).slice(0, 3),
      recent_topics: extractCommonTopics(recent).slice(0, 3),
      complexity_increase: recent.length > 0 && early.length > 0 ? 
        (recent.reduce((acc, i) => acc + (i.content?.length || 0), 0) / recent.length) >
        (early.reduce((acc, i) => acc + (i.content?.length || 0), 0) / early.length) : false
    };
  };

  const calculateAverageRating = (interactions: any[]): number => {
    const ratedInteractions = interactions.filter(i => i.metadata?.user_rating);
    if (ratedInteractions.length === 0) return 0;
    
    const totalRating = ratedInteractions.reduce((acc, i) => acc + (i.metadata.user_rating || 0), 0);
    return Math.round((totalRating / ratedInteractions.length) * 10) / 10;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserKnowledge();
    setRefreshing(false);
  };

  const handleExportData = async () => {
    if (!knowledge) return;
    
    const dataBlob = new Blob([JSON.stringify(knowledge, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-user-knowledge-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading your knowledge profile...</span>
        </div>
      </div>
    );
  }

  if (!knowledge) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Unable to load your knowledge profile. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-4">
            <Brain className="h-8 w-8 text-primary" />
            What Nexus Knows About You
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete overview of your personal and business context that powers your AI experience
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Knowledge Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Completeness</p>
                <p className="text-2xl font-bold">{knowledge.profile.completeness}%</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
            <Progress value={knowledge.profile.completeness} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personalization Score</p>
                <p className="text-2xl font-bold">{knowledge.ai_insights.personalization_score}%</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <Progress value={knowledge.ai_insights.personalization_score} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Thoughts Captured</p>
                <p className="text-2xl font-bold">{knowledge.ai_insights.thoughts_captured}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected Services</p>
                <p className="text-2xl font-bold">{knowledge.integrations.connected_services.length}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Knowledge Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Name</h4>
                  <p className="text-lg">{knowledge.profile.basic.display_name || knowledge.profile.basic.first_name || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Role</h4>
                  <p>{knowledge.profile.professional.job_title || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Department</h4>
                  <p>{knowledge.profile.professional.department || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Location</h4>
                  <p>{knowledge.profile.basic.location || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Business Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Company</h4>
                  <p className="text-lg">{knowledge.business_context.company.name || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Industry</h4>
                  <p>{knowledge.business_context.company.industry || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Company Size</h4>
                  <p>{knowledge.business_context.company.size || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Current Goals</h4>
                  <p className="text-sm">{knowledge.business_context.goals.immediate_goals || 'Not defined'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Intelligence Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{knowledge.ai_insights.thoughts_captured}</div>
                  <p className="text-sm text-muted-foreground">Personal thoughts captured</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{knowledge.ai_insights.interactions_count}</div>
                  <p className="text-sm text-muted-foreground">AI interactions</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{knowledge.integrations.connected_services.length}</div>
                  <p className="text-sm text-muted-foreground">Data sources connected</p>
                </div>
              </div>
              
              {knowledge.business_context.challenges.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Known Challenges</h4>
                  <div className="space-y-2">
                    {knowledge.business_context.challenges.map((challenge, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Target className="h-4 w-4 mt-1 text-warning" />
                        <p className="text-sm">{challenge}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(knowledge.profile.basic).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{value || 'Not provided'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(knowledge.profile.professional).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">
                      {Array.isArray(value) ? value.join(', ') : (value || 'Not provided')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Skills */}
          {knowledge.profile.professional.skills && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {knowledge.profile.professional.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(knowledge.business_context.company).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{value || 'Not provided'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Role Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Role Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(knowledge.business_context.role_context).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="text-sm font-medium text-muted-foreground capitalize mb-1">
                      {key.replace('_', ' ')}
                    </h4>
                    <p className="text-sm">{value || 'Not provided'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Goals and Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals & Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(knowledge.business_context.goals).map(([key, value]) => (
                <div key={key}>
                  <h4 className="text-sm font-medium text-muted-foreground capitalize mb-2">
                    {key.replace('_', ' ')}
                  </h4>
                  <p className="text-sm bg-muted p-4 rounded-lg">{value || 'Not defined'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(knowledge.activity_patterns.session_data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">
                      {key.includes('time') || key.includes('active') ? 
                        (typeof value === 'string' ? new Date(value).toLocaleDateString() : value) : 
                        value
                      }
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Productivity Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Productivity Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(knowledge.activity_patterns.productivity_metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Feature Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Feature Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {knowledge.activity_patterns.feature_usage.map((feature, index) => (
                  <Badge key={index} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-6">
          {/* Personal Thoughts */}
          {knowledge.memory_bank.personal_thoughts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recent Personal Thoughts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {knowledge.memory_bank.personal_thoughts.map((thought, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{thought.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(thought.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{thought.content}</p>
                    {thought.main_sub_categories && thought.main_sub_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {thought.main_sub_categories.map((tag: string, tagIndex: number) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Business Observations */}
          {knowledge.memory_bank.business_observations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Business Observations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {knowledge.memory_bank.business_observations.map((observation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <p className="text-sm">{observation.observation}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{observation.context}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(observation.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Conversation History Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {knowledge.memory_bank.conversation_history.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Recent conversations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {knowledge.memory_bank.conversation_history.reduce(
                      (acc, conv) => acc + (conv.chat_messages?.length || 0), 0
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Total messages</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {knowledge.memory_bank.conversation_history.length > 0 ? 
                      new Date(knowledge.memory_bank.conversation_history[0].updated_at).toLocaleDateString() :
                      'Never'
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">Last conversation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Connected Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connected Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {knowledge.integrations.connected_services.length > 0 ? (
                <div className="space-y-4">
                  {knowledge.integrations.connected_services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">
                          {(() => {
                            const integrationInfo = Array.isArray(service.integrations) ? service.integrations[0] : service.integrations;
                            return integrationInfo?.name || integrationInfo?.category || 'Unknown Service';
                          })()}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Connected on {new Date(service.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={service.status === 'active' ? 'default' : 'secondary'}
                        >
                          {service.status}
                        </Badge>
                        {service.last_sync_at && (
                          <span className="text-xs text-muted-foreground">
                            Last sync: {new Date(service.last_sync_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No integrations connected yet</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/settings'}>
                    Connect Services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {knowledge.integrations.data_sources.map((source, index) => (
                  <Badge key={index} variant="outline">
                    {source}
                  </Badge>
                ))}
              </div>
              {knowledge.integrations.data_sources.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No data sources connected
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This information is stored securely and used only to personalize your Nexus experience. 
          You can export or delete your data at any time through your account settings.
        </AlertDescription>
      </Alert>
    </div>
  );
};