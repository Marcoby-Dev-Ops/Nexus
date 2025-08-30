/**
 * Journey Ticket Service
 * 
 * Manages journey tickets for tracking problems, issues, updates, and new entries in Nexus.
 * This is the core system that determines if problems, issues, updates, or new entries 
 * were properly processed and tracked.
 */

import { BaseService } from '@/core/services/BaseService';
import { callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export interface JourneyTicket {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description?: string;
  ticket_type: 'issue' | 'problem' | 'update' | 'new_entry' | 'improvement' | 'question';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  category?: string;
  source?: string;
  source_id?: string;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  ai_insights?: Record<string, any>;
  business_impact?: Record<string, any>;
  related_tickets?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateJourneyTicketRequest {
  organization_id: string;
  user_id: string;
  title: string;
  description?: string;
  ticket_type: JourneyTicket['ticket_type'];
  priority?: JourneyTicket['priority'];
  category?: string;
  source?: string;
  source_id?: string;
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
  ai_insights?: Record<string, any>;
  business_impact?: Record<string, any>;
}

export interface UpdateJourneyTicketRequest {
  title?: string;
  description?: string;
  priority?: JourneyTicket['priority'];
  status?: JourneyTicket['status'];
  category?: string;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  ai_insights?: Record<string, any>;
  business_impact?: Record<string, any>;
  tags?: string[];
}

export interface JourneyTicketFilters {
  organization_id?: string;
  user_id?: string;
  ticket_type?: JourneyTicket['ticket_type'];
  priority?: JourneyTicket['priority'];
  status?: JourneyTicket['status'];
  category?: string;
  assigned_to?: string;
  tags?: string[];
  source?: string;
  limit?: number;
  offset?: number;
}

export class JourneyTicketService extends BaseService {
  private readonly EDGE_FUNCTION = 'journey';

  /**
   * Create a new journey ticket
   */
  async createTicket(request: CreateJourneyTicketRequest): Promise<ServiceResponse<JourneyTicket>> {
    try {
      logger.info('Creating journey ticket', { 
        organization_id: request.organization_id,
        ticket_type: request.ticket_type,
        title: request.title 
      });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'create', 
        data: request 
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to create journey ticket'));
      }

      logger.info('Journey ticket created successfully', { 
        ticket_id: response.data?.id,
        ticket_type: request.ticket_type 
      });

      return this.createResponse(response.data as JourneyTicket);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get journey tickets with optional filters
   */
  async getTickets(filters: JourneyTicketFilters = {}): Promise<ServiceResponse<JourneyTicket[]>> {
    try {
      logger.info('Fetching journey tickets', { filters });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'get', 
        filters 
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to fetch journey tickets'));
      }

      logger.info('Journey tickets fetched successfully', { 
        count: response.data?.length || 0 
      });

      return this.createResponse(response.data as JourneyTicket[]);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific journey ticket by ID
   */
  async getTicket(ticketId: string): Promise<ServiceResponse<JourneyTicket>> {
    try {
      logger.info('Fetching journey ticket', { ticket_id: ticketId });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'get_by_id', 
        ticket_id: ticketId 
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to fetch journey ticket'));
      }

      return this.createResponse(response.data as JourneyTicket);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a journey ticket
   */
  async updateTicket(ticketId: string, updates: UpdateJourneyTicketRequest): Promise<ServiceResponse<JourneyTicket>> {
    try {
      logger.info('Updating journey ticket', { 
        ticket_id: ticketId,
        updates: Object.keys(updates) 
      });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'update', 
        ticket_id: ticketId, 
        updates 
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to update journey ticket'));
      }

      logger.info('Journey ticket updated successfully', { ticket_id: ticketId });

      return this.createResponse(response.data as JourneyTicket);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a journey ticket
   */
  async deleteTicket(ticketId: string): Promise<ServiceResponse<boolean>> {
    try {
      logger.info('Deleting journey ticket', { ticket_id: ticketId });

      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'delete', 
        ticket_id: ticketId 
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to delete journey ticket'));
      }

      logger.info('Journey ticket deleted successfully', { ticket_id: ticketId });

      return this.createResponse(true);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create a journey ticket from conversation context
   */
  async createFromConversation(
    organizationId: string,
    userId: string,
    conversationContext: {
      messages: Array<{ role: string; content: string }>;
      agentId: string;
      source: string;
      sourceId?: string;
    }
  ): Promise<ServiceResponse<JourneyTicket>> {
    try {
      logger.info('Creating journey ticket from conversation', { 
        organization_id: organizationId,
        agent_id: conversationContext.agentId 
      });

      // Analyze conversation to determine ticket type and priority
      const analysis = this.analyzeConversationForTicket(conversationContext.messages);
      
      const ticketRequest: CreateJourneyTicketRequest = {
        organization_id: organizationId,
        user_id: userId,
        title: analysis.title,
        description: analysis.description,
        ticket_type: analysis.ticketType,
        priority: analysis.priority,
        category: analysis.category,
        source: conversationContext.source,
        source_id: conversationContext.sourceId,
        tags: analysis.tags,
        ai_insights: {
          agent_id: conversationContext.agentId,
          conversation_summary: analysis.summary,
          detected_issues: analysis.detectedIssues,
          suggested_actions: analysis.suggestedActions
        }
      };

      return await this.createTicket(ticketRequest);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Analyze conversation to determine ticket properties
   */
  private analyzeConversationForTicket(messages: Array<{ role: string; content: string }>) {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    const allContent = messages.map(msg => msg.content.toLowerCase()).join(' ');
    
    // Determine ticket type based on content
    let ticketType: JourneyTicket['ticket_type'] = 'question';
    let priority: JourneyTicket['priority'] = 'medium';
    let category = 'general';
    const tags: string[] = [];
    const detectedIssues: string[] = [];
    const suggestedActions: string[] = [];

    // Analyze for problems/issues
    if (allContent.includes('problem') || allContent.includes('issue') || allContent.includes('error')) {
      ticketType = 'problem';
      priority = 'high';
      category = 'technical';
      tags.push('problem', 'issue');
    }

    // Analyze for updates/improvements
    if (allContent.includes('update') || allContent.includes('improve') || allContent.includes('enhance')) {
      ticketType = 'update';
      priority = 'medium';
      category = 'improvement';
      tags.push('update', 'improvement');
    }

    // Analyze for new features/entries
    if (allContent.includes('new') || allContent.includes('add') || allContent.includes('create')) {
      ticketType = 'new_entry';
      priority = 'medium';
      category = 'feature';
      tags.push('new', 'feature');
    }

    // Analyze for critical issues
    if (allContent.includes('critical') || allContent.includes('urgent') || allContent.includes('broken')) {
      priority = 'critical';
      tags.push('critical', 'urgent');
    }

    // Generate title and description
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    const title = lastUserMessage.length > 50 ? 
      lastUserMessage.substring(0, 50) + '...' : 
      lastUserMessage || 'Conversation Ticket';

    const summary = `Conversation with ${messages.length} messages. ${userMessages.length} user messages, ${assistantMessages.length} assistant responses.`;

    return {
      title,
      description: lastUserMessage,
      ticketType,
      priority,
      category,
      tags,
      summary,
      detectedIssues,
      suggestedActions
    };
  }

  /**
   * Get ticket statistics for an organization
   */
  async getTicketStats(organizationId: string): Promise<ServiceResponse<{
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    by_type: Record<string, number>;
    by_priority: Record<string, number>;
    by_category: Record<string, number>;
  }>> {
    try {
      const response = await callEdgeFunction(this.EDGE_FUNCTION, {
        action: 'get_stats', 
        organization_id: organizationId 
      });

      if (!response.success) {
        return this.handleError(new Error(response.error || 'Failed to fetch ticket statistics'));
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export default JourneyTicketService;
