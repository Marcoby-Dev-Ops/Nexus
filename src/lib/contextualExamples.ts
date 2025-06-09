/**
 * contextualExamples.ts
 * 
 * Demonstration of how Nexus creates the "Nexus gets me" experience
 * through deeply personalized AI interactions based on user context.
 */

export interface ContextualConversationExample {
  userProfile: {
    name: string;
    role: string;
    experience_level: string;
    communication_style: string;
    current_pain_points: string[];
    immediate_goals: string;
  };
  businessContext: {
    company: string;
    industry: string;
    size: string;
    automation_maturity: string;
  };
  userQuery: string;
  genericResponse: string;
  contextualResponse: string;
  nexusIntelligence: string[];
}

export const contextualExamples: ContextualConversationExample[] = [
  {
    userProfile: {
      name: "Sarah Chen",
      role: "Marketing Director", 
      experience_level: "intermediate",
      communication_style: "visual",
      current_pain_points: ["Manual reporting", "Scattered data across tools"],
      immediate_goals: "Reduce weekly reporting time from 8 hours to 2 hours"
    },
    businessContext: {
      company: "TechFlow Innovations",
      industry: "B2B SaaS",
      size: "Medium (50-200 employees)",
      automation_maturity: "basic"
    },
    userQuery: "How can I automate my marketing reports?",
    genericResponse: "You can automate marketing reports by using dashboard tools, setting up scheduled reports, and integrating your data sources. Consider tools like Google Data Studio or Tableau for visualization.",
    contextualResponse: `Hi Sarah! 🎯 Given your goal to cut reporting time from 8 hours to 2 hours weekly, here's a tailored automation strategy:

**For Your Current Setup (Basic Automation Level):**
• Start with n8n workflows to aggregate data from your scattered tools
• Create visual dashboards (perfect for your visual communication style) 
• Focus on your key marketing metrics first - likely campaign performance & lead quality

**Immediate Action Plan:**
1. **Week 1**: Connect your top 3 marketing tools to n8n
2. **Week 2**: Build automated weekly report template  
3. **Week 3**: Set up visual dashboard for real-time insights

**Why This Works for TechFlow:**
- B2B SaaS companies typically track similar metrics to what we'll automate
- Medium companies benefit most from workflow automation ROI
- Builds on your existing basic automation foundation

**Expected Outcome:** 75% time reduction (8hrs → 2hrs) within 3 weeks

Would you like me to connect you with our Marketing Automation specialist to design the specific workflows?`,
    nexusIntelligence: [
      "Recognized Sarah's specific time-saving goal (8→2 hours)",
      "Matched her visual communication preference with dashboard suggestions",
      "Addressed her pain point about scattered data across tools",
      "Considered TechFlow's B2B SaaS industry context",
      "Adjusted complexity for her intermediate experience level",
      "Referenced their basic automation maturity level",
      "Provided medium-company-specific ROI expectations",
      "Offered relevant specialist connection"
    ]
  },
  {
    userProfile: {
      name: "Marcus Rodriguez",
      role: "Sales Manager",
      experience_level: "advanced", 
      communication_style: "direct",
      current_pain_points: ["Inconsistent pipeline data", "Manual lead scoring"],
      immediate_goals: "Increase sales team productivity by 25%"
    },
    businessContext: {
      company: "Industrial Solutions Corp",
      industry: "Manufacturing",
      size: "Large (200+ employees)",
      automation_maturity: "intermediate"
    },
    userQuery: "Our sales pipeline is a mess. What's the fastest way to clean it up?",
    genericResponse: "To clean up your sales pipeline, you should standardize your lead qualification process, implement consistent data entry protocols, update your CRM hygiene, and train your team on best practices.",
    contextualResponse: `Marcus, here's your fastest path to pipeline cleanup for immediate productivity gains:

**Priority Actions (Manufacturing Focus):**
• **Data Standardization**: Automate lead scoring using your existing intermediate automation setup
• **Pipeline Segmentation**: Separate long-cycle industrial deals from quick wins
• **CRM Enhancement**: Implement automated data validation rules

**Fast Implementation (Manufacturing Sales Cycle Aware):**
1. **Week 1**: Deploy automated lead scoring (you're advanced enough to handle complex rules)
2. **Week 2**: Set up pipeline health alerts for stalled deals
3. **Week 3**: Implement automated follow-up sequences for different deal types

**Large Company Benefits:**
- Scale solution across your entire sales org
- Standardize processes across regions/divisions
- Generate executive dashboards for leadership visibility

**Expected Impact:** 25% productivity increase through reduced admin time and better deal prioritization.

**Immediate Next Step:** I'll route you to our Sales Operations specialist who has manufacturing industry experience. They can implement this in 2 weeks.`,
    nexusIntelligence: [
      "Addressed Marcus's direct communication style with bullet points",
      "Recognized his advanced experience level for complex automation",
      "Focused on his specific 25% productivity goal",
      "Considered manufacturing industry's longer sales cycles",
      "Leveraged their intermediate automation maturity",
      "Accounted for large company implementation challenges",
      "Offered industry-specific specialist connection",
      "Provided realistic timeline expectations"
    ]
  },
  {
    userProfile: {
      name: "Emily Foster",
      role: "Operations Coordinator",
      experience_level: "beginner",
      communication_style: "detailed",
      current_pain_points: ["Overwhelming number of tools", "Unclear processes"],
      immediate_goals: "Get organized and establish clear workflows"
    },
    businessContext: {
      company: "GreenLeaf Consulting",
      industry: "Professional Services", 
      size: "Small (10-50 employees)",
      automation_maturity: "none"
    },
    userQuery: "I'm new to operations and feeling overwhelmed. Where do I start?",
    genericResponse: "Start by documenting your current processes, identifying your main tools, creating standard operating procedures, and gradually implementing automation where it makes sense.",
    contextualResponse: `Emily, I completely understand! Operations can feel overwhelming initially, especially in a growing consulting firm. Let's create a clear, step-by-step plan tailored for someone just starting out:

**Your Beginner-Friendly Roadmap:**

**Phase 1: Get Organized (Week 1-2)**
• Document what you're currently doing daily (I'll provide templates)
• List all the tools GreenLeaf uses (we'll simplify this)
• Identify your 3 most time-consuming tasks

**Phase 2: Create Simple Systems (Week 3-4)** 
• Build basic workflows for recurring tasks
• Set up simple tracking spreadsheets
• Establish clear communication processes

**Phase 3: Easy Automation (Week 5-6)**
• Start with no-code solutions (perfect for professional services)
• Automate simple repetitive tasks first
• Build confidence before advancing

**Small Company Advantages:**
- Faster decision making and implementation
- Direct impact visibility
- Ability to iterate quickly

**Consulting-Specific Focus Areas:**
- Client project tracking workflows
- Resource allocation systems  
- Time tracking automation

**Your Success Plan:** By focusing on fundamentals first, you'll have clear, manageable workflows in 6 weeks. No overwhelming complexity—just practical systems that work for a small consulting firm.

**Next Step:** I'll connect you with our Beginner-Friendly Operations specialist who'll provide templates and guide you through each phase personally.`,
    nexusIntelligence: [
      "Acknowledged Emily's beginner status with encouraging, supportive tone",
      "Provided detailed explanation matching her communication preference", 
      "Addressed her feeling of being overwhelmed with structured approach",
      "Focused on her goal of getting organized and establishing workflows",
      "Considered GreenLeaf's small company context for faster iteration",
      "Addressed professional services industry-specific needs",
      "Recognized their 'none' automation maturity with no-code start",
      "Offered beginner-specialist connection for personal guidance",
      "Broke down overwhelming task into manageable 6-week phases"
    ]
  }
];

export const getContextualResponseDemo = (userQuery: string, userContext: any): string => {
  return `
🧠 **NEXUS INTELLIGENCE IN ACTION**

**What a Generic AI Would Say:**
"Here are some general best practices for your question..."

**What Nexus Knows About You:**
• Name: ${userContext.name} (${userContext.role})
• Experience: ${userContext.experience_level} level 
• Communication Style: Prefers ${userContext.communication_style} responses
• Current Challenge: ${userContext.current_pain_points[0]}
• Success Goal: ${userContext.immediate_goals}
• Company Context: ${userContext.company} (${userContext.industry})
• Automation Readiness: ${userContext.automation_maturity}

**What Nexus Delivers:**
✅ Personalized advice for YOUR role and experience level
✅ Solutions that match YOUR communication preferences  
✅ Industry-specific recommendations for YOUR business
✅ Implementation timeline that fits YOUR company size
✅ Automation complexity that matches YOUR current maturity
✅ Success metrics aligned with YOUR specific goals
✅ Next steps that consider YOUR constraints and capabilities

**The "Nexus Gets Me" Difference:**
Every response is crafted specifically for YOU, considering your role, industry, experience, goals, and constraints. It's like having a personal business advisor who truly understands your situation.
`;
};

/**
 * Example of how context flows through different AI interactions
 */
export const contextualFlowExample = {
  scenario: "Sarah (Marketing Director) starts with Executive Assistant, then talks to Marketing Specialist",
  
  executiveAssistantContext: `
🧠 EXECUTIVE INTELLIGENCE:
• Sarah Chen (Marketing Director) at TechFlow Innovations  
• Intermediate experience, prefers visual communication
• Pain Point: 8 hours/week on manual reporting
• Goal: Reduce to 2 hours via automation
• B2B SaaS industry context
• Medium company size (faster implementation)
`,

  executiveResponse: `Hi Sarah! I understand you're spending 8 hours weekly on manual reporting and want to cut that to 2 hours. For a B2B SaaS company like TechFlow, this is absolutely achievable.

Given your intermediate experience with business tools and preference for visual communication, I recommend starting with dashboard automation. You'll likely see 75% time reduction within 3 weeks.

Let me connect you with our Marketing Automation specialist who can design specific workflows for your reporting needs.`,

  handoffToSpecialist: "Routing to Marketing Specialist with full context...",

  marketingSpecialistContext: `
🧠 SPECIALIST INTELLIGENCE (Enhanced from Executive handoff):
• Inherited: Sarah's profile, goals, and Executive conversation context
• Added: Marketing-specific tool analysis for TechFlow
• Enhanced: B2B SaaS marketing automation opportunities
• Focused: Visual dashboard design for intermediate users
`,

  marketingSpecialistResponse: `Sarah! I've reviewed your conversation with our Executive Assistant about reducing reporting time from 8 to 2 hours.

For TechFlow's B2B SaaS marketing, here's your specific automation blueprint:

**Visual Dashboard Setup (matches your preference):**
• HubSpot → n8n → Custom dashboard for campaign ROI
• Google Analytics → automated weekly traffic reports  
• LinkedIn/Social → engagement tracking automation

**Your 3-Week Implementation:**
Week 1: Connect HubSpot and Analytics data
Week 2: Build visual reporting dashboard  
Week 3: Automate weekly report generation

This leverages your intermediate experience while being visual-first. Ready to start with Week 1?`
};

export default {
  contextualExamples,
  getContextualResponseDemo,
  contextualFlowExample
}; 