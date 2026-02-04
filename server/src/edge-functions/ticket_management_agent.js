/**
 * Ticket Management Agent Edge Function
 * 
 * Oversees the entire Brain Ticket lifecycle to ensure:
 * - Tickets are opened with correct elements
 * - Updates are made properly
 * - Tickets are closed correctly
 * - Data integrity is maintained
 * - Progress is tracked accurately
 * 
 * Now enhanced with LLM processing for intelligent reasoning and recommendations
 */

const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Import AI processing capabilities
const { processWithLLM } = require('../services/aiService');

/**
 * Convert hash string to UUID format
 * @param {string} hash - The hash string to convert
 * @returns {string} - UUID formatted string
 */
function hashToUUID(hash) {
  const normalizedHash = hash.replace(/[^a-f0-9]/gi, '').substring(0, 32);
  return [
    normalizedHash.substring(0, 8),
    normalizedHash.substring(8, 12),
    normalizedHash.substring(12, 16),
    normalizedHash.substring(16, 20),
    normalizedHash.substring(20, 32)
  ].join('-');
}

/**
 * AI-powered ticket analysis and recommendations
 */
async function analyzeTicketWithAI(ticket, context = {}) {
  try {
    const analysisPrompt = `
You are a Ticket Management Agent responsible for analyzing and providing intelligent recommendations for business tickets.

TICKET INFORMATION:
- Title: ${ticket.title}
- Description: ${ticket.description}
- Type: ${ticket.ticket_type}
- Priority: ${ticket.priority}
- Category: ${ticket.category}
- Status: ${ticket.status}
- Progress: ${ticket.progress}%
- Created: ${ticket.created_at}
- Last Updated: ${ticket.updated_at}
- Tags: ${ticket.tags?.join(', ') || 'None'}

CONTEXT:
- User has ${context.totalTickets || 0} total tickets
- ${context.activeTickets || 0} active tickets
- ${context.completedTickets || 0} completed tickets
- Overall health score: ${context.overallHealthScore || 'Unknown'}

ANALYSIS TASKS:
1. Assess the ticket's current health and identify potential issues
2. Provide specific, actionable recommendations for improvement
3. Suggest optimal next steps based on the ticket's context
4. Identify if the ticket is at risk of becoming stale or blocked
5. Recommend priority adjustments if needed
6. Suggest related tickets or dependencies that might be missing

Please provide your analysis in JSON format with the following structure:
{
  "healthAssessment": {
    "score": 0-100,
    "riskLevel": "low|medium|high|critical",
    "issues": ["list of specific issues"],
    "strengths": ["list of positive aspects"]
  },
  "recommendations": {
    "immediate": ["urgent actions needed"],
    "shortTerm": ["actions for next 1-3 days"],
    "longTerm": ["strategic improvements"]
  },
  "nextSteps": {
    "suggestedActions": ["specific actions to take"],
    "estimatedEffort": "low|medium|high",
    "timeframe": "immediate|1-3 days|1 week|1 month"
  },
  "riskFactors": {
    "staleRisk": "low|medium|high",
    "blockerRisk": "low|medium|high",
    "completionRisk": "low|medium|high"
  },
  "intelligentInsights": {
    "patterns": ["any patterns you notice"],
    "dependencies": ["missing dependencies"],
    "opportunities": ["optimization opportunities"]
  }
}

Focus on providing practical, business-focused advice that helps move the ticket forward effectively.
`;

    const aiResponse = await processWithLLM(analysisPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.3,
      maxTokens: 1500
    });

    // Parse the AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI analysis, using fallback', { error: parseError.message });
      aiAnalysis = {
        healthAssessment: { score: 50, riskLevel: 'medium', issues: ['AI analysis failed'], strengths: [] },
        recommendations: { immediate: [], shortTerm: [], longTerm: [] },
        nextSteps: { suggestedActions: [], estimatedEffort: 'medium', timeframe: '1-3 days' },
        riskFactors: { staleRisk: 'medium', blockerRisk: 'medium', completionRisk: 'medium' },
        intelligentInsights: { patterns: [], dependencies: [], opportunities: [] }
      };
    }

    return aiAnalysis;

  } catch (error) {
    logger.error('Error in AI ticket analysis:', error);
    return null;
  }
}

/**
 * AI-powered update validation with intelligent reasoning
 */
async function validateUpdateWithAI(originalTicket, updateData, user) {
  try {
    const validationPrompt = `
You are a Ticket Management Agent validating a ticket update. Analyze whether this update is appropriate and provide intelligent reasoning.

ORIGINAL TICKET:
${JSON.stringify(originalTicket, null, 2)}

PROPOSED UPDATE:
${JSON.stringify(updateData, null, 2)}

USER CONTEXT:
- User ID: ${user.id}
- Update timestamp: ${new Date().toISOString()}

VALIDATION TASKS:
1. Assess if the update makes logical sense
2. Identify potential issues or conflicts
3. Suggest improvements to the update
4. Determine if any additional actions are needed
5. Evaluate the impact on ticket health and progress

Provide your analysis in JSON format:
{
  "isValid": true/false,
  "confidence": 0-100,
  "reasoning": "detailed explanation of your assessment",
  "issues": ["list of problems or concerns"],
  "warnings": ["potential issues to watch"],
  "suggestions": ["improvements or additional actions"],
  "impact": {
    "severity": "low|medium|high|critical",
    "areas": ["which aspects are affected"],
    "dependencies": ["what else might be impacted"]
  },
  "recommendations": {
    "approve": true/false,
    "modifications": ["suggested changes"],
    "additionalChecks": ["what to verify"]
  }
}

Focus on business logic, data integrity, and user experience.
`;

    const aiResponse = await processWithLLM(validationPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.2,
      maxTokens: 1000
    });

    let aiValidation;
    try {
      aiValidation = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI validation, using rule-based fallback', { error: parseError.message });
      return validateTicketUpdate(originalTicket, updateData); // Fallback to rule-based
    }

    return {
      isValid: aiValidation.isValid,
      errors: aiValidation.issues || [],
      warnings: aiValidation.warnings || [],
      changes: Object.keys(updateData),
      impact: aiValidation.impact?.severity || 'low',
      aiReasoning: aiValidation.reasoning,
      suggestions: aiValidation.suggestions || [],
      confidence: aiValidation.confidence || 50
    };

  } catch (error) {
    logger.error('Error in AI update validation:', error);
    return validateTicketUpdate(originalTicket, updateData); // Fallback to rule-based
  }
}

/**
 * AI-powered completion assessment
 */
async function assessCompletionWithAI(ticket, completionData) {
  try {
    const completionPrompt = `
You are a Ticket Management Agent assessing whether a ticket is ready for completion.

TICKET INFORMATION:
${JSON.stringify(ticket, null, 2)}

COMPLETION DATA:
${JSON.stringify(completionData, null, 2)}

ASSESSMENT TASKS:
1. Determine if the ticket is truly complete
2. Identify any missing elements or loose ends
3. Assess the quality of completion
4. Suggest any final actions needed
5. Evaluate if completion is premature

Provide your assessment in JSON format:
{
  "readyForCompletion": true/false,
  "completionScore": 0-100,
  "missingElements": ["what's still needed"],
  "qualityIssues": ["quality concerns"],
  "finalActions": ["last steps before completion"],
  "completionNotes": "detailed reasoning",
  "risks": ["potential issues with completing now"],
  "recommendations": {
    "proceed": true/false,
    "modifications": ["changes needed"],
    "postCompletion": ["follow-up actions"]
  }
}

Consider business value, completeness, and long-term impact.
`;

    const aiResponse = await processWithLLM(completionPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.3,
      maxTokens: 1200
    });

    let aiAssessment;
    try {
      aiAssessment = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI completion assessment, using rule-based fallback', { error: parseError.message });
      return generateCompletionChecklist(ticket); // Fallback to rule-based
    }

    return {
      readyForCompletion: aiAssessment.readyForCompletion,
      completionScore: aiAssessment.completionScore,
      missingElements: aiAssessment.missingElements || [],
      qualityIssues: aiAssessment.qualityIssues || [],
      finalActions: aiAssessment.finalActions || [],
      completionNotes: aiAssessment.completionNotes,
      risks: aiAssessment.risks || [],
      recommendations: aiAssessment.recommendations || {}
    };

  } catch (error) {
    logger.error('Error in AI completion assessment:', error);
    return generateCompletionChecklist(ticket); // Fallback to rule-based
  }
}

/**
 * AI-powered health monitoring with intelligent insights
 */
async function monitorHealthWithAI(tickets, user) {
  try {
    const healthPrompt = `
You are a Ticket Management Agent providing intelligent health monitoring and insights for a user's ticket portfolio.

USER TICKETS SUMMARY:
- Total tickets: ${tickets.length}
- Active: ${tickets.filter(t => t.status === 'active').length}
- Completed: ${tickets.filter(t => t.status === 'completed').length}
- Paused: ${tickets.filter(t => t.status === 'paused').length}

TICKET DETAILS (first 10 for analysis):
${JSON.stringify(tickets.slice(0, 10), null, 2)}

ANALYSIS TASKS:
1. Identify patterns and trends across the ticket portfolio
2. Assess overall productivity and efficiency
3. Identify systemic issues or bottlenecks
4. Provide strategic recommendations for improvement
5. Suggest optimization opportunities
6. Identify high-impact actions the user should take

Provide your analysis in JSON format:
{
  "portfolioHealth": {
    "overallScore": 0-100,
    "trend": "improving|stable|declining",
    "keyMetrics": {
      "completionRate": "percentage",
      "averageTimeToComplete": "days",
      "staleTicketPercentage": "percentage"
    }
  },
  "patterns": {
    "commonIssues": ["recurring problems"],
    "successFactors": ["what's working well"],
    "bottlenecks": ["blocking factors"]
  },
  "strategicInsights": {
    "productivity": "assessment of overall productivity",
    "efficiency": "efficiency analysis",
    "optimization": "optimization opportunities"
  },
  "recommendations": {
    "immediate": ["urgent actions"],
    "shortTerm": ["next 1-2 weeks"],
    "longTerm": ["strategic improvements"]
  },
  "highImpactActions": [
    {
      "action": "description",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "timeframe": "immediate|1 week|1 month"
    }
  ],
  "riskAssessment": {
    "overallRisk": "low|medium|high",
    "riskFactors": ["specific risks"],
    "mitigation": ["how to address risks"]
  }
}

Focus on actionable insights that will improve the user's ticket management effectiveness.
`;

    const aiResponse = await processWithLLM(healthPrompt, {
      model: 'zai/glm-4.7',
      temperature: 0.4,
      maxTokens: 2000
    });

    let aiHealthReport;
    try {
      aiHealthReport = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      logger.warn('Failed to parse AI health report, using rule-based fallback', { error: parseError.message });
      return monitorTicketHealth(user); // Fallback to rule-based
    }

    return {
      success: true,
      data: {
        ...aiHealthReport,
        totalTickets: tickets.length,
        activeTickets: tickets.filter(t => t.status === 'active').length,
        completedTickets: tickets.filter(t => t.status === 'completed').length,
        aiGenerated: true
      }
    };

  } catch (error) {
    logger.error('Error in AI health monitoring:', error);
    // Return a basic fallback instead of recursive call
    return {
      success: true,
      data: {
        totalTickets: 0,
        activeTickets: 0,
        completedTickets: 0,
        overallHealthScore: 100,
        overallRisk: 'low',
        healthScores: [],
        highRiskTickets: [],
        staleTickets: [],
        recommendations: ['System temporarily unavailable - using basic monitoring'],
        aiGenerated: false
      }
    };
  }
}

/**
 * Validate ticket structure and required elements
 */
function validateTicketStructure(ticketData) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    missingElements: [],
    recommendations: []
  };

  // Required fields validation
  const requiredFields = [
    'title', 'description', 'ticket_type', 'priority', 'category', 'source'
  ];

  for (const field of requiredFields) {
    if (!ticketData[field] || ticketData[field].trim() === '') {
      validation.isValid = false;
      validation.errors.push(`Missing required field: ${field}`);
      validation.missingElements.push(field);
    }
  }

  // AI insights validation
  if (!ticketData.ai_insights) {
    validation.isValid = false;
    validation.errors.push('Missing AI insights');
    validation.missingElements.push('ai_insights');
  } else {
    const requiredInsights = ['intent', 'confidence', 'routing'];
    for (const insight of requiredInsights) {
      if (!ticketData.ai_insights[insight]) {
        validation.warnings.push(`Missing AI insight: ${insight}`);
        validation.missingElements.push(`ai_insights.${insight}`);
      }
    }
  }

  // Priority validation
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (ticketData.priority && !validPriorities.includes(ticketData.priority)) {
    validation.isValid = false;
    validation.errors.push(`Invalid priority: ${ticketData.priority}`);
  }

  // Category validation
  const validCategories = [
    'business', 'finance', 'marketing', 'operations', 'technology', 
    'strategy', 'team', 'customer', 'general'
  ];
  if (ticketData.category && !validCategories.includes(ticketData.category)) {
    validation.warnings.push(`Unusual category: ${ticketData.category}`);
  }

  // Title length validation
  if (ticketData.title && ticketData.title.length > 255) {
    validation.isValid = false;
    validation.errors.push('Title exceeds maximum length (255 characters)');
  }

  // Description quality validation
  if (ticketData.description) {
    if (ticketData.description.length < 10) {
      validation.warnings.push('Description is very short - consider adding more detail');
    }
    if (ticketData.description.length > 5000) {
      validation.warnings.push('Description is very long - consider summarizing');
    }
  }

  return validation;
}

/**
 * Validate ticket updates
 */
function validateTicketUpdate(originalTicket, updateData) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    changes: [],
    impact: 'low'
  };

  // Track what's being changed
  const changedFields = [];
  for (const [key, value] of Object.entries(updateData)) {
    if (originalTicket[key] !== value) {
      changedFields.push(key);
      validation.changes.push(`${key}: ${originalTicket[key]} → ${value}`);
    }
  }

  // Validate status transitions
  if (updateData.status && originalTicket.status !== updateData.status) {
    const validTransitions = {
      'active': ['paused', 'completed', 'abandoned'],
      'paused': ['active', 'completed', 'abandoned'],
      'completed': [], // Can't transition from completed
      'abandoned': [] // Can't transition from abandoned
    };

    const allowedTransitions = validTransitions[originalTicket.status] || [];
    if (!allowedTransitions.includes(updateData.status)) {
      validation.isValid = false;
      validation.errors.push(`Invalid status transition: ${originalTicket.status} → ${updateData.status}`);
    }
  }

  // Validate priority changes
  if (updateData.priority && originalTicket.priority !== updateData.priority) {
    const priorityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const oldLevel = priorityLevels[originalTicket.priority];
    const newLevel = priorityLevels[updateData.priority];
    
    if (newLevel > oldLevel) {
      validation.impact = 'high';
      validation.warnings.push(`Priority escalated from ${originalTicket.priority} to ${updateData.priority}`);
    }
  }

  // Validate completion requirements
  if (updateData.status === 'completed') {
    if (!updateData.completed_at) {
      validation.warnings.push('Completion timestamp missing');
    }
    if (!updateData.progress || updateData.progress < 100) {
      validation.warnings.push('Ticket marked complete but progress < 100%');
    }
  }

  // Validate progress updates
  if (updateData.progress !== undefined) {
    if (updateData.progress < 0 || updateData.progress > 100) {
      validation.isValid = false;
      validation.errors.push('Progress must be between 0 and 100');
    }
    if (updateData.progress < originalTicket.progress) {
      validation.warnings.push('Progress decreased - unusual but allowed');
    }
  }

  return validation;
}

/**
 * Analyze ticket health and identify issues
 */
function analyzeTicketHealth(ticket) {
  const health = {
    score: 100,
    issues: [],
    recommendations: [],
    risk: 'low'
  };

  // Check for stale tickets
  const daysSinceUpdate = Math.floor((Date.now() - new Date(ticket.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate > 7 && ticket.status === 'active') {
    health.score -= 20;
    health.issues.push(`Ticket hasn't been updated in ${daysSinceUpdate} days`);
    health.recommendations.push('Consider updating progress or pausing if blocked');
  }

  if (daysSinceUpdate > 14 && ticket.status === 'active') {
    health.score -= 30;
    health.risk = 'medium';
    health.issues.push(`Ticket is stale (${daysSinceUpdate} days without update)`);
    health.recommendations.push('Review if ticket should be paused or abandoned');
  }

  // Check for high priority tickets without recent activity
  if (ticket.priority === 'critical' && daysSinceUpdate > 2) {
    health.score -= 40;
    health.risk = 'high';
    health.issues.push('Critical priority ticket without recent updates');
    health.recommendations.push('Immediate attention required');
  }

  // Check for tickets with low progress but high age
  if (ticket.progress < 25 && daysSinceUpdate > 5) {
    health.score -= 15;
    health.issues.push('Low progress despite being active for several days');
    health.recommendations.push('Review if additional resources or clarification needed');
  }

  // Check for tickets without proper categorization
  if (!ticket.category || ticket.category === 'general') {
    health.score -= 10;
    health.issues.push('Ticket lacks specific categorization');
    health.recommendations.push('Assign appropriate category for better organization');
  }

  // Check for tickets without tags
  if (!ticket.tags || ticket.tags.length === 0) {
    health.score -= 5;
    health.issues.push('Ticket has no tags');
    health.recommendations.push('Add relevant tags for better searchability');
  }

  // Check for tickets with missing AI insights
  if (!ticket.ai_insights || !ticket.ai_insights.routing) {
    health.score -= 15;
    health.issues.push('Missing AI routing information');
    health.recommendations.push('Ensure proper AI analysis and routing');
  }

  // Ensure health score doesn't go below 0
  health.score = Math.max(0, health.score);

  // Determine overall risk level
  if (health.score < 50) {
    health.risk = 'high';
  } else if (health.score < 75) {
    health.risk = 'medium';
  }

  return health;
}

/**
 * Generate ticket completion checklist
 */
function generateCompletionChecklist(ticket) {
  const checklist = {
    required: [],
    recommended: [],
    optional: [],
    completed: [],
    missing: []
  };

  // Required items for completion
  checklist.required = [
    'Progress at 100%',
    'Status set to completed',
    'Completion timestamp',
    'Final description or summary'
  ];

  // Recommended items
  checklist.recommended = [
    'Lessons learned documented',
    'Related tickets linked',
    'Success metrics recorded',
    'Next steps identified'
  ];

  // Optional items
  checklist.optional = [
    'Screenshots or attachments',
    'User feedback collected',
    'Process improvements noted',
    'Knowledge base article created'
  ];

  // Check what's already completed
  if (ticket.progress === 100) checklist.completed.push('Progress at 100%');
  if (ticket.status === 'completed') checklist.completed.push('Status set to completed');
  if (ticket.completed_at) checklist.completed.push('Completion timestamp');
  if (ticket.description && ticket.description.length > 50) checklist.completed.push('Final description or summary');

  // Determine missing required items
  checklist.missing = checklist.required.filter(item => !checklist.completed.includes(item));

  return checklist;
}

/**
 * Update ticket with validation and health monitoring
 */
async function updateTicket(ticketId, updateData, user) {
  try {
    const uuidUserId = hashToUUID(user.id);

    // Get current ticket
    const currentTicketResult = await query(
      `SELECT * FROM brain_tickets WHERE id = $1 AND user_id = $2`,
      [ticketId, uuidUserId]
    );

    if (currentTicketResult.rows.length === 0) {
      throw new Error('Ticket not found');
    }

    const currentTicket = currentTicketResult.rows[0];

    // Use AI-powered validation if available, fallback to rule-based
    let updateValidation;
    try {
      updateValidation = await validateUpdateWithAI(currentTicket, updateData, user);
    } catch (aiError) {
      logger.warn('AI validation failed, using rule-based validation', { error: aiError.message });
      updateValidation = validateTicketUpdate(currentTicket, updateData);
    }
    
    if (!updateValidation.isValid) {
      throw new Error(`Update validation failed: ${updateValidation.errors.join(', ')}`);
    }

    // Prepare update data
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'user_id') { // Don't allow updating these fields
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(new Date().toISOString());

    // Add completion timestamp if status is being set to completed
    if (updateData.status === 'completed' && currentTicket.status !== 'completed') {
      updateFields.push(`completed_at = NOW()`);
      updateValues.push(new Date().toISOString());
    }

    // Execute update
    const updateQuery = `
      UPDATE brain_tickets 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;
    updateValues.push(ticketId, uuidUserId);

    const result = await query(updateQuery, updateValues);
    const updatedTicket = result.rows[0];

    // Get AI-powered health analysis
    let aiHealthAnalysis = null;
    try {
      const context = {
        totalTickets: 1, // We could fetch this if needed
        activeTickets: updatedTicket.status === 'active' ? 1 : 0,
        completedTickets: updatedTicket.status === 'completed' ? 1 : 0
      };
      aiHealthAnalysis = await analyzeTicketWithAI(updatedTicket, context);
    } catch (aiError) {
      logger.warn('AI health analysis failed, using rule-based', { error: aiError.message });
    }

    // Use AI analysis if available, otherwise fallback to rule-based
    const health = aiHealthAnalysis ? {
      score: aiHealthAnalysis.healthAssessment.score,
      issues: aiHealthAnalysis.healthAssessment.issues,
      recommendations: aiHealthAnalysis.recommendations.immediate,
      risk: aiHealthAnalysis.healthAssessment.riskLevel
    } : analyzeTicketHealth(updatedTicket);

    // Log the update
    logger.info('Ticket updated', {
      ticketId,
      userId: user.id,
      changes: updateValidation.changes,
      healthScore: health.score,
      risk: health.risk,
      aiValidated: !!updateValidation.aiReasoning
    });

    return {
      success: true,
      data: {
        ticket: updatedTicket,
        validation: updateValidation,
        health,
        aiAnalysis: aiHealthAnalysis,
        message: 'Ticket updated successfully'
      }
    };

  } catch (error) {
    logger.error('Error updating ticket:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Close ticket with proper completion process
 */
async function closeTicket(ticketId, completionData, user) {
  try {
    const uuidUserId = hashToUUID(user.id);

    // Get current ticket
    const currentTicketResult = await query(
      `SELECT * FROM brain_tickets WHERE id = $1 AND user_id = $2`,
      [ticketId, uuidUserId]
    );

    if (currentTicketResult.rows.length === 0) {
      throw new Error('Ticket not found');
    }

    const currentTicket = currentTicketResult.rows[0];

    // Use AI-powered completion assessment
    let completionAssessment;
    try {
      completionAssessment = await assessCompletionWithAI(currentTicket, completionData);
    } catch (aiError) {
      logger.warn('AI completion assessment failed, using rule-based', { error: aiError.message });
      const checklist = generateCompletionChecklist(currentTicket);
      completionAssessment = {
        readyForCompletion: checklist.missing.length === 0,
        missingElements: checklist.missing,
        completionScore: checklist.completed.length / checklist.required.length * 100
      };
    }
    
    if (!completionAssessment.readyForCompletion) {
      return {
        success: false,
        error: `Cannot close ticket - missing elements: ${completionAssessment.missingElements.join(', ')}`,
        data: { 
          assessment: completionAssessment,
          completionScore: completionAssessment.completionScore
        }
      };
    }

    // Prepare completion data
    const completionUpdate = {
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      ...completionData
    };

    // Update ticket to completed status
    const updateResult = await updateTicket(ticketId, completionUpdate, user);

    if (!updateResult.success) {
      return updateResult;
    }

    // Log completion
    logger.info('Ticket completed', {
      ticketId,
      userId: user.id,
      completionTime: completionUpdate.completed_at,
      completionData,
      aiAssessed: !!completionAssessment.completionNotes
    });

    return {
      success: true,
      data: {
        ticket: updateResult.data.ticket,
        assessment: completionAssessment,
        aiAnalysis: updateResult.data.aiAnalysis,
        message: 'Ticket completed successfully'
      }
    };

  } catch (error) {
    logger.error('Error closing ticket:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Monitor and report on ticket health
 */
async function monitorTicketHealth(user) {
  try {
    const uuidUserId = hashToUUID(user.id);

    // Get all user's tickets
    const ticketsResult = await query(
      `SELECT * FROM brain_tickets WHERE user_id = $1 ORDER BY updated_at DESC`,
      [uuidUserId]
    );

    const tickets = ticketsResult.rows;

    // Use AI-powered health monitoring
    let healthReport;
    try {
      healthReport = await monitorHealthWithAI(tickets, user);
    } catch (aiError) {
      logger.warn('AI health monitoring failed, using rule-based', { error: aiError.message });
      
      // Fallback to rule-based monitoring
      const ruleBasedReport = {
        totalTickets: tickets.length,
        activeTickets: 0,
        completedTickets: 0,
        healthScores: [],
        highRiskTickets: [],
        staleTickets: [],
        recommendations: []
      };

      for (const ticket of tickets) {
        const health = analyzeTicketHealth(ticket);
        
        if (ticket.status === 'active') {
          ruleBasedReport.activeTickets++;
        } else if (ticket.status === 'completed') {
          ruleBasedReport.completedTickets++;
        }

        ruleBasedReport.healthScores.push({
          ticketId: ticket.id,
          title: ticket.title,
          score: health.score,
          risk: health.risk
        });

        if (health.risk === 'high') {
          ruleBasedReport.highRiskTickets.push({
            ticketId: ticket.id,
            title: ticket.title,
            issues: health.issues,
            lastUpdated: ticket.updated_at
          });
        }

        if (health.issues.some(issue => issue.includes('stale'))) {
          ruleBasedReport.staleTickets.push({
            ticketId: ticket.id,
            title: ticket.title,
            daysSinceUpdate: Math.floor((Date.now() - new Date(ticket.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          });
        }

        ruleBasedReport.recommendations.push(...health.recommendations);
      }

      const avgHealthScore = ruleBasedReport.healthScores.length > 0 
        ? ruleBasedReport.healthScores.reduce((sum, ticket) => sum + ticket.score, 0) / ruleBasedReport.healthScores.length
        : 100;

      ruleBasedReport.overallHealthScore = Math.round(avgHealthScore);
      ruleBasedReport.overallRisk = avgHealthScore < 50 ? 'high' : avgHealthScore < 75 ? 'medium' : 'low';

      healthReport = {
        success: true,
        data: ruleBasedReport
      };
    }

    return healthReport;

  } catch (error) {
    logger.error('Error monitoring ticket health:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main ticket management agent function
 */
async function ticket_management_agent(payload, user) {
  const { action, ticketId, updateData, completionData, useAI = true } = payload;

  try {
    if (!user) {
      throw new Error('User authentication required');
    }

    logger.info('Ticket management agent request', {
      userId: user.id,
      action,
      ticketId,
      useAI
    });

    let result;

    switch (action) {
      case 'validate_ticket':
        result = {
          success: true,
          data: {
            validation: validateTicketStructure(updateData),
            message: 'Ticket structure validated'
          }
        };
        break;

      case 'update_ticket':
        if (!ticketId || !updateData) {
          throw new Error('Ticket ID and update data required');
        }
        result = await updateTicket(ticketId, updateData, user);
        break;

      case 'close_ticket':
        if (!ticketId) {
          throw new Error('Ticket ID required');
        }
        result = await closeTicket(ticketId, completionData || {}, user);
        break;

      case 'monitor_health':
        result = await monitorTicketHealth(user);
        break;

      case 'analyze_health':
        if (!ticketId) {
          throw new Error('Ticket ID required');
        }
        const uuidUserId = hashToUUID(user.id);
        
        let ticketResult;
        try {
          ticketResult = await query(
            `SELECT * FROM brain_tickets WHERE id = $1 AND user_id = $2`,
            [ticketId, uuidUserId]
          );
        } catch (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }
        
        if (!ticketResult || !ticketResult.rows || ticketResult.rows.length === 0) {
          throw new Error('Ticket not found');
        }
        
        const ticket = ticketResult.rows[0];
        
        // Use AI analysis if requested and available
        let health, checklist, aiAnalysis;
        if (useAI) {
          try {
            aiAnalysis = await analyzeTicketWithAI(ticket);
            health = {
              score: aiAnalysis.healthAssessment.score,
              issues: aiAnalysis.healthAssessment.issues,
              recommendations: aiAnalysis.recommendations.immediate,
              risk: aiAnalysis.healthAssessment.riskLevel
            };
            checklist = {
              required: aiAnalysis.recommendations.immediate,
              recommended: aiAnalysis.recommendations.shortTerm,
              optional: aiAnalysis.recommendations.longTerm,
              completed: [],
              missing: aiAnalysis.recommendations.immediate
            };
          } catch (aiError) {
            logger.warn('AI health analysis failed, using rule-based', { error: aiError.message });
            health = analyzeTicketHealth(ticket);
            checklist = generateCompletionChecklist(ticket);
          }
        } else {
          health = analyzeTicketHealth(ticket);
          checklist = generateCompletionChecklist(ticket);
        }
        
        result = {
          success: true,
          data: {
            ticket,
            health,
            checklist,
            aiAnalysis,
            message: 'Ticket health analyzed'
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    logger.info('Ticket management agent completed', {
      userId: user.id,
      action,
      success: result.success,
      aiEnhanced: result.data?.aiAnalysis || result.data?.aiGenerated
    });

    return result;

  } catch (error) {
    logger.error('Ticket management agent error:', {
      message: error.message,
      stack: error.stack,
      userId: user?.id,
      action
    });

    return {
      success: false,
      error: error.message || 'Failed to process ticket management request'
    };
  }
}

module.exports = ticket_management_agent;
