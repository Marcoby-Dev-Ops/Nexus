/**
 * Quantum Home Dashboard - Living OS Command Center
 * 
 * The home page that feels like a living operating system dashboard,
 * not another setup screen. Users land in their command center.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { 
  Building2, DollarSign, Users, BookOpen, Settings, 
  TrendingUp, Package, ArrowRight, CheckCircle, 
  AlertCircle, Target, Zap, Brain, Activity,
  RefreshCw, Eye, BrainCircuit, Globe, Shield,
  Lightbulb, Clock, Star, Rocket, Briefcase,
  MessageSquare, FileText, PieChart, Calendar,
  Plus, BookOpen as BookOpenIcon, Target as TargetIcon,
  Heart, AlertTriangle, Play, BarChart3, 
  Bot, Sparkles, ChevronRight, TrendingDown,
  CalendarDays, Target as TargetIcon2, 
  Users as UsersIcon, BookOpen as BookOpenIcon2, 
  TrendingUp as TrendingUpIcon, Settings as SettingsIcon,
  Zap as ZapIcon
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useBusinessBody, useBusinessAlerts } from '@/hooks/business-systems/useBusinessBody';
import type { BusinessSystem, SystemHealth } from '@/core/business-systems/BusinessSystemTypes';
import { 
  getAllQuantumBlocks, 
  getQuantumBlock, 
  type QuantumBlock, 
  type QuantumBusinessProfile,
  calculateBusinessHealth,
  generateQuantumInsights,
  generateQuantumRecommendations
} from '@/core/config/quantumBusinessModel';
import { quantumBusinessService } from '@/services/business/QuantumBusinessService';
import { unifiedPlaybookService as PlaybookService } from '@/services/playbook/UnifiedPlaybookService';
import { useFireCyclePlaybooks, type PlaybookRecommendation } from '@/core/fire-cycle/fireCyclePlaybooks';
import JourneyTicketService, { type JourneyTicket as ServiceBrainTicket } from '@/services/playbook/JourneyTicketService';
import { nexusUnifiedBrain } from '@/services/ai/nexusUnifiedBrain';


interface BrainTicket {
  id: string;
  title: string;
  type: 'identity' | 'revenue' | 'people' | 'operations' | 'infrastructure' | 'knowledge' | 'growth';
  status: 'in_progress' | 'waiting' | 'completed' | 'new';
  progress: number;
  lastActivity: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface QuantumBlockStatus {
  blockId: string;
  strength: number;
  health: number;
  lastUpdated: string;
  insights: string[];
  recommendations: string[];
}

interface QuantumHomeDashboardProps {
  className?: string;
}

type JourneyType = {
  id: string;
  name: string;
  description: string;
  duration: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  category?: 'onboarding' | 'growth' | 'optimization' | 'innovation' | 'compliance' | 'custom';
  icon: React.ReactElement;
};

const QuantumHomeDashboard: React.FC<QuantumHomeDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const { orgs, activeOrgId, getActiveOrg } = useOrganizationStore();
  
  const [quantumProfile, setQuantumProfile] = useState<QuantumBusinessProfile | null>(null);
  const [blockStatuses, setBlockStatuses] = useState<QuantumBlockStatus[]>([]);
  const [overallHealth, setOverallHealth] = useState<number>(0);
  const [maturityLevel, setMaturityLevel] = useState<string>('startup');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
     const [brainTickets, setBrainTickets] = useState<BrainTicket[]>([]);
   const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
   const [lastLoginDelta, setLastLoginDelta] = useState<number>(0);
   const [showAllTickets, setShowAllTickets] = useState<boolean>(false);
     const [playbookRecommendations, setPlaybookRecommendations] = useState<PlaybookRecommendation[]>([]);
  const [showPlaybooks, setShowPlaybooks] = useState<boolean>(false);
  const [brainTicketsService] = useState(() => new JourneyTicketService());
  const [playbookService] = useState(() => PlaybookService);
  const { recommendPlaybook } = useFireCyclePlaybooks();
  const [brainPoweredJourneys, setBrainPoweredJourneys] = useState<JourneyType[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);

  // System icons for the widget
  const SYSTEM_ICONS = {
    cashFlow: Heart,
    intelligence: Brain,
    customerIntel: Activity,
    operations: Zap,
    infrastructure: Shield,
    knowledgeMgmt: BookOpen,
    growthDev: TrendingUp,
    riskMgmt: AlertTriangle
  };

  const quantumBlocks = getAllQuantumBlocks();

  // All available journeys data
  const allJourneys: JourneyType[] = [
    // Onboarding Journeys - Starter journeys for all businesses
    {
      id: 'business-identity-setup',
      name: 'Business Identity Setup',
      description: 'Define your business vision, mission, and unique value proposition',
      duration: '15-30 minutes',
      complexity: 'beginner' as const,
      category: 'onboarding',
      icon: <Target className="w-6 h-6 text-primary" />
    },
    {
      id: 'quantum-building-blocks',
      name: 'Quantum Building Blocks Setup',
      description: 'Configure the 7 fundamental building blocks that compose your business',
      duration: '30-60 minutes',
      complexity: 'beginner' as const,
      category: 'onboarding',
      icon: <Building2 className="w-6 h-6 text-primary" />
    },
    {
      id: 'business-profile-completion',
      name: 'Business Profile Completion',
      description: 'Complete your business profile with industry, goals, and context',
      duration: '10-20 minutes',
      complexity: 'beginner' as const,
      category: 'onboarding',
      icon: <Users className="w-6 h-6 text-primary" />
    },
    // Growth Journeys
    {
      id: 'customer-acquisition',
      name: 'Customer Acquisition',
      description: 'Systematically grow your customer base through targeted marketing and sales strategies',
      duration: '3-6 months',
      complexity: 'intermediate' as const,
      category: 'growth',
      icon: <UsersIcon className="w-6 h-6 text-primary" />
    },
    {
      id: 'content-marketing',
      name: 'Content Marketing & Blog',
      description: 'Build authority and attract customers through valuable content creation and distribution',
      duration: '6-12 months',
      complexity: 'beginner' as const,
      category: 'growth',
      icon: <BookOpenIcon2 className="w-6 h-6 text-primary" />
    },
    {
      id: 'sales-optimization',
      name: 'Sales Optimization',
      description: 'Increase sales performance through process optimization and team development',
      duration: '2-4 months',
      complexity: 'intermediate' as const,
      category: 'optimization',
      icon: <TrendingUpIcon className="w-6 h-6 text-primary" />
    },
    {
      id: 'product-development',
      name: 'Product Development',
      description: 'Develop and launch new products or improve existing ones based on market needs',
      duration: '6-18 months',
      complexity: 'advanced' as const,
      category: 'innovation',
      icon: <Package className="w-6 h-6 text-primary" />
    },
    {
      id: 'operational-efficiency',
      name: 'Operational Efficiency',
      description: 'Streamline operations and reduce costs while maintaining quality',
      duration: '3-6 months',
      complexity: 'intermediate' as const,
      category: 'optimization',
      icon: <SettingsIcon className="w-6 h-6 text-primary" />
    },
    {
      id: 'digital-transformation',
      name: 'Digital Transformation',
      description: 'Modernize business processes and technology infrastructure',
      duration: '12-24 months',
      complexity: 'advanced' as const,
      category: 'innovation',
      icon: <ZapIcon className="w-6 h-6 text-primary" />
    }
  ];

  // Filter journeys based on business maturity level
  const getJourneysForMaturityLevel = (level: string) => {
    // For new users or incomplete onboarding, prioritize onboarding journeys
    const configuredBlocks = blockStatuses.filter(s => s.strength > 0).length;
    const totalBlocks = 7;
    const blocksCompletionRate = configuredBlocks / totalBlocks;
    
    if (level === 'startup' || blocksCompletionRate < 0.5) {
      return allJourneys.filter(journey => journey.category === 'onboarding');
    }
    
    switch (level) {
      case 'startup':
        // Startups get beginner journeys to build foundation
        return allJourneys.filter(j => j.complexity === 'beginner');
      case 'growing':
        // Growing businesses get beginner and intermediate journeys
        return allJourneys.filter(j => j.complexity === 'beginner' || j.complexity === 'intermediate');
      case 'scaling':
        // Scaling businesses get intermediate and advanced journeys
        return allJourneys.filter(j => j.complexity === 'intermediate' || j.complexity === 'advanced');
      case 'mature':
        // Mature businesses get advanced journeys for optimization
        return allJourneys.filter(j => j.complexity === 'advanced');
      default:
        // Fallback to beginner journeys for unknown maturity levels
        return allJourneys.filter(j => j.complexity === 'beginner');
    }
  };

  // Get filtered journeys based on current maturity level (fallback)
  const maturityBasedJourneys = getJourneysForMaturityLevel(maturityLevel);
  
  // Use brain-powered journeys if available, otherwise fall back to maturity-based
  const availableJourneys = brainPoweredJourneys.length > 0 ? brainPoweredJourneys : maturityBasedJourneys;

  // Brain-powered journey recommendation system
  const generateBrainPoweredJourneyRecommendations = async () => {
    if (!user?.id || !activeOrgId) return;
    
    setJourneyLoading(true);
    try {
      // 1. Analyze business intelligence from unified brain
      const businessIntelligence = await nexusUnifiedBrain.generateBusinessIntelligence([]);
      
      // 2. Extract current business challenges from alerts
      const currentChallenges = criticalAlerts.map(alert => alert.type.toLowerCase());
      
      // 3. Analyze business health and opportunities
      const businessHealth = overallHealth;
      const opportunities = businessIntelligence.opportunities;
      const risks = businessIntelligence.risks;
      
      // 4. Analyze building blocks completion status
      const configuredBlocks = blockStatuses.filter(s => s.strength > 0).length;
      const totalBlocks = 7; // Total quantum blocks
      const blocksCompletionRate = configuredBlocks / totalBlocks;
      
      // 5. Generate personalized journey recommendations
      const recommendedJourneys = getJourneysForBusinessContext(allJourneys, {
        challenges: currentChallenges,
        health: businessHealth,
        opportunities: opportunities,
        risks: risks,
        maturityLevel: maturityLevel,
        businessIntelligence: businessIntelligence,
        blocksCompletionRate: blocksCompletionRate,
        configuredBlocks: configuredBlocks,
        totalBlocks: totalBlocks
      });
      
      setBrainPoweredJourneys(recommendedJourneys);
    } catch (error) {
      console.error('Error generating brain-powered journey recommendations:', error);
      // Fall back to maturity-based recommendations
      setBrainPoweredJourneys(maturityBasedJourneys);
    } finally {
      setJourneyLoading(false);
    }
  };

  // Journey recommendation logic based on business context
  const getJourneysForBusinessContext = (
    journeys: JourneyType[],
    context: {
      challenges: string[];
      health: number;
      opportunities: string[];
      risks: string[];
      maturityLevel: string;
      businessIntelligence: any;
      blocksCompletionRate: number;
      configuredBlocks: number;
      totalBlocks: number;
    }
  ): JourneyType[] => {
    const { challenges, health, opportunities, risks, maturityLevel, businessIntelligence, blocksCompletionRate, configuredBlocks, totalBlocks } = context;
    
    // Start with maturity-based filtering
    let recommendedJourneys = getJourneysForMaturityLevel(maturityLevel);
    
    // 0. Building Blocks Foundation Check (HIGHEST PRIORITY)
    if (blocksCompletionRate < 0.5) {
      // Less than 50% of building blocks configured - prioritize onboarding journeys
      const onboardingJourneys = journeys.filter(j => j.category === 'onboarding');
      recommendedJourneys = onboardingJourneys.slice(0, 4);
      return recommendedJourneys;
    }
    
    // 1. Challenge-based recommendations (highest priority)
    const challengeBasedJourneys = getJourneysForChallenges(challenges);
    if (challengeBasedJourneys.length > 0) {
      recommendedJourneys = challengeBasedJourneys;
    }
    
    // 2. Health-based recommendations
    if (health < 50) {
      // Low health - prioritize foundational journeys
      const foundationalJourneys = journeys.filter(j => 
        j.complexity === 'beginner' || j.id === 'operational-efficiency'
      );
      recommendedJourneys = [...foundationalJourneys, ...recommendedJourneys].slice(0, 4);
    }
    
    // 3. Opportunity-based recommendations
    const opportunityBasedJourneys = getJourneysForOpportunities(opportunities);
    if (opportunityBasedJourneys.length > 0) {
      recommendedJourneys = [...opportunityBasedJourneys, ...recommendedJourneys].slice(0, 4);
    }
    
    // 4. Risk-based recommendations
    const riskBasedJourneys = getJourneysForRisks(risks);
    if (riskBasedJourneys.length > 0) {
      recommendedJourneys = [...riskBasedJourneys, ...recommendedJourneys].slice(0, 4);
    }
    
    // 5. Pattern-based recommendations from business intelligence
    const patternBasedJourneys = getJourneysForPatterns(businessIntelligence.patterns);
    if (patternBasedJourneys.length > 0) {
      recommendedJourneys = [...patternBasedJourneys, ...recommendedJourneys].slice(0, 4);
    }
    
    // Remove duplicates and limit to 6 journeys
    const uniqueJourneys = recommendedJourneys.filter((journey, index, self) => 
      index === self.findIndex(j => j.id === journey.id)
    );
    
    return uniqueJourneys.slice(0, 6);
  };

  // Challenge-based journey mapping
  const getJourneysForChallenges = (challenges: string[]) => {
    const challengeToJourneyMap: Record<string, string> = {
      'low_revenue': 'customer-acquisition',
      'poor_sales_performance': 'sales-optimization',
      'inefficient_processes': 'operational-efficiency',
      'outdated_technology': 'digital-transformation',
      'content_gaps': 'content-marketing',
      'product_issues': 'product-development',
      'customer_churn': 'customer-acquisition',
      'cash_flow_issues': 'operational-efficiency',
      'team_productivity': 'operational-efficiency',
      'market_competition': 'sales-optimization',
      'brand_awareness': 'content-marketing',
      'technology_debt': 'digital-transformation'
    };
    
    const recommendedJourneyIds = challenges
      .map(challenge => challengeToJourneyMap[challenge])
      .filter(Boolean);
    
    return allJourneys.filter(journey => recommendedJourneyIds.includes(journey.id));
  };

  // Opportunity-based journey mapping
  const getJourneysForOpportunities = (opportunities: string[]) => {
    const opportunitiesToJourneys: Record<string, string[]> = {
      'growth': ['customer-acquisition', 'sales-optimization'],
      'efficiency': ['operational-efficiency'],
      'innovation': ['product-development', 'digital-transformation'],
      'market_expansion': ['customer-acquisition', 'content-marketing'],
      'automation': ['digital-transformation', 'operational-efficiency'],
      'brand_building': ['content-marketing'],
      'customer_retention': ['customer-acquisition', 'sales-optimization'],
      'revenue_optimization': ['sales-optimization', 'operational-efficiency']
    };
    
    const recommendedJourneyIds = opportunities
      .flatMap(opportunity => opportunitiesToJourneys[opportunity] || [])
      .filter(Boolean);
    
    return allJourneys.filter(journey => recommendedJourneyIds.includes(journey.id));
  };

  // Risk-based journey mapping
  const getJourneysForRisks = (risks: string[]) => {
    const risksToJourneys: Record<string, string[]> = {
      'customer_churn': ['customer-acquisition', 'sales-optimization'],
      'cash_flow_issues': ['operational-efficiency'],
      'technology_debt': ['digital-transformation'],
      'market_competition': ['sales-optimization', 'content-marketing'],
      'operational_inefficiency': ['operational-efficiency'],
      'revenue_decline': ['customer-acquisition', 'sales-optimization']
    };
    
    const recommendedJourneyIds = risks
      .flatMap(risk => risksToJourneys[risk] || [])
      .filter(Boolean);
    
    return allJourneys.filter(journey => recommendedJourneyIds.includes(journey.id));
  };

  // Pattern-based journey mapping
  const getJourneysForPatterns = (patterns: string[]) => {
    const patternsToJourneys: Record<string, string[]> = {
      'revenue_growth': ['customer-acquisition', 'sales-optimization'],
      'efficiency_improvement': ['operational-efficiency'],
      'technology_adoption': ['digital-transformation'],
      'content_engagement': ['content-marketing'],
      'product_development': ['product-development']
    };
    
    const recommendedJourneyIds = patterns
      .flatMap(pattern => patternsToJourneys[pattern] || [])
      .filter(Boolean);
    
    return allJourneys.filter(journey => recommendedJourneyIds.includes(journey.id));
  };

  // Journey handler - all journeys go through unified journey system
  const handleJourneyStart = (journeyId: string) => {
    navigate(`/journey-intake?journey=${journeyId}`);
  };

  // Business body hooks
  const {
    businessBody,
    loading: businessBodyLoading,
    error: businessBodyError,
    overallHealth: businessOverallHealth,
    healthySystems,
    totalSystems,
    systemHealthPercentage,
    refresh: refreshBusinessBody
  } = useBusinessBody();

  const {
    criticalAlerts,
    hasCriticalAlerts,
    hasHighPriorityItems
  } = useBusinessAlerts();

  // Set header content
  useEffect(() => {
    const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
    setHeaderContent('Your Command Center', `Welcome back, ${displayName}. Here's your business at a glance.`);
    
    return () => setHeaderContent(null, null);
  }, [profile]);

     // Load quantum profile data
   useEffect(() => {
     if (user?.id && (profile || orgs.length > 0)) {
       loadQuantumProfile();
       loadBrainTickets();
       loadPlaybookRecommendations();
       generateBrainPoweredJourneyRecommendations();
     }
   }, [user?.id, profile, orgs, activeOrgId]);

  const loadBrainTickets = async () => {
    try {
      if (!user?.id || !activeOrgId) return;

      const result = await brainTicketsService.getTickets({
        organization_id: activeOrgId,
        user_id: user.id,
        limit: 20
      });

      if (result.success && result.data) {
        // Transform service tickets to dashboard format
        const transformedTickets: BrainTicket[] = result.data.map((ticket: ServiceBrainTicket) => ({
          id: ticket.id,
          title: ticket.title,
          type: mapTicketType(ticket.ticket_type),
          status: mapTicketStatus(ticket.status),
          progress: calculateTicketProgress(ticket),
          lastActivity: formatLastActivity(ticket.updated_at),
          description: ticket.description || '',
          priority: ticket.priority
        }));

        setBrainTickets(transformedTickets);
      } else {
        // If no tickets found, generate some active journeys based on quantum blocks
        generateActiveJourneys();
      }
    } catch (error) {
      console.error('Error loading brain tickets:', error);
      // Fallback to active journeys if service fails
      generateActiveJourneys();
    }
  };

  const mapTicketType = (serviceType: string): BrainTicket['type'] => {
    const typeMap: Record<string, BrainTicket['type']> = {
      'issue': 'identity',
      'problem': 'identity',
      'update': 'operations',
      'new_entry': 'growth',
      'improvement': 'operations',
      'question': 'knowledge'
    };
    return typeMap[serviceType] || 'identity';
  };

  const mapTicketStatus = (serviceStatus: string): BrainTicket['status'] => {
    const statusMap: Record<string, BrainTicket['status']> = {
      'open': 'new',
      'in_progress': 'in_progress',
      'resolved': 'completed',
      'closed': 'completed',
      'cancelled': 'waiting'
    };
    return statusMap[serviceStatus] || 'new';
  };

  const calculateTicketProgress = (ticket: ServiceBrainTicket): number => {
    // Use AI insights or business impact data to calculate progress
    if (ticket.ai_insights?.progress) return ticket.ai_insights.progress;
    if (ticket.business_impact?.completion_percentage) return ticket.business_impact.completion_percentage;
    
    // Default progress based on status
    switch (ticket.status) {
      case 'open': return 0;
      case 'in_progress': return 45;
      case 'resolved': return 100;
      case 'closed': return 100;
      default: return 0;
    }
  };

  const formatLastActivity = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const generateActiveJourneys = () => {
    // Generate active journeys based on quantum blocks and business profile
    const activeJourneys: BrainTicket[] = quantumBlocks.map((block, index) => {
      const hasData = blockStatuses[index]?.strength > 0;
      const isActive = !hasData || blockStatuses[index]?.strength < 70; // Consider active if not complete or below 70%
      
      return {
        id: `journey-${block.id}`,
        title: `${block.name} Journey`,
        type: block.id as BrainTicket['type'],
        status: hasData ? (isActive ? 'in_progress' as const : 'completed' as const) : 'new' as const,
        progress: hasData ? Math.min(blockStatuses[index]?.strength || 0, 100) : 0,
        lastActivity: new Date().toISOString(),
        description: `Complete your ${block.name.toLowerCase()} journey to unlock full business potential`,
        priority: isActive ? 'high' as const : 'medium' as const
      };
    }).filter(journey => journey.status !== 'completed'); // Only show active journeys

    setBrainTickets(activeJourneys);
  };

  const generateMockData = () => {
    // Generate mock brain tickets based on quantum blocks
    const mockTickets: BrainTicket[] = quantumBlocks.map((block, index) => {
      const hasData = blockStatuses[index]?.strength > 0;
      return {
        id: `ticket-${block.id}`,
        title: `${block.name} Setup`,
        type: block.id as any,
        status: hasData ? 'completed' : 'new',
        progress: hasData ? 100 : 0,
        lastActivity: new Date().toISOString(),
        description: `Configure your ${block.name.toLowerCase()} to unlock insights and AI capabilities`,
        priority: hasData ? 'low' : 'high'
      };
    });

    // Add some in-progress tickets
    if (mockTickets.length > 0) {
      mockTickets[0].status = 'in_progress';
      mockTickets[0].progress = 45;
      mockTickets[1].status = 'waiting';
      mockTickets[1].progress = 75;
    }

    setBrainTickets(mockTickets);

    // Generate AI recommendations
    const recommendations: AIRecommendation[] = [
      {
        id: 'rec-1',
        title: 'Complete Identity Setup',
        description: 'Finish your business identity to unlock cash flow insights',
        impact: '+15% Business Health',
        action: 'Continue Setup',
        priority: 'high'
      },
      {
        id: 'rec-2',
        title: 'Link Bank Account',
        description: 'Connect your financial data for automated cash flow tracking',
        impact: '+20% Cash Flow Visibility',
        action: 'Connect Account',
        priority: 'medium'
      },
      {
        id: 'rec-3',
        title: 'Set Revenue Goals',
        description: 'Define your revenue targets to track progress',
        impact: '+10% Goal Achievement',
        action: 'Set Goals',
        priority: 'medium'
      }
    ];

    setAiRecommendations(recommendations);
    setLastLoginDelta(12); // Mock 12% improvement since last login
  };

  const loadQuantumProfile = async () => {
    try {
      setLoading(true);
      let organizationId = profile?.organization_id;
      
      if (!organizationId) {
        const activeOrg = getActiveOrg();
        if (activeOrg) {
          organizationId = activeOrg.id;
        } else if (orgs.length > 0) {
          organizationId = orgs[0].id;
        }
      }
      
      if (!organizationId) {
        setBlockStatuses(quantumBlocks.map(block => ({
          blockId: block.id,
          strength: 0,
          health: 0,
          lastUpdated: new Date().toISOString(),
          insights: [],
          recommendations: []
        })));
        setLoading(false);
        return;
      }

      const response = await quantumBusinessService.getQuantumProfile(organizationId);
      
      if (response.success && response.data) {
        setQuantumProfile(response.data);
        setOverallHealth(response.data.healthScore);
        setMaturityLevel(response.data.maturityLevel);
        
        const statuses = response.data.blocks.map(block => ({
          blockId: block.blockId,
          strength: block.strength,
          health: block.health,
          lastUpdated: response.data?.lastUpdated || new Date().toISOString(),
          insights: [],
          recommendations: []
        }));
        setBlockStatuses(statuses);
      } else {
        setBlockStatuses(quantumBlocks.map(block => ({
          blockId: block.id,
          strength: 0,
          health: 0,
          lastUpdated: new Date().toISOString(),
          insights: [],
          recommendations: []
        })));
      }
    } catch (error) {
      console.error('Error loading quantum profile:', error);
      setBlockStatuses(quantumBlocks.map(block => ({
        blockId: block.id,
        strength: 0,
        health: 0,
        lastUpdated: new Date().toISOString(),
        insights: [],
        recommendations: []
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuantumProfile();
    setRefreshing(false);
  };

   const loadPlaybookRecommendations = async () => {
     try {
       if (!profile || !orgs.length) return;
       
       const userContext = {
         role: profile.role || 'entrepreneur',
         department: 'general',
         experienceLevel: 'intermediate' as const,
         goals: ['growth', 'efficiency', 'scaling'],
         challenges: ['process_optimization', 'resource_management'],
         currentProjects: [],
         recentActivities: [],
         metrics: [],
         integrations: [],
         companySize: 'startup',
         industry: 'technology',
         stage: 'startup' as const
       };

       const recommendations = await recommendPlaybook(userContext, 'focus');
       setPlaybookRecommendations(recommendations.slice(0, 3)); // Show top 3 recommendations
     } catch (error) {
       console.error('Error loading playbook recommendations:', error);
     }
  };

  const getBlockStatus = (blockId: string): QuantumBlockStatus | undefined => {
    return blockStatuses.find(status => status.blockId === blockId);
  };

  const getHealthColor = (health: number): string => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMaturityBadgeVariant = (level: string) => {
    switch (level) {
      case 'mature': return 'default';
      case 'scaling': return 'secondary';
      case 'growing': return 'outline';
      default: return 'destructive';
    }
  };

  const handleBlockSetup = (blockId: string) => {
      navigate('/journey-intake?journey=quantum-building-blocks', { 
        state: { 
          initialBlock: blockId,
          fromDashboard: true 
        } 
      });
  };

  const handleBlockDetails = (blockId: string) => {
    navigate(`/quantum/blocks/${blockId}`, { 
      state: { 
        blockId,
        fromDashboard: true 
      } 
    });
  };

  const handleStartNewJourney = async () => {
    try {
      if (!user?.id || !activeOrgId) return;

      // Navigate to journey intake page
      navigate('/journey-intake', {
        state: {
          fromDashboard: true
        }
      });
    } catch (error) {
      console.error('Error starting new journey:', error);
    }
  };

  const handleAskAI = () => {
    navigate('/chat', { 
      state: { 
        fromDashboard: true 
      } 
    });
  };

  const handleViewReports = () => {
    navigate('/reports', { 
        state: { 
          fromDashboard: true 
        } 
      });
  };

     const handleViewIntegrations = () => {
     navigate('/integrations', { 
       state: { 
         fromDashboard: true 
       } 
     });
   };

   const handleResumeJourney = (ticket: BrainTicket) => {
     navigate(`/journey/${ticket.id}`, { 
       state: { 
         journeyType: ticket.type,
         fromDashboard: true 
       } 
     });
   };

  const getTicketStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-info" />;
      case 'waiting':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Plus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'in_progress':
        return 'bg-info/20 text-info';
      case 'waiting':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

     const getPriorityColor = (priority: string) => {
     switch (priority) {
       case 'high':
         return 'text-destructive';
       case 'medium':
         return 'text-warning';
       default:
         return 'text-success';
     }
   };

   const getTicketDescription = (ticket: BrainTicket) => {
     switch (ticket.type) {
       case 'identity':
         return "Let's lock in your identity so your AI can think like your business.";
       case 'revenue':
         return "Define your revenue streams to track growth and optimize performance.";
       case 'people':
         return "Set up your team structure and roles for better collaboration.";
       case 'operations':
         return "Streamline your processes and workflows for maximum efficiency.";
       case 'infrastructure':
         return "Build the systems and tools that power your business.";
       case 'knowledge':
         return "Organize your knowledge base and learning resources.";
       case 'growth':
         return "Plan your expansion strategy and growth initiatives.";
       default:
         return ticket.description;
     }
   };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
                </div>
              <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
                    </div>
                  </div>
                    </div>
    );
  }

  const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
  const configuredBlocks = blockStatuses.filter(s => s.strength > 0).length;

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* 1. Hero Zone - Business Health Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary-subtle via-muted-subtle to-secondary-subtle rounded-xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground">
              Nexus has updated your Business Health and prepared next steps to grow your business.
            </p>
              </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Business Health Score */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Business Health</span>
              <Heart className="h-4 w-4 text-primary" />
        </div>
                         <div className="flex items-baseline gap-2">
               <span className="text-2xl font-bold text-foreground">
                 {Math.max(35, overallHealth)}%
               </span>
               <span className={`text-sm font-medium ${lastLoginDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                 {lastLoginDelta >= 0 ? '+' : ''}{lastLoginDelta}% this week
               </span>
            </div>
          </div>

                     {/* Stage Indicator */}
           <div className="bg-card rounded-lg p-4 border border-border">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-muted-foreground">Stage</span>
               <Rocket className="h-4 w-4 text-info" />
             </div>
             <div className="space-y-2">
               <div className="flex items-baseline gap-2">
                 <span className="text-lg font-bold text-foreground capitalize">{maturityLevel}</span>
                 <Badge variant={getMaturityBadgeVariant(maturityLevel)} className="text-xs">
                   {maturityLevel === 'startup' ? 'Getting Started' : 
                    maturityLevel === 'growing' ? 'Growing' : 
                    maturityLevel === 'scaling' ? 'Scaling' : 'Mature'}
                 </Badge>
               </div>
               {/* Stage Progression Bar */}
               <div className="space-y-1">
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Startup</span>
                   <span>Growth</span>
                   <span>Scale</span>
                   <span>Enterprise</span>
                 </div>
                 <div className="w-full bg-muted rounded-full h-1.5">
                   <div 
                     className={`h-1.5 rounded-full transition-all duration-500 ${
                       maturityLevel === 'startup' ? 'bg-primary w-1/4' :
                       maturityLevel === 'growing' ? 'bg-primary w-1/2' :
                       maturityLevel === 'scaling' ? 'bg-primary w-3/4' :
                       'bg-primary w-full'
                     }`}
                   />
                 </div>
               </div>
            </div>
          </div>

          {/* Blocks Configured */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Blocks Ready</span>
              <Building2 className="h-4 w-4 text-success" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{configuredBlocks}/7</span>
              <span className="text-sm text-muted-foreground">configured</span>
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">AI Ready</span>
              <Brain className="h-4 w-4 text-purple" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {quantumBlocks.reduce((total, block) => total + (block.aiCapabilities?.length || 0), 0)}
              </span>
              <span className="text-sm text-muted-foreground">capabilities</span>
            </div>
          </div>
        </div>
      </motion.div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* 2. Center Panel - Brain Ticket Feed */}
         <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
                               <h2 className="text-xl font-bold text-foreground">Active Journeys</h2>
                               <p className="text-muted-foreground">Your active business journeys and next steps</p>
            </div>
                             <Button onClick={handleStartNewJourney} size="sm">
               <Plus className="h-4 w-4 mr-2" />
               New Journey
            </Button>
          </div>

           <div className="space-y-4">
             {brainTickets
               .filter(ticket => ticket.status !== 'new') // Only show active tickets
               .map((ticket) => (
                <motion.div
                 key={ticket.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.3 }}
               >
                 <Card className={`hover:shadow-md transition-all cursor-pointer ${
                   ticket.status === 'in_progress' 
                     ? 'ring-2 ring-primary/20 bg-gradient-to-r from-primary/5 to-transparent' 
                     : 'hover:shadow-md'
                 }`}>
                   <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 flex-1">
                         <div className={`p-2 rounded-full ${
                           ticket.status === 'in_progress' ? 'bg-primary/20' : 'bg-muted'
                         }`}>
                           {getTicketStatusIcon(ticket.status)}
                    </div>
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                             <h3 className={`font-semibold ${
                               ticket.status === 'in_progress' ? 'text-foreground' : 'text-foreground'
                             }`}>
                               {ticket.title}
                             </h3>
                             <Badge className={`text-xs ${getTicketStatusColor(ticket.status)}`}>
                               {ticket.status.replace('_', ' ')}
                             </Badge>
                             <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                               {ticket.priority} priority
                        </span>
                           </div>
                           <p className="text-sm text-muted-foreground mb-2">
                             {ticket.status === 'in_progress' 
                               ? `We're ${ticket.progress}% of the way to completing this. ${getTicketDescription(ticket)}`
                               : ticket.description
                             }
                           </p>
                           {ticket.status === 'in_progress' && (
                             <div className="space-y-1">
                               <div className="flex justify-between text-xs text-muted-foreground">
                                 <span>Progress</span>
                                 <span>{ticket.progress}%</span>
                               </div>
                               <Progress value={ticket.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                       </div>
                       <div className="flex items-center gap-2">
                         {ticket.status === 'completed' ? (
                           <Button variant="outline" size="sm">
                             <Eye className="h-4 w-4 mr-1" />
                             View
                           </Button>
                         ) : ticket.status === 'in_progress' ? (
                    <Button
                      size="sm"
                             className="bg-primary hover:bg-primary/90"
                             onClick={() => handleResumeJourney(ticket)}
                           >
                             <Play className="h-4 w-4 mr-1" />
                             Resume
                           </Button>
                         ) : (
                           <Button size="sm">
                             <ArrowRight className="h-4 w-4 mr-1" />
                             Start
                    </Button>
                  )}
          </div>
                     </div>
                   </CardContent>
                 </Card>
               </motion.div>
             ))}

                           {/* Business Playbooks Section */}
              {playbookRecommendations.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Recommended Playbooks</h3>
                      <p className="text-sm text-muted-foreground">Proven business strategies tailored to your needs</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowPlaybooks(!showPlaybooks)}>
                      {showPlaybooks ? 'Collapse' : 'Show All'}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showPlaybooks ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>
                  
                  {showPlaybooks && (
                    <div className="space-y-3">
                      {playbookRecommendations.map((rec) => (
                        <motion.div
                          key={rec.playbook.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="hover:shadow-md transition-all cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                                                      <h4 className="font-medium text-sm text-foreground">{rec.playbook.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {rec.playbook.category}
                                  </Badge>
                                  <Badge className={`text-xs ${
                                    rec.nextAction.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                                    rec.nextAction.priority === 'medium' ? 'bg-warning/20 text-warning' :
                                    'bg-success/20 text-success'
                                  }`}>
                                    {rec.nextAction.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{rec.playbook.description}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Confidence: {Math.round(rec.relevance * 100)}%</span>
                                  <span>{rec.playbook.estimatedTime}min</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-medium text-success mb-1">{rec.nextAction.title}</div>
                                  <Button size="sm" variant="outline" className="text-xs">
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                    Start Playbook
                                  </Button>
                  </div>
        </div>
      </CardContent>
    </Card>
                        </motion.div>
                      ))}
         </div>
                  )}
      </div>
              )}
      </div>
    </div>

        {/* 3. Right Sidebar - AI Assistant & Quick Actions */}
        <div className="space-y-6">
                     {/* AI Assistant Recommendations */}
        <Card>
             <CardHeader className="pb-3">
               <CardTitle className="flex items-center gap-2 text-lg">
                 <motion.div
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 >
                   <Bot className="h-5 w-5 text-purple-600" />
                 </motion.div>
                 AI Assistant
            </CardTitle>
            <CardDescription>
                 Your AI advisor is watching and ready to help
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-success">{rec.impact}</span>
                        <Button size="sm" variant="outline" className="text-xs">
                          {rec.action}
                        </Button>
                  </div>
                </div>
            </div>
                </div>
              ))}
          </CardContent>
        </Card>

          {/* Quick Actions Dock */}
        <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
                Your OS dock for common tasks
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleAskAI}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Nexus AI
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleStartNewJourney}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Journey
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewReports}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewIntegrations}
              >
                <Globe className="h-4 w-4 mr-2" />
                Integrations
              </Button>
          </CardContent>
        </Card>
      </div>
        </div>

      {/* 4. Bottom Section - Available Journeys Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Available Journeys</CardTitle>
          <CardDescription>
            Guided business development journeys to transform your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {journeyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Analyzing your business intelligence to recommend personalized journeys...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableJourneys.map((journey, index) => (
              <motion.div
                key={journey.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className="relative p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md bg-gradient-to-br from-primary-subtle via-muted-subtle to-secondary-subtle border-border hover:border-primary/30"
                onClick={() => handleJourneyStart(journey.id)}
              >
                {/* Journey Icon */}
                <div className="flex items-center justify-center w-12 h-12 mb-3 mx-auto bg-primary-subtle rounded-full border border-primary/20">
                  {journey.icon}
                </div>

                {/* Journey Name */}
                <h4 className="text-sm font-semibold text-center mb-2 text-foreground">{journey.name}</h4>

                {/* Journey Description */}
                <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-2">
                  {journey.description}
                </p>

                {/* Journey Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <span className="text-xs font-medium text-foreground">{journey.duration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Complexity</span>
                    <Badge 
                      variant={journey.complexity === 'beginner' ? 'default' : 
                              journey.complexity === 'intermediate' ? 'secondary' : 'outline'} 
                      className="text-xs"
                    >
                      {journey.complexity}
                    </Badge>
                  </div>
                </div>
                
                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs border-primary/20 hover:bg-primary-subtle hover:border-primary/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJourneyStart(journey.id);
                  }}
                >
                  <ChevronRight className="h-3 w-3 mr-1" />
                  Start Journey
                                 </Button>
               </motion.div>
             ))}
           </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default QuantumHomeDashboard;
