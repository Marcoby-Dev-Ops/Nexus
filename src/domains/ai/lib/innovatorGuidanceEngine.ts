/**
 * Innovator Guidance Engine
 * 
 * Designed specifically for innovators, thinkers, and self-starters who want to 
 * build businesses without formal business education. Provides approachable,
 * jargon-free guidance that makes business accessible to everyone.
 */

import { nexusUnifiedBrain } from '@/domains/ai/lib/nexusUnifiedBrain';

export interface InnovatorProfile {
  id: string;
  name: string;
  idea: string;
  passion: string;
  experience: 'first-time' | 'some-experience' | 'experienced';
  goals: string[];
  challenges: string[];
  currentStage: 'idea' | 'validation' | 'planning' | 'setup' | 'launch' | 'growth';
  progressMetrics: {
    stepsCompleted: number;
    totalSteps: number;
    confidenceLevel: number;
    timeSpent: number;
  };
}

export interface PlainLanguageGuidance {
  id: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  simpleSteps: Array<{
    step: number;
    action: string;
    explanation: string;
    timeEstimate: string;
    difficulty: 'easy' | 'medium' | 'hard';
    resources: string[];
  }>;
  commonMistakes: string[];
  successTips: string[];
  realWorldExample: string;
  nextActions: string[];
}

export interface BusinessStage {
  id: string;
  name: string;
  description: string;
  plainLanguageGoal: string;
  keyActivities: string[];
  successCriteria: string[];
  timeframe: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InnovatorMilestone {
  id: string;
  title: string;
  description: string;
  stage: string;
  isCompleted: boolean;
  completedAt?: Date;
  celebrationMessage: string;
  nextMilestone?: string;
}

export class InnovatorGuidanceEngine {
  private innovatorProfiles: Map<string, InnovatorProfile> = new Map();
  private businessStages: BusinessStage[] = [];
  private guidanceLibrary: Map<string, PlainLanguageGuidance> = new Map();

  constructor() {
    this.initializeBusinessStages();
    this.initializeGuidanceLibrary();
  }

  /**
   * Initialize the business stages for innovators
   */
  private initializeBusinessStages(): void {
    this.businessStages = [
      {
        id: 'idea',
        name: 'Idea Development',
        description: 'Turn your idea into something concrete',
        plainLanguageGoal: 'Figure out exactly what you want to build and who you want to help',
        keyActivities: [
          'Write down your idea clearly',
          'Identify who would benefit from your idea',
          'Research if similar things exist',
          'Talk to potential customers'
        ],
        successCriteria: [
          'You can explain your idea in one sentence',
          'You know who your customers are',
          'You understand what makes your idea different',
          'You have talked to at least 5 potential customers'
        ],
        timeframe: '1-2 weeks',
        difficulty: 'easy'
      },
      {
        id: 'validation',
        name: 'Idea Validation',
        description: 'Test if people actually want what you\'re offering',
        plainLanguageGoal: 'Make sure people will actually pay for your idea before you build it',
        keyActivities: [
          'Create a simple version to test',
          'Get feedback from real people',
          'Ask if people would pay for it',
          'Make improvements based on feedback'
        ],
        successCriteria: [
          'At least 10 people say they would buy it',
          'You have pre-orders or commitments',
          'People are excited about your idea',
          'You understand what features matter most'
        ],
        timeframe: '2-4 weeks',
        difficulty: 'medium'
      },
      {
        id: 'planning',
        name: 'Business Planning',
        description: 'Create a simple plan for your business',
        plainLanguageGoal: 'Figure out how to turn your validated idea into a real business',
        keyActivities: [
          'Write a simple business plan',
          'Figure out your pricing',
          'Plan how you\'ll reach customers',
          'Calculate basic finances'
        ],
        successCriteria: [
          'You have a one-page business plan',
          'You know how much to charge',
          'You have a plan to get customers',
          'You know how much money you need to start'
        ],
        timeframe: '1-2 weeks',
        difficulty: 'medium'
      },
      {
        id: 'setup',
        name: 'Business Setup',
        description: 'Handle the legal and administrative stuff',
        plainLanguageGoal: 'Get all the boring but necessary stuff done so you can focus on customers',
        keyActivities: [
          'Choose a business structure',
          'Register your business',
          'Get necessary licenses',
          'Set up basic accounting'
        ],
        successCriteria: [
          'Your business is legally registered',
          'You have all required licenses',
          'You can accept payments',
          'You\'re tracking income and expenses'
        ],
        timeframe: '1-3 weeks',
        difficulty: 'hard'
      },
      {
        id: 'launch',
        name: 'Launch',
        description: 'Get your first customers and start making money',
        plainLanguageGoal: 'Start selling to real customers and making your first revenue',
        keyActivities: [
          'Launch your product or service',
          'Execute your marketing plan',
          'Serve your first customers',
          'Collect feedback and improve'
        ],
        successCriteria: [
          'You have paying customers',
          'You\'re generating revenue',
          'Customers are satisfied',
          'You\'re learning and improving'
        ],
        timeframe: '2-8 weeks',
        difficulty: 'medium'
      },
      {
        id: 'growth',
        name: 'Growth',
        description: 'Scale your business and increase profits',
        plainLanguageGoal: 'Grow your customer base and increase your income consistently',
        keyActivities: [
          'Optimize your operations',
          'Expand your marketing',
          'Improve your product',
          'Build systems and processes'
        ],
        successCriteria: [
          'Revenue is growing monthly',
          'You have repeat customers',
          'Your business runs smoothly',
          'You\'re profitable'
        ],
        timeframe: 'Ongoing',
        difficulty: 'hard'
      }
    ];
  }

  /**
   * Initialize the guidance library with plain language explanations
   */
  private initializeGuidanceLibrary(): void {
    const guidanceItems: PlainLanguageGuidance[] = [
      {
        id: 'idea_validation',
        title: 'How to Test if Your Idea is Good',
        explanation: 'Before you spend time and money building something, you want to make sure people actually want it. This is called "validation" - basically proving your idea will work.',
        whyItMatters: 'Most businesses fail because they build something nobody wants. By testing first, you save time, money, and heartbreak.',
        simpleSteps: [
          {
            step: 1,
            action: 'Write down your idea in one simple sentence',
            explanation: 'If you can\'t explain it simply, it\'s probably too complicated',
            timeEstimate: '10 minutes',
            difficulty: 'easy',
            resources: ['Pen and paper', 'Clear thinking']
          },
          {
            step: 2,
            action: 'List 10 people who might want this',
            explanation: 'Think of specific people, not general groups like "everyone"',
            timeEstimate: '20 minutes',
            difficulty: 'easy',
            resources: ['Your network', 'Social media']
          },
          {
            step: 3,
            action: 'Talk to 5 of these people',
            explanation: 'Ask them about their problems, not about your solution',
            timeEstimate: '2-3 hours',
            difficulty: 'medium',
            resources: ['Phone calls', 'Coffee meetings']
          },
          {
            step: 4,
            action: 'Create a simple version to show them',
            explanation: 'This could be a drawing, website mockup, or basic prototype',
            timeEstimate: '3-5 hours',
            difficulty: 'medium',
            resources: ['Design tools', 'Basic materials']
          },
          {
            step: 5,
            action: 'Ask if they would pay for it',
            explanation: 'This is the ultimate test - are they willing to give you money?',
            timeEstimate: '1-2 hours',
            difficulty: 'hard',
            resources: ['Confidence', 'Clear pricing']
          }
        ],
        commonMistakes: [
          'Asking leading questions like "Would you buy this awesome product?"',
          'Only talking to friends and family who will be nice',
          'Falling in love with your idea and ignoring negative feedback',
          'Making it too complicated - keep it simple'
        ],
        successTips: [
          'Listen more than you talk',
          'Ask "why" to understand the real problem',
          'Look for patterns in what people say',
          'Be willing to change your idea based on feedback'
        ],
        realWorldExample: 'Sara had an idea for custom pet portraits. Instead of spending months learning to paint, she first posted on Facebook asking if friends would pay $50 for a portrait of their pet. She got 15 "yes" responses and 3 people paid upfront. Only then did she start the business.',
        nextActions: [
          'If people are excited: Move to business planning',
          'If feedback is mixed: Improve your idea and test again',
          'If nobody wants it: Don\'t worry! Try a different idea'
        ]
      },
      {
        id: 'simple_business_plan',
        title: 'Creating a Business Plan That Actually Helps',
        explanation: 'A business plan is just a way to think through your business before you start. It doesn\'t need to be fancy - it just needs to help you make good decisions.',
        whyItMatters: 'Planning helps you avoid expensive mistakes and gives you confidence that your business can work.',
        simpleSteps: [
          {
            step: 1,
            action: 'Describe what you\'re selling in one paragraph',
            explanation: 'Keep it simple - what do you offer and who is it for?',
            timeEstimate: '15 minutes',
            difficulty: 'easy',
            resources: ['Your validated idea']
          },
          {
            step: 2,
            action: 'List your target customers',
            explanation: 'Be specific - age, location, interests, problems they have',
            timeEstimate: '20 minutes',
            difficulty: 'easy',
            resources: ['Customer research']
          },
          {
            step: 3,
            action: 'Figure out your pricing',
            explanation: 'Look at competitors and consider what customers said they\'d pay',
            timeEstimate: '30 minutes',
            difficulty: 'medium',
            resources: ['Competitor research', 'Customer feedback']
          },
          {
            step: 4,
            action: 'Plan how you\'ll reach customers',
            explanation: 'Where do your customers hang out? How will you tell them about your business?',
            timeEstimate: '45 minutes',
            difficulty: 'medium',
            resources: ['Marketing knowledge', 'Social media']
          },
          {
            step: 5,
            action: 'Calculate basic numbers',
            explanation: 'How much will it cost to start? How much could you make?',
            timeEstimate: '1 hour',
            difficulty: 'hard',
            resources: ['Calculator', 'Research on costs']
          }
        ],
        commonMistakes: [
          'Making it too long and complicated',
          'Being overly optimistic about sales',
          'Forgetting about costs like taxes and marketing',
          'Not updating it as you learn more'
        ],
        successTips: [
          'Keep it to one page if possible',
          'Be conservative with revenue estimates',
          'Include a buffer for unexpected costs',
          'Update it regularly as you learn'
        ],
        realWorldExample: 'Mike wanted to start a lawn care business. His one-page plan included: target customers (busy homeowners), pricing ($40/visit), marketing (door-to-door in nice neighborhoods), and costs ($200 for equipment). He started with 5 customers and grew from there.',
        nextActions: [
          'Use your plan to guide your setup decisions',
          'Share it with a mentor or advisor for feedback',
          'Update it as you learn more about your market'
        ]
      },
      {
        id: 'first_customers',
        title: 'Getting Your First Customers',
        explanation: 'Getting your first customers is often the hardest part, but it\'s also the most important. These early customers will teach you how to improve and help you grow.',
        whyItMatters: 'Your first customers prove your business works and provide valuable feedback to make it better.',
        simpleSteps: [
          {
            step: 1,
            action: 'Start with people you know',
            explanation: 'Friends, family, and colleagues are often your first customers',
            timeEstimate: '1-2 days',
            difficulty: 'easy',
            resources: ['Your network', 'Social media']
          },
          {
            step: 2,
            action: 'Offer a special deal for early customers',
            explanation: 'Discount or bonus for being first - people love getting a good deal',
            timeEstimate: '30 minutes',
            difficulty: 'easy',
            resources: ['Pricing flexibility']
          },
          {
            step: 3,
            action: 'Ask for referrals',
            explanation: 'Happy customers are your best marketers',
            timeEstimate: 'Ongoing',
            difficulty: 'medium',
            resources: ['Great service', 'Referral incentives']
          },
          {
            step: 4,
            action: 'Go where your customers are',
            explanation: 'Online groups, local events, or places they shop',
            timeEstimate: '2-4 hours per week',
            difficulty: 'medium',
            resources: ['Research', 'Time', 'Networking']
          },
          {
            step: 5,
            action: 'Provide amazing service',
            explanation: 'Exceed expectations so they tell others about you',
            timeEstimate: 'Always',
            difficulty: 'hard',
            resources: ['Attention to detail', 'Customer focus']
          }
        ],
        commonMistakes: [
          'Waiting for customers to find you',
          'Being afraid to ask for the sale',
          'Not following up with interested people',
          'Focusing on perfection instead of getting started'
        ],
        successTips: [
          'Be genuinely helpful, not just salesy',
          'Follow up consistently but not annoyingly',
          'Ask for feedback and actually use it',
          'Celebrate every single customer win'
        ],
        realWorldExample: 'Lisa started a tutoring business by posting in local parent Facebook groups. She offered the first session free and asked satisfied parents to refer friends. Within a month, she had 12 regular students just from referrals.',
        nextActions: [
          'Track which methods work best for getting customers',
          'Focus your time on the most effective approaches',
          'Build systems to stay in touch with customers'
        ]
      }
    ];

    guidanceItems.forEach(guidance => {
      this.guidanceLibrary.set(guidance.id, guidance);
    });
  }

  /**
   * Create a new innovator profile
   */
  createInnovatorProfile(profileData: Omit<InnovatorProfile, 'id' | 'currentStage' | 'progressMetrics'>): InnovatorProfile {
    const profile: InnovatorProfile = {
      ...profileData,
      id: `innovator_${Date.now()}`,
      currentStage: 'idea',
      progressMetrics: {
        stepsCompleted: 0,
        totalSteps: this.getTotalStepsForJourney(),
        confidenceLevel: 0.3, // Start with low confidence
        timeSpent: 0
      }
    };

    this.innovatorProfiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Get personalized guidance for an innovator
   */
  getPersonalizedGuidance(innovatorId: string): PlainLanguageGuidance | null {
    const profile = this.innovatorProfiles.get(innovatorId);
    if (!profile) return null;

    // Get guidance based on current stage
    const guidanceKey = this.getGuidanceKeyForStage(profile.currentStage);
    return this.guidanceLibrary.get(guidanceKey) || null;
  }

  /**
   * Get the next steps for an innovator based on their current stage
   */
  getNextSteps(innovatorId: string): Array<{
    title: string;
    description: string;
    difficulty: string;
    timeEstimate: string;
    isUrgent: boolean;
  }> {
    const profile = this.innovatorProfiles.get(innovatorId);
    if (!profile) return [];

    const currentStage = this.businessStages.find(stage => stage.id === profile.currentStage);
    if (!currentStage) return [];

    return currentStage.keyActivities.map((activity, index) => ({
      title: activity,
      description: this.getActivityDescription(activity),
      difficulty: index < 2 ? 'easy' : 'medium',
      timeEstimate: this.getActivityTimeEstimate(activity),
      isUrgent: index === 0 // First activity is always urgent
    }));
  }

  /**
   * Provide encouragement and motivation tailored to the innovator
   */
  getEncouragement(innovatorId: string): {
    message: string;
    tip: string;
    celebration?: string;
  } {
    const profile = this.innovatorProfiles.get(innovatorId);
    if (!profile) return { message: '', tip: '' };

    const encouragements = this.getEncouragementByExperience(profile.experience);
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    const tips = this.getTipsByStage(profile.currentStage);
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    let celebration;
    if (profile.progressMetrics.stepsCompleted > 0) {
      celebration = this.getCelebrationMessage(profile.progressMetrics.stepsCompleted);
    }

    return {
      message: randomEncouragement,
      tip: randomTip,
      celebration
    };
  }

  /**
   * Handle challenges and provide solutions
   */
  addressChallenge(innovatorId: string, challenge: string): {
    understanding: string;
    solution: string;
    resources: string[];
    encouragement: string;
  } {
    const challengeSolutions: Record<string, any> = {
      "I don't know where to start": {
        understanding: "Starting is the hardest part! It's completely normal to feel overwhelmed.",
        solution: "Let's break it down into tiny steps. Today, just write down your idea in one sentence. That's it!",
        resources: ["Step-by-step checklist", "Video tutorials", "One-on-one guidance"],
        encouragement: "Every successful business started with someone feeling exactly like you do right now."
      },
      "I'm worried about money/funding": {
        understanding: "Money worries are real, and it's smart to think about this early.",
        solution: "Start with the minimum viable version. Most successful businesses started with very little money.",
        resources: ["Bootstrap funding guide", "Low-cost business ideas", "Revenue-first strategies"],
        encouragement: "Some of the biggest companies started in garages with almost no money. Your idea matters more than your budget."
      },
      "I don't understand business terms": {
        understanding: "Business jargon can be confusing and intimidating. You're not alone!",
        solution: "We explain everything in plain English. No MBA required - just common sense and good guidance.",
        resources: ["Plain English business dictionary", "Simple explanations", "Visual guides"],
        encouragement: "The best entrepreneurs focus on solving problems, not memorizing business terms."
      },
      "I'm afraid of failing": {
        understanding: "Fear of failure is natural. It shows you care about succeeding!",
        solution: "Start small and test everything. Small failures teach you how to create big successes.",
        resources: ["Risk management strategies", "Success stories", "Failure recovery plans"],
        encouragement: "Every entrepreneur fails at something. The successful ones learn from it and keep going."
      }
    };

    return challengeSolutions[challenge] || {
      understanding: "That's a valid concern that many entrepreneurs face.",
      solution: "Let's work together to find a solution that fits your situation.",
      resources: ["Personalized guidance", "Community support", "Expert advice"],
      encouragement: "You've got this! Every challenge is just a problem waiting for a creative solution."
    };
  }

  /**
   * Update progress and advance to next stage if ready
   */
  updateProgress(innovatorId: string, completedStep: string): {
    newStage?: string;
    celebration?: string;
    nextGuidance?: PlainLanguageGuidance;
  } {
    const profile = this.innovatorProfiles.get(innovatorId);
    if (!profile) return {};

    // Update progress metrics
    profile.progressMetrics.stepsCompleted++;
    profile.progressMetrics.confidenceLevel = Math.min(
      profile.progressMetrics.confidenceLevel + 0.1,
      1.0
    );

    // Check if ready for next stage
    const currentStage = this.businessStages.find(stage => stage.id === profile.currentStage);
    if (currentStage && this.isReadyForNextStage(profile, currentStage)) {
      const nextStage = this.getNextStage(profile.currentStage);
      if (nextStage) {
        profile.currentStage = nextStage.id;
        const celebration = `🎉 Congratulations! You've completed ${currentStage.name} and are ready for ${nextStage.name}!`;
        const nextGuidance = this.getPersonalizedGuidance(innovatorId);
        
        return { newStage: nextStage.id, celebration, nextGuidance: nextGuidance || undefined };
      }
    }

    return {};
  }

  /**
   * Get success stories relevant to the innovator's situation
   */
  getRelevantSuccessStories(innovatorId: string): Array<{
    name: string;
    background: string;
    challenge: string;
    solution: string;
    outcome: string;
    lesson: string;
  }> {
    const profile = this.innovatorProfiles.get(innovatorId);
    if (!profile) return [];

    // Return stories based on their challenges and stage
    const stories = [
      {
        name: "Maria Garcia",
        background: "Single mom working two jobs",
        challenge: "No time or money to start a business",
        solution: "Started selling homemade salsa on weekends at farmers markets",
        outcome: "Now has a $200K/year food business with 3 employees",
        lesson: "Start small and grow gradually - you don't need to quit your job immediately"
      },
      {
        name: "James Chen",
        background: "High school dropout, worked in construction",
        challenge: "No business education or formal training",
        solution: "Used Nexus to learn business basics while starting a handyman service",
        outcome: "Built a $500K/year home services company",
        lesson: "Practical experience and good guidance matter more than formal education"
      },
      {
        name: "Sarah Williams",
        background: "Nurse who loved crafting",
        challenge: "Afraid to leave secure job for uncertain business",
        solution: "Started Etsy shop while working, gradually built customer base",
        outcome: "Left nursing to run $300K/year craft business",
        lesson: "You can test and build your business while keeping your day job"
      }
    ];

    // Filter stories based on innovator's challenges
    return stories.filter(story => 
      profile.challenges.some(challenge => 
        story.challenge.toLowerCase().includes(challenge.toLowerCase().substring(0, 10))
      )
    ).slice(0, 2);
  }

  /**
   * Helper methods
   */
  private getTotalStepsForJourney(): number {
    return this.businessStages.reduce((total, stage) => total + stage.keyActivities.length, 0);
  }

  private getGuidanceKeyForStage(stage: string): string {
    const stageGuidanceMap: Record<string, string> = {
      'idea': 'idea_validation',
      'validation': 'idea_validation',
      'planning': 'simple_business_plan',
      'setup': 'simple_business_plan',
      'launch': 'first_customers',
      'growth': 'first_customers'
    };
    return stageGuidanceMap[stage] || 'idea_validation';
  }

  private getActivityDescription(activity: string): string {
    const descriptions: Record<string, string> = {
      'Write down your idea clearly': 'Put your idea into words that anyone can understand',
      'Identify who would benefit from your idea': 'Figure out exactly who your customers are',
      'Research if similar things exist': 'See what competitors are doing and how you can be different',
      'Talk to potential customers': 'Have real conversations with people who might buy from you'
    };
    return descriptions[activity] || 'Complete this important step in your business journey';
  }

  private getActivityTimeEstimate(activity: string): string {
    const timeEstimates: Record<string, string> = {
      'Write down your idea clearly': '30 minutes',
      'Identify who would benefit from your idea': '1 hour',
      'Research if similar things exist': '2-3 hours',
      'Talk to potential customers': '3-5 hours'
    };
    return timeEstimates[activity] || '1-2 hours';
  }

  private getEncouragementByExperience(experience: string): string[] {
    const encouragements: Record<string, string[]> = {
      'first-time': [
        "Every expert was once a beginner. You're taking the first step toward something amazing!",
        "Your fresh perspective is actually an advantage - you'll see opportunities others miss!",
        "The fact that you're starting shows incredible courage. That's the most important ingredient for success!",
        "Don't worry about not knowing everything. The best entrepreneurs learn as they go!"
      ],
      'some-experience': [
        "Your previous experience gives you a head start. Trust what you've learned!",
        "You've already proven you can learn and adapt. Now let's apply that to your business!",
        "Building on what you know while learning new skills is the perfect combination!",
        "Your experience helps you avoid common mistakes that trip up first-timers!"
      ],
      'experienced': [
        "Your experience is a huge asset. Now let's channel that into this new venture!",
        "You know what works and what doesn't. That knowledge is incredibly valuable!",
        "Experienced entrepreneurs like you are more likely to succeed because you understand the process!",
        "Your track record shows you can build something successful. Let's do it again!"
      ]
    };
    return encouragements[experience] || encouragements['first-time'];
  }

  private getTipsByStage(stage: string): string[] {
    const tips: Record<string, string[]> = {
      'idea': [
        "Write your idea down - it helps clarify your thinking",
        "Talk to potential customers early and often",
        "Don't worry about being perfect, worry about being helpful",
        "Keep it simple - complexity kills good ideas"
      ],
      'validation': [
        "Ask about problems, not solutions",
        "Look for patterns in what people tell you",
        "Be willing to change your idea based on feedback",
        "Small tests save big mistakes"
      ],
      'planning': [
        "Keep your plan simple and actionable",
        "Be conservative with revenue estimates",
        "Plan for things to take longer than expected",
        "Focus on your first customers, not your hundredth"
      ],
      'setup': [
        "Start simple and add complexity later",
        "Get help with legal stuff - it's worth the cost",
        "Set up good record-keeping from the start",
        "Don't let paperwork stop you from serving customers"
      ],
      'launch': [
        "Done is better than perfect",
        "Your first customers will teach you the most",
        "Focus on making people happy, not making everything perfect",
        "Celebrate every single customer win"
      ],
      'growth': [
        "Systems and processes are your friend",
        "Hire slowly and fire quickly",
        "Keep learning from your customers",
        "Don't grow faster than you can handle"
      ]
    };
    return tips[stage] || tips['idea'];
  }

  private getCelebrationMessage(stepsCompleted: number): string {
    const milestones = [
      { steps: 1, message: "🎉 You took the first step! That's often the hardest one!" },
      { steps: 5, message: "🚀 You're building momentum! Keep going!" },
      { steps: 10, message: "💪 You're really making progress! Your business is taking shape!" },
      { steps: 20, message: "⭐ Amazing progress! You're becoming a real entrepreneur!" },
      { steps: 50, message: "🏆 Incredible! You've come so far from where you started!" }
    ];

    const milestone = milestones.reverse().find(m => stepsCompleted >= m.steps);
    return milestone?.message || "🎯 Every step forward is progress worth celebrating!";
  }

  private isReadyForNextStage(profile: InnovatorProfile, currentStage: BusinessStage): boolean {
    // Simple logic: completed at least 75% of key activities
    const completedActivities = profile.progressMetrics.stepsCompleted;
    const stageActivities = currentStage.keyActivities.length;
    return completedActivities >= Math.ceil(stageActivities * 0.75);
  }

  private getNextStage(currentStageId: string): BusinessStage | null {
    const currentIndex = this.businessStages.findIndex(stage => stage.id === currentStageId);
    if (currentIndex >= 0 && currentIndex < this.businessStages.length - 1) {
      return this.businessStages[currentIndex + 1];
    }
    return null;
  }

  /**
   * Public getters
   */
  getInnovatorProfile(innovatorId: string): InnovatorProfile | undefined {
    return this.innovatorProfiles.get(innovatorId);
  }

  getAllBusinessStages(): BusinessStage[] {
    return this.businessStages;
  }

  getGuidanceLibrary(): PlainLanguageGuidance[] {
    return Array.from(this.guidanceLibrary.values());
  }
}

// Global innovator guidance engine instance
export const innovatorGuidanceEngine = new InnovatorGuidanceEngine(); 