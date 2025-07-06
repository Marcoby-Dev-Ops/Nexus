/**
 * @file quickActionsService.tsx
 * @description Service for providing context-aware quick actions.
 */

import { FileText, Mail, Calendar, Users, PlusCircle, Lightbulb, ClipboardCheck } from 'lucide-react';
import React from 'react';

export interface QuickAction {
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

// A more sophisticated implementation would involve a more dynamic registry
// and potentially user-configurable actions.
const allActions: { [key: string]: QuickAction } = {
  newDocument: { name: 'New Document', icon: <FileText className="h-5 w-5" />, action: () => console.log('Action: New Document') },
  sendMessage: { name: 'Send Message', icon: <Mail className="h-5 w-5" />, action: () => console.log('Action: Send Message') },
  scheduleMeeting: { name: 'Schedule Meeting', icon: <Calendar className="h-5 w-5" />, action: () => console.log('Action: Schedule Meeting') },
  addContact: { name: 'Add Contact', icon: <Users className="h-5 w-5" />, action: () => console.log('Action: Add Contact') },
  newTask: { name: 'New Task', icon: <ClipboardCheck className="h-5 w-5" />, action: () => console.log('Action: New Task') },
  newIdea: { name: 'New Idea', icon: <Lightbulb className="h-5 w-5" />, action: () => console.log('Action: New Idea') },
};

class QuickActionsService {
  /**
   * Gets a list of context-aware quick actions.
   * 
   * @param {string} context - The current context, e.g., the current page or view.
   * @returns {Promise<QuickAction[]>} A promise that resolves to an array of quick actions.
   */
  async getActions(context: string = 'global'): Promise<QuickAction[]> {
    // This is a simple rule-based system. A real implementation could be
    // driven by user behavior, AI, or a more complex rules engine.
    switch (context) {
      case 'workspace':
        return [allActions.newTask, allActions.newIdea, allActions.scheduleMeeting, allActions.sendMessage];
      case 'sales':
        return [allActions.addContact, allActions.sendMessage, allActions.newDocument];
      default:
        return [allActions.newDocument, allActions.sendMessage, allActions.scheduleMeeting, allActions.addContact];
    }
  }
}

export const quickActionsService = new QuickActionsService(); 