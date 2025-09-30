/**
 * MVP Journey - Maturity Assessment Step
 * 
 * Step for assessing business maturity level.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/RadioGroup';
import { Label } from '@/shared/components/ui/Label';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  CheckCircle, 
  ArrowRight, 
  TrendingUp, 
  Target,
  ArrowLeft,
  Star,
  Lightbulb,
  Award
} from 'lucide-react';
import type { JourneyStepProps } from '../types';

interface MaturityAssessmentStepProps extends JourneyStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  description: string;
  category: string;
  options: {
    value: string;
    label: string;
    description: string;
    score: number;
  }[];
}

export default function MaturityAssessmentStep({ onNext, onBack, initialData }: MaturityAssessmentStepProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialData?.answers || {});
  const [isComplete, setIsComplete] = useState(false);

  const assessmentQuestions: AssessmentQuestion[] = [
    {
      id: 'business_planning',
      question: 'How would you describe your business planning approach?',
      description: 'This helps us understand your strategic thinking and planning capabilities.',
      category: 'Strategy',
      options: [
        {
          value: 'reactive',
          label: 'Reactive',
          description: 'We respond to situations as they arise',
          score: 1
        },
        {
          value: 'basic_planning',
          label: 'Basic Planning',
          description: 'We have some basic plans and goals',
          score: 2
        },
        {
          value: 'structured',
          label: 'Structured',
          description: 'We follow a structured planning process',
          score: 3
        },
        {
          value: 'strategic',
          label: 'Strategic',
          description: 'We have comprehensive strategic planning',
          score: 4
        },
        {
          value: 'advanced',
          label: 'Advanced',
          description: 'We use advanced strategic frameworks',
          score: 5
        }
      ]
    },
    {
      id: 'customer_understanding',
      question: 'How well do you understand your customers?',
      description: 'This assesses your customer research and market understanding.',
      category: 'Marketing',
      options: [
        {
          value: 'basic',
          label: 'Basic Understanding',
          description: 'We know who our customers are',
          score: 1
        },
        {
          value: 'some_research',
          label: 'Some Research',
          description: 'We have done some customer research',
          score: 2
        },
        {
          value: 'detailed_profiles',
          label: 'Detailed Profiles',
          description: 'We have detailed customer personas',
          score: 3
        },
        {
          value: 'data_driven',
          label: 'Data-Driven',
          description: 'We use data to understand customer behavior',
          score: 4
        },
        {
          value: 'predictive',
          label: 'Predictive',
          description: 'We can predict customer needs and trends',
          score: 5
        }
      ]
    },
    {
      id: 'operations_efficiency',
      question: 'How efficient are your business operations?',
      description: 'This evaluates your operational processes and efficiency.',
      category: 'Operations',
      options: [
        {
          value: 'manual',
          label: 'Manual Processes',
          description: 'Most processes are done manually',
          score: 1
        },
        {
          value: 'some_automation',
          label: 'Some Automation',
          description: 'We have some automated processes',
          score: 2
        },
        {
          value: 'standardized',
          label: 'Standardized',
          description: 'We have standardized processes',
          score: 3
        },
        {
          value: 'optimized',
          label: 'Optimized',
          description: 'Our processes are optimized and efficient',
          score: 4
        },
        {
          value: 'continuous_improvement',
          label: 'Continuous Improvement',
          description: 'We continuously improve our processes',
          score: 5
        }
      ]
    },
    {
      id: 'financial_management',
      question: 'How sophisticated is your financial management?',
      description: 'This assesses your financial planning and management capabilities.',
      category: 'Finance',
      options: [
        {
          value: 'basic_tracking',
          label: 'Basic Tracking',
          description: 'We track basic income and expenses',
          score: 1
        },
        {
          value: 'monthly_reviews',
          label: 'Monthly Reviews',
          description: 'We review finances monthly',
          score: 2
        },
        {
          value: 'budgeting',
          label: 'Budgeting',
          description: 'We create and follow budgets',
          score: 3
        },
        {
          value: 'forecasting',
          label: 'Forecasting',
          description: 'We do financial forecasting',
          score: 4
        },
        {
          value: 'strategic_finance',
          label: 'Strategic Finance',
          description: 'We use finance for strategic decisions',
          score: 5
        }
      ]
    },
    {
      id: 'technology_adoption',
      question: 'How do you approach technology adoption?',
      description: 'This evaluates your technology strategy and digital transformation.',
      category: 'Technology',
      options: [
        {
          value: 'minimal',
          label: 'Minimal Technology',
          description: 'We use basic technology tools',
          score: 1
        },
        {
          value: 'standard_tools',
          label: 'Standard Tools',
          description: 'We use standard business software',
          score: 2
        },
        {
          value: 'integrated_systems',
          label: 'Integrated Systems',
          description: 'We have integrated technology systems',
          score: 3
        },
        {
          value: 'advanced_tech',
          label: 'Advanced Technology',
          description: 'We use advanced technology solutions',
          score: 4
        },
        {
          value: 'innovation_leader',
          label: 'Innovation Leader',
          description: 'We lead in technology innovation',
          score: 5
        }
      ]
    }
  ];

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    const scores = assessmentQuestions.map(q => {
      const answer = answers[q.id];
      const option = q.options.find(opt => opt.value === answer);
      return option?.score || 0;
    });

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maturityLevel = Math.round(averageScore);

    const maturityLabels = {
      1: 'Startup',
      2: 'Emerging',
      3: 'Established',
      4: 'Mature',
      5: 'Advanced'
    };

    onNext({
      answers,
      scores,
      averageScore,
      maturityLevel,
      maturityLabel: maturityLabels[maturityLevel as keyof typeof maturityLabels],
      recommendations: generateRecommendations(maturityLevel, answers)
    });
  };

  const generateRecommendations = (level: number, answers: Record<string, string>) => {
    const recommendations = [];
    
    if (level <= 2) {
      recommendations.push('Focus on building foundational business processes');
      recommendations.push('Develop clear customer personas and value propositions');
      recommendations.push('Implement basic financial tracking and budgeting');
    } else if (level <= 3) {
      recommendations.push('Optimize existing processes for efficiency');
      recommendations.push('Enhance customer data collection and analysis');
      recommendations.push('Develop more sophisticated financial forecasting');
    } else {
      recommendations.push('Explore advanced automation and AI solutions');
      recommendations.push('Implement predictive analytics for customer insights');
      recommendations.push('Consider strategic partnerships and expansion opportunities');
    }

    return recommendations;
  };

  const currentQuestionData = assessmentQuestions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Award className="w-16 h-16 text-primary mb-4" />
          </div>
          <h2 className="text-2xl font-bold">Assessment Complete!</h2>
          <p className="text-muted-foreground">
            Thank you for completing the maturity assessment. Here's what we found:
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-8 w-8 ${
                      i < Math.round(Object.values(answers).length / assessmentQuestions.length * 5)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <h3 className="text-xl font-semibold">
                Maturity Level: {Math.round(Object.values(answers).length / assessmentQuestions.length * 5)}/5
              </h3>
              <p className="text-muted-foreground">
                You've answered {answeredQuestions} out of {assessmentQuestions.length} questions
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={() => setIsComplete(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Review Answers
          </Button>

          <Button onClick={handleComplete}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <TrendingUp className="w-16 h-16 text-primary mb-4" />
        </div>
        <h2 className="text-2xl font-bold">Business Maturity Assessment</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Let's understand your current business maturity level to provide personalized recommendations.
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Question {currentQuestion + 1} of {assessmentQuestions.length}</h3>
              <p className="text-sm text-muted-foreground">
                {answeredQuestions} questions answered
              </p>
            </div>
            <Badge variant="secondary">
              {Math.round(progressPercentage)}% complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{currentQuestionData.category}</Badge>
            </div>
            <h3 className="text-lg font-semibold mb-2">{currentQuestionData.question}</h3>
            <p className="text-muted-foreground">{currentQuestionData.description}</p>
          </div>

          <RadioGroup
            value={answers[currentQuestionData.id] || ''}
            onValueChange={(value) => handleAnswerSelect(currentQuestionData.id, value)}
            className="space-y-4"
          >
            {currentQuestionData.options.map((option) => (
              <div
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  answers[currentQuestionData.id] === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground'
                }`}
                onClick={() => handleAnswerSelect(currentQuestionData.id, option.value)}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < option.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Level {option.score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentQuestion === 0 ? 'Back' : 'Previous'}
        </Button>

        <Button 
          onClick={handleNext}
          disabled={!answers[currentQuestionData.id]}
        >
          {currentQuestion === assessmentQuestions.length - 1 ? 'Complete Assessment' : 'Next'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
