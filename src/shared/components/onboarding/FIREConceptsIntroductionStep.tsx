import React, { useState, useEffect } from 'react';
import { Zap, Brain, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';

interface FIREConceptsIntroductionStepProps {
  onNext: (data: Record<string, unknown>) => void;
  onSkip: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
  currentStep: number;
  totalSteps: number;
}

export const FIREConceptsIntroductionStep: React.FC<FIREConceptsIntroductionStepProps> = ({ 
  onNext, 
  onSkip, 
  data 
}) => {
  const [discoveredOpportunities, setDiscoveredOpportunities] = useState<any[]>([]);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  // Generate personalized opportunities based on business context
  const generatePersonalizedOpportunities = (context: any) => {
    // Use Phase 1 data for personalization
    const industry = context.industry || 'Technology';
    const companySize = context.companySize || 'Small to Medium';
    const tools = context.tools || ['Slack', 'Notion', 'QuickBooks'];
    const priorities = context.priorities || ['Increase revenue', 'Improve efficiency'];
    const challenges = context.challenges || ['Time management', 'Manual processes'];
    
    const opportunities = [];

    // Base opportunities for all businesses
    opportunities.push({
      id: 'opp-1',
      title: 'Implement Data-Driven Decision Framework',
      description: 'Establish KPIs and analytics dashboards for informed business decisions',
      impact: 'Critical',
      timeframe: '4-6 weeks',
      category: 'Intelligence',
      confidence: 90,
      estimatedValue: '$25,000/year in improved decisions',
      fireScore: 88,
      reasoning: 'Essential for any business to make informed decisions'
    });

    // Industry-specific opportunities
    if (industry.toLowerCase().includes('ecommerce') || industry.toLowerCase().includes('retail')) {
      opportunities.push({
        id: 'opp-2',
        title: 'Optimize Conversion Funnel',
        description: 'Improve checkout process and reduce cart abandonment rates',
        impact: 'High',
        timeframe: '3-4 weeks',
        category: 'Revenue',
        confidence: 87,
        estimatedValue: '$20,000/year in additional sales',
        fireScore: 91,
        reasoning: 'Based on your ecommerce focus'
      });
    }

    if (industry.toLowerCase().includes('technology') || industry.toLowerCase().includes('saas')) {
      opportunities.push({
        id: 'opp-3',
        title: 'Automate Customer Onboarding Process',
        description: 'Streamline new customer setup with automated workflows and self-service portals',
        impact: 'High',
        timeframe: '2-4 weeks',
        category: 'Efficiency',
        confidence: 85,
        estimatedValue: '$15,000/year in time savings',
        fireScore: 92,
        reasoning: 'Technology companies benefit from streamlined onboarding'
      });
    }

    // Company size specific opportunities
    if (companySize.toLowerCase().includes('small') || companySize.toLowerCase().includes('startup')) {
      opportunities.push({
        id: 'opp-4',
        title: 'Establish Core Business Processes',
        description: 'Document and standardize key workflows for scalability',
        impact: 'High',
        timeframe: '3-5 weeks',
        category: 'Operations',
        confidence: 82,
        estimatedValue: '$12,000/year in efficiency gains',
        fireScore: 86,
        reasoning: 'Small companies need solid foundations to scale'
      });
    }

    if (companySize.toLowerCase().includes('medium') || companySize.toLowerCase().includes('growing')) {
      opportunities.push({
        id: 'opp-5',
        title: 'Enhance Team Collaboration Tools',
        description: 'Implement modern communication and project management systems',
        impact: 'Medium',
        timeframe: '2-3 weeks',
        category: 'Productivity',
        confidence: 82,
        estimatedValue: '$10,000/year in productivity gains',
        fireScore: 79,
        reasoning: 'Growing teams need better collaboration tools'
      });
    }

    // Tool-specific opportunities
    if (tools.some((tool: string) => tool.toLowerCase().includes('slack'))) {
      opportunities.push({
        id: 'opp-6',
        title: 'Optimize Slack Workflows',
        description: 'Create automated workflows and integrations to reduce manual tasks',
        impact: 'Medium',
        timeframe: '1-2 weeks',
        category: 'Productivity',
        confidence: 88,
        estimatedValue: '$8,000/year in time savings',
        fireScore: 84,
        reasoning: 'You\'re already using Slack - let\'s make it more powerful'
      });
    }

    if (tools.some((tool: string) => tool.toLowerCase().includes('notion'))) {
      opportunities.push({
        id: 'opp-7',
        title: 'Centralize Knowledge Management',
        description: 'Organize company knowledge and create accessible documentation systems',
        impact: 'Medium',
        timeframe: '2-3 weeks',
        category: 'Knowledge',
        confidence: 85,
        estimatedValue: '$6,000/year in reduced onboarding time',
        fireScore: 81,
        reasoning: 'Notion is great for knowledge management - let\'s optimize it'
      });
    }

    // Priority-specific opportunities
    if (priorities.some((priority: string) => priority.toLowerCase().includes('revenue') || priority.toLowerCase().includes('growth'))) {
      opportunities.push({
        id: 'opp-8',
        title: 'Optimize Revenue Streams',
        description: 'Analyze and enhance pricing strategies and revenue models',
        impact: 'High',
        timeframe: '3-5 weeks',
        category: 'Revenue',
        confidence: 78,
        estimatedValue: '$30,000/year in revenue growth',
        fireScore: 85,
        reasoning: 'Based on your revenue growth priority'
      });
    }

    if (priorities.some((priority: string) => priority.toLowerCase().includes('efficiency') || priority.toLowerCase().includes('productivity'))) {
      opportunities.push({
        id: 'opp-9',
        title: 'Streamline Core Operations',
        description: 'Identify and eliminate bottlenecks in key business processes',
        impact: 'High',
        timeframe: '4-6 weeks',
        category: 'Operations',
        confidence: 80,
        estimatedValue: '$18,000/year in operational savings',
        fireScore: 87,
        reasoning: 'Based on your efficiency focus'
      });
    }

    // Challenge-specific opportunities
    if (challenges.some((challenge: string) => challenge.toLowerCase().includes('time') || challenge.toLowerCase().includes('manual'))) {
      opportunities.push({
        id: 'opp-10',
        title: 'Automate Repetitive Tasks',
        description: 'Identify and automate time-consuming manual processes',
        impact: 'High',
        timeframe: '2-4 weeks',
        category: 'Automation',
        confidence: 83,
        estimatedValue: '$20,000/year in time savings',
        fireScore: 89,
        reasoning: 'Addressing your time management challenges'
      });
    }

    // Ensure we have at least 4 opportunities
    while (opportunities.length < 4) {
      opportunities.push({
        id: `opp-fallback-${opportunities.length + 1}`,
        title: 'Establish Key Performance Indicators',
        description: 'Define and track the most important metrics for your business success',
        impact: 'Medium',
        timeframe: '2-3 weeks',
        category: 'Analytics',
        confidence: 75,
        estimatedValue: '$5,000/year in better decision making',
        fireScore: 76,
        reasoning: 'Essential for business growth and optimization'
      });
    }

    return opportunities.slice(0, 6); // Return top 6 opportunities
  };

  const handleOpportunityToggle = (opportunityId: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(opportunityId)
        ? prev.filter(id => id !== opportunityId)
        : [...prev, opportunityId]
    );
  };

  const handleNext = () => {
    const selectedOpportunitiesData = discoveredOpportunities.filter(opp => 
      selectedOpportunities.includes(opp.id)
    );

    onNext({
      ...data,
      discoveredOpportunities: selectedOpportunitiesData,
      selectedOpportunities,
      fireConceptsData: {
        totalDiscovered: discoveredOpportunities.length,
        selected: selectedOpportunitiesData,
        selectedCount: selectedOpportunities.length,
        // Additional metadata for home page
        categories: [...new Set(selectedOpportunitiesData.map(opp => opp.category))],
        totalEstimatedValue: selectedOpportunitiesData.reduce((sum, opp) => {
          const value = opp.estimatedValue?.match(/\$([\d,]+)/)?.[1]?.replace(/,/g, '') || '0';
          return sum + parseInt(value);
        }, 0),
        averageFireScore: selectedOpportunitiesData.reduce((sum, opp) => sum + opp.fireScore, 0) / selectedOpportunitiesData.length,
        impactBreakdown: selectedOpportunitiesData.reduce((acc, opp) => {
          acc[opp.impact] = (acc[opp.impact] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      // Business context for personalization
      businessContext: {
        industry: data.industry,
        companySize: data.companySize,
        tools: data.tools,
        priorities: data.priorities,
        challenges: data.challenges
      }
    });
  };

  // Load personalized opportunities when component mounts
  useEffect(() => {
    const personalizedOpportunities = generatePersonalizedOpportunities(data);
    setDiscoveredOpportunities(personalizedOpportunities);
  }, [data]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* FIRE Philosophy Introduction */}
      <div className="text-center mb-12">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-6">
          <Zap className="h-10 w-10 text-orange-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Welcome to FIRE
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Your business transformation philosophy: <strong>Fast, Impactful, Relevant, Executable</strong>
        </p>
        
        <p className="text-lg text-primary mb-8 max-w-3xl mx-auto">
          Based on your AI foundation, we've identified personalized opportunities that match your unique business context.
        </p>
                 {/* FIRE Philosophy Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
           <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
             <div className="text-primary font-semibold mb-2">🚀 Fast</div>
             <p className="text-sm text-foreground">Quick wins and rapid implementation cycles</p>
           </div>
           <div className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
             <div className="text-secondary font-semibold mb-2">💥 Impactful</div>
             <p className="text-sm text-foreground">Measurable business value and outcomes</p>
           </div>
           <div className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border border-accent/20">
             <div className="text-accent font-semibold mb-2">🎯 Relevant</div>
             <p className="text-sm text-foreground">Aligned with your specific business context</p>
           </div>
           <div className="p-4 bg-gradient-to-br from-muted/5 to-muted/10 rounded-lg border border-muted/20">
             <div className="text-muted-foreground font-semibold mb-2">⚡ Executable</div>
             <p className="text-sm text-foreground">Actionable with clear implementation paths</p>
           </div>
         </div>
      </div>

      {/* Thought Management Introduction */}
      <div className="mb-12">
                 <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-foreground mb-4">
             Your Building Blocks Are Ready
           </h2>
                       <p className="text-muted-foreground max-w-2xl mx-auto">
              Nexus has identified personalized opportunities that follow the FIRE philosophy. 
              These are your building blocks for business transformation.
            </p>
            
            {/* Show Business Context */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg max-w-2xl mx-auto">
              <h3 className="text-sm font-medium text-foreground mb-2">Based on your AI foundation:</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs">
                  Industry: {data.industry || 'Technology'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Size: {data.companySize || 'Small to Medium'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Tools: {Array.isArray(data.tools) ? data.tools.slice(0, 3).join(', ') : 'Slack, Notion, QuickBooks'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Priority: {Array.isArray(data.priorities) ? data.priorities[0] : 'Increase revenue'}
                </Badge>
              </div>
            </div>
         </div>

        {/* Discovered Opportunities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Discovered Opportunities
              <Badge variant="secondary" className="ml-2">
                {discoveredOpportunities.length} Found
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select the opportunities that resonate with your current priorities
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedOpportunities.includes(opportunity.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleOpportunityToggle(opportunity.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-2">{opportunity.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedOpportunities.includes(opportunity.id)}
                      onChange={() => handleOpportunityToggle(opportunity.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  
                                     <div className="flex flex-wrap gap-2 mb-3">
                     <span className={`px-2 py-1 text-xs rounded-full ${
                       opportunity.impact === 'Critical' ? 'bg-destructive/10 text-destructive' :
                       opportunity.impact === 'High' ? 'bg-primary/10 text-primary' :
                       'bg-secondary/10 text-secondary'
                     }`}>
                       {opportunity.impact} Impact
                     </span>
                     <span className="px-2 py-1 text-xs bg-accent/10 text-accent rounded-full">
                       {opportunity.category}
                     </span>
                     <span className="px-2 py-1 text-xs bg-muted/10 text-muted-foreground rounded-full">
                       {opportunity.timeframe}
                     </span>
                   </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span><strong>FIRE Score:</strong> {opportunity.fireScore}/100</span>
                    <span><strong>Confidence:</strong> {opportunity.confidence}%</span>
                  </div>
                  
                                     {opportunity.estimatedValue && (
                     <div className="mt-2 text-xs text-primary font-medium">
                       💰 {opportunity.estimatedValue}
                     </div>
                   )}
                   
                   {opportunity.reasoning && (
                     <div className="mt-2 text-xs text-muted-foreground italic">
                       💡 {opportunity.reasoning}
                     </div>
                   )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Thought Management Explanation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              How Thought Management Works
            </CardTitle>
          </CardHeader>
          <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="text-center">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Brain className="w-6 h-6 text-primary" />
                 </div>
                 <h4 className="font-medium mb-2">1. Discover</h4>
                 <p className="text-sm text-muted-foreground">
                   AI analyzes your business context to identify opportunities
                 </p>
               </div>
               <div className="text-center">
                 <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Brain className="w-6 h-6 text-secondary" />
                 </div>
                 <h4 className="font-medium mb-2">2. Prioritize</h4>
                 <p className="text-sm text-muted-foreground">
                   Select and rank opportunities based on your priorities
                 </p>
               </div>
               <div className="text-center">
                 <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Zap className="w-6 h-6 text-accent" />
                 </div>
                 <h4 className="font-medium mb-2">3. Execute</h4>
                 <p className="text-sm text-muted-foreground">
                   Transform opportunities into actionable initiatives
                 </p>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => onSkip()}>
          Skip for Now
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedOpportunities.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Continue with {selectedOpportunities.length} Opportunities
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
