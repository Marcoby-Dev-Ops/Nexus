import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Brain, ArrowRight, Target, TrendingUp, Users, Clock, CheckCircle, Star, Rocket, BookOpen, Play, FileText, Calendar, BarChart3, DollarSign, Sparkles, MessageSquare, Link, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { motion } from 'framer-motion';
import { playbookService } from '@/services/PlaybookService';
import type { PlaybookRecommendation, BusinessContext } from '@/services/PlaybookService';
import { Progress } from '@/shared/components/ui/Progress';
import { BusinessAdvisorRAG } from '@/lib/ai/businessAdvisorRAG';
import { InsightFeedbackWidget } from '@/shared/components/insights/InsightFeedbackWidget';
import { useAuth } from '@/hooks';
import { useUserContext } from '@/shared/contexts/UserContext';

interface FIREConceptsIntroductionStepProps {
  data: any;
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
}

interface FIREInitiative {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  timeframe: string;
  estimatedCost: string;
  estimatedValue: string;
  fireScore: number;
  executionPlaybook: any;
  contextualFactors: {
    relevance: string;
    readiness: string;
    impact: string;
    contextualFit?: any;
  };
}

const FIREConceptsIntroductionStep: React.FC<FIREConceptsIntroductionStepProps> = ({
  data,
  onNext,
  onBack
}) => {
  const { user } = useAuth();
  const { profile } = useUserContext();
  const [discoveredInitiatives, setDiscoveredInitiatives] = useState<FIREInitiative[]>([]);
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'intro' | 'initiatives'>('intro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showFeedbackFor, setShowFeedbackFor] = useState<string | null>(null);
  const [acceptedInitiatives, setAcceptedInitiatives] = useState<Map<string, { status: 'accepted' | 'pending' | 'completed'; playbook: any; implementationDetails: string }>>(new Map());

  // Extract real context from previous phase with proper typing
  const userProfile = (data.userProfile as any) || {};
  const companyProfile = (data.companyProfile as any) || {};
  const foundationalKnowledge = (data.foundationalKnowledge as any) || {};
  
  // Use real data with fallbacks - memoized to prevent infinite re-renders
  const businessContext = useMemo(() => ({
    firstName: userProfile.firstName || 'Business Leader',
    companyName: companyProfile.name || 'Your Company',
    industry: data.industry || companyProfile.industry || 'Technology',
    companySize: data.companySize || companyProfile.size || 'Small to Medium',
    role: userProfile.role || 'Founder/CEO',
    experience: userProfile.experience || 'Intermediate',
    priorities: data.keyPriorities || data.priorities || companyProfile.priorities || ['Increase revenue'],
    challenges: data.businessChallenges || data.challenges || companyProfile.challenges || ['Time management'],
    tools: data.tools || companyProfile.tools || ['CRM', 'Email'],
    businessModel: foundationalKnowledge.businessModel || 'B2B',
    growthStage: foundationalKnowledge.growthStage || 'Growing',
    targetMarket: foundationalKnowledge.targetMarket || 'Small Businesses'
  }), [userProfile, companyProfile, foundationalKnowledge, data.industry, data.companySize, data.keyPriorities, data.priorities, data.businessChallenges, data.challenges, data.tools]);

  // Convert to BusinessContext format for playbook service
  const playbookContext: BusinessContext = useMemo(() => ({
    userProfile: {
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      role: businessContext.role?.toLowerCase() || '',
      experience: userProfile?.experience || 'intermediate',
      skills: [],
      userId: user?.id || ''
    },
    companyProfile: {
      name: companyProfile?.name || '',
      industry: businessContext.industry?.toLowerCase() || '',
      size: businessContext.companySize || '',
      stage: businessContext.growthStage?.toLowerCase() || '',
      location: '',
      companyId: profile?.company_id || ''
    },
    foundationalKnowledge: {
      priorities: businessContext.priorities || [],
      challenges: businessContext.challenges || [],
      goals: [],
      tools: businessContext.tools || []
    },
    currentCapabilities: {
      existingTools: businessContext.tools || [],
      teamSize: 1,
      budget: 'moderate',
      technicalExpertise: 'intermediate'
    },
    marcobyServices: []
  }), [businessContext, userProfile, companyProfile, user, profile]);

  // FIRE's Unique AI-Powered Initiative Generation using Playbook Database
  const generatePersonalizedInitiatives = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      setGenerationProgress(25);
      console.log('🔍 Debug: Business Context for Playbook Matching:', playbookContext);
      
      setGenerationProgress(50);
      const recommendations = await playbookService.getIntelligentRecommendations(playbookContext);
      console.log('🔍 Debug: Raw Playbook Recommendations:', recommendations);

      setGenerationProgress(75);
      const initiatives = recommendations.map(rec => ({
        id: rec.playbook.id,
        title: rec.playbook.title,
        description: rec.playbook.description,
        category: rec.playbook.category,
        difficulty: rec.playbook.difficulty,
        timeframe: rec.playbook.timeframe,
        estimatedCost: rec.playbook.estimatedCost,
        estimatedValue: rec.estimatedImpact,
        fireScore: Math.round(rec.confidenceScore || 85),
        executionPlaybook: rec.playbook.executionPlan,
        contextualFactors: {
          relevance: rec.reasoning,
          readiness: `${rec.playbook.difficulty} difficulty, ${rec.playbook.timeframe} timeframe`,
          impact: rec.estimatedImpact,
          contextualFit: rec.contextualFit
        }
      }));

      console.log('🔍 Debug: Converted Initiatives:', initiatives);

      setGenerationProgress(100);
      
      if (initiatives.length === 0) {
        console.log('⚠️ No initiatives found, using fallback initiatives');
        setDiscoveredInitiatives(generateFallbackInitiatives());
      } else {
        setDiscoveredInitiatives(initiatives);
        
        const cacheData = {
          initiatives: initiatives,
          timestamp: Date.now(),
          context: {
            industry: businessContext.industry,
            companySize: businessContext.companySize,
            priorities: businessContext.priorities,
            challenges: businessContext.challenges
          }
        };
        
        localStorage.setItem(`fire-initiatives-${user?.id || 'onboarding'}`, JSON.stringify(cacheData));
        console.log('📋 Cached FIRE initiatives for future use');
      }
    } catch (error) {
      console.error('Error generating initiatives:', error);
      setDiscoveredInitiatives(generateFallbackInitiatives());
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const generateFallbackInitiatives = (): FIREInitiative[] => {
    return [
      {
        id: 'fallback-1',
        title: 'Optimize Customer Onboarding Process',
        description: 'Streamline your customer onboarding to improve conversion rates and reduce churn',
        category: 'operations',
        difficulty: 'intermediate',
        timeframe: '2-3 weeks',
        estimatedCost: '$500-1500',
        estimatedValue: 'High impact on customer satisfaction',
        fireScore: 85,
        executionPlaybook: {
          overview: 'Create a streamlined customer onboarding process',
          steps: [
            {
              step: 1,
              title: 'Map Current Process',
              description: 'Document your existing onboarding workflow',
              duration: '2-3 days',
              resources: ['Process mapping tools', 'Team input'],
              successCriteria: ['Process documented', 'Bottlenecks identified'],
              tips: ['Include all touchpoints', 'Note pain points'],
              agentExecutable: false,
              validationMethod: 'manual'
            }
          ],
          toolsRequired: [],
          teamRoles: [],
          riskAssessment: [],
          timeline: []
        },
        contextualFactors: {
          relevance: 'Addresses customer experience and operational efficiency',
          readiness: 'Intermediate difficulty, 2-3 weeks timeframe',
          impact: 'High impact on customer satisfaction and retention',
          contextualFit: 'Fits most business types and sizes'
        }
      }
    ];
  };

  // Load personalized initiatives on component mount
  useEffect(() => {
    if (discoveredInitiatives.length === 0) {
      const cachedInitiatives = localStorage.getItem(`fire-initiatives-${user?.id || 'onboarding'}`);
      
      if (cachedInitiatives) {
        try {
          const parsed = JSON.parse(cachedInitiatives);
          const cacheAge = Date.now() - parsed.timestamp;
          if (cacheAge < 24 * 60 * 60 * 1000) {
            console.log('📋 Using cached FIRE initiatives');
            setDiscoveredInitiatives(parsed.initiatives);
            return;
          }
        } catch (error) {
          console.log('📋 Cache invalid, regenerating initiatives');
        }
      }
      
      generatePersonalizedInitiatives();
    }
  }, [playbookContext, user?.id]);

  const handleInitiativeToggle = (initiativeId: string) => {
    const isCurrentlySelected = selectedInitiatives.includes(initiativeId);
    
    setSelectedInitiatives(prev => 
      prev.includes(initiativeId) 
        ? prev.filter(id => id !== initiativeId)
        : [...prev, initiativeId]
    );
    
    if (!isCurrentlySelected) {
      const initiative = discoveredInitiatives.find(i => i.id === initiativeId);
      if (initiative) {
        console.log('📋 Added to Nexus Plan:', initiative.title);
        alert(`"${initiative.title}" has been added to your Nexus Plan. You'll receive a complete implementation playbook to guide you through the process.`);
      }
    }
  };

  const handleAlreadyHaveThis = async (initiative: FIREInitiative) => {
    console.log('🔗 User already has:', initiative.title);
    const implementationDetails = prompt('How do you have this implemented?') || '';
    
    if (implementationDetails && implementationDetails.trim()) {
      alert(`Monitoring playbook created! Nexus will now help you monitor and optimize "${initiative.title}" through your ${implementationDetails} integration.`);
    }
  };

  const handleNotInterested = (initiative: FIREInitiative) => {
    console.log('❌ User not interested in:', initiative.title);
    alert(`Got it! We won't suggest "${initiative.title}" again.`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/20 text-success border-success/30';
      case 'intermediate': return 'bg-warning/20 text-warning border-warning/30';
      case 'advanced': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup': return <BookOpen className="w-4 h-4" />;
      case 'marketing': return <TrendingUp className="w-4 h-4" />;
      case 'sales': return <Target className="w-4 h-4" />;
      case 'finance': return <DollarSign className="w-4 h-4" />;
      case 'operations': return <Users className="w-4 h-4" />;
      case 'technology': return <Brain className="w-4 h-4" />;
      default: return <Rocket className="w-4 h-4" />;
    }
  };

  if (currentView === 'intro') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-primary p-3 rounded-full">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-primary">
              FIRE Transformation Opportunities
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover AI-powered initiatives that deliver <span className="font-semibold text-primary">immediate, measurable results</span> 
            with <span className="font-semibold text-secondary">AI-powered intelligence and automation</span>
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-subtle rounded-xl p-6 border border-primary/20"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            Your Business Intelligence Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Company:</span> {businessContext.companyName}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Industry:</span> {businessContext.industry}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Size:</span> {businessContext.companySize}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Role:</span> {businessContext.role}</p>
            </div>
            <div>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Priorities:</span> {businessContext.priorities.join(', ')}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Challenges:</span> {businessContext.challenges.join(', ')}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Growth Stage:</span> {businessContext.growthStage}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button 
            onClick={() => {
              localStorage.removeItem(`fire-initiatives-${user?.id || 'onboarding'}`);
              setCurrentView('initiatives');
            }}
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                <span>Generating Your FIRE Initiatives...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Generate Your FIRE Initiatives</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
          
          {isGenerating && (
            <div className="mt-4 max-w-md mx-auto">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                {generationProgress < 25 && "Analyzing your business context..."}
                {generationProgress >= 25 && generationProgress < 50 && "Finding matching playbooks..."}
                {generationProgress >= 50 && generationProgress < 75 && "Scoring and ranking initiatives..."}
                {generationProgress >= 75 && "Finalizing execution playbooks..."}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="bg-primary p-3 rounded-full">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary">
            AI-Generated FIRE Initiatives
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Personalized business transformation opportunities with complete execution playbooks
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {discoveredInitiatives.map((initiative, index) => (
          <motion.div
            key={initiative.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`h-full border-2 transition-all duration-300 hover:shadow-lg ${
              selectedInitiatives.includes(initiative.id) 
                ? 'border-primary bg-primary-subtle' 
                : 'border-border hover:border-primary/30'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(initiative.category)}
                    <Badge variant="outline" className="text-xs font-medium">
                      {initiative.category}
                    </Badge>
                    <Badge className={`text-xs font-medium border ${getDifficultyColor(initiative.difficulty)}`}>
                      {initiative.difficulty}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-base leading-tight">{initiative.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {initiative.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground font-medium">TIMEFRAME</p>
                    <p className="text-sm font-semibold text-foreground">{initiative.timeframe}</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground font-medium">COST</p>
                    <p className="text-sm font-semibold text-foreground">{initiative.estimatedCost}</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-4 h-4 text-warning mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground font-medium">FIRE SCORE</p>
                    <p className="text-sm font-semibold text-foreground">{initiative.fireScore}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Business Fit</h4>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 text-xs text-primary/70">
                      <Play className="w-3 h-3" />
                      {initiative.executionPlaybook.steps.length} steps
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {initiative.contextualFactors.relevance}
                  </p>
                </div>

                <div className="bg-primary-subtle rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-semibold text-success">Expected Value</span>
                    </div>
                    <span className="text-lg font-bold text-success">{initiative.estimatedValue}</span>
                  </div>
                  <p className="text-xs text-primary/80 leading-relaxed">
                    {initiative.executionPlaybook.overview}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <div className="space-y-3">
                    {selectedInitiatives.includes(initiative.id) && (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium text-success">Added to Nexus Plan</span>
                      </div>
                    )}
                    
                    {!selectedInitiatives.includes(initiative.id) && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="default"
                          onClick={() => handleInitiativeToggle(initiative.id)}
                          className="flex items-center gap-2 h-auto py-3 px-4"
                        >
                          <Play className="w-4 h-4" />
                          <div className="text-left">
                            <div className="font-medium">Add to My Nexus Plan</div>
                            <div className="text-xs opacity-80">Get playbook for implementation</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleAlreadyHaveThis(initiative)}
                          className="flex items-center gap-2 h-auto py-3 px-4"
                        >
                          <Link className="w-4 h-4" />
                          <div className="text-left">
                            <div className="font-medium">I Already Have This</div>
                            <div className="text-xs opacity-80">Monitor this in Nexus</div>
                          </div>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center pt-6"
      >
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            onClick={() => {
              localStorage.removeItem(`fire-initiatives-${user?.id || 'onboarding'}`);
              setDiscoveredInitiatives([]);
              generatePersonalizedInitiatives();
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {selectedInitiatives.length} initiatives selected
          </span>
          <Button 
            onClick={() => onNext({
              selectedInitiatives,
              discoveredInitiatives: discoveredInitiatives.filter(initiative => 
                selectedInitiatives.includes(initiative.id)
              ),
              fireInitiativesData: {
                selected: selectedInitiatives,
                discovered: discoveredInitiatives,
                businessContext
              }
            })}
            disabled={selectedInitiatives.length === 0}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            Continue with Selected Initiatives
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default FIREConceptsIntroductionStep;
