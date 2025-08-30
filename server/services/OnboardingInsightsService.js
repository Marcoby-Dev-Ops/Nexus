const { logger } = require('../src/utils/logger');
const { NexusAIGatewayService } = require('./NexusAIGatewayService');
const { InsightsAnalyticsService } = require('./InsightsAnalyticsService');

// System user ID for onboarding and system-level operations
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Server-side OnboardingInsightsService
 * Generates AI-powered insights for user onboarding
 */
class OnboardingInsightsService {
  constructor() {
    this.aiGateway = new NexusAIGatewayService();
    this.analyticsService = new InsightsAnalyticsService();
  }

  /**
   * Generate AI-powered insights for onboarding
   */
  async generateOnboardingInsights(context) {
    try {
      logger.info('Generating onboarding insights', { 
        company: context.user?.company, 
        industry: context.user?.industry,
        integrationCount: context.selectedIntegrations?.length || 0 
      });

      // Check if we should use low-cost mode (skip AI for now due to low credits)
      const lowCostMode = process.env.LOW_COST_MODE === 'true' || process.env.OPENAI_LOW_CREDITS === 'true';
      
      if (lowCostMode) {
        logger.info('Using low-cost mode - skipping AI calls to preserve credits');
        const fallbackInsights = this.generateFallbackInsights(context);
        return {
          success: true,
          data: fallbackInsights,
          maturityScore: this.calculateMaturityScore(context, fallbackInsights)
        };
      }

      // Build comprehensive context for AI analysis
      const businessContext = this.buildBusinessContext(context);
      
      // Generate insights using AI with proper user scoping
      const aiResponse = await this.aiGateway.chat({
        role: 'chat',
        messages: [
          {
            role: 'system',
                         content: `You are an expert business advisor specializing in helping entrepreneurs maximize the value of their existing tools and systems.

Your task is to analyze the provided business context and generate 3-5 actionable insights that will help this business owner optimize their current tools and improve their operations.

IMPORTANT: This is the INITIALIZATION of their personalized AI knowledge base (RAG system). The insights you generate will become the foundation for all future AI interactions with this user. Every piece of information you reference will be stored and used to provide increasingly personalized assistance.

CRITICAL PERSONALIZATION REQUIREMENTS:
- ADDRESS THEM BY NAME: Use their first name when possible to create a personal connection
- REFERENCE THEIR SPECIFIC COMPANY: Mention their company name in insights to show you understand their business
- ACKNOWLEDGE THEIR INDUSTRY: Show deep understanding of their industry's unique challenges and opportunities
- REFERENCE THEIR SPECIFIC TOOLS: Mention their actual tool names and show you understand their current setup
- ADDRESS THEIR SPECIFIC PRIORITIES: Connect insights directly to the priorities they've stated
- CONSIDER THEIR COMPANY SIZE: Tailor recommendations to their specific company size and growth stage
- BUILD KNOWLEDGE FOUNDATION: Create insights that will serve as the foundation for their personalized AI knowledge base

ADAPTIVE GUIDELINES:
- BE CONSERVATIVE IN ASSESSMENTS: If you don't have enough information, default to beginner-level recommendations
- ADAPT TO USER SOPHISTICATION: Tailor complexity and implementation approach to their technical level (consider confidence levels)
- CONSIDER IMPLEMENTATION CAPACITY: Ensure recommendations match their ability to implement changes
- FOCUS ON OPTIMIZING EXISTING TOOLS: Prioritize maximizing the value of tools they already have
- AVOID SUGGESTING NEW TOOLS: Only recommend new tools if absolutely necessary and clearly more valuable than optimizing existing ones
- LEVERAGE CURRENT INTEGRATIONS: Show them how to get more value from their existing integrations
- UNLOCK HIDDEN FEATURES: Identify underutilized features in their current tools
- AUTOMATION OPPORTUNITIES: Find ways to automate workflows using their existing stack
- INDUSTRY-SPECIFIC FOCUS: Consider their industry's unique challenges and opportunities
- ACKNOWLEDGE DATA LIMITATIONS: If confidence levels are low, acknowledge that recommendations are based on limited information

COMPLEXITY ADAPTATION:
- BEGINNER USERS: Focus on basic optimizations, simple automations, and foundational improvements
- INTERMEDIATE USERS: Include moderate complexity optimizations and workflow improvements
- ADVANCED USERS: Provide sophisticated automation and advanced feature utilization

PERSONALIZATION TECHNIQUES:
- Start insights with phrases like "Based on your [industry] business..." or "For [Company Name]..."
- Reference their specific tools: "Your [Tool Name] integration can..."
- Connect to their priorities: "This aligns with your priority of [specific priority]..."
- Show industry expertise: "In the [industry] space, companies like yours typically..."
- Acknowledge their sophistication level: "Given your [level] setup, you're ready to..."

For each insight, provide:
- A clear, specific title focused on optimizing existing tools (include their company name and relevant building block when relevant)
- A detailed description explaining the opportunity or issue (tailored to their sophistication level and specific context, mentioning the building block)
- Impact level (Low/Medium/High/Critical)
- Confidence score (0-100) - consider the confidence factors provided
- Specific action item using their current tools (with complexity matching their level)
- Brief reasoning for the recommendation (connect to their specific situation and building block improvement)
- Estimated value if applicable
- Timeframe for implementation (realistic for their capacity)
- Implementation difficulty (Beginner/Intermediate/Advanced)
- Category: The business building block this addresses (Identity, Revenue, Delivery, People, Money, Knowledge, Governance)

Focus on practical, implementable advice that maximizes their current tool stack and addresses their stated priorities. Ensure the complexity and implementation approach matches their sophistication level. Most importantly, make them feel like you truly understand their specific business and situation.

Return your response as a JSON array of insights.`
          },
          {
            role: 'user',
            content: businessContext
          }
        ],
        tenantId: 'onboarding',
        sensitivity: 'internal',
        json: true,
        userId: context.user.id && context.user.id !== 'onboarding' ? context.user.id : SYSTEM_USER_ID,
        orgId: context.user.org_id || null
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI service failed');
      }

      // Parse AI response and transform into structured insights
      const insights = this.parseAIInsights(aiResponse.data.message, context);
      
      // Calculate maturity score based on insights and context
      const maturityScore = this.calculateMaturityScore(context, insights);

      // Store insights analytics for trend analysis
      try {
        logger.info('Starting analytics storage...', { 
          userId: context.user.id,
          industry: context.user.industry,
          insightCount: insights.length 
        });
        
        const userSophistication = this.detectUserSophistication(context);
        const confidenceFactors = this.calculateConfidenceFactors(context);
        const maturityLevel = this.extractMaturityLevel(context);
        
        logger.info('Analytics context prepared', {
          maturityLevel,
          sophisticationLevel: userSophistication.level,
          confidenceScore: confidenceFactors.overallConfidence,
          dataCompletenessScore: confidenceFactors.dataCompleteness
        });
        
        const analyticsId = await this.analyticsService.storeInsightsAnalytics(
          {
            ...context,
            maturityLevel,
            sophisticationLevel: userSophistication.level,
            confidenceScore: confidenceFactors.overallConfidence,
            dataCompletenessScore: confidenceFactors.dataCompleteness
          },
          insights,
          {
            maturityScore,
            userSophistication,
            confidenceFactors
          }
        );
        
        logger.info('Insights analytics stored for trend analysis', { analyticsId });
      } catch (analyticsError) {
        logger.error('Failed to store insights analytics', { 
          error: analyticsError.message,
          stack: analyticsError.stack,
          userId: context.user.id 
        });
        // Don't fail the main operation if analytics storage fails
      }

      // Initialize RAG system with user's business context and insights (skip in low-cost mode)
      if (!lowCostMode) {
        await this.initializeUserRAGSystem(context, insights);
      } else {
        logger.info('Skipping RAG initialization due to low-cost mode');
      }

      logger.info('Generated insights successfully', { 
        insightCount: insights.length, 
        maturityScore 
      });

      return {
        success: true,
        data: insights,
        maturityScore
      };
    } catch (error) {
      logger.error('Error generating onboarding insights', { error: error.message });
      
      // Fallback to contextual mock insights if AI fails
      const fallbackInsights = this.generateFallbackInsights(context);
      return {
        success: true,
        data: fallbackInsights,
        maturityScore: this.calculateMaturityScore(context, fallbackInsights)
      };
    }
  }

  /**
   * Build comprehensive business context for AI analysis
   */
  buildBusinessContext(context) {
    const { user, selectedIntegrations, selectedTools } = context;
    
    // Enhanced context analysis
    const userSophistication = this.detectUserSophistication(context);
    const maturityContext = this.getMaturityContext(context);
    const industrySpecificContext = this.getIndustrySpecificContext(context);
    const confidenceFactors = this.calculateConfidenceFactors(context);
    const buildingBlocksContext = this.generateBuildingBlocksContext(user.keyPriorities || [], selectedTools || {}, user.industry, user.companySize);
    
    const toolCategories = Object.entries(selectedTools || {}).map(([category, tools]) => 
      `${category}: ${tools.join(', ')}`
    ).join('\n');

    const integrationList = selectedIntegrations?.length > 0 
      ? selectedIntegrations.join(', ') 
      : 'None yet';

         return `
BUSINESS ANALYSIS CONTEXT - RAG SYSTEM INITIALIZATION

This analysis will initialize ${user.firstName}'s personalized AI knowledge base. Every insight generated will become part of their ongoing AI assistance foundation.

PERSONAL DETAILS:
- Name: ${user.firstName} ${user.lastName}
- Company: ${user.company || 'Not specified'}
- Industry: ${user.industry || 'Not specified'}
- Company Size: ${user.companySize || 'Not specified'}
- Key Priorities: ${user.keyPriorities?.length > 0 ? user.keyPriorities.join(', ') : 'Not specified'}

${buildingBlocksContext}

USER SOPHISTICATION LEVEL: ${userSophistication.level} (${userSophistication.confidence})
- Technical Expertise: ${userSophistication.technicalLevel}
- Implementation Capacity: ${userSophistication.implementationCapacity}
- Tool Adoption Readiness: ${userSophistication.toolAdoption}
- Assessment Score: ${userSophistication.score}/15

BUSINESS MATURITY CONTEXT:
${maturityContext}

CURRENT TOOL STACK:
${toolCategories}

ACTIVE INTEGRATIONS:
${integrationList}

INDUSTRY-SPECIFIC CONTEXT:
${industrySpecificContext}

CONFIDENCE FACTORS:
- Data Completeness: ${confidenceFactors.dataCompleteness}%
- Industry Alignment: ${confidenceFactors.industryAlignment}%
- Tool Specificity: ${confidenceFactors.toolSpecificity}%

PERSONALIZATION GUIDELINES:
- Address ${user.firstName} directly when appropriate
- Reference ${user.company} specifically in insights
- Connect recommendations to their stated priorities: ${user.keyPriorities.join(', ')}
- Show understanding of their ${user.industry} industry challenges
- Consider their ${user.companySize} company size and growth stage
- Reference their specific tools: ${Object.values(selectedTools || {}).flat().join(', ')}
- Acknowledge their ${userSophistication.level} sophistication level

RAG INITIALIZATION REQUIREMENTS:
- Create insights that will serve as the foundation for future AI interactions
- Build context that can be referenced and built upon over time
- Establish patterns for personalized recommendations
- Set the tone for ongoing AI assistance
- Create a knowledge base that grows with the user

ANALYSIS REQUIREMENTS:
1. MAXIMIZE EXISTING TOOLS: Focus on optimizing and getting more value from their current tool stack
2. UNLOCK HIDDEN FEATURES: Identify underutilized capabilities in their existing tools
3. AUTOMATE WITH CURRENT STACK: Find automation opportunities using their existing integrations
4. LEVERAGE INTEGRATIONS: Show how to get more value from their current integrations
5. AVOID NEW TOOL RECOMMENDATIONS: Only suggest new tools if absolutely necessary and clearly superior
6. ADAPT TO USER LEVEL: Provide insights appropriate for ${userSophistication.level} sophistication
7. CONSIDER IMPLEMENTATION CAPACITY: Ensure recommendations match their ${userSophistication.implementationCapacity} capacity
8. PERSONALIZE EVERYTHING: Make ${user.firstName} feel like you truly understand ${user.company}'s specific situation
9. BUILD KNOWLEDGE FOUNDATION: Create insights that will become part of their personalized AI knowledge base

Please generate 3-5 high-quality, actionable business insights that will help ${user.firstName} and ${user.company} maximize the value of their existing tools and improve their operations. These insights will become the foundation of their personalized AI knowledge base, so make them comprehensive, specific, and actionable. Make them feel like you've been studying their business specifically and are building a knowledge foundation for ongoing AI assistance.
    `.trim();
  }

  /**
   * Detect user sophistication level based on context
   */
  detectUserSophistication(context) {
    const { user, selectedIntegrations, selectedTools } = context;
    
    // Calculate sophistication based on multiple factors
    let sophisticationScore = 0;
    
    // Check data completeness first
    const hasCompanyInfo = user.company && user.company.trim() !== '';
    const hasIndustryInfo = user.industry && user.industry !== 'Other';
    const hasSizeInfo = user.companySize && user.companySize !== '';
    const hasTools = Object.keys(selectedTools || {}).length > 0;
    const hasIntegrations = selectedIntegrations?.length > 0;
    
    const dataCompleteness = [hasCompanyInfo, hasIndustryInfo, hasSizeInfo, hasTools, hasIntegrations]
      .filter(Boolean).length;
    
    // If we don't have enough data, default to Beginner
    if (dataCompleteness < 2) {
      return {
        level: 'Beginner',
        technicalLevel: 'Low',
        implementationCapacity: 'Low',
        toolAdoption: 'Focus on basic optimization',
        score: 0,
        confidence: 'Low - Limited data available'
      };
    }
    
    // Tool stack complexity (more conservative scoring)
    const toolCount = Object.values(selectedTools || {}).flat().length;
    if (toolCount >= 10) sophisticationScore += 3;
    else if (toolCount >= 6) sophisticationScore += 2;
    else if (toolCount >= 3) sophisticationScore += 1;
    
    // Integration complexity (more conservative)
    if (selectedIntegrations?.length >= 6) sophisticationScore += 2;
    else if (selectedIntegrations?.length >= 4) sophisticationScore += 1;
    
    // Company size factor (more conservative)
    const sizeFactors = {
      '1-10': 1,
      '11-50': 1,
      '51-200': 2,
      '201-1000': 3,
      '1000+': 4
    };
    sophisticationScore += sizeFactors[user.companySize] || 0;
    
    // Industry sophistication (only if we have clear industry data)
    if (hasIndustryInfo) {
      const sophisticatedIndustries = ['SaaS', 'Technology', 'Finance', 'Healthcare'];
      if (sophisticatedIndustries.includes(user.industry)) {
        sophisticationScore += 1;
      }
    }
    
    // Determine level with more conservative thresholds
    let level, technicalLevel, implementationCapacity, toolAdoption, confidence;
    
    if (sophisticationScore >= 10 && dataCompleteness >= 4) {
      level = 'Advanced';
      technicalLevel = 'High';
      implementationCapacity = 'High';
      toolAdoption = 'Ready for advanced features';
      confidence = 'High';
    } else if (sophisticationScore >= 6 && dataCompleteness >= 3) {
      level = 'Intermediate';
      technicalLevel = 'Medium';
      implementationCapacity = 'Medium';
      toolAdoption = 'Ready for intermediate features';
      confidence = 'Medium';
    } else {
      level = 'Beginner';
      technicalLevel = 'Low';
      implementationCapacity = 'Low';
      toolAdoption = 'Focus on basic optimization';
      confidence = dataCompleteness >= 3 ? 'Medium' : 'Low';
    }
    
    return { 
      level, 
      technicalLevel, 
      implementationCapacity, 
      toolAdoption, 
      score: sophisticationScore,
      confidence: `${confidence} - Based on ${dataCompleteness}/5 data points`
    };
  }

  /**
   * Get business maturity context
   */
  getMaturityContext(context) {
    const { user, selectedIntegrations, selectedTools } = context;
    
    const toolCategories = Object.keys(selectedTools || {}).length;
    const integrationCount = selectedIntegrations?.length || 0;
    const priorityCount = user.keyPriorities?.length || 0;
    
    // More conservative assessment - require stronger evidence for higher maturity levels
    let maturityStage = 'Early Stage';
    let maturityDescription = '';
    let confidenceLevel = 'Low';
    
    // Check if we have enough data to make a reliable assessment
    const hasCompanyInfo = user.company && user.company.trim() !== '';
    const hasIndustryInfo = user.industry && user.industry !== 'Other';
    const hasSizeInfo = user.companySize && user.companySize !== '';
    const hasPriorities = priorityCount > 0;
    const hasTools = toolCategories > 0;
    const hasIntegrations = integrationCount > 0;
    
    const dataCompleteness = [hasCompanyInfo, hasIndustryInfo, hasSizeInfo, hasPriorities, hasTools, hasIntegrations]
      .filter(Boolean).length;
    
    // If we don't have enough data, default to Early Stage with low confidence
    if (dataCompleteness < 3) {
      maturityStage = 'Early Stage';
      maturityDescription = 'Limited information available. Focus on foundational setup and basic optimization.';
      confidenceLevel = 'Low';
    }
    // Conservative criteria for higher maturity levels
    else if (toolCategories >= 6 && integrationCount >= 5 && priorityCount >= 4 && hasCompanyInfo && hasIndustryInfo) {
      maturityStage = 'Mature';
      maturityDescription = 'Well-established tool stack with clear priorities and integrations. Focus on advanced optimization and automation.';
      confidenceLevel = 'High';
    } else if (toolCategories >= 3 && integrationCount >= 2 && priorityCount >= 2 && hasCompanyInfo) {
      maturityStage = 'Growing';
      maturityDescription = 'Developing tool stack with some integrations. Focus on expanding tool usage and establishing workflows.';
      confidenceLevel = 'Medium';
    } else {
      maturityStage = 'Early Stage';
      maturityDescription = 'Starting to build tool stack. Focus on foundational setup and basic optimization.';
      confidenceLevel = 'Medium';
    }
    
    return `${maturityStage} (${confidenceLevel} confidence): ${maturityDescription}`;
  }

  /**
   * Get industry-specific context
   */
  getIndustrySpecificContext(context) {
    const { user } = context;
    const industry = user.industry?.toLowerCase() || '';
    
    const industryContexts = {
      'saas': 'Focus on customer lifecycle automation, churn reduction, and scalable growth. Key metrics: CAC, LTV, churn rate.',
      'e-commerce': 'Emphasize inventory management, order fulfillment, customer retention, and conversion optimization. Key metrics: AOV, conversion rate, inventory turnover.',
      'consulting': 'Prioritize client relationship management, project delivery, and knowledge sharing. Key metrics: billable hours, client satisfaction, project profitability.',
      'manufacturing': 'Focus on supply chain optimization, quality control, and production efficiency. Key metrics: OEE, cycle time, defect rate.',
      'healthcare': 'Emphasize patient care coordination, compliance, and operational efficiency. Key metrics: patient satisfaction, wait times, compliance scores.',
      'finance': 'Focus on risk management, compliance, and customer service. Key metrics: portfolio performance, compliance scores, customer satisfaction.',
      'real estate': 'Prioritize lead management, client communication, and transaction efficiency. Key metrics: lead conversion, transaction time, client satisfaction.',
      'education': 'Focus on student engagement, administrative efficiency, and learning outcomes. Key metrics: student retention, engagement scores, administrative efficiency.',
      'retail': 'Emphasize inventory management, customer experience, and sales optimization. Key metrics: sales per square foot, inventory turnover, customer satisfaction.',
      'marketing': 'Focus on campaign performance, lead generation, and ROI optimization. Key metrics: conversion rates, CAC, ROI, engagement rates.'
    };
    
    // Find best match
    const matchedIndustry = Object.keys(industryContexts).find(key => 
      industry.includes(key) || key.includes(industry)
    );
    
    return matchedIndustry 
      ? industryContexts[matchedIndustry]
      : `Based on ${user.industry} industry benchmarks and best practices. Focus on operational efficiency and growth optimization.`;
  }

  /**
   * Calculate confidence factors for insights
   */
  calculateConfidenceFactors(context) {
    const { user, selectedIntegrations, selectedTools } = context;
    
    // Data completeness (how much info we have)
    let dataCompleteness = 0;
    if (user.company) dataCompleteness += 20;
    if (user.industry) dataCompleteness += 20;
    if (user.companySize) dataCompleteness += 15;
    if (user.keyPriorities?.length > 0) dataCompleteness += 25;
    if (Object.keys(selectedTools || {}).length > 0) dataCompleteness += 20;
    
    // Industry alignment (how well we understand their industry)
    const wellKnownIndustries = ['SaaS', 'E-commerce', 'Consulting', 'Manufacturing', 'Healthcare', 'Finance', 'Real Estate', 'Education', 'Retail', 'Marketing'];
    const industryAlignment = wellKnownIndustries.includes(user.industry) ? 90 : 60;
    
    // Tool specificity (how specific their tool stack is)
    const toolCount = Object.values(selectedTools || {}).flat().length;
    const integrationCount = selectedIntegrations?.length || 0;
    const toolSpecificity = Math.min(100, (toolCount * 10) + (integrationCount * 15));
    
    return {
      dataCompleteness: Math.min(100, dataCompleteness),
      industryAlignment,
      toolSpecificity: Math.max(30, toolSpecificity)
    };
  }

  /**
   * Parse AI response into structured insights
   */
  parseAIInsights(aiOutput, context) {
    try {
      // Handle different AI response formats
      let insightsData = aiOutput;
      
      if (typeof aiOutput === 'string') {
        // Strip markdown code blocks if present
        let cleanedOutput = aiOutput.trim();
        
        // Handle various markdown code block formats
        if (cleanedOutput.startsWith('```json')) {
          cleanedOutput = cleanedOutput.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedOutput.startsWith('```')) {
          cleanedOutput = cleanedOutput.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Additional cleanup for common AI response issues
        cleanedOutput = cleanedOutput.replace(/^\s*\[/, '[').replace(/\]\s*$/, ']');
        
        try {
          insightsData = JSON.parse(cleanedOutput);
        } catch (parseError) {
          logger.error('JSON parse error after cleanup', { 
            error: parseError.message, 
            cleanedOutput: cleanedOutput.substring(0, 200) + '...' 
          });
          throw parseError;
        }
      }
      
      if (aiOutput.insights) {
        insightsData = aiOutput.insights;
      }

      if (!Array.isArray(insightsData)) {
        throw new Error('Invalid AI response format');
      }

      return insightsData.map((insight, index) => ({
        id: `insight-${Date.now()}-${index}`,
        type: this.mapInsightType(insight.type || insight.category),
        title: insight.title || insight.name || `Insight ${index + 1}`,
        description: insight.description || insight.summary || insight.content,
        impact: this.mapImpactLevel(insight.impact || insight.priority),
        confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
        action: insight.action || insight.recommendation || 'Review and implement',
        reasoning: insight.reasoning || insight.explanation || 'Based on industry best practices',
        estimatedValue: insight.estimatedValue || insight.value,
        timeframe: insight.timeframe || insight.duration || '30-90 days',
        category: insight.category || 'Business Intelligence'
      }));
    } catch (error) {
      logger.error('Error parsing AI insights', { error: error.message, aiOutput });
      return this.generateFallbackInsights(context);
    }
  }

  /**
   * Generate fallback insights when AI fails
   */
  generateFallbackInsights(context) {
    const { user, selectedIntegrations, selectedTools } = context;
    
    // Get user sophistication for adaptive fallback insights
    const userSophistication = this.detectUserSophistication(context);
    const industryContext = this.getIndustrySpecificContext(context);
    
    // Base insights adapted to user sophistication
    const baseInsights = [
      {
        id: `fallback-${Date.now()}-1`,
        type: 'optimization',
                 title: userSophistication.level === 'Beginner' 
           ? `Optimize ${user.company}'s CRM Setup`
           : userSophistication.level === 'Intermediate'
           ? `Maximize ${user.company}'s CRM Investment`
           : `Advanced CRM Features for ${user.company}`,
         description: userSophistication.level === 'Beginner'
           ? `${user.firstName}, begin optimizing ${user.company}'s CRM by setting up basic automation and tracking. This can improve your ${user.industry} business efficiency by 20% and aligns with your priority of ${user.keyPriorities?.[0] || 'business growth'}.`
           : userSophistication.level === 'Intermediate'
           ? `Based on ${user.industry} industry data, companies like ${user.company} typically use only 40% of their CRM capabilities. Unlocking advanced features can increase sales efficiency by 35% and help you achieve your ${user.keyPriorities?.[0] || 'business'} goals.`
           : `${user.firstName}, leverage advanced CRM features like predictive analytics, advanced automation, and AI-powered insights to give ${user.company} a competitive advantage in the ${user.industry} space.`,
        impact: 'High',
        confidence: 87,
        action: userSophistication.level === 'Beginner'
          ? 'Set up basic automation and tracking in your CRM'
          : userSophistication.level === 'Intermediate'
          ? 'Explore advanced features in your existing CRM system'
          : 'Implement advanced CRM analytics and AI features',
        reasoning: 'Most businesses underutilize their CRM tools, missing out on powerful automation and analytics features',
        estimatedValue: userSophistication.level === 'Beginner' ? '+20% efficiency' : '+35% sales efficiency',
        timeframe: userSophistication.level === 'Beginner' ? '15-30 days' : '30-60 days',
        category: 'Sales & Marketing',
        implementationDifficulty: userSophistication.level
      },
      {
        id: `fallback-${Date.now()}-2`,
        type: 'efficiency',
        title: userSophistication.level === 'Beginner'
          ? 'Optimize Basic Workflow Tools'
          : userSophistication.level === 'Intermediate'
          ? 'Optimize Your Current Workflow Tools'
          : 'Advanced Workflow Automation',
        description: userSophistication.level === 'Beginner'
          ? 'Start with basic workflow optimization using features you already have. This can save 3-5 hours per week.'
          : userSophistication.level === 'Intermediate'
          ? 'Most teams use only basic features of their project management tools. Advanced automation and reporting features can save 6-10 hours per week.'
          : 'Implement advanced workflow automation and AI-powered project management features to maximize team productivity.',
        impact: 'Medium',
        confidence: 92,
        action: userSophistication.level === 'Beginner'
          ? 'Learn and use basic features in your project management tools'
          : userSophistication.level === 'Intermediate'
          ? 'Configure advanced features in your existing project management tools'
          : 'Implement advanced automation and AI features in your workflow tools',
        reasoning: 'Teams often miss powerful automation and reporting capabilities in tools they already have',
        estimatedValue: userSophistication.level === 'Beginner' ? '3-5 hours/week saved' : '6-10 hours/week saved',
        timeframe: userSophistication.level === 'Beginner' ? '7-15 days' : '15-30 days',
        category: 'Operations',
        implementationDifficulty: userSophistication.level
      },
      {
        id: `fallback-${Date.now()}-3`,
        type: 'optimization',
        title: userSophistication.level === 'Beginner'
          ? 'Discover Basic Tool Features'
          : userSophistication.level === 'Intermediate'
          ? 'Unlock Hidden Features in Your Tools'
          : 'Advanced Tool Feature Mastery',
        description: userSophistication.level === 'Beginner'
          ? `${user.industry} businesses can improve productivity by 25% by using basic features they may have missed.`
          : userSophistication.level === 'Intermediate'
          ? `${user.industry} businesses typically use only 30% of their software capabilities. Exploring advanced features can improve productivity by 40%.`
          : `Master advanced features and integrations to achieve maximum efficiency and competitive advantage in ${user.industry}.`,
        impact: 'High',
        confidence: 78,
        action: userSophistication.level === 'Beginner'
          ? 'Review and learn basic features in your existing tools'
          : userSophistication.level === 'Intermediate'
          ? 'Review and enable advanced features in your existing tools'
          : 'Master advanced features and create custom integrations',
        reasoning: 'Most software tools have powerful features that go unused, representing missed opportunities',
        estimatedValue: userSophistication.level === 'Beginner' ? '+25% productivity' : '+40% productivity',
        timeframe: userSophistication.level === 'Beginner' ? '10-20 days' : '20-40 days',
        category: 'Business Intelligence',
        implementationDifficulty: userSophistication.level
      }
    ];

         // Add integration-specific insights focused on maximizing existing tools
     if (selectedIntegrations?.includes('hubspot')) {
       baseInsights.push({
         id: `fallback-${Date.now()}-4`,
         type: 'optimization',
         title: 'Unlock HubSpot\'s Advanced Features',
         description: 'Your HubSpot integration has powerful features you may not be using. Advanced lead scoring, marketing automation, and analytics can boost your sales pipeline by 25%.',
         impact: 'Medium',
         confidence: 95,
         action: 'Explore and configure advanced HubSpot features you\'re not currently using',
         reasoning: 'Most HubSpot users only use 30% of available features, missing significant automation and analytics capabilities',
         estimatedValue: '+25% sales pipeline efficiency',
         timeframe: '30 days',
         category: 'CRM & Marketing'
       });
     }

     if (selectedIntegrations?.includes('quickbooks')) {
       baseInsights.push({
         id: `fallback-${Date.now()}-5`,
         type: 'optimization',
         title: 'Maximize QuickBooks Automation',
         description: 'Your QuickBooks integration has advanced automation features that can save 5-8 hours per week on financial tasks and provide better business insights.',
         impact: 'Medium',
         confidence: 88,
         action: 'Configure advanced QuickBooks automation and reporting features',
         reasoning: 'QuickBooks has powerful automation and reporting features that most users don\'t fully utilize',
         estimatedValue: '5-8 hours/week saved + better insights',
         timeframe: '15-30 days',
         category: 'Finance'
       });
     }

    return baseInsights;
  }

  /**
   * Calculate business maturity score based on context and insights
   */
  calculateMaturityScore(context, insights) {
    let score = 45; // Base score

    // Add points for integrations
    const integrationCount = context.selectedIntegrations?.length || 0;
    score += Math.min(integrationCount * 5, 20); // Max 20 points for integrations

    // Add points for tool coverage
    const toolCategories = Object.keys(context.selectedTools || {}).length;
    score += Math.min(toolCategories * 3, 15); // Max 15 points for tool coverage

    // Add points for high-impact insights
    const highImpactInsights = insights.filter(i => i.impact === 'High' || i.impact === 'Critical').length;
    score += Math.min(highImpactInsights * 2, 10); // Max 10 points for high-impact insights

    // Add points for industry alignment
    if (context.user.industry && context.user.industry !== 'Other') {
      score += 5;
    }

    // Add points for clear priorities
    if (context.user.keyPriorities?.length > 0) {
      score += Math.min(context.user.keyPriorities.length * 2, 10);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map AI insight types to our standardized types
   */
  mapInsightType(aiType) {
    const typeMap = {
      'opportunity': 'opportunity',
      'efficiency': 'efficiency',
      'risk': 'risk',
      'growth': 'growth',
      'integration': 'integration',
      'recommendation': 'recommendation',
      'optimization': 'efficiency',
      'automation': 'efficiency',
      'revenue': 'opportunity',
      'cost': 'efficiency',
      'customer': 'growth',
      'process': 'efficiency'
    };

    return typeMap[aiType?.toLowerCase()] || 'recommendation';
  }

  /**
   * Map AI impact levels to our standardized levels
   */
  mapImpactLevel(aiImpact) {
    const impactMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical',
      'minor': 'Low',
      'moderate': 'Medium',
      'major': 'High',
      'urgent': 'Critical'
    };

    return impactMap[aiImpact?.toLowerCase()] || 'Medium';
  }

     /**
    * Initialize RAG system with user's business context and insights
    * This is the foundation for personalized AI assistance throughout their journey
    */
   async initializeUserRAGSystem(context, insights) {
     try {
       const { logger } = require('../src/utils/logger');
       const vectorSearch = require('../src/database/vectorSearch');
       const { user, selectedIntegrations, selectedTools } = context;

       logger.info('Initializing RAG system for user', { 
         userId: user.id || 'onboarding',
         company: user.company,
         industry: user.industry 
       });

       // 1. Store comprehensive business profile
       const businessProfileContent = `
BUSINESS PROFILE - ${user.company}

Company Details:
- Name: ${user.company}
- Industry: ${user.industry}
- Size: ${user.companySize}
- Key Priorities: ${user.keyPriorities.join(', ')}

Tool Stack:
${Object.entries(selectedTools || {}).map(([category, tools]) => 
  `${category}: ${tools.join(', ')}`
).join('\n')}

Active Integrations:
${selectedIntegrations?.join(', ') || 'None yet'}

Business Context:
- User Sophistication: ${this.detectUserSophistication(context).level}
- Implementation Capacity: ${this.detectUserSophistication(context).implementationCapacity}
- Industry Focus: ${this.getIndustrySpecificContext(context)}
- Maturity Stage: ${this.getMaturityContext(context)}

This profile serves as the foundation for all future AI interactions and personalized recommendations.
       `.trim();

       await vectorSearch.insertThoughtWithEmbedding({
         title: `${user.company} - Business Profile`,
         content: businessProfileContent,
         embedding: null,
         user_id: user.id && user.id !== 'onboarding' ? user.id : SYSTEM_USER_ID,
         company_id: user.companyId,
         category: 'business_profile',
         tags: [
           'onboarding',
           'business_profile',
           user.industry?.toLowerCase(),
           user.companySize?.toLowerCase(),
           'rag_initialization'
         ].filter(Boolean),
         metadata: {
           profile_type: 'business_profile',
           company: user.company,
           industry: user.industry,
           company_size: user.companySize,
           key_priorities: user.keyPriorities || [],
           tool_stack: selectedTools || {},
           integrations: selectedIntegrations || [],
           sophistication_level: this.detectUserSophistication(context).level,
           maturity_context: this.getMaturityContext(context),
           industry_context: this.getIndustrySpecificContext(context),
           created_at: new Date().toISOString(),
           rag_initialization: true
         }
       });

       // 2. Store each insight with enhanced context
       for (const insight of insights) {
         const insightContent = `
INSIGHT FOR ${user.company} - ${insight.title}

Description: ${insight.description}
Action Required: ${insight.action}
Reasoning: ${insight.reasoning}
Impact Level: ${insight.impact}
Confidence: ${insight.confidence}%
Category: ${insight.category}
Estimated Value: ${insight.estimatedValue || 'Not specified'}
Timeframe: ${insight.timeframe || 'Not specified'}

Business Context:
- Company: ${user.company}
- Industry: ${user.industry}
- Priority Alignment: ${user.keyPriorities?.join(', ')}
- Tool Relevance: ${this.getToolRelevanceForInsight(insight, selectedTools)}

This insight was generated based on ${user.company}'s specific business context and tool stack.
       `.trim();

         await vectorSearch.insertThoughtWithEmbedding({
           title: insight.title,
           content: insightContent,
           embedding: null,
           user_id: user.id && user.id !== 'onboarding' ? user.id : SYSTEM_USER_ID,
           company_id: user.companyId,
           category: 'onboarding_insight',
           tags: [
             'onboarding',
             'insight',
             insight.type,
             insight.impact.toLowerCase(),
             user.industry?.toLowerCase(),
             user.companySize?.toLowerCase(),
             'rag_initialization'
           ].filter(Boolean),
           metadata: {
             insight_id: insight.id,
             insight_type: insight.type,
             impact_level: insight.impact,
             confidence_score: insight.confidence,
             category: insight.category,
             estimated_value: insight.estimatedValue,
             timeframe: insight.timeframe,
             company: user.company,
             industry: user.industry,
             company_size: user.companySize,
             integrations: selectedIntegrations || [],
             tools: selectedTools || {},
             priorities: user.keyPriorities || [],
             generated_at: new Date().toISOString(),
             rag_initialization: true
           }
         });
       }

       // 3. Store industry-specific knowledge base
       const industryKnowledgeContent = this.generateIndustryKnowledgeContent(context);
       await vectorSearch.insertThoughtWithEmbedding({
         title: `${user.industry} Industry Knowledge Base`,
         content: industryKnowledgeContent,
         embedding: null,
         user_id: user.id && user.id !== 'onboarding' ? user.id : SYSTEM_USER_ID,
         company_id: user.companyId,
         category: 'industry_knowledge',
         tags: [
           'industry_knowledge',
           user.industry?.toLowerCase(),
           'best_practices',
           'rag_initialization'
         ].filter(Boolean),
         metadata: {
           knowledge_type: 'industry_knowledge',
           industry: user.industry,
           company_size: user.companySize,
           created_at: new Date().toISOString(),
           rag_initialization: true
         }
       });

       // 4. Store tool-specific optimization knowledge
       const toolOptimizationContent = this.generateToolOptimizationContent(context);
       await vectorSearch.insertThoughtWithEmbedding({
         title: `${user.company} - Tool Optimization Knowledge`,
         content: toolOptimizationContent,
         embedding: null,
         user_id: user.id && user.id !== 'onboarding' ? user.id : SYSTEM_USER_ID,
         company_id: user.companyId,
         category: 'tool_optimization',
         tags: [
           'tool_optimization',
           'best_practices',
           ...Object.values(selectedTools || {}).flat(),
           'rag_initialization'
         ].filter(Boolean),
         metadata: {
           knowledge_type: 'tool_optimization',
           tools: selectedTools || {},
           integrations: selectedIntegrations || [],
           created_at: new Date().toISOString(),
           rag_initialization: true
         }
       });

       logger.info(`RAG system initialized successfully for ${user.company}`, {
         profileStored: true,
         insightsStored: insights.length,
         industryKnowledgeStored: true,
         toolOptimizationStored: true,
         totalKnowledgeBaseEntries: 3 + insights.length
       });

     } catch (error) {
       logger.error('Error initializing RAG system:', { 
         error: error.message, 
         stack: error.stack,
         userId: context.user?.id && context.user.id !== 'onboarding' ? context.user.id : SYSTEM_USER_ID,
         company: context.user?.company 
       });
       // Don't fail the entire operation if RAG initialization fails
     }
   }

   /**
    * Generate tool relevance context for insights
    */
   getToolRelevanceForInsight(insight, selectedTools) {
     const allTools = Object.values(selectedTools || {}).flat();
     const toolMentions = allTools.filter(tool => 
       insight.title.toLowerCase().includes(tool.toLowerCase()) ||
       insight.description.toLowerCase().includes(tool.toLowerCase()) ||
       insight.action.toLowerCase().includes(tool.toLowerCase())
     );
     return toolMentions.length > 0 ? toolMentions.join(', ') : 'General optimization';
   }

   /**
    * Generate industry-specific knowledge content
    */
   generateIndustryKnowledgeContent(context) {
     const { user } = context;
     const industry = user.industry?.toLowerCase() || '';
     
     const industryKnowledge = {
       'saas': `
SaaS INDUSTRY KNOWLEDGE BASE

Key Metrics & KPIs:
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)

Critical Success Factors:
- Customer lifecycle automation
- Churn reduction strategies
- Scalable growth processes
- Product-market fit optimization
- Customer success implementation

Common Challenges:
- High customer acquisition costs
- Customer churn management
- Scaling operations efficiently
- Maintaining product-market fit
- Building sustainable growth

Best Practices for ${user.companySize} SaaS Companies:
- Implement automated onboarding flows
- Focus on customer success metrics
- Optimize pricing strategies
- Build scalable sales processes
- Leverage data-driven decision making
       `,
       'e-commerce': `
E-COMMERCE INDUSTRY KNOWLEDGE BASE

Key Metrics & KPIs:
- Average Order Value (AOV)
- Conversion Rate
- Customer Lifetime Value (CLV)
- Inventory Turnover
- Return Rate

Critical Success Factors:
- Inventory management optimization
- Order fulfillment efficiency
- Customer retention strategies
- Conversion rate optimization
- Supply chain management

Common Challenges:
- Inventory management complexity
- Order fulfillment efficiency
- Customer acquisition costs
- Return management
- Seasonal demand fluctuations

Best Practices for ${user.companySize} E-commerce Companies:
- Implement automated inventory tracking
- Optimize checkout processes
- Focus on customer experience
- Leverage data analytics
- Build efficient fulfillment systems
       `,
       'consulting': `
CONSULTING INDUSTRY KNOWLEDGE BASE

Key Metrics & KPIs:
- Billable Hours
- Client Satisfaction Scores
- Project Profitability
- Client Retention Rate
- Revenue per Consultant

Critical Success Factors:
- Client relationship management
- Project delivery efficiency
- Knowledge sharing systems
- Time tracking accuracy
- Quality assurance processes

Common Challenges:
- Managing billable hours
- Client relationship maintenance
- Project profitability
- Knowledge transfer
- Scaling service delivery

Best Practices for ${user.companySize} Consulting Firms:
- Implement comprehensive time tracking
- Build client relationship management systems
- Create knowledge sharing platforms
- Focus on project profitability
- Develop scalable delivery processes
       `
     };

     const matchedIndustry = Object.keys(industryKnowledge).find(key => 
       industry.includes(key) || key.includes(industry)
     );

     return matchedIndustry 
       ? industryKnowledge[matchedIndustry]
       : `
${user.industry?.toUpperCase()} INDUSTRY KNOWLEDGE BASE

General Best Practices:
- Operational efficiency optimization
- Customer experience enhancement
- Data-driven decision making
- Process automation
- Team productivity improvement

Key Focus Areas for ${user.companySize} Companies:
- Streamline core business processes
- Implement effective communication systems
- Optimize resource allocation
- Build scalable growth strategies
- Focus on customer satisfaction
       `;
   }

   /**
    * Generate tool-specific optimization knowledge
    */
   generateToolOptimizationContent(context) {
     const { selectedTools, selectedIntegrations } = context;
     const allTools = Object.values(selectedTools || {}).flat();
     
     let content = `TOOL OPTIMIZATION KNOWLEDGE BASE FOR ${context.user.company}\n\n`;
     
     // Add general optimization principles
     content += `GENERAL OPTIMIZATION PRINCIPLES:\n`;
     content += `- Most businesses use only 30-40% of their software capabilities\n`;
     content += `- Automation can save 6-10 hours per week per team member\n`;
     content += `- Integration between tools can improve efficiency by 25-40%\n`;
     content += `- Regular tool audits can uncover 20-30% efficiency gains\n\n`;

     // Add specific tool optimization knowledge
     if (allTools.length > 0) {
       content += `SPECIFIC TOOL OPTIMIZATION OPPORTUNITIES:\n`;
       allTools.forEach(tool => {
         content += `\n${tool.toUpperCase()}:\n`;
         content += `- Explore advanced features and automation capabilities\n`;
         content += `- Configure integrations with other tools in your stack\n`;
         content += `- Set up reporting and analytics dashboards\n`;
         content += `- Implement workflow automation and templates\n`;
       });
     }

     // Add integration optimization knowledge
     if (selectedIntegrations?.length > 0) {
       content += `\nINTEGRATION OPTIMIZATION:\n`;
       content += `Your current integrations: ${selectedIntegrations.join(', ')}\n`;
       content += `- Configure data synchronization between tools\n`;
       content += `- Set up automated workflows across platforms\n`;
       content += `- Implement unified reporting and analytics\n`;
       content += `- Create cross-platform automation rules\n`;
     }

     return content;
   }

   /**
    * Generate building blocks context for AI analysis
    */
   generateBuildingBlocksContext(priorities, selectedTools, industry, companySize) {
     // 7 Building Blocks Framework
     const buildingBlocks = [
       { id: 'identity', name: 'Identity', description: 'Who you are, your mission, vision, values, and brand' },
       { id: 'revenue', name: 'Revenue', description: 'Sales, marketing, customer acquisition, and monetization' },
       { id: 'delivery', name: 'Delivery', description: 'Products, services, operations, logistics, and fulfillment' },
       { id: 'people', name: 'People', description: 'Team, talent, culture, and human resources' },
       { id: 'money', name: 'Money', description: 'Finance, accounting, cash flow, and resource allocation' },
       { id: 'knowledge', name: 'Knowledge', description: 'Data, insights, learning, and intellectual property' },
       { id: 'governance', name: 'Governance', description: 'Leadership, decision-making, compliance, and oversight' }
     ];

     // Priority-to-building-block mappings
     const priorityMappings = {
       'Increase revenue': [
         { block: 'revenue', focus: 'sales optimization and customer acquisition' },
         { block: 'identity', focus: 'brand positioning and value proposition' },
         { block: 'delivery', focus: 'product quality and customer experience' }
       ],
       'Improve efficiency': [
         { block: 'delivery', focus: 'process automation and workflow optimization' },
         { block: 'people', focus: 'team productivity and collaboration' },
         { block: 'knowledge', focus: 'data-driven decision making' }
       ],
       'Better customer insights': [
         { block: 'knowledge', focus: 'customer data analytics and insights' },
         { block: 'revenue', focus: 'customer behavior and sales analytics' },
         { block: 'delivery', focus: 'customer feedback and satisfaction metrics' }
       ],
       'Automate processes': [
         { block: 'delivery', focus: 'workflow automation and process digitization' },
         { block: 'money', focus: 'financial process automation' },
         { block: 'governance', focus: 'compliance and approval automation' }
       ],
       'Scale operations': [
         { block: 'delivery', focus: 'scalable operations and infrastructure' },
         { block: 'people', focus: 'team scaling and organizational structure' },
         { block: 'money', focus: 'financial planning for growth' }
       ],
       'Reduce costs': [
         { block: 'money', focus: 'cost analysis and budget optimization' },
         { block: 'delivery', focus: 'operational efficiency and waste reduction' },
         { block: 'people', focus: 'productivity optimization and resource allocation' }
       ],
       'Improve team collaboration': [
         { block: 'people', focus: 'team communication and collaboration tools' },
         { block: 'knowledge', focus: 'knowledge sharing and documentation' },
         { block: 'delivery', focus: 'collaborative workflows and project management' }
       ],
       'Better decision making': [
         { block: 'knowledge', focus: 'data analytics and business intelligence' },
         { block: 'governance', focus: 'decision frameworks and processes' },
         { block: 'money', focus: 'financial insights for decision making' }
       ]
     };

     // Map priorities to relevant building blocks
     let relevantBlocks = new Set();
     const contextualFocus = [];

     priorities.forEach(priority => {
       const mapping = priorityMappings[priority];
       if (mapping) {
         mapping.forEach(({ block, focus }) => {
           relevantBlocks.add(block);
           contextualFocus.push(`${priority}: Focus on ${focus}`);
         });
       }
     });

     // If no specific mappings, include all blocks
     if (relevantBlocks.size === 0) {
       relevantBlocks = new Set(['identity', 'revenue', 'delivery', 'people']);
     }

     // Generate building blocks context
     const blocksContext = Array.from(relevantBlocks).map(blockId => {
       const block = buildingBlocks.find(b => b.id === blockId);
       return `- ${block.name}: ${block.description}`;
     }).join('\n');

     return `
BUSINESS BUILDING BLOCKS FRAMEWORK:
Based on the user's priorities, focus on these key building blocks:

${blocksContext}

PRIORITY-BUILDING BLOCK ALIGNMENT:
${contextualFocus.join('\n')}

BUILDING BLOCKS INSIGHTS REQUIREMENT:
Generate insights that specifically strengthen these building blocks for their ${industry} business (${companySize}). Each insight should:
1. Reference the specific building block it addresses
2. Connect to their stated priorities through building block improvement
3. Use building block terminology in titles and descriptions
4. Focus on optimizing existing tools within each building block
5. Consider how building blocks interconnect for maximum impact
     `.trim();
   }

   /**
    * Extract maturity level from context
    */
   extractMaturityLevel(context) {
     const { user, selectedIntegrations, selectedTools } = context;
     
     const toolCategories = Object.keys(selectedTools || {}).length;
     const integrationCount = selectedIntegrations?.length || 0;
     const priorityCount = user.keyPriorities?.length || 0;
     
     // Check if we have enough data to make a reliable assessment
     const hasCompanyInfo = user.company && user.company.trim() !== '';
     const hasIndustryInfo = user.industry && user.industry !== 'Other';
     const hasSizeInfo = user.companySize && user.companySize !== '';
     const hasPriorities = priorityCount > 0;
     const hasTools = toolCategories > 0;
     const hasIntegrations = integrationCount > 0;
     
     const dataCompleteness = [hasCompanyInfo, hasIndustryInfo, hasSizeInfo, hasPriorities, hasTools, hasIntegrations]
       .filter(Boolean).length;
     
     // If we don't have enough data, default to Early Stage
     if (dataCompleteness < 3) {
       return 'Early Stage';
     }
     // Conservative criteria for higher maturity levels
     else if (toolCategories >= 6 && integrationCount >= 5 && priorityCount >= 4 && hasCompanyInfo && hasIndustryInfo) {
       return 'Mature';
     } else if (toolCategories >= 3 && integrationCount >= 2 && priorityCount >= 2 && hasCompanyInfo) {
       return 'Growing';
     } else {
       return 'Early Stage';
     }
   }

   /**
    * Store insights in vector database for ongoing analysis (legacy method)
    */
   async storeInsightsInVectorDB(insights, context) {
    try {
      const { logger } = require('../src/utils/logger');
      const vectorSearch = require('../src/database/vectorSearch');

      // Store each insight as a thought with embedding
      for (const insight of insights) {
        const insightContent = `
          Title: ${insight.title}
          Description: ${insight.description}
          Action: ${insight.action}
          Reasoning: ${insight.reasoning}
          Impact: ${insight.impact}
          Confidence: ${insight.confidence}%
          Category: ${insight.category}
          Estimated Value: ${insight.estimatedValue || 'Not specified'}
          Timeframe: ${insight.timeframe || 'Not specified'}
        `.trim();

        await vectorSearch.insertThoughtWithEmbedding({
          title: insight.title,
          content: insightContent,
          embedding: null, // Will be generated automatically
                     user_id: context.user.id && context.user.id !== 'onboarding' ? context.user.id : SYSTEM_USER_ID,
          company_id: context.user.companyId,
          category: 'onboarding_insight',
          tags: [
            'onboarding',
            insight.type,
            insight.impact.toLowerCase(),
            context.user.industry?.toLowerCase(),
            context.user.companySize?.toLowerCase()
          ].filter(Boolean),
          metadata: {
            insight_id: insight.id,
            insight_type: insight.type,
            impact_level: insight.impact,
            confidence_score: insight.confidence,
            category: insight.category,
            estimated_value: insight.estimatedValue,
            timeframe: insight.timeframe,
            company: context.user.company,
            industry: context.user.industry,
            company_size: context.user.companySize,
            integrations: context.selectedIntegrations || [],
            tools: context.selectedTools || {},
            priorities: context.user.keyPriorities || [],
            generated_at: new Date().toISOString()
          }
        });
      }

      logger.info(`Stored ${insights.length} insights in vector database for ongoing analysis`);
    } catch (error) {
      logger.error('Error storing insights in vector database:', error);
      // Don't fail the entire operation if storage fails
    }
  }
}

module.exports = { OnboardingInsightsService };
