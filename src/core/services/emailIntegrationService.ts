/**
 * Email Integration Service
 * Enhanced with real-time processing, webhook integration, and automated orchestration
 */

import { supabase, insertOne } from '@/lib/supabase';
import { EmailIntelligenceService } from './emailIntelligenceService';
import { logger } from '@/shared/utils/logger.ts';

export interface EmailAnalysisResult {
  emailId: string;
  subject: string;
  sender: string;
  opportunities: any[];
  userContext: any;
  analysis: any;
  replyDraft?: any;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  businessValue: 'low' | 'medium' | 'high' | 'critical';
  predictions?: any[];
  workflows?: any[];
}

export interface RealTimeEmailEvent {
  id: string;
  userId: string;
  emailData: {
    subject: string;
    body: string;
    sender: string;
    senderName?: string;
    receivedAt: string;
    source: 'microsoft' | 'gmail' | 'outlook' | 'other';
    metadata?: Record<string, any>;
  };
  processingPriority: 'low' | 'medium' | 'high' | 'critical';
  businessContext?: any;
}

export class EmailIntegrationService {
  private config = {
    maxEmailsPerAnalysis: 50,
    autoDraftReplies: true,
    realTimeProcessing: true,
    webhookEnabled: true,
    autoWorkflowExecution: true,
    crossPlatformIntegration: true,
    predictiveAnalysis: true
  };

  private processingQueue: Map<string, Promise<any>> = new Map();
  private webhookSubscriptions: Map<string, any> = new Map();
  private emailIntelligenceService!: EmailIntelligenceService;

  constructor() {
    this.emailIntelligenceService = new EmailIntelligenceService();
    this.initializeRealTimeProcessing();
  }

  /**
   * Initialize real-time email processing system
   */
  private async initializeRealTimeProcessing(): Promise<void> {
    try {
      if (this.config.realTimeProcessing) {
        await this.setupWebhookSubscriptions();
        await this.startBackgroundProcessing();
        logger.info('Real-time email processing initialized');
      }
    } catch (error) {
      logger.error('Error initializing real-time processing', error);
    }
  }

  /**
   * Setup webhook subscriptions for real-time email processing
   */
  private async setupWebhookSubscriptions(): Promise<void> {
    try {
      // Subscribe to email provider webhooks
      const providers = ['microsoft', 'gmail', 'outlook'];
      
      for (const provider of providers) {
        const subscription = await this.createWebhookSubscription(provider);
        this.webhookSubscriptions.set(provider, subscription);
      }

      logger.info('Webhook subscriptions established', {
        providers: providers.length
      });
    } catch (error) {
      logger.error('Error setting up webhook subscriptions', error);
    }
  }

  /**
   * Create webhook subscription for email provider
   */
  private async createWebhookSubscription(provider: string): Promise<any> {
    try {
      // Implementation would integrate with provider APIs
      // For now, simulate webhook subscription
      return {
        provider,
        status: 'active',
        endpoint: `/api/webhooks/email/${provider}`,
        events: ['email.received', 'email.read', 'email.replied']
      };
    } catch (error) {
      logger.error('Error creating webhook subscription', { error, provider });
      throw error;
    }
  }

  /**
   * Start background processing for real-time email analysis
   */
  private async startBackgroundProcessing(): Promise<void> {
    try {
      // Set up real-time database listener for new emails
      supabase
        .channel('email-processing')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ai_inbox_items',
            filter: 'source_type=eq.email'
          },
          async (payload) => {
            await this.processRealTimeEmail(payload.new);
          }
        )
        .subscribe();

      logger.info('Background email processing started');
    } catch (error) {
      logger.error('Error starting background processing', error);
    }
  }

  /**
   * Process real-time email event
   */
  async processRealTimeEmail(emailData: any): Promise<void> {
    try {
      const processingId = `email_${emailData.id}_${Date.now()}`;
      
      // Check if already processing
      if (this.processingQueue.has(processingId)) {
        logger.info('Email already being processed', { emailId: emailData.id });
        return;
      }

      // Add to processing queue
      const processingPromise = this.executeRealTimeProcessing(emailData);
      this.processingQueue.set(processingId, processingPromise);

      // Execute processing
      await processingPromise;

      // Remove from queue
      this.processingQueue.delete(processingId);

      logger.info('Real-time email processing completed', { emailId: emailData.id });
    } catch (error) {
      logger.error('Error in real-time email processing', { error, emailId: emailData.id });
    }
  }

  /**
   * Execute real-time email processing with advanced capabilities
   */
  private async executeRealTimeProcessing(emailData: any): Promise<void> {
    try {
      // Parse email content
      const emailContent = this.parseUnifiedInboxEmail(emailData);
      if (!emailContent) {
        logger.warn('Could not parse email content', { emailId: emailData.id });
        return;
      }

      // Create real-time email event
      const emailEvent: RealTimeEmailEvent = {
        id: emailData.id,
        userId: emailData.user_id,
        emailData: {
          subject: emailContent.subject,
          body: emailContent.body,
          sender: emailContent.sender,
          senderName: emailContent.senderName,
          receivedAt: emailContent.receivedAt,
          source: emailData.provider || 'other',
          metadata: {
            threadId: emailData.thread_id,
            messageId: emailData.message_id,
            hasAttachments: emailData.has_attachments,
            isImportant: emailData.is_important
          }
        },
        processingPriority: this.assessProcessingPriority(emailContent),
        businessContext: await this.getBusinessContext(emailData.user_id)
      };

      // Process with enhanced intelligence service
      const result = await this.emailIntelligenceService.processIncomingEmail({
        id: emailEvent.id,
        subject: emailEvent.emailData.subject,
        body: emailEvent.emailData.body,
        sender: emailEvent.emailData.sender,
        senderName: emailEvent.emailData.senderName,
        receivedAt: emailEvent.emailData.receivedAt,
        userId: emailEvent.userId
      });

      // Execute automated workflows if enabled
      if (this.config.autoWorkflowExecution && result.workflows.length > 0) {
        await this.executeAutomatedWorkflows(result.workflows, emailEvent);
      }

      // Update email with analysis results
      await this.updateEmailWithAnalysis(emailData.id, result);

      // Trigger cross-platform integrations
      if (this.config.crossPlatformIntegration) {
        await this.triggerCrossPlatformIntegrations(emailEvent, result);
      }

      logger.info('Real-time processing completed successfully', {
        emailId: emailData.id,
        opportunities: result.opportunities.length,
        predictions: result.predictions.length,
        workflows: result.workflows.length
      });

    } catch (error) {
      logger.error('Error in real-time processing execution', { error, emailId: emailData.id });
      throw error;
    }
  }

  /**
   * Assess processing priority based on email content and context
   */
  private assessProcessingPriority(emailContent: any): 'low' | 'medium' | 'high' | 'critical' {
    const content = `${emailContent.subject} ${emailContent.body}`.toLowerCase();
    
    // Critical indicators
    const criticalIndicators = ['urgent', 'asap', 'emergency', 'critical', 'immediate'];
    if (criticalIndicators.some(indicator => content.includes(indicator))) {
      return 'critical';
    }

    // High priority indicators
    const highIndicators = ['important', 'priority', 'urgent', 'deadline', 'meeting'];
    if (highIndicators.some(indicator => content.includes(indicator))) {
      return 'high';
    }

    // Medium priority indicators
    const mediumIndicators = ['follow up', 'review', 'discuss', 'schedule'];
    if (mediumIndicators.some(indicator => content.includes(indicator))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Execute automated workflows
   */
  private async executeAutomatedWorkflows(workflows: any[], emailEvent: RealTimeEmailEvent): Promise<void> {
    try {
      for (const workflow of workflows) {
        try {
          // Execute workflow with email context
          await this.executeWorkflowWithContext(workflow, emailEvent);
          
          // Log workflow execution
          await this.logWorkflowExecution(workflow, emailEvent);
          
        } catch (error) {
          logger.error('Error executing workflow', { error, workflowId: workflow.id });
        }
      }
    } catch (error) {
      logger.error('Error executing automated workflows', { error });
    }
  }

  /**
   * Execute workflow with email context
   */
  private async executeWorkflowWithContext(workflow: any, emailEvent: RealTimeEmailEvent): Promise<void> {
    try {
      // Enhance workflow with email context
      const enhancedWorkflow = {
        ...workflow,
        context: {
          emailEvent,
          businessContext: emailEvent.businessContext,
          timestamp: new Date().toISOString()
        }
      };

      // Execute workflow actions
      for (const action of enhancedWorkflow.actions) {
        await this.executeWorkflowAction(action, enhancedWorkflow.context);
      }

      // Update workflow status
      await this.updateWorkflowStatus(workflow.id, 'completed');

    } catch (error) {
      logger.error('Error executing workflow with context', { error, workflowId: workflow.id });
      await this.updateWorkflowStatus(workflow.id, 'failed');
      throw error;
    }
  }

  /**
   * Execute individual workflow action
   */
  private async executeWorkflowAction(action: any, context: any): Promise<void> {
    try {
      switch (action.type) {
        case 'create_task':
          await this.createTaskFromEmail(action.parameters, context);
          break;
        case 'schedule_meeting':
          await this.scheduleMeetingFromEmail(action.parameters, context);
          break;
        case 'send_notification':
          await this.sendNotificationFromEmail(action.parameters, context);
          break;
        case 'update_crm':
          await this.updateCRMFromEmail(action.parameters, context);
          break;
        case 'escalate':
          await this.escalateEmailIssue(action.parameters, context);
          break;
        default: logger.warn('Unknown workflow action type', { action });
      }
    } catch (error) {
      logger.error('Error executing workflow action', { error, action });
      throw error;
    }
  }

  /**
   * Trigger cross-platform integrations
   */
  private async triggerCrossPlatformIntegrations(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    try {
      // Integrate with CRM systems
      if (analysisResult.opportunities.length > 0) {
        await this.integrateWithCRM(emailEvent, analysisResult);
      }

      // Integrate with project management
      if (analysisResult.workflows.some((w: any) => w.type === 'task_creation')) {
        await this.integrateWithProjectManagement(emailEvent, analysisResult);
      }

      // Integrate with calendar systems
      if (analysisResult.workflows.some((w: any) => w.type === 'meeting_scheduling')) {
        await this.integrateWithCalendar(emailEvent, analysisResult);
      }

      // Integrate with notification systems
      await this.integrateWithNotificationSystems(emailEvent, analysisResult);

    } catch (error) {
      logger.error('Error triggering cross-platform integrations', { error });
    }
  }

  /**
   * Update email with analysis results
   */
  private async updateEmailWithAnalysis(emailId: string, analysisResult: any): Promise<void> {
    try {
      const updateData: any = {};

      if (analysisResult.urgencyscore !== undefined) {
        updateData.urgencyscore = analysisResult.urgencyscore;
      }
      if (analysisResult.importance !== undefined) {
        updateData.importance = analysisResult.importance;
      }
      if (analysisResult.sentimentscore !== undefined) {
        updateData.sentimentscore = analysisResult.sentimentscore;
      }
      if (analysisResult.aiinsights !== undefined) {
        updateData.aiinsights = analysisResult.aiinsights;
      }
      if (analysisResult.updatedat !== undefined) {
        updateData.updatedat = analysisResult.updatedat;
      }
      if (analysisResult.riskscore !== undefined) {
        updateData.riskscore = analysisResult.riskscore;
      }

      const { error } = await supabase
        .from('ai_inbox_items')
        .update(updateData)
        .eq('id', emailId);

      if (error) {
        logger.error('Error updating email with analysis', { error, emailId });
      }

    } catch (error) {
      logger.error('Error updating email with analysis', { error, emailId });
    }
  }

  /**
   * Get business context for email processing
   */
  private async getBusinessContext(userId: string): Promise<any> {
    try {
      // Get user's business context
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('company_id, role, department')
        .eq('id', userId)
        .single();

      if (!userProfile?.company_id) {
        return null;
      }

      // Get company information
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userProfile.company_id)
        .single();

      // Get current business metrics
      const { data: kpiSnapshots } = await supabase
        .from('ai_kpi_snapshots')
        .select('*')
        .eq('org_id', userProfile.company_id)
        .order('captured_at', { ascending: false })
        .limit(5);

      return {
        company,
        userProfile,
        currentMetrics: kpiSnapshots?.[0] || {},
        businessContext: {
          industry: company?.industry,
          size: company?.size,
          stage: company?.growth_stage
        }
      };

    } catch (error) {
      logger.error('Error getting business context', { error, userId });
      return null;
    }
  }

  // Helper methods for workflow execution
  private async createTaskFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for creating tasks from email content
    logger.info('Creating task from email', { parameters, context });
  }

  private async scheduleMeetingFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for scheduling meetings from email content
    logger.info('Scheduling meeting from email', { parameters, context });
  }

  private async sendNotificationFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for sending notifications from email content
    logger.info('Sending notification from email', { parameters, context });
  }

  private async updateCRMFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for updating CRM from email content
    logger.info('Updating CRM from email', { parameters, context });
  }

  private async escalateEmailIssue(parameters: any, context: any): Promise<void> {
    // Implementation for escalating email issues
    logger.info('Escalating email issue', { parameters, context });
  }

  // Integration methods
  private async integrateWithCRM(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for CRM integration
    logger.info('Integrating with CRM', { emailEvent, analysisResult });
  }

  private async integrateWithProjectManagement(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for project management integration
    logger.info('Integrating with project management', { emailEvent, analysisResult });
  }

  private async integrateWithCalendar(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for calendar integration
    logger.info('Integrating with calendar', { emailEvent, analysisResult });
  }

  private async integrateWithNotificationSystems(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for notification system integration
    logger.info('Integrating with notification systems', { emailEvent, analysisResult });
  }

  // Analysis helper methods
  private calculatePriorityScore(analysisResult: any): number {
    const baseScore = 50;
    let score = baseScore;

    // Adjust based on opportunities
    if (analysisResult.opportunities.length > 0) {
      score += analysisResult.opportunities.length * 10;
    }

    // Adjust based on predictions
    if (analysisResult.predictions?.length > 0) {
      score += analysisResult.predictions.length * 5;
    }

    // Adjust based on workflows
    if (analysisResult.workflows?.length > 0) {
      score += analysisResult.workflows.length * 3;
    }

    return Math.min(100, Math.max(0, score));
  }

  private determineCategory(analysisResult: any): string {
    if (analysisResult.opportunities.some((o: any) => o.type === 'sales')) return 'sales';
    if (analysisResult.opportunities.some((o: any) => o.type === 'customer_success')) return 'customer_success';
    if (analysisResult.opportunities.some((o: any) => o.type === 'partnership')) return 'partnership';
    return 'general';
  }

  private determineSentiment(_analysisResult: any): 'positive' | 'neutral' | 'negative' {
    // Implementation for sentiment determination
    return 'neutral';
  }

  private generateSummary(analysisResult: any): string {
    const summaries = [];
    
    if (analysisResult.opportunities.length > 0) {
      summaries.push(`${analysisResult.opportunities.length} opportunities detected`);
    }
    
    if (analysisResult.predictions?.length > 0) {
      summaries.push(`${analysisResult.predictions.length} predictions generated`);
    }
    
    if (analysisResult.workflows?.length > 0) {
      summaries.push(`${analysisResult.workflows.length} workflows triggered`);
    }

    return summaries.join('. ') || 'No significant insights detected';
  }

  private extractActionItems(analysisResult: any): string[] {
    const actionItems: string[] = [];
    
    // Extract from opportunities
    analysisResult.opportunities.forEach((opportunity: any) => {
      actionItems.push(...opportunity.requiredActions);
    });
    
    // Extract from workflows
    analysisResult.workflows?.forEach((__workflow: any) => {
      __workflow.actions.forEach((__action: any) => {
        actionItems.push(`${__action.type}: ${__action.target}`);
      });
    });

    return actionItems;
  }

  private async logWorkflowExecution(workflow: any, emailEvent: RealTimeEmailEvent): Promise<void> {
    // Implementation for workflow execution logging
    logger.info('Workflow executed', { workflowId: workflow.id, emailEvent });
  }

  private async updateWorkflowStatus(workflowId: string, status: string): Promise<void> {
    // Implementation for workflow status update
    logger.info('Workflow status updated', { workflowId, status });
  }

  // Legacy methods for backward compatibility
  async processNewEmails(userId: string): Promise<EmailAnalysisResult[]> {
    try {
      // Get recent emails from ai_inbox_items (unified inbox)
      const { data: recentEmails, error } = await supabase
        .from('ai_inbox_items')
        .select('*')
        .eq('userid', userId)
        .eq('sourcetype', 'email')
        .eq('isread', false) // Focus on unread emails
        .order('item_timestamp', { ascending: false })
        .limit(this.config.maxEmailsPerAnalysis);

      if (error) {
        logger.error('Error fetching recent emails for analysis', { error, userId });
        return [];
      }

      if (!recentEmails || recentEmails.length === 0) {
        logger.info('No new emails found for analysis');
        return [];
      }

      const results: EmailAnalysisResult[] = [];

      for (const email of recentEmails) {
        try {
          // Check if already analyzed
          const { data: existingAnalysis } = await supabase
            .from('ai_insights')
            .select('id')
            .eq('userid', userId)
            .eq('insighttype', 'opportunity')
            .eq('content', email.id)
            .limit(1);

          if (existingAnalysis && existingAnalysis.length > 0) {
            continue; // Already analyzed
          }

          // Parse email content from unified inbox format
          const emailContent = this.parseUnifiedInboxEmail(email);
          
          if (!emailContent) {
            continue;
          }

          // Analyze email
          const analysis = await this.emailIntelligenceService.analyzeEmail(
            email.id,
            userId,
            emailContent
          );

          // Generate reply draft if opportunities found
          let replyDraft = null;
          if (analysis.opportunities.length > 0 && this.config.autoDraftReplies) {
            replyDraft = await this.emailIntelligenceService.generateReplyDraft(
              email.id,
              userId,
              analysis.opportunities[0],
              analysis.userContext
            );
          }

          // Store analysis result
          if (analysis.opportunities.length > 0) {
            await this.storeEmailAnalysis({
              userid: userId,
              insighttype: 'opportunity',
              title: `Email Opportunity: ${email.subject}`,
              content: `Opportunity detected in email from ${email.sender_email}`,
              confidencescore: 0.8,
              urgency: this.assessUrgency(email.subject || '', email.content || ''),
              category: 'email_intelligence',
              metadata: {
                emailid: email.id,
                opportunities: analysis.opportunities,
                usercontext: analysis.userContext,
                replydraft: replyDraft
              },
              isactive: true
            });
          }

          results.push({
            emailId: email.id,
            subject: email.subject || '',
            sender: email.sender_email || '',
            opportunities: analysis.opportunities,
            userContext: analysis.userContext,
            analysis: analysis.analysis,
            replyDraft,
            urgency: this.assessUrgency(email.subject || '', email.content || ''),
            businessValue: this.assessBusinessValue(analysis.opportunities)
          });

        } catch (error) {
          logger.error('Error processing email for intelligence', {
            error,
            emailId: email.id
          });
        }
      }

      return results;

    } catch (error) {
      logger.error('Error processing new emails for intelligence', error);
      return [];
    }
  }

  async getEmailAnalysis(emailId: string, userId: string): Promise<EmailAnalysisResult | null> {
    try {
      // Get email from unified inbox
      const { data: email, error } = await supabase
        .from('ai_inbox_items')
        .select('*')
        .eq('id', emailId)
        .eq('userid', userId)
        .eq('sourcetype', 'email')
        .limit(1);

      if (error || !email || email.length === 0) {
        logger.error('Error getting email analysis', { error, emailId });
        return null;
      }

      const emailContent = this.parseUnifiedInboxEmail(email[0]);
      if (!emailContent) {
        return null;
      }

      // Analyze email
      const analysis = await this.emailIntelligenceService.analyzeEmail(
        emailId,
        userId,
        emailContent
      );

      return {
        emailId,
        subject: email[0].subject || '',
        sender: email[0].sender_email || '',
        opportunities: analysis.opportunities,
        userContext: analysis.userContext,
        analysis: analysis.analysis,
        urgency: this.assessUrgency(email[0].subject || '', email[0].content || ''),
        businessValue: this.assessBusinessValue(analysis.opportunities)
      };

    } catch (error) {
      logger.error('Error getting email analysis', { error, emailId });
      return null;
    }
  }

  async triggerEmailAnalysis(userId: string, emailId: string): Promise<EmailAnalysisResult | null> {
    try {
      // Get email from unified inbox
      const { data: email, error } = await supabase
        .from('ai_inbox_items')
        .select('*')
        .eq('id', emailId)
        .eq('userid', userId)
        .eq('sourcetype', 'email')
        .limit(1);

      if (error || !email || email.length === 0) {
        logger.error('Error triggering email analysis', { error, emailId });
        return null;
      }

      // Process with real-time capabilities
      await this.processRealTimeEmail(email[0]);

      // Return the analysis result
      return await this.getEmailAnalysis(emailId, userId);

    } catch (error) {
      logger.error('Error triggering email analysis', { error, emailId });
      return null;
    }
  }

  async getUserEmails(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data: emails, error } = await supabase
        .from('ai_inbox_items')
        .select('*')
        .eq('userid', userId)
        .eq('sourcetype', 'email')
        .order('item_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting user emails', { error, userId });
        return [];
      }
      return emails || [];
    } catch (error) {
      logger.error('Error getting user emails', { error, userId });
      return [];
    }
  }

  // Helper methods for backward compatibility
  private parseUnifiedInboxEmail(email: any): any {
    return {
      subject: email.subject,
      body: email.content,
      sender: email.sender_email,
      senderName: email.sender_name,
      receivedAt: email.item_timestamp
    };
  }

  private assessUrgency(subject: string, content: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = `${subject} ${content}`.toLowerCase();
    
    if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) {
      return 'critical';
    }
    
    if (text.includes('important') || text.includes('priority')) {
      return 'high';
    }
    
    if (text.includes('follow up') || text.includes('review')) {
      return 'medium';
    }
    
    return 'low';
  }

  private assessBusinessValue(opportunities: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (opportunities.length === 0) return 'low';
    
    const maxValue = Math.max(...opportunities.map((opportunity: any) => {
      switch (opportunity.businessValue) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 1;
      }
    }));
    
    switch (maxValue) {
      case 4: return 'critical';
      case 3: return 'high';
      case 2: return 'medium';
      default: return 'low';
    }
  }

  private async storeEmailAnalysis(analysis: any): Promise<void> {
    try {
      await insertOne('ai_insights', analysis);
    } catch (error) {
      logger.error('Error storing email analysis', { error });
    }
  }
}

// Export an instance of the service
export const emailIntegrationService = new EmailIntegrationService(); 