/**
 * useIdentitySetupTicket Hook
 * 
 * Provides easy access to Identity Setup Ticket functionality.
 * Manages the 7 Building Blocks conversation flow and progress tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { identitySetupTicketService, type IdentitySetupTicket } from '@/shared/services/IdentitySetupTicketService';
import { logger } from '@/shared/utils/logger';

interface UseIdentitySetupTicketReturn {
  // State
  ticket: IdentitySetupTicket | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  createTicket: () => Promise<IdentitySetupTicket | null>;
  sendMessage: (message: string) => Promise<string | null>;
  getCurrentTicket: () => Promise<IdentitySetupTicket | null>;
  
  // Computed values
  isActive: boolean;
  progress: number;
  currentBlock: string | null;
  completedBlocks: string[];
  totalBlocks: number;
}

/**
 * Hook for managing Identity Setup Tickets
 */
export function useIdentitySetupTicket(): UseIdentitySetupTicketReturn {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<IdentitySetupTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current ticket when user changes
  useEffect(() => {
    if (user?.id) {
      loadCurrentTicket();
    } else {
      setTicket(null);
    }
  }, [user?.id]);

  /**
   * Load current active ticket for user
   */
  const loadCurrentTicket = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await identitySetupTicketService.getCurrentTicket(user.id);
      
      if (response.success) {
        setTicket(response.data);
        logger.info('Current identity setup ticket loaded', { 
          userId: user.id,
          ticketId: response.data?.id,
          status: response.data?.status,
          progress: response.data?.conversation.totalProgress
        });
      } else {
        setError(response.error || 'Failed to load current ticket');
        logger.warn('Failed to load current ticket', { userId: user.id, error: response.error });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading ticket';
      setError(errorMessage);
      logger.error('Error loading current ticket', { userId: user.id, error: err });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create a new identity setup ticket
   */
  const createTicket = useCallback(async (): Promise<IdentitySetupTicket | null> => {
    if (!user?.id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await identitySetupTicketService.createTicket(user.id);
      
      if (response.success && response.data) {
        setTicket(response.data);
        logger.info('Identity setup ticket created', { 
          userId: user.id,
          ticketId: response.data.id,
          companyName: response.data.foundationData.companyName
        });
        return response.data;
      } else {
        setError(response.error || 'Failed to create ticket');
        logger.error('Failed to create identity setup ticket', { userId: user.id, error: response.error });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error creating ticket';
      setError(errorMessage);
      logger.error('Error creating identity setup ticket', { userId: user.id, error: err });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Send a message to the current ticket
   */
  const sendMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!ticket?.id) {
      logger.warn('No active ticket to send message to');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await identitySetupTicketService.processMessage(ticket.id, message);
      
      if (response.success && response.data) {
        // Update ticket state with new data
        setTicket(response.data.ticket);
        
        logger.info('Message processed successfully', { 
          ticketId: ticket.id,
          messageLength: message.length,
          newProgress: response.data.ticket.conversation.totalProgress
        });
        
        return response.data.response;
      } else {
        setError(response.error || 'Failed to process message');
        logger.error('Failed to process message', { ticketId: ticket.id, error: response.error });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error processing message';
      setError(errorMessage);
      logger.error('Error processing message', { ticketId: ticket.id, error: err });
      return null;
    } finally {
      setLoading(false);
    }
  }, [ticket?.id]);

  /**
   * Get current ticket (refresh from server)
   */
  const getCurrentTicket = useCallback(async (): Promise<IdentitySetupTicket | null> => {
    await loadCurrentTicket();
    return ticket;
  }, [loadCurrentTicket, ticket]);

  // Computed values
  const isActive = ticket?.status === 'active';
  const progress = ticket?.conversation.totalProgress || 0;
  const currentBlock = ticket?.conversation.currentBlock || null;
  const completedBlocks = ticket?.conversation.completedBlocks || [];
  const totalBlocks = ticket ? Object.keys(ticket.identityBlocks).length : 0;

  return {
    // State
    ticket,
    loading,
    error,
    
    // Actions
    createTicket,
    sendMessage,
    getCurrentTicket,
    
    // Computed values
    isActive,
    progress,
    currentBlock,
    completedBlocks,
    totalBlocks
  };
}
