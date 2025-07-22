/**
 * Help Center Tickets Subdomain
 * Handles support ticket management
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  userId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  sla: number; // hours
  autoAssign?: string;
} 