/**
 * Email Integration Service
 * Real-time email processing and integration with business systems
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
// Avoid importing OAuthTokenService here to prevent noisy logs during optional checks
import { EmailIntelligenceService } from '../ai/emailIntelligenceService';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';

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

export class EmailIntegrationService extends BaseService {
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

  // Idempotent initialization guard to avoid double init under StrictMode
  private static hasInitializedForWindow = false;

  constructor() {
    super();
    this.emailIntelligenceService = new EmailIntelligenceService();
    if (!EmailIntegrationService.hasInitializedForWindow) {
      EmailIntegrationService.hasInitializedForWindow = true;
      // Defer initialization until we confirm an email account is connected
      // This prevents the Mail service from starting when no account is linked
      // and aligns with requirement to avoid side-effects before integration.
      // Use setTimeout to defer initialization and avoid blocking the main thread
      setTimeout(() => {
        void this.maybeInitialize();
      }, 0);
    } else {
      this.logger.debug('EmailIntegrationService initialization skipped (already initialized)');
    }
  }

  /**
   * Conditionally initialize based on whether an email account is connected
   */
  private async maybeInitialize(): Promise<void> {
    try {
      // Check if we have a valid session before proceeding
      const sessionResult = await authentikAuthService.getSession();
      if (!sessionResult.success || !sessionResult.data) {
        this.logger.info('No valid session available; skipping email integration initialization');
        return;
      }

      const isConnected = await this.isEmailIntegrationConnected();
      if (!isConnected) {
        this.logger.info('Email integration not connected; skipping real-time initialization');
        return;
      }
      await this.initializeRealTimeProcessing();
    } catch (error) {
      this.logger.error('Error during conditional initialization', error);
    }
  }

  /**
   * Determine whether the current user has a connected email account
   * Checks active OAuth tokens for email providers and falls back to user_integrations
   */
  private async isEmailIntegrationConnected(): Promise<boolean> {
    try {
      const result = await authentikAuthService.getSession();
      const user = result.data?.user;
      if (!user) {
        return false;
      }

      // Check: look for a user_integrations record indicating email connection
      const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select('integration_name, status')
        .eq('user_id', user.id);

      if (error) {
        return false;
      }

      const normalize = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : '');
      const isActive = (s: unknown) => {
        const status = normalize(s);
        return status === 'connected';
      };

      const hasEmailIntegration = (integrations || []).some((i: any) => {
        const name = normalize(i.integration_name);
        const emailProviders = ['microsoft', 'gmail', 'google', 'outlook'];
        const matchesProvider = emailProviders.some((p) => name.includes(p));
        return matchesProvider && isActive(i.status);
      });

      return hasEmailIntegration;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Initialize real-time email processing system
   */
  private async initializeRealTimeProcessing(): Promise<void> {
    try {
      if (this.config.realTimeProcessing) {
        await this.setupWebhookSubscriptions();
        await this.startBackgroundProcessing();
      this.logger.info('Real-time email processing initialized');
      }
    } catch (error) {
      this.logger.error('Error initializing real-time processing', error);
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

      this.logger.info('Webhook subscriptions established', {
        providers: providers.length
      });
    } catch (error) {
      this.logger.error('Error setting up webhook subscriptions', error);
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
      this.logger.error('Error creating webhook subscription', { error, provider });
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
    } catch (error) {
      this.logger.error('Error starting background processing', error);
    }
  }

  /**
   * Process real-time email events
   */
  async processRealTimeEmail(emailData: any): Promise<ServiceResponse<void>> {
    const emailIdValidation = this.validateIdParam(emailData.id, 'emailId');
    if (emailIdValidation) {
      return this.createErrorResponse(emailIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Check if already processing
          if (this.processingQueue.has(emailData.id)) {
            return { data: undefined, error: null };
          }

          // Add to processing queue
          const processingPromise = this.executeRealTimeProcessing(emailData);
          this.processingQueue.set(emailData.id, processingPromise);

          // Wait for processing to complete
          await processingPromise;

          // Remove from queue
          this.processingQueue.delete(emailData.id);

          return { data: undefined, error: null };
        } catch (error) {
          this.processingQueue.delete(emailData.id);
          return { data: null, error: error instanceof Error ? error.message : 'Real-time email processing failed' };
        }
      },
      'processRealTimeEmail'
    );
  }

  /**
   * Execute real-time email processing
   */
  private async executeRealTimeProcessing(emailData: any): Promise<void> {
    try {
      // Create email event
      const emailEvent: RealTimeEmailEvent = {
        id: emailData.id,
        userId: emailData.user_id,
        emailData: {
          subject: emailData.subject || '',
          body: emailData.body || '',
          sender: emailData.sender || '',
          senderName: emailData.sender_name,
          receivedAt: emailData.received_at || new Date().toISOString(),
          source: emailData.source_type || 'other',
          metadata: emailData.metadata
        },
        processingPriority: this.assessProcessingPriority(emailData),
        businessContext: await this.getBusinessContext(emailData.user_id)
      };

      // Process with email intelligence service
      const intelligenceResult = await this.emailIntelligenceService.processIncomingEmail({
        id: emailEvent.id,
        userId: emailEvent.userId,
        subject: emailEvent.emailData.subject,
        body: emailEvent.emailData.body,
        sender: emailEvent.emailData.sender,
        senderName: emailEvent.emailData.senderName,
        receivedAt: emailEvent.emailData.receivedAt
      });

      if (intelligenceResult.success && intelligenceResult.data) {
        // Execute automated workflows
        if (this.config.autoWorkflowExecution && intelligenceResult.data.workflows) {
          await this.executeAutomatedWorkflows(intelligenceResult.data.workflows, emailEvent);
        }

        // Trigger cross-platform integrations
        if (this.config.crossPlatformIntegration) {
          await this.triggerCrossPlatformIntegrations(emailEvent, intelligenceResult.data);
        }

        // Update email with analysis results
        await this.updateEmailWithAnalysis(emailEvent.id, intelligenceResult.data);
      }

    } catch (error) {
      this.logger.error('Error in real-time email processing', { error, emailId: emailData.id });
      throw error;
    }
  }

  /**
   * Assess processing priority based on email content
   */
  private assessProcessingPriority(emailContent: any): 'low' | 'medium' | 'high' | 'critical' {
    const content = `${emailContent.subject} ${emailContent.body}`.toLowerCase();
    
    // Critical keywords
    if (content.includes('urgent') || content.includes('asap') || content.includes('emergency')) {
      return 'critical';
    }
    
    // High priority keywords
    if (content.includes('important') || content.includes('meeting') || content.includes('deadline')) {
      return 'high';
    }
    
    // Medium priority keywords
    if (content.includes('follow up') || content.includes('update') || content.includes('request')) {
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
        await this.executeWorkflowWithContext(workflow, emailEvent);
      }
    } catch (error) {
      this.logger.error('Error executing automated workflows', { error, emailId: emailEvent.id });
    }
  }

  /**
   * Execute workflow with email context
   */
  private async executeWorkflowWithContext(workflow: any, emailEvent: RealTimeEmailEvent): Promise<void> {
    try {
      for (const action of workflow.actions) {
        await this.executeWorkflowAction(action, {
          email: emailEvent,
          workflow,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      this.logger.error('Error executing workflow with context', { error, workflowId: workflow.id });
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
      }
    } catch (error) {
      this.logger.error('Error executing workflow action', { error, action });
    }
  }

  /**
   * Trigger cross-platform integrations
   */
  private async triggerCrossPlatformIntegrations(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    try {
      // Integrate with CRM
      await this.integrateWithCRM(emailEvent, analysisResult);
      
      // Integrate with project management
      await this.integrateWithProjectManagement(emailEvent, analysisResult);
      
      // Integrate with calendar
      await this.integrateWithCalendar(emailEvent, analysisResult);
      
      // Integrate with notification systems
      await this.integrateWithNotificationSystems(emailEvent, analysisResult);
    } catch (error) {
      this.logger.error('Error triggering cross-platform integrations', { error, emailId: emailEvent.id });
    }
  }

  /**
   * Update email with analysis results
   */
  private async updateEmailWithAnalysis(emailId: string, analysisResult: any): Promise<void> {
    try {
              const { error } = await supabase
          .from('ai_inbox_items')
          .update({
            ai_processed_at: new Date().toISOString(),
            ai_priority_score: this.calculatePriorityScore(analysisResult),
            ai_category: this.determineCategory(analysisResult),
            ai_sentiment: this.determineSentiment(analysisResult),
            ai_action_suggestion: this.generateSummary(analysisResult)
          })
          .eq('id', emailId);

      if (error) {
        this.logger.error('Error updating email with analysis', { error, emailId });
      }
    } catch (error) {
      this.logger.error('Error updating email with analysis', { error, emailId });
    }
  }

  /**
   * Get business context for user
   */
  private async getBusinessContext(userId: string): Promise<any> {
    try {
      // Get user's company and business context
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

      return {
        companyId: userProfile.company_id,
        userRole: userProfile.role,
        department: userProfile.department,
        company: company
      };
    } catch (error) {
      this.logger.error('Error getting business context', { error, userId });
      return null;
    }
  }

  // Integration helper methods
  private async createTaskFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for creating tasks from email
  }

  private async scheduleMeetingFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for scheduling meetings from email
  }

  private async sendNotificationFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for sending notifications from email
  }

  private async updateCRMFromEmail(parameters: any, context: any): Promise<void> {
    // Implementation for updating CRM from email
  }

  private async escalateEmailIssue(parameters: any, context: any): Promise<void> {
    // Implementation for escalating email issues
  }

  private async integrateWithCRM(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for CRM integration
  }

  private async integrateWithProjectManagement(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for project management integration
  }

  private async integrateWithCalendar(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for calendar integration
  }

  private async integrateWithNotificationSystems(emailEvent: RealTimeEmailEvent, analysisResult: any): Promise<void> {
    // Implementation for notification system integration
  }

  /**
   * Process new emails for a user
   */
  async processNewEmails(userId: string): Promise<ServiceResponse<EmailAnalysisResult[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Get unprocessed emails
          const { data: emails, error } = await supabase
            .from('ai_inbox_items')
            .select('*')
            .eq('user_id', userId)
            .eq('source_type', 'email')
            .is('processed_at', null)
            .order('received_at', { ascending: false })
            .limit(this.config.maxEmailsPerAnalysis);

          if (error) {
            return { data: [], error };
          }

          const results: EmailAnalysisResult[] = [];

          for (const email of emails || []) {
            try {
              const analysisResult = await this.emailIntelligenceService.analyzeEmail(
                email.id,
                userId,
                {
                  subject: email.subject || '',
                  body: email.content || '',
                  sender: email.sender_email || '',
                  senderName: email.sender_name || undefined,
                  receivedAt: email.item_timestamp || new Date().toISOString()
                }
              );

              if (analysisResult.success && analysisResult.data) {
                results.push({
                  emailId: email.id,
                  subject: email.subject || '',
                  sender: email.sender || '',
                  opportunities: analysisResult.data.opportunities,
                  userContext: analysisResult.data.userContext,
                  analysis: analysisResult.data.analysis,
                  urgency: this.assessUrgency(email.subject || '', email.content || ''),
                  businessValue: this.assessBusinessValue(analysisResult.data.opportunities)
                });
              }
            } catch (error) {
              this.logger.error('Error processing email', { error, emailId: email.id });
            }
          }

          return { data: results, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to process new emails' };
        }
      },
      'processNewEmails'
    );
  }

  /**
   * Get email analysis for specific email
   */
  async getEmailAnalysis(emailId: string, userId: string): Promise<ServiceResponse<EmailAnalysisResult | null>> {
    const emailIdValidation = this.validateIdParam(emailId, 'emailId');
    if (emailIdValidation) {
      return this.createErrorResponse(emailIdValidation);
    }

    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Get email data
          const { data: email, error } = await supabase
            .from('ai_inbox_items')
            .select('*')
            .eq('id', emailId)
            .eq('user_id', userId)
            .single();

          if (error || !email) {
            return { data: null, error: 'Email not found' };
          }

          // Get analysis result
          const analysisResult = await this.emailIntelligenceService.analyzeEmail(
            emailId,
            userId,
            {
              subject: email.subject || '',
              body: email.content || '',
              sender: email.sender_email || '',
              senderName: email.sender_name || undefined,
              receivedAt: email.item_timestamp || new Date().toISOString()
            }
          );

          if (!analysisResult.success || !analysisResult.data) {
            return { data: null, error: 'Failed to analyze email' };
          }

          return {
            data: {
              emailId: email.id,
              subject: email.subject || '',
              sender: email.sender || '',
              opportunities: analysisResult.data.opportunities,
              userContext: analysisResult.data.userContext,
              analysis: analysisResult.data.analysis,
              urgency: this.assessUrgency(email.subject || '', email.content || ''),
              businessValue: this.assessBusinessValue(analysisResult.data.opportunities)
            },
            error: null
          };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to get email analysis' };
        }
      },
      'getEmailAnalysis'
    );
  }

  /**
   * Trigger email analysis manually
   */
  async triggerEmailAnalysis(userId: string, emailId: string): Promise<ServiceResponse<EmailAnalysisResult | null>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const emailIdValidation = this.validateIdParam(emailId, 'emailId');
    if (emailIdValidation) {
      return this.createErrorResponse(emailIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Get email data
          const { data: email, error } = await supabase
            .from('ai_inbox_items')
            .select('*')
            .eq('id', emailId)
            .eq('user_id', userId)
            .single();

          if (error || !email) {
            return { data: null, error: 'Email not found' };
          }

          // Process email
          await this.processRealTimeEmail(email);

          // Get updated analysis
          return await this.getEmailAnalysis(emailId, userId);
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to trigger email analysis' };
        }
      },
      'triggerEmailAnalysis'
    );
  }

  /**
   * Get user emails with analysis
   */
  async getUserEmails(userId: string, limit: number = 20): Promise<ServiceResponse<any[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const { data: emails, error } = await supabase
            .from('ai_inbox_items')
            .select('*')
            .eq('user_id', userId)
            .eq('source_type', 'email')
            .order('received_at', { ascending: false })
            .limit(limit);

          if (error) {
            return { data: [], error };
          }

          const processedEmails = (emails || []).map(email => this.parseUnifiedInboxEmail(email));

          return { data: processedEmails, error: null };
        } catch (error) {
          return { data: [], error: error instanceof Error ? error.message : 'Failed to get user emails' };
        }
      },
      'getUserEmails'
    );
  }

  /**
   * Parse unified inbox email
   */
  private parseUnifiedInboxEmail(email: any): any {
    return {
      id: email.id,
      subject: email.subject || '',
      sender: email.sender || '',
      body: email.body || '',
      receivedAt: email.received_at,
      source: email.source_type || 'email',
      urgency: this.assessUrgency(email.subject || '', email.body || ''),
      businessValue: 'medium', // Default value
      analysisResult: email.analysis_result,
      processingStatus: email.processing_status || 'pending'
    };
  }

  /**
   * Assess urgency based on email content
   */
  private assessUrgency(subject: string, content: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = `${subject} ${content}`.toLowerCase();
    
    if (text.includes('urgent') || text.includes('asap') || text.includes('emergency')) {
      return 'critical';
    }
    
    if (text.includes('important') || text.includes('deadline') || text.includes('meeting')) {
      return 'high';
    }
    
    if (text.includes('follow up') || text.includes('update') || text.includes('request')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Assess business value based on opportunities
   */
  private assessBusinessValue(opportunities: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (!opportunities || opportunities.length === 0) {
      return 'low';
    }

    const totalValue = opportunities.reduce((sum, opp) => {
      const value = opp.businessValue === 'critical' ? 4 : 
                   opp.businessValue === 'high' ? 3 : 
                   opp.businessValue === 'medium' ? 2 : 1;
      return sum + value;
    }, 0);

    const averageValue = totalValue / opportunities.length;

    if (averageValue >= 3.5) return 'critical';
    if (averageValue >= 2.5) return 'high';
    if (averageValue >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate priority score for analysis result
   */
  private calculatePriorityScore(analysisResult: any): number {
    const baseScore = 50;
    let score = baseScore;

    // Adjust based on opportunities
    if (analysisResult.opportunities?.length > 0) {
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

  /**
   * Determine category for analysis result
   */
  private determineCategory(analysisResult: any): string {
    if (analysisResult.opportunities?.some((o: any) => o.type === 'sales')) return 'sales';
    if (analysisResult.opportunities?.some((o: any) => o.type === 'customer_success')) return 'customer_success';
    if (analysisResult.opportunities?.some((o: any) => o.type === 'partnership')) return 'partnership';
    return 'general';
  }

  /**
   * Determine sentiment for analysis result
   */
  private determineSentiment(_analysisResult: any): 'positive' | 'neutral' | 'negative' {
    // Implementation for sentiment determination
    return 'neutral';
  }

  /**
   * Generate summary for analysis result
   */
  private generateSummary(analysisResult: any): string {
    const summaries = [];
    
    if (analysisResult.opportunities?.length > 0) {
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

  /**
   * Store email analysis
   */
  private async storeEmailAnalysis(analysis: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .insert(analysis);

      if (error) {
        this.logger.error('Error storing email analysis', { error });
      }
    } catch (error) {
      this.logger.error('Error storing email analysis', { error });
    }
  }
}

// Do not export a global singleton. Use the ServiceRegistry-managed instance instead.
