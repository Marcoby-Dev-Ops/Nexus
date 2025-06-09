/**
 * OnboardingChat.tsx
 * First meeting with the user's Executive Assistant
 * Conversational onboarding that builds the foundation of the AI-human relationship
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Building2, 
  Target, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Heart,
  Briefcase,
  Users,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEnhancedUser } from '@/contexts/EnhancedUserContext';
import { useOnboarding } from '@/lib/useOnboarding';

interface OnboardingMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  type: 'message' | 'introduction' | 'data-collected' | 'relationship-building';
  metadata?: {
    step?: string;
    dataCollected?: Record<string, any>;
    suggestions?: string[];
          emotion?: 'excited' | 'thoughtful' | 'supportive' | 'celebratory' | 'friendly';
  };
}

interface OnboardingStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  description: string;
}

export const OnboardingChat: React.FC = () => {
  const { user } = useEnhancedUser();
  const { completeOnboarding } = useOnboarding();
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [assistantPersonality, setAssistantPersonality] = useState<'professional' | 'friendly' | 'adaptive'>('adaptive');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPrompt, setTextInputPrompt] = useState('');
  const [textInputValue, setTextInputValue] = useState('');
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const onboardingSteps: OnboardingStep[] = [
    { 
      id: 'introduction', 
      title: 'Meet Your Assistant', 
      icon: <Heart className="w-4 h-4" />, 
      completed: false,
      description: 'Getting to know each other'
    },
    { 
      id: 'company', 
      title: 'Your Company', 
      icon: <Building2 className="w-4 h-4" />, 
      completed: false,
      description: 'Tell us about your business'
    },
    { 
      id: 'organization', 
      title: 'Your Industry', 
      icon: <Building2 className="w-4 h-4" />, 
      completed: false,
      description: 'What sector you\'re in'
    },
    { 
      id: 'role', 
      title: 'Your Role', 
      icon: <Briefcase className="w-4 h-4" />, 
      completed: false,
      description: 'Your position & responsibilities'
    },
    { 
      id: 'goals', 
      title: 'Your Goals', 
      icon: <Target className="w-4 h-4" />, 
      completed: false,
      description: 'Your biggest challenges'
    },
    { 
      id: 'working-style', 
      title: 'Working Together', 
      icon: <Users className="w-4 h-4" />, 
      completed: false,
      description: 'Communication preferences'
    },
    { 
      id: 'partnership', 
      title: 'Ready to Start', 
      icon: <TrendingUp className="w-4 h-4" />, 
      completed: false,
      description: 'Launch your workspace'
    }
  ];

  const [steps, setSteps] = useState(onboardingSteps);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with executive assistant introduction
  useEffect(() => {
    const firstName = user?.profile?.first_name;
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    
    const personalizedGreeting = firstName 
      ? `Good ${timeOfDay}, ${firstName}! 👋`
      : `Good ${timeOfDay}! 👋`;

    const introMessage: OnboardingMessage = {
      id: '1',
      role: 'assistant',
      content: `${personalizedGreeting}

        I'm Nex, your Executive Assistant here at Nexus. Think of me as your AI business partner who's going to help you streamline operations, make smarter decisions, and achieve your goals faster.

I'm not just another chatbot - I'm specifically designed to understand your business, learn your preferences, and become your trusted right-hand assistant. I'll be here 24/7 to help with everything from strategic planning to daily tasks.

Before we dive into the powerful features of Nexus, I'd love to get to know you better. This way, I can customize everything specifically for your needs and working style.

Ready to start our partnership?`,
      timestamp: new Date(),
      type: 'introduction',
      metadata: {
        step: 'introduction',
        emotion: 'friendly',
        suggestions: [
          '🚀 Yes, let\'s get started!',
          '🤔 Tell me more about what you can do',
          '💼 How will you help my business?',
          '⚡ What makes you different?'
        ]
      }
    };

    setMessages([introMessage]);
  }, [user]);

  const completeStep = (stepId: string, data?: Record<string, any>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    if (data) {
      setCollectedData(prev => ({ ...prev, ...data }));
    }
  };

  const simulateTyping = async (duration: number = 2000) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsTyping(false);
  };

  const addMessage = (message: Omit<OnboardingMessage, 'id' | 'timestamp'>) => {
    const newMessage: OnboardingMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Industry-specific insights and challenges
  const getIndustryInsights = (industry: string) => {
    const insights: Record<string, { insight: string; challenges: string; roleQuestions?: string[] }> = {
      '🏥 Healthcare & Medical': {
        insight: "Healthcare is rapidly evolving with digital transformation and regulatory changes.",
        challenges: "I know healthcare faces unique challenges like HIPAA compliance, patient data management, and integrating new technologies with legacy systems. I can help streamline operations while maintaining strict security standards."
      },
      '🛒 E-commerce & Retail': {
        insight: "E-commerce is all about customer experience, inventory optimization, and data-driven decisions.",
        challenges: "Common pain points I see in retail include inventory management, customer acquisition costs, and converting data into actionable insights. I can help automate processes and improve your conversion rates."
      },
      '💻 Technology & Software': {
        insight: "Tech companies need to move fast while maintaining quality and scalability.",
        challenges: "I understand the pressure to ship quickly while managing technical debt, scaling teams, and staying competitive. I can help with project management, data analysis, and strategic planning."
      },
      '💰 Finance & Banking': {
        insight: "Financial services require precision, compliance, and risk management at every step.",
        challenges: "I know finance deals with regulatory compliance, risk assessment, and complex reporting requirements. I can help automate reporting and provide insights while ensuring accuracy."
      },
      '📈 Marketing & Advertising': {
        insight: "Marketing success depends on understanding your audience and measuring what works.",
        challenges: "Attribution, ROI measurement, and campaign optimization are constant challenges. I can help analyze performance data and identify opportunities for growth."
      },
      '🏭 Manufacturing': {
        insight: "Manufacturing requires precise coordination between supply chain, production, and quality control.",
        challenges: "Supply chain disruptions and operational efficiency are key concerns. I can help optimize workflows and provide visibility into your operations."
      },
      '🎓 Education': {
        insight: "Education is embracing digital tools to improve learning outcomes and operational efficiency.",
        challenges: "Student engagement, administrative efficiency, and data management are ongoing challenges. I can help streamline operations and improve insights."
      },
      '🏗️ Construction & Real Estate': {
        insight: "Construction and real estate rely on project management, timeline coordination, and financial oversight.",
        challenges: "Project delays, cost overruns, and coordination between teams are common issues. I can help with project tracking and financial management."
      },
      '🍕 Food & Restaurant': {
        insight: "Food service businesses need to balance quality, efficiency, and customer satisfaction.",
        challenges: "Inventory management, staff scheduling, and customer experience optimization are key areas. I can help with operations and customer insights."
      },
      '⚖️ Legal & Professional Services': {
        insight: "Professional services depend on time management, client communication, and expertise delivery.",
        challenges: "Billable hour tracking, client management, and document organization are crucial. I can help streamline administrative tasks and improve client insights."
      }
    };

    return insights[industry] || {
      insight: "Every industry has its unique opportunities and challenges.",
      challenges: "I'm here to learn about your specific business needs and help you optimize your operations, regardless of your sector."
    };
  };

  // Role-specific insights based on industry context
  const getRoleInsights = (role: string, industry: string) => {
    const roleInsights: Record<string, { insight: string; focus: string }> = {
      '👑 CEO / Founder': {
        insight: "As a CEO/Founder, you're focused on strategic growth, team scaling, and operational efficiency.",
        focus: `In ${industry?.replace(/🏥|🛒|💻|💰|📈|🏭|🎓|🏗️|🍕|⚖️/g, '').trim() || 'your industry'}, I can help you with high-level analytics, growth metrics, strategic planning, and executive reporting to make data-driven decisions faster.`
      },
      '⚙️ Operations Manager': {
        insight: "Operations managers are the backbone of efficiency - you turn strategy into execution.",
        focus: "I can help you optimize workflows, automate repetitive processes, track KPIs, and identify bottlenecks before they impact your team's productivity."
      },
      '💼 Sales Professional': {
        insight: "Sales success comes from understanding your pipeline, knowing your customers, and timing your outreach perfectly.",
        focus: "I can help you track lead quality, analyze conversion rates, automate follow-ups, and identify your highest-value prospects to close more deals."
      },
      '📊 Marketing Manager': {
        insight: "Marketing is all about reaching the right audience with the right message at the right time.",
        focus: "I can help you analyze campaign performance, optimize ad spend, track customer journeys, and identify which channels drive your best customers."
      },
      '💳 Finance Professional': {
        insight: "Finance requires precision, forecasting accuracy, and clear visibility into business performance.",
        focus: "I can help automate financial reporting, track budget variance, analyze cash flow patterns, and provide real-time insights for strategic planning."
      },
      '👥 HR Manager': {
        insight: "HR is evolving from administration to strategic talent management and employee experience.",
        focus: "I can help you analyze employee data, track engagement metrics, streamline hiring processes, and identify trends that impact retention."
      },
      '🔧 Project Manager': {
        insight: "Project success depends on coordination, timeline management, and clear communication across teams.",
        focus: "I can help you track project progress, identify risks early, optimize resource allocation, and keep stakeholders informed with automated updates."
      },
      '📈 Business Analyst': {
        insight: "Business analysts turn data into actionable insights that drive strategic decisions.",
        focus: "I can help you automate data collection, create interactive dashboards, perform advanced analytics, and present findings in compelling, executive-ready formats."
      },
      '🎯 Product Manager': {
        insight: "Product management requires balancing user needs, technical constraints, and business objectives.",
        focus: "I can help you analyze user behavior, track feature adoption, prioritize roadmaps based on data, and measure product-market fit metrics."
      }
    };

    return roleInsights[role] || {
      insight: "Every role has unique challenges and opportunities for optimization.",
      focus: "I can help you identify areas where AI and automation can make your work more efficient and impactful."
    };
  };

  const getChallengeInsights = (challenge: string, role: string, industry: string) => {
    const challengeData = {
      'scaling': {
        understanding: 'I understand you\'re focused on scaling and growth challenges.',
        solution: 'I can help you identify bottlenecks, optimize processes, and create scalable systems.',
        nextSteps: 'Let\'s start by analyzing your current operations and identifying automation opportunities.'
      },
      'efficiency': {
        understanding: 'Manual processes can really slow down productivity.',
        solution: 'I can help automate repetitive tasks, streamline workflows, and optimize resource allocation.',
        nextSteps: 'We\'ll map your current processes and identify the highest-impact automation opportunities.'
      },
      'data': {
        understanding: 'Data management and getting actionable insights is crucial.',
        solution: 'I can help centralize your data, create automated reports, and provide real-time business intelligence.',
        nextSteps: 'Let\'s connect your data sources and set up intelligent dashboards for your role.'
      },
      'communication': {
        understanding: 'Team coordination and communication can make or break productivity.',
        solution: 'I can help streamline team communications, automate status updates, and improve collaboration.',
        nextSteps: 'We\'ll integrate your communication tools and set up smart notification systems.'
      },
      'customer': {
        understanding: 'Customer experience and retention are key to sustainable growth.',
        solution: 'I can help track customer interactions, automate follow-ups, and identify retention opportunities.',
        nextSteps: 'Let\'s analyze your customer journey and set up proactive engagement systems.'
      },
      'finance': {
        understanding: 'Cash flow and financial management require constant attention.',
        solution: 'I can help track expenses, forecast cash flow, and identify cost optimization opportunities.',
        nextSteps: 'We\'ll connect your financial tools and set up automated reporting and alerts.'
      },
      'time': {
        understanding: 'Time management and productivity are always challenging.',
        solution: 'I can help prioritize tasks, automate scheduling, and eliminate time-wasting activities.',
        nextSteps: 'Let\'s analyze how you spend time and identify the biggest productivity wins.'
      },
      'integration': {
        understanding: 'Managing multiple tools and integrations can be overwhelming.',
        solution: 'I can help centralize your tools, automate data sync, and create unified workflows.',
        nextSteps: 'We\'ll map your current tool stack and create seamless integrations.'
      },
      'sales': {
        understanding: 'Lead generation and sales optimization are critical for growth.',
        solution: 'I can help track leads, automate follow-ups, and optimize your sales processes.',
        nextSteps: 'Let\'s analyze your sales funnel and identify conversion opportunities.'
      }
    };

    const challenge_key = challenge.toLowerCase().includes('scaling') ? 'scaling' :
                         challenge.toLowerCase().includes('manual') || challenge.toLowerCase().includes('efficiency') ? 'efficiency' :
                         challenge.toLowerCase().includes('data') ? 'data' :
                         challenge.toLowerCase().includes('communication') || challenge.toLowerCase().includes('team') ? 'communication' :
                         challenge.toLowerCase().includes('customer') ? 'customer' :
                         challenge.toLowerCase().includes('cash') || challenge.toLowerCase().includes('financial') ? 'finance' :
                         challenge.toLowerCase().includes('time') || challenge.toLowerCase().includes('productivity') ? 'time' :
                         challenge.toLowerCase().includes('integration') || challenge.toLowerCase().includes('tool') ? 'integration' :
                         challenge.toLowerCase().includes('lead') || challenge.toLowerCase().includes('sales') ? 'sales' : 'efficiency';

    return challengeData[challenge_key] || challengeData['efficiency'];
  };

  const getNextQuestion = async (step: number, userResponse?: string) => {
    await simulateTyping();

    const questions = [
      // Step 0: Introduction - already handled in useEffect
      null,
      
      // Step 1: Company Name Collection
      () => {
        completeStep('introduction');
        setShowTextInput(true);
        setTextInputPrompt('What\'s the name of your company?');
        setPendingStep(1);
        return `Excellent! I'm excited to work with you. 🚀

First, let me get to know your business better. What's the name of your company?`;
      },
      
      // Step 2: Industry Selection  
      (response: string) => {
        const companyData = { companyName: response };
        completeStep('company', companyData);
        return `Great to meet you, ${response}! 

Now, what industry best describes your business? This helps me understand your unique challenges and opportunities.`;
      },
      
      // Step 3: Role Selection
      (response: string) => {
        const businessData = { industry: response };
        completeStep('organization', businessData);
        
        // Check if they selected "Other" and need custom input
        if (response.includes('Other Industry')) {
          setShowTextInput(true);
          setTextInputPrompt('What industry is your business in?');
          setPendingStep(3);
          return `Perfect! 

What specific industry is your business in?`;
        }
        
        // Provide industry-specific insights
        const industryInsights = getIndustryInsights(response);
        
        return `Excellent! ${industryInsights.insight}

${industryInsights.challenges}

Now, what's your role at ${collectedData.companyName}? This helps me focus on what matters most to your day-to-day work:`;
      },
      
      // Step 4: Business Goals
      (response: string) => {
        const roleData = { role: response };
        completeStep('role', roleData);
        
        // Check if they selected "Other" and need custom input
        if (response.includes('Other Role')) {
          setShowTextInput(true);
          setTextInputPrompt('What\'s your specific role or title?');
          setPendingStep(4);
          return `Great! 

What's your specific role or title at ${collectedData.companyName || 'your company'}?`;
        }
        
        // Provide role-specific insights
        const roleInsights = getRoleInsights(response, collectedData.industry);
        
        return `Perfect! ${roleInsights.insight}

${roleInsights.focus}

What's your biggest challenge in this role right now? Choose what resonates most with your day-to-day experience:`;
      },
      
      // Step 5: Communication Preferences
      (response: string) => {
        const goalsData = { primaryChallenge: response };
        completeStep('goals', goalsData);
        
        // Check if they selected "Other" and need custom input
        if (response.includes('Other Challenge')) {
          setShowTextInput(true);
          setTextInputPrompt('What\'s your biggest business challenge?');
          setPendingStep(5);
          return `I'd love to help with that! 

What's your biggest business challenge or goal right now?`;
        }
        
        // Provide challenge-specific solutions
        const challengeInsights = getChallengeInsights(response, collectedData.role, collectedData.industry);
        
        return `${challengeInsights.understanding} 🎯

${challengeInsights.solution}

${challengeInsights.nextSteps}

One more thing - how would you prefer I communicate with you?`;
      },
      
      // Step 6: Setup Complete
      (response: string) => {
        const workingStyleData = { communicationStyle: response };
        completeStep('working-style', workingStyleData);
        
        return `Perfect! I've got everything I need to be your ideal AI assistant.

**🎉 Your Nexus workspace is now personalized for:**
• **Company:** ${collectedData.companyName || 'Your business'}
• **Industry:** ${collectedData.industry || 'Your sector'}
• **Role:** ${collectedData.role || 'Your position'}  
• **Focus:** ${collectedData.primaryChallenge || 'Your main goals'}
• **Style:** ${response}

I'm ready to help you streamline operations, make data-driven decisions, and achieve your business goals faster than ever before.

Ready to dive in?`;
      },
      
      // Step 7: Welcome & Complete
      (response: string) => {
        completeStep('partnership');
        
        return `🚀 **Welcome to Nexus, ${collectedData.companyName}!**

Your AI-powered business operating system is ready. I've already started setting up:

✅ **Smart dashboards** tailored to your role
✅ **Industry-specific workflows** for ${collectedData.industry}
✅ **Automated processes** to save you time
✅ **Communication preferences** that match your style

**What's Next:**
1. **Take a quick tour** of your personalized workspace
2. **Connect your tools** (CRM, email, project management)
3. **Get your first AI insights** about your business
4. **Start achieving your goals** with AI assistance

Ready to transform how you work?`;
      }
    ];

    const questionFn = questions[step];
    if (questionFn) {
      const content = questionFn(userResponse || '');
      const isComplete = step === 6;
      
      // Define structured options for each step
      const getStepSuggestions = (stepNumber: number) => {
        switch (stepNumber) {
          case 1: // Company Name - no suggestions, text input
            return [];
          case 2: // Industry
            return [
              '🏥 Healthcare & Medical',
              '🛒 E-commerce & Retail', 
              '💻 Technology & Software',
              '💰 Finance & Banking',
              '📈 Marketing & Advertising',
              '🏭 Manufacturing',
              '🎓 Education',
              '🏗️ Construction & Real Estate',
              '🍕 Food & Restaurant',
              '⚖️ Legal & Professional Services',
              '✨ Other Industry'
            ];
          case 3: // Role
            return [
              '👑 CEO / Founder',
              '⚙️ Operations Manager',
              '💼 Sales Professional', 
              '📊 Marketing Manager',
              '💳 Finance Professional',
              '👥 HR Manager',
              '🔧 Project Manager',
              '📈 Business Analyst',
              '🎯 Product Manager',
              '👤 Other Role'
            ];
          case 4: // Challenges
            return [
              '🚀 Scaling & Growth Issues',
              '⚡ Manual Processes & Inefficiency',
              '📊 Data Management & Insights',
              '👥 Team Communication & Coordination',
              '🎯 Customer Experience & Retention',
              '💰 Cash Flow & Financial Management',
              '⏰ Time Management & Productivity',
              '🔗 Integration & Tool Management',
              '📈 Lead Generation & Sales',
              '🎪 Other Challenge'
            ];
          case 5: // Communication Style
            return [
              '⚡ Quick & Direct Updates',
              '📝 Detailed Explanations',
              '🎯 Action-Focused Summaries',
              '💬 Conversational & Friendly',
              '📊 Data-Driven Reports',
              '🔄 Regular Check-ins'
            ];
          case 6: // Ready to start
            return [
              '🚀 Yes, let\'s get started!',
              '📊 Show me the dashboard',
              '🔗 Connect my tools first'
            ];
          case 7: // Final step
            return [
              '🎯 Start the tour',
              '🚀 Go to workspace',
              '🔗 Connect integrations'
            ];
          default:
            return ['Continue'];
        }
      };
      
      addMessage({
        role: 'assistant',
        content,
        type: isComplete ? 'relationship-building' : 'message',
        metadata: {
          step: onboardingSteps[step]?.id,
          emotion: isComplete ? 'celebratory' : step === 1 ? 'excited' : 'supportive',
          suggestions: getStepSuggestions(step)
        }
      });
      
      if (isComplete) {
        setTimeout(() => {
          completeStep('partnership');
          // Create a seamless transition to the main Executive Assistant
          setTimeout(() => {
            completeOnboarding();
          }, 3000);
        }, 1000);
      }
    }
  };

  // Helper functions to analyze responses and extract data
  const analyzeBusinessResponse = (response: string) => {
    const words = response.toLowerCase();
    let industry = 'general';
    let companyName = '';
    
    // Extract company name (basic heuristic)
    const sentences = response.split('.');
    for (const sentence of sentences) {
      const nameMatch = sentence.match(/(?:company|business|startup|firm|corp|inc|ltd|llc)?\s*(?:is|called|named)?\s*([A-Za-z][A-Za-z0-9\s&.,-]{1,30})/i);
      if (nameMatch) {
        companyName = nameMatch[1].trim();
        break;
      }
    }
    
    // Detect industry
    if (words.includes('health') || words.includes('medical') || words.includes('hospital')) {
      industry = 'healthcare';
    } else if (words.includes('ecommerce') || words.includes('retail') || words.includes('shop')) {
      industry = 'ecommerce';
    } else if (words.includes('software') || words.includes('tech') || words.includes('saas')) {
      industry = 'technology';
    } else if (words.includes('financial') || words.includes('finance') || words.includes('bank')) {
      industry = 'finance';
    } else if (words.includes('marketing') || words.includes('agency') || words.includes('advertising')) {
      industry = 'marketing';
    }
    
    return { companyName, industry, fullResponse: response };
  };

  const analyzeRoleResponse = (response: string) => {
    const words = response.toLowerCase();
    let roleType = 'general';
    let roleTitle = '';
    
    if (words.includes('ceo') || words.includes('founder') || words.includes('owner')) {
      roleType = 'executive';
      roleTitle = 'CEO/Founder';
    } else if (words.includes('operations') || words.includes('ops')) {
      roleType = 'operations';
      roleTitle = 'Operations Manager';
    } else if (words.includes('sales') || words.includes('revenue')) {
      roleType = 'sales';
      roleTitle = 'Sales Professional';
    } else if (words.includes('marketing') || words.includes('growth')) {
      roleType = 'marketing';
      roleTitle = 'Marketing Professional';
    } else if (words.includes('finance') || words.includes('accounting')) {
      roleType = 'finance';
      roleTitle = 'Finance Professional';
    }
    
    return { roleType, roleTitle, fullResponse: response };
  };

  const analyzeGoalsResponse = (response: string) => {
    const words = response.toLowerCase();
    const goals = [];
    
    if (words.includes('scale') || words.includes('grow') || words.includes('expand')) {
      goals.push('growth');
    }
    if (words.includes('automat') || words.includes('efficient') || words.includes('manual')) {
      goals.push('automation');
    }
    if (words.includes('data') || words.includes('insight') || words.includes('report')) {
      goals.push('analytics');
    }
    if (words.includes('customer') || words.includes('service') || words.includes('experience')) {
      goals.push('customer-experience');
    }
    if (words.includes('team') || words.includes('communication') || words.includes('coordination')) {
      goals.push('collaboration');
    }
    
    return { primaryGoals: goals, fullResponse: response };
  };

  const analyzeWorkingStyleResponse = (response: string) => {
    const words = response.toLowerCase();
    let communicationStyle = 'balanced';
    let proactivityLevel = 'moderate';
    let detailPreference = 'summary';
    
    if (words.includes('quick') || words.includes('brief') || words.includes('bullet')) {
      communicationStyle = 'concise';
      detailPreference = 'summary';
    } else if (words.includes('detailed') || words.includes('thorough') || words.includes('comprehensive')) {
      communicationStyle = 'detailed';
      detailPreference = 'comprehensive';
    }
    
    if (words.includes('proactive') || words.includes('suggest') || words.includes('recommend')) {
      proactivityLevel = 'high';
    } else if (words.includes('wait') || words.includes('ask') || words.includes('reactive')) {
      proactivityLevel = 'low';
    }
    
    return { communicationStyle, proactivityLevel, detailPreference, fullResponse: response };
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Add user message
    addMessage({
      role: 'user',
      content: suggestion,
      type: 'message'
    });

    // Move to next step and ask next question
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await getNextQuestion(nextStep, suggestion);
  };

  const handleTextSubmit = async () => {
    if (!textInputValue.trim()) return;

    // Add user message
    addMessage({
      role: 'user',
      content: textInputValue,
      type: 'message'
    });

    const response = textInputValue;
    setTextInputValue('');
    setShowTextInput(false);

    // Move to next step
    const nextStep = pendingStep ? pendingStep + 1 : currentStep + 1;
    setCurrentStep(nextStep);
    setPendingStep(null);
    await getNextQuestion(nextStep, response);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Progress Steps - Executive Assistant Meeting Flow */}
      <div className="border-b border-border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-2 sm:p-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground truncate">Meeting Your Executive Assistant</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        
        {/* Desktop: Horizontal progress bar */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                step.completed 
                  ? 'bg-success/20 text-success border border-success/30 shadow-sm'
                  : index === currentStep
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm scale-105'
                  : 'bg-background/60 text-muted-foreground border border-border'
              }`}>
                {step.completed ? <CheckCircle className="w-3 h-3" /> : step.icon}
                <div className="text-left">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs opacity-70 hidden lg:block">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        
        {/* Mobile: Compact progress indicator */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {steps[currentStep]?.completed ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                steps[currentStep]?.icon
              )}
              <span className="text-sm font-medium text-foreground">
                {steps[currentStep]?.title}
              </span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Messages - Executive Assistant Conversation */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 sm:gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.role === 'assistant' && (
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Nex - Executive Assistant
                  </div>
                )}
                
                <div className={`rounded-xl p-3 sm:p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto shadow-md'
                    : 'bg-card border border-border shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
                
                {/* Interactive Suggestions */}
                {message.role === 'assistant' && message.metadata?.suggestions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 sm:mt-4">
                    {message.metadata.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isTyping}
                        className="text-left text-sm px-4 py-3 bg-background border border-border rounded-lg hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <span className="group-hover:text-primary transition-colors">
                          {suggestion}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-1.5 sm:mt-2">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

                    {/* Typing indicator - Nex is thinking */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center shadow-lg">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Nex is thinking...
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
        {/* Extra padding to ensure last message is visible above input */}
        <div className="h-4"></div>
        </div>
      </div>

      {/* Input Area - Dynamic based on step */}
      <div className="border-t border-border bg-muted/30 p-3 sm:p-4 safe-area-inset-bottom flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          {showTextInput ? (
            // Text Input for specific information
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={textInputPrompt}
                  disabled={isTyping}
                  className="w-full resize-none border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px] sm:min-h-[52px] max-h-32 transition-all duration-200"
                  rows={1}
                />
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={!textInputValue.trim() || isTyping}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Instructions for clickable options
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                Click an option above to continue your conversation with Nex
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 