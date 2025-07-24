/**
 * ExpertKnowledgePreview.tsx
 * Showcases 20+ years of business expertise
 * Demonstrates progressive intelligence based on user context
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  BarChart3,
  Users,
  DollarSign,
  Zap,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Globe
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';

interface ExpertKnowledgePreviewProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
  };
  onKnowledgeApplied?: (knowledge: ExpertKnowledge) => void;
}

interface ExpertKnowledge {
  id: string;
  domain: string;
  principle: string;
  description: string;
  application: string;
  confidence: number;
  relevance: number;
  source: string;
  timestamp: Date;
}

interface KnowledgeDomain {
  name: string;
  icon: React.ReactNode;
  description: string;
  expertise: number;
  principles: string[];
  applications: string[];
}

export const ExpertKnowledgePreview: React.FC<ExpertKnowledgePreviewProps> = ({ 
  userProfile: userProfile, 
  systemIntelligence = {
    understandingLevel: 0,
    personalizedInsights: 0,
    contextAccuracy: 0
  },
  onKnowledgeApplied 
}) => {
  const [activeDomains, setActiveDomains] = useState<string[]>([]);
  const [appliedKnowledge, setAppliedKnowledge] = useState<ExpertKnowledge[]>([]);
  const [currentPrinciple, setCurrentPrinciple] = useState<string>('');
  const [knowledgeProgress, setKnowledgeProgress] = useState(0);

  const knowledgeDomains: KnowledgeDomain[] = [
    {
      name: 'Sales & Revenue',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Revenue optimization and customer acquisition strategies',
      expertise: 95,
      principles: [
        'Value-based pricing optimization',
        'Customer lifetime value maximization',
        'Sales funnel optimization',
        'Competitive positioning strategies'
      ],
      applications: [
        'Dynamic pricing implementation',
        'Customer segmentation analysis',
        'Sales process automation',
        'Revenue forecasting models'
      ]
    },
    {
      name: 'Financial Management',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Cash flow, budgeting, and financial planning expertise',
      expertise: 92,
      principles: [
        'Cash flow optimization',
        'Cost structure analysis',
        'Financial risk management',
        'Investment decision frameworks'
      ],
      applications: [
        'Cash flow forecasting',
        'Budget optimization',
        'Financial modeling',
        'Risk assessment tools'
      ]
    },
    {
      name: 'Operations & Efficiency',
      icon: <Zap className="w-5 h-5" />,
      description: 'Process optimization and operational excellence',
      expertise: 88,
      principles: [
        'Lean process optimization',
        'Automation opportunity identification',
        'Quality management systems',
        'Supply chain optimization'
      ],
      applications: [
        'Process mapping and optimization',
        'Automation implementation',
        'Quality control systems',
        'Performance metrics tracking'
      ]
    },
    {
      name: 'Marketing & Growth',
      icon: <Target className="w-5 h-5" />,
      description: 'Brand building and customer engagement strategies',
      expertise: 90,
      principles: [
        'Customer journey optimization',
        'Brand positioning strategies',
        'Growth hacking techniques',
        'Market penetration tactics'
      ],
      applications: [
        'Marketing campaign optimization',
        'Customer acquisition strategies',
        'Brand development',
        'Market expansion planning'
      ]
    },
    {
      name: 'Leadership & Strategy',
      icon: <Users className="w-5 h-5" />,
      description: 'Strategic planning and organizational leadership',
      expertise: 85,
      principles: [
        'Strategic planning frameworks',
        'Change management strategies',
        'Team development methodologies',
        'Organizational culture building'
      ],
      applications: [
        'Strategic planning sessions',
        'Change management initiatives',
        'Team building programs',
        'Culture development projects'
      ]
    },
    {
      name: 'Market Intelligence',
      icon: <Globe className="w-5 h-5" />,
      description: 'Market analysis and competitive intelligence',
      expertise: 87,
      principles: [
        'Market trend analysis',
        'Competitive landscape mapping',
        'Customer behavior analysis',
        'Industry benchmarking'
      ],
      applications: [
        'Market research reports',
        'Competitive analysis',
        'Customer insights generation',
        'Industry trend monitoring'
      ]
    }
  ];

  // Simulate progressive knowledge application based on system intelligence
  useEffect(() => {
    if (systemIntelligence?.understandingLevel > 20) {
      startKnowledgeApplication();
    }
  }, [systemIntelligence?.understandingLevel]);

  const startKnowledgeApplication = () => {
    setKnowledgeProgress(0);
    
    const principles = knowledgeDomains.flatMap(domain => 
      domain.principles.map(principle => ({
        domain: domain.name,
        principle,
        application: domain.applications[Math.floor(Math.random() * domain.applications.length)]
      }))
    );

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < Math.min(principles.length, 5)) {
        const principle = principles[currentIndex];
        setCurrentPrinciple(principle.principle);
        
        const newKnowledge: ExpertKnowledge = {
          id: `knowledge-${currentIndex}`,
          domain: principle.domain,
          principle: principle.principle,
          description: `Expert principle from ${principle.domain} domain`,
          application: principle.application,
          confidence: 85 + Math.random() * 15,
                        relevance: Math.min(100, (systemIntelligence?.understandingLevel || 0) + Math.random() * 20),
          source: '20+ Years Business Expertise',
          timestamp: new Date()
        };

        setAppliedKnowledge(prev => [...prev, newKnowledge]);
        setActiveDomains(prev => [...new Set([...prev, principle.domain])]);
        
        onKnowledgeApplied?.(newKnowledge);
        
        setKnowledgeProgress((currentIndex + 1) * 20);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  };

  const getDomainIcon = (domainName: string) => {
    const domain = knowledgeDomains.find(d => d.name === domainName);
    return domain?.icon || <Brain className="w-5 h-5" />;
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 80) return 'text-green-500 bg-green-50';
    if (relevance >= 60) return 'text-yellow-500 bg-yellow-50';
    return 'text-blue-500 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <BookOpen className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold">20+ Years of Business Expertise</h3>
        <p className="text-muted-foreground">
          Access proven business principles and strategies from industry experts
        </p>
      </div>

      {/* Knowledge Domains */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeDomains.map((domain) => (
          <Card 
            key={domain.name}
            className={`cursor-pointer transition-all duration-300 ${
              activeDomains.includes(domain.name) 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover: shadow-md'
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                {domain.icon}
                <span>{domain.name}</span>
                {activeDomains.includes(domain.name) && (
                  <Badge variant="secondary" className="ml-auto">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {domain.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Expertise Level</span>
                  <span className="font-medium">{domain.expertise}%</span>
                </div>
                <Progress value={domain.expertise} className="h-2" />
              </div>

              {activeDomains.includes(domain.name) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="text-xs font-medium text-primary">
                    Applied Principles:
                  </div>
                  <div className="space-y-1">
                    {domain.principles.slice(0, 2).map((principle, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{principle}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Knowledge Application */}
      {currentPrinciple && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span>Applying Expert Knowledge</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Principle</span>
                <span className="text-sm font-medium">{Math.round(knowledgeProgress)}%</span>
              </div>
              <Progress value={knowledgeProgress} className="h-2" />
              <p className="text-sm font-medium">{currentPrinciple}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applied Knowledge */}
      {appliedKnowledge.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center space-x-2">
            <Award className="w-5 h-5 text-primary" />
            <span>Applied Expert Knowledge</span>
          </h4>
          
          <div className="grid gap-4">
            <AnimatePresence>
              {appliedKnowledge.map((knowledge, index) => (
                <motion.div
                  key={knowledge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getDomainIcon(knowledge.domain)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-semibold">{knowledge.principle}</h5>
                              <Badge variant="secondary" className={getRelevanceColor(knowledge.relevance)}>
                                {Math.round(knowledge.relevance)}% relevant
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {knowledge.description}
                            </p>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-primary">
                                Application: {knowledge.application}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{Math.round(knowledge.confidence)}% confidence</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{knowledge.timestamp.toLocaleTimeString()}</span>
                                </span>
                                <span>{knowledge.source}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Intelligence Growth Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Expert Knowledge Integration</div>
              <div className="text-sm text-muted-foreground">
                Your brain is integrating {appliedKnowledge.length} expert principles with {activeDomains.length} active knowledge domains.
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {Math.round((systemIntelligence?.understandingLevel || 0) * 0.4)}%
              </div>
              <div className="text-xs text-muted-foreground">Knowledge Applied</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 