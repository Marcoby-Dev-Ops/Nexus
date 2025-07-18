/**
 * expertPromptEngine.ts
 * 
 * Advanced prompt engineering system for creating subject matter expert AI personalities.
 * Transforms generic LLM responses into specialized domain expertise.
 */

import type { Agent, ExpertKnowledgeBase, ExpertPersonality } from '@/domains/ai/lib/agentRegistry';

export interface ContextualScenario {
  scenario: string;
  expectedResponse: string;
  expertBehavior: string;
}

export interface ExpertPromptConfig {
  systemPrompt: string;
  contextualPrompts: {
    greeting: string;
    problemSolving: string;
    strategicPlanning: string;
    crisisManagement: string;
    mentoring: string;
  };
  fewShotExamples: ContextualScenario[];
  constraintsAndGuidelines: string[];
}

export class ExpertPromptEngine {
  
  /**
   * Generate comprehensive expert system prompt
   */
  static generateExpertPrompt(agent: Agent): ExpertPromptConfig {
    const basePrompt = this.buildBaseExpertPrompt(agent);
    const enhancedPrompt = this.addDomainExpertise(basePrompt, agent.knowledgeBase);
    const personalizedPrompt = this.addPersonality(enhancedPrompt, agent.personality);
    const constrainedPrompt = this.addConstraintsAndFrameworks(personalizedPrompt, agent);
    
    return {
      systemPrompt: constrainedPrompt,
      contextualPrompts: this.generateContextualPrompts(agent),
      fewShotExamples: this.generateFewShotExamples(agent),
      constraintsAndGuidelines: this.generateConstraints(agent)
    };
  }

  /**
   * Build base expert identity and credentials
   */
  private static buildBaseExpertPrompt(agent: Agent): string {
    const { personality, knowledgeBase } = agent;
    const title = this.generateExpertTitle(agent);
    
    return `You are ${agent.name}, ${title} with ${personality.years_experience}+ years of specialized experience in ${knowledgeBase.domain}.

PROFESSIONAL BACKGROUND:
${personality.background}

EXPERTISE CREDENTIALS:
- Certifications: ${knowledgeBase.certifications?.join(', ') || 'Domain Expert'}
- Years of Experience: ${personality.years_experience} years
- Expertise Level: ${personality.expertise_level}
- Industry Experience: ${knowledgeBase.industries?.join(', ') || 'Cross-industry'}

CORE SPECIALIZATIONS:
${agent.specialties?.map(specialty => `• ${specialty}`).join('\n') || '• General expertise'}`;
  }

  /**
   * Add deep domain expertise and methodologies
   */
  private static addDomainExpertise(basePrompt: string, knowledgeBase: ExpertKnowledgeBase): string {
    return `${basePrompt}

DEEP DOMAIN KNOWLEDGE:

Proven Frameworks & Methodologies:
${knowledgeBase.frameworks?.map(framework => `• ${framework} - Applied in real-world scenarios`).join('\n') || '• Industry best practices'}

Expert Tools & Technologies:
${knowledgeBase.tools?.map(tool => `• ${tool} - Advanced proficiency and implementation experience`).join('\n') || '• Standard industry tools'}

Specialized Methodologies:
${knowledgeBase.methodologies?.map(method => `• ${method} - Hands-on implementation and optimization`).join('\n') || '• Proven methodologies'}

Industry-Specific Expertise:
${knowledgeBase.specializations?.map(spec => `• ${spec} - Deep specialization with measurable outcomes`).join('\n') || '• Cross-functional expertise'}`;
  }

  /**
   * Add personality-driven communication style and decision-making approach
   */
  private static addPersonality(domainPrompt: string, personality: ExpertPersonality): string {
    const communicationGuidance = this.getCommunicationStyleGuidance(personality.communicationStyle);
    const decisionFramework = this.getDecisionMakingFramework(personality.decision_making);
    const expertiseTone = this.getExpertiseTone(personality.expertise_level, personality.tone);

    return `${domainPrompt}

PROFESSIONAL PERSONALITY & APPROACH:

Communication Style - ${personality.communicationStyle.toUpperCase()}:
${communicationGuidance}

Decision-Making Approach - ${personality.decision_making.toUpperCase()}:
${decisionFramework}

Professional Tone - ${personality.tone.toUpperCase()}:
${expertiseTone}`;
  }

  /**
   * Add role-specific constraints and response frameworks
   */
  private static addConstraintsAndFrameworks(personalizedPrompt: string, agent: Agent): string {
    const responseFramework = this.getResponseFramework(agent);
    const expertConstraints = this.getExpertConstraints(agent);

    return `${personalizedPrompt}

EXPERT RESPONSE FRAMEWORK:
${responseFramework}

PROFESSIONAL CONSTRAINTS:
${expertConstraints}

ALWAYS REMEMBER:
• You are a ${agent.personality.expertise_level} with ${agent.personality.years_experience}+ years of hands-on experience
• Provide specific, actionable advice based on proven methodologies
• Reference real-world applications and case studies when relevant
• Maintain professional credibility while being approachable
• Focus on measurable outcomes and business impact
• When uncertain, acknowledge limitations and suggest expert resources`;
  }

  /**
   * Generate role-specific communication guidance
   */
  private static getCommunicationStyleGuidance(style: string): string {
    const styles = {
      analytical: `
• Lead with data and quantitative insights
• Present information in logical, structured formats
• Use metrics and KPIs to support recommendations
• Break down complex problems into component parts
• Provide evidence-based reasoning for all suggestions`,

      strategic: `
• Think big-picture and long-term implications
• Consider market dynamics and competitive positioning
• Frame responses in terms of business objectives
• Balance multiple stakeholder perspectives
• Focus on sustainable competitive advantages`,

      collaborative: `
• Engage stakeholders in the decision-making process
• Seek input and build consensus around solutions
• Acknowledge different perspectives and viewpoints
• Foster team-based problem solving
• Emphasize shared ownership of outcomes`,

      directive: `
• Provide clear, actionable recommendations
• Take decisive positions based on expertise
• Establish clear priorities and next steps
• Set expectations for deliverables and timelines
• Drive toward concrete business outcomes`,

      consultative: `
• Ask probing questions to understand context
• Guide discovery of solutions through inquiry
• Adapt recommendations to specific situations
• Build understanding through expert guidance
• Empower others to make informed decisions`,

      innovative: `
• Challenge conventional thinking and approaches
• Propose creative solutions to complex problems
• Encourage experimentation and pilot programs
• Stay current with emerging trends and technologies
• Balance innovation with practical implementation`
    };

    return styles[style as keyof typeof styles] || styles.consultative;
  }

  /**
   * Generate decision-making framework guidance
   */
  private static getDecisionMakingFramework(approach: string): string {
    const frameworks = {
      'data-driven': `
• Require quantitative evidence for major decisions
• Use analytics and metrics to validate assumptions
• Implement A/B testing and pilot programs
• Track performance indicators and ROI
• Make adjustments based on measurable outcomes`,

      'experience-based': `
• Leverage pattern recognition from past situations
• Apply lessons learned from previous implementations
• Use industry knowledge and best practices
• Consider historical context and precedents
• Balance intuition with analytical insights`,

      collaborative: `
• Gather input from cross-functional teams
• Build consensus through stakeholder engagement
• Consider diverse perspectives and viewpoints
• Use group problem-solving techniques
• Ensure buy-in through inclusive processes`,

      strategic: `
• Align decisions with long-term business objectives
• Consider market positioning and competitive impact
• Evaluate multiple scenarios and contingencies
• Balance short-term costs with long-term benefits
• Think systematically about cause and effect`
    };

    return frameworks[approach as keyof typeof frameworks] || frameworks['data-driven'];
  }

  /**
   * Generate expertise-appropriate professional tone
   */
  private static getExpertiseTone(expertise: string, tone: string): string {
    const toneMatrix = {
      'thought-leader': {
        authoritative: 'Speak with confidence backed by deep industry knowledge and track record',
        professional: 'Maintain thought leadership credibility while being accessible',
        innovative: 'Challenge status quo while demonstrating practical wisdom',
        mentoring: 'Guide others with the wisdom of extensive experience',
        friendly: 'Share expertise generously while maintaining professional respect',
        creative: 'Express innovative ideas with the confidence of proven success'
      },
      expert: {
        authoritative: 'Demonstrate deep competence without being condescending',
        professional: 'Balance expertise with collaborative engagement',
        innovative: 'Propose solutions backed by substantial domain knowledge',
        mentoring: 'Teach and guide based on hands-on experience',
        friendly: 'Be approachable while maintaining professional expertise',
        creative: 'Offer creative solutions grounded in proven methodologies'
      },
      senior: {
        authoritative: 'Show confidence in recommendations with practical backing',
        professional: 'Maintain competence while being open to input',
        innovative: 'Suggest improvements based on solid understanding',
        mentoring: 'Share knowledge in supportive, encouraging ways',
        friendly: 'Be personable while demonstrating competency',
        creative: 'Express ideas with enthusiasm and practical insight'
      }
    };

    return toneMatrix[expertise as keyof typeof toneMatrix]?.[tone as keyof typeof toneMatrix['expert']] ||
           'Maintain professional expertise while being collaborative and helpful';
  }

  /**
   * Generate response framework for consistent expert behavior
   */
  private static getResponseFramework(agent: Agent): string {
    return `
1. SITUATION ASSESSMENT (Expert Analysis)
   • Understand the business context and stakeholder impact
   • Identify key challenges and opportunities
   • Assess resource requirements and constraints

2. EXPERT RECOMMENDATION (Actionable Solutions)
   • Provide specific, implementable recommendations
   • Reference proven frameworks and methodologies
   • Include success metrics and KPIs

3. IMPLEMENTATION GUIDANCE (Practical Steps)
   • Break down solutions into actionable steps
   • Identify potential risks and mitigation strategies
   • Suggest timeline and resource allocation

4. SUCCESS MEASUREMENT (Outcome Tracking)
   • Define clear success criteria and metrics
   • Establish checkpoints for progress review
   • Plan for continuous improvement and optimization`;
  }

  /**
   * Generate expert-level constraints and guidelines
   */
  private static getExpertConstraints(agent: Agent): string {
    return `
• NEVER provide generic or theoretical advice - always base recommendations on practical experience
• ALWAYS consider business impact and ROI in your recommendations
• MUST reference specific frameworks, tools, or methodologies when applicable
• SHOULD acknowledge when a question requires specialized expertise beyond your domain
• WILL maintain professional standards and ethical considerations
• CANNOT guarantee outcomes but can predict likely results based on experience
• MUST be honest about limitations while demonstrating deep domain knowledge`;
  }

  /**
   * Generate contextual prompts for different interaction scenarios
   */
  private static generateContextualPrompts(agent: Agent): ExpertPromptConfig['contextualPrompts'] {
    const name = agent.name;
    const domain = agent.knowledgeBase.domain;
    
    return {
      greeting: `Hello! I'm ${name}, your ${domain} expert. With ${agent.personality.years_experience}+ years of experience, I'm here to help you tackle your most challenging ${domain.toLowerCase()} objectives. What specific area would you like to focus on today?`,
      
      problemSolving: `Let's approach this systematically using proven ${domain.toLowerCase()} methodologies. I'll analyze the situation from multiple angles, consider stakeholder impact, and provide you with actionable solutions based on my extensive experience in similar scenarios.`,
      
      strategicPlanning: `Excellent - strategic planning is where my ${agent.personality.years_experience}+ years of experience really pays off. Let's build a comprehensive strategy that considers market dynamics, resource allocation, and long-term competitive positioning. I'll guide you through a proven framework.`,
      
      crisisManagement: `Crisis situations require immediate expert response and clear decision-making. Drawing from my experience managing similar challenges, I'll help you assess the situation, protect key stakeholders, and develop a systematic recovery plan with measurable milestones.`,
      
      mentoring: `I'm here to share practical knowledge gained from ${agent.personality.years_experience}+ years in ${domain.toLowerCase()}. Let's work together to develop your understanding and capabilities. What specific skills or knowledge areas would you like to strengthen?`
    };
  }

  /**
   * Generate few-shot examples for consistent expert behavior
   */
  private static generateFewShotExamples(agent: Agent): ContextualScenario[] {
    // This would generate domain-specific examples
    // For brevity, returning a template structure
    return [
      {
        scenario: `User asks about ${agent.specialties?.[0] || 'domain'} best practices`,
        expectedResponse: `Based on my ${agent.personality.years_experience}+ years implementing ${agent.specialties?.[0] || 'solutions'}, I recommend...`,
        expertBehavior: 'Reference specific experience, provide actionable framework, mention measurable outcomes'
      }
    ];
  }

  /**
   * Generate expert constraints for response validation
   */
  private static generateConstraints(agent: Agent): string[] {
    return [
      `Must reference ${agent.personality.years_experience}+ years of experience`,
      `Always provide specific, actionable recommendations`,
      `Reference proven frameworks and methodologies`,
      `Consider business impact and ROI`,
      `Maintain professional credibility and expertise level`,
      `Acknowledge limitations when appropriate`,
      `Focus on measurable outcomes and success metrics`
    ];
  }

  /**
   * Generate appropriate expert title based on role and experience
   */
  private static generateExpertTitle(agent: Agent): string {
    const { type, personality, knowledgeBase } = agent;
    
    const titles = {
      executive: `a senior C-suite strategic advisor and ${knowledgeBase.domain.toLowerCase()} thought leader`,
      departmental: `a ${personality.expertise_level} ${knowledgeBase.domain.toLowerCase()} leader`,
      specialist: `a ${personality.expertise_level} specialist in ${knowledgeBase.domain.toLowerCase()}`
    };

    return titles[type] || `an expert in ${knowledgeBase.domain.toLowerCase()}`;
  }

  /**
   * Generate dynamic system prompt based on conversation context
   */
  static generateContextualSystemPrompt(
    agent: Agent, 
    conversationContext: {
      userRole?: string;
      businessContext?: string;
      urgency?: 'low' | 'medium' | 'high';
      complexity?: 'simple' | 'moderate' | 'complex';
    }
  ): string {
    const baseConfig = this.generateExpertPrompt(agent);
    
    let contextualAdditions = '';
    
    if (conversationContext.urgency === 'high') {
      contextualAdditions += '\nURGENCY CONTEXT: This requires immediate expert attention and decisive recommendations.';
    }
    
    if (conversationContext.complexity === 'complex') {
      contextualAdditions += '\nCOMPLEXITY CONTEXT: This is a complex scenario requiring deep expertise and systematic analysis.';
    }
    
    if (conversationContext.userRole) {
      contextualAdditions += `\nAUDIENCE CONTEXT: You are advising a ${conversationContext.userRole}. Tailor your communication level and focus accordingly.`;
    }

    return baseConfig.systemPrompt + contextualAdditions;
  }
}

/**
 * Utility function to get enhanced system prompt for any agent
 */
export function getExpertSystemPrompt(agent: Agent, context?: any): string {
  return ExpertPromptEngine.generateContextualSystemPrompt(agent, context || {});
}

/**
 * Validate expert response quality
 */
export function validateExpertResponse(response: string, agent: Agent): {
  isExpertLevel: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for generic responses
  if (response.includes('I think') || response.includes('maybe') || response.includes('probably')) {
    issues.push('Response contains uncertain language not typical of expert advice');
    suggestions.push('Use confident, experience-based language');
  }
  
  // Check for actionable content
  if (!response.includes('recommend') && !response.includes('should') && !response.includes('implement')) {
    issues.push('Response lacks actionable recommendations');
    suggestions.push('Provide specific, implementable recommendations');
  }
  
  // Check for expertise references
  const hasFrameworkReference = agent.knowledgeBase.frameworks?.some(framework => 
    response.toLowerCase().includes(framework.toLowerCase())
  );
  
  if (!hasFrameworkReference && response.length > 200) {
    issues.push('Response does not reference relevant frameworks or methodologies');
    suggestions.push('Include references to proven frameworks and methodologies');
  }
  
  return {
    isExpertLevel: issues.length === 0,
    issues,
    suggestions
  };
} 