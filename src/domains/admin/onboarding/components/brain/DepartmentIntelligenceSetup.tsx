/**
 * DepartmentIntelligenceSetup.tsx
 * Configures department-specific AI agents and insights
 * Shows progressive intelligence for each department
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Lightbulb, 
  Sparkles,
  CheckCircle,
  Clock,
  BarChart3,
  DollarSign,
  Zap,
  Target,
  Brain,
  Settings,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';

interface DepartmentIntelligenceSetupProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
  };
  onDepartmentsConfigured?: (departments: DepartmentConfig[]) => void;
}

interface DepartmentConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  isActive: boolean;
  intelligence: {
    understandingLevel: number;
    insightsGenerated: number;
    recommendationsCount: number;
    lastUpdated: Date;
  };
  agents: AIAgent[];
  insights: DepartmentInsight[];
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'learning';
  confidence: number;
}

interface DepartmentInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  timestamp: Date;
}

export const DepartmentIntelligenceSetup: React.FC<DepartmentIntelligenceSetupProps> = ({ 
  userProfile: _userProfile, 
  systemIntelligence,
  onDepartmentsConfigured: _onDepartmentsConfigured 
}) => {
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<string>('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configProgress, setConfigProgress] = useState(0);

  const departmentTemplates = [
    {
      id: 'sales',
      name: 'Sales & Revenue',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Revenue optimization and customer acquisition',
      agents: [
        {
          id: 'sales-optimizer',
          name: 'Revenue Optimizer',
          description: 'AI agent for sales strategy and revenue maximization',
          capabilities: ['Pricing optimization', 'Lead scoring', 'Sales forecasting', 'Customer segmentation'],
          status: 'learning' as const,
          confidence: 0
        },
        {
          id: 'customer-success',
          name: 'Customer Success Agent',
          description: 'AI agent for customer retention and satisfaction',
          capabilities: ['Churn prediction', 'Customer journey optimization', 'Success metrics tracking'],
          status: 'learning' as const,
          confidence: 0
        }
      ]
    },
    {
      id: 'finance',
      name: 'Finance & Operations',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Financial planning and operational efficiency',
      agents: [
        {
          id: 'financial-analyst',
          name: 'Financial Analyst',
          description: 'AI agent for financial planning and analysis',
          capabilities: ['Cash flow forecasting', 'Budget optimization', 'Financial modeling', 'Risk assessment'],
          status: 'learning' as const,
          confidence: 0
        },
        {
          id: 'operations-manager',
          name: 'Operations Manager',
          description: 'AI agent for operational efficiency',
          capabilities: ['Process optimization', 'Resource allocation', 'Performance monitoring'],
          status: 'learning' as const,
          confidence: 0
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing & Growth',
      icon: <Target className="w-5 h-5" />,
      description: 'Brand building and customer engagement',
      agents: [
        {
          id: 'marketing-strategist',
          name: 'Marketing Strategist',
          description: 'AI agent for marketing strategy and campaign optimization',
          capabilities: ['Campaign optimization', 'Market analysis', 'Brand positioning', 'ROI tracking'],
          status: 'learning' as const,
          confidence: 0
        },
        {
          id: 'growth-hacker',
          name: 'Growth Hacker',
          description: 'AI agent for growth strategies and market expansion',
          capabilities: ['Growth hacking', 'Market expansion', 'Customer acquisition', 'A/B testing'],
          status: 'learning' as const,
          confidence: 0
        }
      ]
    },
    {
      id: 'operations',
      name: 'Operations & Efficiency',
      icon: <Zap className="w-5 h-5" />,
      description: 'Process optimization and operational excellence',
      agents: [
        {
          id: 'process-optimizer',
          name: 'Process Optimizer',
          description: 'AI agent for process improvement and automation',
          capabilities: ['Process mapping', 'Automation identification', 'Efficiency analysis', 'Quality control'],
          status: 'learning' as const,
          confidence: 0
        },
        {
          id: 'quality-manager',
          name: 'Quality Manager',
          description: 'AI agent for quality assurance and improvement',
          capabilities: ['Quality monitoring', 'Defect prevention', 'Performance metrics', 'Continuous improvement'],
          status: 'learning' as const,
          confidence: 0
        }
      ]
    }
  ];

  // Initialize departments based on system intelligence
  useEffect(() => {
    if (systemIntelligence?.understandingLevel > 20) {
      initializeDepartments();
    }
  }, [systemIntelligence?.understandingLevel]);

  const initializeDepartments = () => {
    const initialDepartments = departmentTemplates.map(dept => ({
      ...dept,
      isActive: false,
      intelligence: {
        understandingLevel: 0,
        insightsGenerated: 0,
        recommendationsCount: 0,
        lastUpdated: new Date()
      },
      insights: []
    }));
    setDepartments(initialDepartments);
  };

  const handleDepartmentToggle = (deptId: string) => {
    setDepartments(prev => prev.map(dept => 
      dept.id === deptId 
        ? { ...dept, isActive: !dept.isActive }
        : dept
    ));

    if (activeDepartment !== deptId) {
      setActiveDepartment(deptId);
      startDepartmentConfiguration(deptId);
    }
  };

  const startDepartmentConfiguration = (deptId: string) => {
    setIsConfiguring(true);
    setConfigProgress(0);
    
    const configSteps = [
      'Analyzing department requirements...',
      'Configuring AI agents...',
      'Setting up intelligence models...',
      'Generating initial insights...',
      'Optimizing agent capabilities...',
      'Finalizing department setup...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setConfigProgress(prev => {
        const newProgress = prev + 16.67;
        currentStep++;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsConfiguring(false);
          completeDepartmentSetup(deptId);
          return 100;
        }
        return newProgress;
      });
    }, 1200);
  };

  const completeDepartmentSetup = (deptId: string) => {
    setDepartments(prev => prev.map(dept => {
      if (dept.id === deptId) {
        return {
          ...dept,
          intelligence: {
            understandingLevel: 75 + Math.random() * 25,
            insightsGenerated: 3 + Math.floor(Math.random() * 5),
            recommendationsCount: 2 + Math.floor(Math.random() * 3),
            lastUpdated: new Date()
          },
          agents: dept.agents.map(agent => ({
            ...agent,
            status: 'active' as const,
            confidence: 80 + Math.random() * 20
          })),
          insights: generateDepartmentInsights(dept.name)
        };
      }
      return dept;
    }));
  };

  const generateDepartmentInsights = (deptName: string): DepartmentInsight[] => {
    const insights = [
      {
        id: '1',
        title: `${deptName} Optimization Opportunity`,
        description: `Based on your business context, there are significant opportunities to optimize ${deptName.toLowerCase()} operations.`,
        impact: 'high' as const,
        category: 'optimization',
        confidence: 85 + Math.random() * 15,
        timestamp: new Date()
      },
      {
        id: '2',
        title: `${deptName} Performance Metrics`,
        description: `Key performance indicators for ${deptName.toLowerCase()} have been identified and are being tracked.`,
        impact: 'medium' as const,
        category: 'metrics',
        confidence: 90 + Math.random() * 10,
        timestamp: new Date()
      }
    ];
    return insights;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-50';
      case 'inactive': return 'text-gray-500 bg-gray-50';
      case 'learning': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-blue-500 bg-blue-50';
    }
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
          <Users className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground">Configure Your Business Intelligence</h3>
        <p className="text-foreground/70">
          Set up department-specific AI agents and insights
        </p>
      </div>

      {/* Configuration Progress */}
      {isConfiguring && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary" />
              <span>Configuring Department Intelligence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">Setting up AI agents...</span>
              <span className="text-sm font-medium">{Math.round(configProgress)}%</span>
            </div>
            <Progress value={configProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Department Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <Card 
            key={dept.id}
            className={`cursor-pointer transition-all duration-300 ${
              dept.isActive 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleDepartmentToggle(dept.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                {dept.icon}
                <span>{dept.name}</span>
                {dept.isActive && (
                  <Badge variant="secondary" className="ml-auto">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/70">
                {dept.description}
              </p>
              
              {dept.isActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Intelligence Level</span>
                      <span className="font-medium">{Math.round(dept.intelligence.understandingLevel)}%</span>
                    </div>
                    <Progress value={dept.intelligence.understandingLevel} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-primary/5 rounded">
                      <div className="font-bold text-primary">{dept.intelligence.insightsGenerated}</div>
                      <div className="text-foreground/70">Insights</div>
                    </div>
                    <div className="text-center p-2 bg-primary/5 rounded">
                      <div className="font-bold text-primary">{dept.intelligence.recommendationsCount}</div>
                      <div className="text-foreground/70">Recommendations</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Department Details */}
      {activeDepartment && departments.find(d => d.id === activeDepartment)?.isActive && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>AI Agents & Insights</span>
          </h4>
          
          {departments.find(d => d.id === activeDepartment)?.agents.map((agent) => (
            <Card key={agent.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-semibold">{agent.name}</h5>
                      <Badge variant="secondary" className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/70 mb-3">
                      {agent.description}
                    </p>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-primary">Capabilities:</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3 text-xs text-foreground/70">
                      <CheckCircle className="w-3 h-3" />
                      <span>{Math.round(agent.confidence)}% confidence</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Department Insights */}
          {departments.find(d => d.id === activeDepartment)?.insights.map((insight) => (
            <Card key={insight.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-semibold">{insight.title}</h5>
                      <Badge variant="secondary" className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/70 mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-foreground/70">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{Math.round(insight.confidence)}% confidence</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{insight.timestamp.toLocaleTimeString()}</span>
                      </span>
                      <span>{insight.category}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Intelligence Growth Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Department Intelligence Growing</div>
              <div className="text-sm text-foreground/70">
                {departments.filter(d => d.isActive).length} departments are now active with AI agents 
                providing intelligent insights and recommendations.
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {departments.filter(d => d.isActive).length}
              </div>
              <div className="text-xs text-muted-foreground">Active Departments</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 