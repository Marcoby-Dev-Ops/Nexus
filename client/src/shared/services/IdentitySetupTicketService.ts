/**
 * Identity Setup Ticket Service
 * 
 * Orchestrates the 7 Building Blocks identity setup process as a brain ticket.
 * Manages conversation flow, progress tracking, and integration with the unified brain.
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { selectData, selectOne, upsertOne } from '@/lib/api-client';
import { onboardingBrainIntegration } from './OnboardingBrainIntegrationService';

// 7 Building Blocks Schema
export interface IdentityBlock {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'defined' | 'completed';
  data: Record<string, any>;
  slots: IdentitySlot[];
  progress: number; // 0-100%
}

export interface IdentitySlot {
  id: string;
  label: string;
  type: 'text' | 'array' | 'select' | 'textarea';
  required: boolean;
  value?: any;
  prompt: string;
  validation?: (value: any) => boolean;
}

export interface IdentitySetupTicket {
  id: string;
  type: 'identity_setup';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  userId: string;
  companyId?: string;
  
  // Foundation data from onboarding
  foundationData: {
    companyName: string;
    industry: string;
    size: string;
    role: string;
  };
  
  // The 7 Building Blocks
  identityBlocks: {
    mission: IdentityBlock;
    values: IdentityBlock;
    offerings: IdentityBlock;
    market: IdentityBlock;
    advantage: IdentityBlock;
    brand: IdentityBlock;
    objectives: IdentityBlock;
  };
  
  // Conversation state
  conversation: {
    currentBlock: keyof IdentitySetupTicket['identityBlocks'];
    completedBlocks: string[];
    totalProgress: number;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
      blockId?: string;
      slotId?: string;
    }>;
  };
  
  // Events and metadata
  events: Array<{
    type: string;
    timestamp: string;
    data: any;
  }>;
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Block templates with prompts and slots
const IDENTITY_BLOCK_TEMPLATES = {
  mission: {
    id: 'mission',
    title: 'Mission & Vision',
    description: 'Define why your business exists and where it\'s going',
    slots: [
      {
        id: 'mission_statement',
        label: 'Mission Statement',
        type: 'textarea',
        required: true,
        prompt: 'What is your company\'s mission? Why does your business exist? What problem does it solve?'
      },
      {
        id: 'vision_statement',
        label: 'Vision Statement',
        type: 'textarea',
        required: true,
        prompt: 'What is your company\'s vision? Where do you see your business in 3-5 years? What\'s the ultimate impact you want to have?'
      },
      {
        id: 'purpose',
        label: 'Core Purpose',
        type: 'text',
        required: false,
        prompt: 'What is the deeper purpose that drives your business? What motivates you beyond profit?'
      }
    ]
  },
  
  values: {
    id: 'values',
    title: 'Values & Culture',
    description: 'Define what your business stands for and how it operates',
    slots: [
      {
        id: 'core_values',
        label: 'Core Values',
        type: 'array',
        required: true,
        prompt: 'What are your company\'s core values? What principles guide your decisions and actions? (List 3-5 key values)'
      },
      {
        id: 'culture',
        label: 'Company Culture',
        type: 'textarea',
        required: true,
        prompt: 'How would you describe your company culture? How do you work with clients and approach challenges?'
      },
      {
        id: 'principles',
        label: 'Guiding Principles',
        type: 'array',
        required: false,
        prompt: 'What are your guiding principles or operating philosophies? (e.g., "Always put the client first", "Innovation through iteration")'
      }
    ]
  },
  
  offerings: {
    id: 'offerings',
    title: 'Products & Services',
    description: 'Define what your business offers to the market',
    slots: [
      {
        id: 'products',
        label: 'Products',
        type: 'array',
        required: false,
        prompt: 'What products does your company offer? (List your main products or product categories)'
      },
      {
        id: 'services',
        label: 'Services',
        type: 'array',
        required: true,
        prompt: 'What services does your company provide? (List your main service offerings)'
      },
      {
        id: 'solutions',
        label: 'Solutions',
        type: 'array',
        required: true,
        prompt: 'What problems does your company solve? What solutions do you provide to your clients?'
      }
    ]
  },
  
  market: {
    id: 'market',
    title: 'Clients & Markets',
    description: 'Define who your business serves',
    slots: [
      {
        id: 'target_clients',
        label: 'Target Clients',
        type: 'array',
        required: true,
        prompt: 'Who are your ideal clients? What types of businesses or individuals do you serve?'
      },
      {
        id: 'market_segments',
        label: 'Market Segments',
        type: 'array',
        required: true,
        prompt: 'What market segments do you focus on? (e.g., small businesses, enterprise, specific industries)'
      },
      {
        id: 'customer_profiles',
        label: 'Customer Profiles',
        type: 'array',
        required: false,
        prompt: 'What are the key characteristics of your best customers? (e.g., size, industry, pain points)'
      }
    ]
  },
  
  advantage: {
    id: 'advantage',
    title: 'Competitive Advantage',
    description: 'Define what makes your business unique',
    slots: [
      {
        id: 'unique_value',
        label: 'Unique Value Proposition',
        type: 'textarea',
        required: true,
        prompt: 'What makes your company unique? What value do you provide that others don\'t?'
      },
      {
        id: 'competitive_edge',
        label: 'Competitive Advantages',
        type: 'array',
        required: true,
        prompt: 'What are your competitive advantages? What gives you an edge over competitors?'
      },
      {
        id: 'positioning',
        label: 'Market Positioning',
        type: 'text',
        required: true,
        prompt: 'How do you position yourself in the market? How do you want to be perceived by clients and competitors?'
      }
    ]
  },
  
  brand: {
    id: 'brand',
    title: 'Brand & Communication',
    description: 'Define how your business presents itself',
    slots: [
      {
        id: 'brand_voice',
        label: 'Brand Voice',
        type: 'text',
        required: true,
        prompt: 'How does your company communicate? What\'s your brand voice? (e.g., professional, friendly, innovative, trustworthy)'
      },
      {
        id: 'key_messages',
        label: 'Key Messages',
        type: 'array',
        required: true,
        prompt: 'What are your key brand messages? What do you want people to know about your company?'
      },
      {
        id: 'tone',
        label: 'Communication Tone',
        type: 'text',
        required: true,
        prompt: 'What tone do you use in communications? (e.g., formal, casual, authoritative, collaborative)'
      }
    ]
  },
  
  objectives: {
    id: 'objectives',
    title: 'Goals & Objectives',
    description: 'Define your business goals and strategic direction',
    slots: [
      {
        id: 'short_term_goals',
        label: 'Short-term Goals (3-6 months)',
        type: 'array',
        required: true,
        prompt: 'What are your primary goals for the next 3-6 months? What do you want to achieve in the short term?'
      },
      {
        id: 'medium_term_goals',
        label: 'Medium-term Goals (6-12 months)',
        type: 'array',
        required: true,
        prompt: 'What are your goals for the next 6-12 months? What milestones do you want to reach?'
      },
      {
        id: 'long_term_vision',
        label: 'Long-term Vision (1-3 years)',
        type: 'textarea',
        required: true,
        prompt: 'What\'s your long-term vision for the business? Where do you see your company in 1-3 years?'
      }
    ]
  }
};

/**
 * Identity Setup Ticket Service
 * 
 * Manages the complete lifecycle of identity setup tickets, from creation
 * through completion, with full conversation orchestration and brain integration.
 */
export class IdentitySetupTicketService extends BaseService {
  private static instance: IdentitySetupTicketService;
  private activeTickets: Map<string, IdentitySetupTicket> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): IdentitySetupTicketService {
    if (!IdentitySetupTicketService.instance) {
      IdentitySetupTicketService.instance = new IdentitySetupTicketService();
    }
    return IdentitySetupTicketService.instance;
  }

  /**
   * Create a new identity setup ticket for a user
   */
  async createTicket(userId: string): Promise<ServiceResponse<IdentitySetupTicket>> {
    try {
      logger.info('Creating identity setup ticket', { userId });

      // Get foundation data from onboarding
      const onboardingResponse = await onboardingBrainIntegration.getOnboardingContext(userId);
      if (!onboardingResponse.success) {
        return this.handleError('Failed to get onboarding data');
      }

      const foundationData = {
        companyName: onboardingResponse.data?.businessContext.companyName || 'Unknown',
        industry: onboardingResponse.data?.businessContext.industry || 'Unknown',
        size: onboardingResponse.data?.businessContext.size || 'Unknown',
        role: onboardingResponse.data?.userProfile.personal.role || 'Unknown'
      };

      // Initialize identity blocks
      const identityBlocks = this.initializeIdentityBlocks();

      // Create ticket
      const ticket: IdentitySetupTicket = {
        id: `identity_${userId}_${Date.now()}`,
        type: 'identity_setup',
        status: 'active',
        userId,
        foundationData,
        identityBlocks,
        conversation: {
          currentBlock: 'mission',
          completedBlocks: [],
          totalProgress: 0,
          messages: []
        },
        events: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store ticket
      await this.storeTicket(ticket);
      this.activeTickets.set(ticket.id, ticket);

      // Emit ticket created event
      this.emitEvent(ticket, 'identity.ticket.created', { ticketId: ticket.id });

      logger.info('Identity setup ticket created', { 
        ticketId: ticket.id, 
        userId,
        companyName: foundationData.companyName 
      });

      return this.createResponse(ticket);

    } catch (error) {
      logger.error('Error creating identity setup ticket', { userId, error });
      return this.handleError('Failed to create identity setup ticket');
    }
  }

  /**
   * Process a user message in the context of an identity setup ticket
   */
  async processMessage(
    ticketId: string, 
    message: string
  ): Promise<ServiceResponse<{ response: string; ticket: IdentitySetupTicket }>> {
    try {
      const ticket = await this.getTicket(ticketId);
      if (!ticket) {
        return this.handleError('Ticket not found');
      }

      // Add user message to conversation
      ticket.conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        blockId: ticket.conversation.currentBlock
      });

      // Process the message and update current block
      const blockUpdate = await this.processBlockMessage(ticket, message);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(ticket, blockUpdate);

      // Add AI response to conversation
      ticket.conversation.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        blockId: ticket.conversation.currentBlock
      });

      // Update ticket
      ticket.updatedAt = new Date().toISOString();
      await this.storeTicket(ticket);

      // Emit progress events
      this.emitProgressEvents(ticket, blockUpdate);

      return this.createResponse({ response: aiResponse, ticket });

    } catch (error) {
      logger.error('Error processing identity setup message', { ticketId, error });
      return this.handleError('Failed to process message');
    }
  }

  /**
   * Get current ticket for a user
   */
  async getCurrentTicket(userId: string): Promise<ServiceResponse<IdentitySetupTicket | null>> {
    try {
      // Check active tickets first
      for (const [ticketId, ticket] of this.activeTickets) {
        if (ticket.userId === userId && ticket.status === 'active') {
          return this.createResponse(ticket);
        }
      }

      // Check database for active tickets
      const { data: tickets, error } = await selectData(
        'brain_tickets',
        '*',
        { 
          user_id: userId, 
          ticket_type: 'identity_setup',
          status: 'active'
        }
      );

      if (error) {
        logger.error('Error fetching current ticket', { userId, error });
        return this.handleError('Failed to fetch current ticket');
      }

      if (tickets && tickets.length > 0) {
        const ticket = tickets[0] as IdentitySetupTicket;
        this.activeTickets.set(ticket.id, ticket);
        return this.createResponse(ticket);
      }

      return this.createResponse(null);

    } catch (error) {
      logger.error('Error getting current ticket', { userId, error });
      return this.handleError('Failed to get current ticket');
    }
  }

  /**
   * Initialize identity blocks with templates
   */
  private initializeIdentityBlocks(): IdentitySetupTicket['identityBlocks'] {
    const blocks: any = {};
    
    Object.entries(IDENTITY_BLOCK_TEMPLATES).forEach(([key, template]) => {
      blocks[key] = {
        id: template.id,
        title: template.title,
        description: template.description,
        status: 'pending',
        data: {},
        slots: template.slots.map(slot => ({ ...slot })),
        progress: 0
      };
    });

    return blocks;
  }

  /**
   * Process a message within the current block context
   */
  private async processBlockMessage(
    ticket: IdentitySetupTicket, 
    message: string
  ): Promise<{ blockCompleted: boolean; nextBlock?: string; progress: number }> {
    const currentBlock = ticket.conversation.currentBlock;
    const block = ticket.identityBlocks[currentBlock];

    // Extract data from user message
    const extractedData = this.extractBlockData(currentBlock, message);
    
    // Update block data
    Object.assign(block.data, extractedData);

    // Check if block is complete
    const isComplete = this.isBlockComplete(block);
    if (isComplete) {
      block.status = 'completed';
      block.progress = 100;
      ticket.conversation.completedBlocks.push(currentBlock);
      
      // Determine next block
      const nextBlock = this.getNextBlock(ticket);
      if (nextBlock) {
        ticket.conversation.currentBlock = nextBlock;
        ticket.identityBlocks[nextBlock].status = 'in_progress';
      } else {
        // All blocks complete
        ticket.status = 'completed';
        ticket.completedAt = new Date().toISOString();
      }
    } else {
      block.status = 'in_progress';
      block.progress = this.calculateBlockProgress(block);
    }

    // Update total progress
    ticket.conversation.totalProgress = this.calculateTotalProgress(ticket);

    return {
      blockCompleted: isComplete,
      nextBlock: isComplete ? ticket.conversation.currentBlock : undefined,
      progress: ticket.conversation.totalProgress
    };
  }

  /**
   * Generate AI response based on current ticket state
   */
  private async generateAIResponse(
    ticket: IdentitySetupTicket, 
    blockUpdate: any
  ): Promise<string> {
    const currentBlock = ticket.conversation.currentBlock;
    const block = ticket.identityBlocks[currentBlock];

    if (blockUpdate.blockCompleted) {
      // Block completed, congratulate and move to next
      const nextBlock = ticket.identityBlocks[blockUpdate.nextBlock];
      return `Excellent! ✅ **${block.title}** is now complete.

**Moving to: ${nextBlock.title}**

${nextBlock.description}

${this.getNextPrompt(nextBlock)}`;
    } else if (ticket.status === 'completed') {
      // All blocks complete
      return `🎉 **Congratulations! Your Business Identity Setup is Complete!**

You've successfully defined all 7 building blocks of your business identity:

${Object.values(ticket.identityBlocks).map(b => `✅ **${b.title}**`).join('\n')}

**Your business identity is now active in the Nexus brain system!** 

This foundation will power all your future interactions with Nexus AI, providing personalized, context-aware assistance for your business operations.

Would you like to review your complete business identity or move on to other business setup tasks?`;
    } else {
      // Continue with current block
      return this.getNextPrompt(block);
    }
  }

  /**
   * Extract relevant data from user message for current block
   */
  private extractBlockData(blockKey: string, message: string): Record<string, any> {
    // Simple extraction - in production, you'd use more sophisticated NLP
    const data: Record<string, any> = {};
    
    // For now, store the raw message and let the user refine later
    data[`${blockKey}_raw_response`] = message;
    
    return data;
  }

  /**
   * Check if a block is complete
   */
  private isBlockComplete(block: IdentityBlock): boolean {
    const requiredSlots = block.slots.filter(slot => slot.required);
    return requiredSlots.every(slot => slot.value !== undefined);
  }

  /**
   * Calculate block progress
   */
  private calculateBlockProgress(block: IdentityBlock): number {
    const totalSlots = block.slots.length;
    const filledSlots = block.slots.filter(slot => slot.value !== undefined).length;
    return Math.round((filledSlots / totalSlots) * 100);
  }

  /**
   * Calculate total progress across all blocks
   */
  private calculateTotalProgress(ticket: IdentitySetupTicket): number {
    const totalBlocks = Object.keys(ticket.identityBlocks).length;
    const completedBlocks = ticket.conversation.completedBlocks.length;
    return Math.round((completedBlocks / totalBlocks) * 100);
  }

  /**
   * Get next block in sequence
   */
  private getNextBlock(ticket: IdentitySetupTicket): string | null {
    const blockOrder = ['mission', 'values', 'offerings', 'market', 'advantage', 'brand', 'objectives'];
    const currentIndex = blockOrder.indexOf(ticket.conversation.currentBlock);
    
    if (currentIndex < blockOrder.length - 1) {
      return blockOrder[currentIndex + 1];
    }
    
    return null; // All blocks complete
  }

  /**
   * Get next prompt for a block
   */
  private getNextPrompt(block: IdentityBlock): string {
    const incompleteSlots = block.slots.filter(slot => slot.value === undefined);
    if (incompleteSlots.length > 0) {
      const nextSlot = incompleteSlots[0];
      return `**${nextSlot.label}**

${nextSlot.prompt}

${nextSlot.required ? '(Required)' : '(Optional)'}`;
    }
    
    return `Please provide more details for the **${block.title}** section.`;
  }

  /**
   * Store ticket in database
   */
  private async storeTicket(ticket: IdentitySetupTicket): Promise<void> {
    try {
      await upsertOne('brain_tickets', {
        id: ticket.id,
        user_id: ticket.userId,
        ticket_type: ticket.type,
        status: ticket.status,
        title: `Identity Setup - ${ticket.foundationData.companyName}`,
        description: 'Business Identity Setup using 7 Building Blocks framework',
        data: ticket,
        progress: ticket.conversation.totalProgress,
        current_phase: ticket.conversation.currentBlock,
        completed_phases: ticket.conversation.completedBlocks,
        message_count: ticket.conversation.messages.length,
        last_message_at: ticket.conversation.messages.length > 0 
          ? ticket.conversation.messages[ticket.conversation.messages.length - 1].timestamp 
          : null,
        events: ticket.events,
        created_at: ticket.createdAt,
        updated_at: ticket.updatedAt,
        completed_at: ticket.completedAt
      });
    } catch (error) {
      logger.error('Error storing ticket', { ticketId: ticket.id, error });
    }
  }

  /**
   * Get ticket from cache or database
   */
  private async getTicket(ticketId: string): Promise<IdentitySetupTicket | null> {
    // Check cache first
    if (this.activeTickets.has(ticketId)) {
      return this.activeTickets.get(ticketId)!;
    }

    // Fetch from database
    try {
      const { data: ticketData, error } = await selectOne(
        'brain_tickets',
        '*',
        { id: ticketId }
      );

      if (error || !ticketData) {
        return null;
      }

      const ticket = ticketData.data as IdentitySetupTicket;
      this.activeTickets.set(ticketId, ticket);
      return ticket;

    } catch (error) {
      logger.error('Error fetching ticket', { ticketId, error });
      return null;
    }
  }

  /**
   * Emit progress events
   */
  private emitProgressEvents(ticket: IdentitySetupTicket, blockUpdate: any): void {
    if (blockUpdate.blockCompleted) {
      this.emitEvent(ticket, 'identity.block.completed', {
        blockId: ticket.conversation.currentBlock,
        blockTitle: ticket.identityBlocks[ticket.conversation.currentBlock].title
      });
    }

    this.emitEvent(ticket, 'identity.progress.updated', {
      progress: blockUpdate.progress,
      completedBlocks: ticket.conversation.completedBlocks.length,
      totalBlocks: Object.keys(ticket.identityBlocks).length
    });

    if (ticket.status === 'completed') {
      this.emitEvent(ticket, 'identity.ticket.completed', {
        ticketId: ticket.id,
        finalProgress: blockUpdate.progress
      });
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(ticket: IdentitySetupTicket, eventType: string, data: any): void {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    ticket.events.push(event);
    logger.info('Identity setup event emitted', { ticketId: ticket.id, eventType, data });
  }
}

// Export singleton instance
export const identitySetupTicketService = IdentitySetupTicketService.getInstance();
