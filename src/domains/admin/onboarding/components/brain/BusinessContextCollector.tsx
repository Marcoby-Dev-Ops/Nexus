/**
 * BusinessContextCollector.tsx
 * Collects business context with progressive intelligence
 * Shows system getting smarter as more information is provided
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, Target, Lightbulb, Sparkles, BarChart3, Brain, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useAuth } from '@/core/auth/AuthProvider';

interface BusinessContextCollectorProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
  };
  onContextUpdated?: (context: BusinessContext) => void;
}

interface BusinessContext {
  company: {
    name: string;
    industry: string;
    size: string;
    description: string;
    challenges: string[];
    goals: string[];
  };
  user: {
    role: string;
    experience: string;
    responsibilities: string[];
    goals: string[];
  };
  business: {
    currentMetrics: Record<string, any>;
    targetMetrics: Record<string, any>;
    timeframes: Record<string, any>;
  };
  intelligence: {
    understandingLevel: number;
    insights: string[];
    recommendations: string[];
  };
}

interface ContextField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'multiselect';
  options?: string[];
  placeholder: string;
  weight: number; // Impact on system intelligence
  category: 'company' | 'user' | 'business';
}

export const BusinessContextCollector: React.FC<BusinessContextCollectorProps> = ({ 
  userProfile: userProfile, 
  systemIntelligence,
  onContextUpdated 
}) => {
  const { user } = useAuth();
  const [context, setContext] = useState<BusinessContext>({
    company: { name: '', industry: '', size: '', description: '', challenges: [], goals: [] },
    user: { role: '', experience: '', responsibilities: [], goals: [] },
    business: { currentMetrics: {}, targetMetrics: {}, timeframes: {} },
    intelligence: { understandingLevel: 0, insights: [], recommendations: [] }
  });
  const [intelligence, setIntelligence] = useState({
    contextScore: 0,
    insightsGenerated: 0,
    recommendationsCount: 0,
    lastUpdated: new Date()
  });
  const [isLearning, setIsLearning] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Get user's first name for personalization
  const getUserFirstName = () => {
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.profile?.full_name) return user.profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  const handleComplete = () => {
    if (onContextUpdated) {
      onContextUpdated(context);
    }
  };

  const isFormValid = () => {
    return context.company.name && context.company.industry && context.user.role;
  };

  const contextFields: ContextField[] = [
    {
      id: 'company.name',
      label: 'Company Name',
      type: 'text',
      placeholder: 'Enter your company name',
      weight: 15,
      category: 'company'
    },
    {
      id: 'company.industry',
      label: 'Industry',
      type: 'select',
      options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Consulting', 'Education', 'Other'],
      placeholder: 'Select your industry',
      weight: 25,
      category: 'company'
    },
    {
      id: 'company.size',
      label: 'Company Size',
      type: 'select',
      options: ['Solo Entrepreneur', 'Small Team (2-10)', 'Medium Business (11-50)', 'Large Business (50+)'],
      placeholder: 'Select company size',
      weight: 10,
      category: 'company'
    },
    {
      id: 'user.role',
      label: 'Your Role',
      type: 'text',
      placeholder: 'e.g., CEO, Manager, Consultant',
      weight: 20,
      category: 'user'
    },
    {
      id: 'user.experience',
      label: 'Experience Level',
      type: 'select',
      options: ['Beginner (0-2 years)', 'Intermediate (3-7 years)', 'Advanced (8+ years)'],
      placeholder: 'Select your experience level',
      weight: 15,
      category: 'user'
    },
    {
      id: 'business.description',
      label: 'Business Description',
      type: 'textarea',
      placeholder: 'Describe your business and what you do',
      weight: 20,
      category: 'business'
    }
  ];

  const handleFieldUpdate = useCallback((fieldId: string, value: string | string[]) => {
    // Clear existing debounce timer for this field
    if (debounceTimers[fieldId]) {
      clearTimeout(debounceTimers[fieldId]);
    }

    // Update context immediately
    setContext(prev => {
      const newContext = { ...prev };
      const [category, field] = fieldId.split('.');
      
      if (category === 'company') {
        newContext.company = { ...newContext.company, [field]: value };
      } else if (category === 'user') {
        newContext.user = { ...newContext.user, [field]: value };
      } else if (category === 'business') {
        newContext.business = { ...newContext.business, [field]: value };
      }

      return newContext;
    });

    // Show learning indicator
    setIsLearning(true);
    setTimeout(() => setIsLearning(false), 2000);

    // Debounce insight generation
    const timer = setTimeout(() => {
      updateIntelligence(fieldId, value);
    }, 1000); // Wait 1 second after user stops typing

    setDebounceTimers(prev => ({ ...prev, [fieldId]: timer }));
  }, [debounceTimers]);

  const updateIntelligence = (fieldId: string, value: string | string[]) => {
    const field = contextFields.find(f => f.id === fieldId);
    if (!field) return;

    // Only generate insights for meaningful content
    if (typeof value === 'string' && value.trim().length < 3) return;

    setIntelligence(prev => {
      const newScore = prev.contextScore + field.weight;
      const newInsights = prev.insightsGenerated + (field.weight > 15 ? 1: 0);
      const newRecommendations = prev.recommendationsCount + (field.weight > 20 ? 1: 0);

      return {
        contextScore: Math.min(100, newScore),
        insightsGenerated: newInsights,
        recommendationsCount: newRecommendations,
        lastUpdated: new Date()
      };
    });

    // Generate insights based on field
    generateInsights(fieldId, value);
  };

  const generateInsights = (fieldId: string, value: string | string[]) => {
    // Only generate insights for meaningful content
    if (typeof value === 'string' && value.trim().length < 3) return;

    const newInsights: string[] = [];
    
    if (fieldId === 'company.industry' && typeof value === 'string') {
      newInsights.push(`Industry-specific optimization strategies for ${value}`);
      newInsights.push(`Market positioning insights for ${value} sector`);
    }
    
    if (fieldId === 'company.size' && typeof value === 'string') {
      newInsights.push(`Scalability strategies for ${value} businesses`);
      newInsights.push(`Resource optimization for ${value} operations`);
    }
    
    if (fieldId === 'user.role' && typeof value === 'string') {
      newInsights.push(`Leadership strategies for ${value} role`);
      newInsights.push(`Decision-making frameworks for ${value}`);
    }

    if (newInsights.length > 0) {
      setInsights(prev => {
        // Remove any existing insights for this field to prevent duplicates
        const filtered = prev.filter(insight => 
          !newInsights.some(newInsight => 
            insight.includes(fieldId.split('.')[1]) || 
            insight.includes(value as string)
          )
        );
        return [...filtered, ...newInsights];
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'company': return <Building2 className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'business': return <BarChart3 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'company': return 'text-blue-500 bg-blue-50';
      case 'user': return 'text-green-500 bg-green-50';
      case 'business': return 'text-purple-500 bg-purple-50';
      default: return 'text-gray-500 bg-gray-50';
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
          <Building2 className="w-12 h-12 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold text-foreground">Welcome, {getUserFirstName()}! 👋</h2>
        <h3 className="text-2xl font-bold text-foreground">Your Business Context</h3>
        <p className="text-foreground/70">
          Help your brain understand your unique business situation
        </p>
      </div>

      {/* Intelligence Status */}
      <div className="grid md: grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Context Score</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-foreground">{intelligence.contextScore}%</div>
            <Progress value={intelligence.contextScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Insights</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-foreground">{intelligence.insightsGenerated}</div>
            <Progress value={intelligence.insightsGenerated * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Recommendations</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-foreground">{intelligence.recommendationsCount}</div>
            <Progress value={intelligence.recommendationsCount * 20} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Learning</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-foreground">{Math.round(systemIntelligence?.understandingLevel || 0)}%</div>
            <Progress value={systemIntelligence?.understandingLevel || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Learning Indicator */}
      {isLearning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full mx-auto"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-foreground">Brain learning about your business...</span>
        </motion.div>
      )}

      {/* Context Collection Form */}
      <div className="grid md: grid-cols-2 gap-6">
        {contextFields.map((field) => (
          <Card key={field.id} className="hover: shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                {getCategoryIcon(field.category)}
                <span className="text-foreground">{field.label}</span>
                <Badge variant="secondary" className={getCategoryColor(field.category)}>
                  {field.weight} pts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {field.type === 'text' && (
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                  className="w-full"
                />
              )}
              
              {field.type === 'select' && (
                <select
                  onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file: border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{field.placeholder}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {field.type === 'textarea' && (
                <Textarea
                  placeholder={field.placeholder}
                  rows={3}
                  onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                  className="w-full"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generated Insights */}
      {insights.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span>Generated Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Button */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={handleComplete}
          disabled={!isFormValid()}
          className="px-8 py-3 text-lg"
        >
          Continue to Next Step
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}; 