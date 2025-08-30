import { create } from 'zustand';
import { createSelectors } from '@/shared/utils/zustand';
import { logger } from '@/shared/utils/logger';

interface OnboardingChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface OnboardingChatState {
  messages: OnboardingChatMessage[];
  isTyping: boolean;
  hasInitialized: boolean;
  
  // Actions
  initialize: (user: any) => void;
  addMessage: (message: Omit<OnboardingChatMessage, 'id' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  updateMessage: (id: string, updates: Partial<OnboardingChatMessage>) => void;
  removeMessage: (id: string) => void;
}

const useOnboardingChatStoreBase = create<OnboardingChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  hasInitialized: false,

  initialize: (user) => {
    // Validate required parameters
    if (!user) {
      logger.error('User is required for onboarding chat initialization');
      return;
    }
     
    // eslint-disable-next-line no-console
    console.log('[OnboardingChatStore] Initialize called. Has initialized?', get().hasInitialized);
    if (get().hasInitialized || !user) return;
     
    // eslint-disable-next-line no-console
    console.log('[OnboardingChatStore] Initializing for the first time...');

    try {
      const profile = user.profile;
      const company = user.company;
      const userContext = profile?.preferences?.user_context;
      const businessContext = company?.settings;

      const firstName = profile?.first_name || 'there';
      const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
      
      const personalizedGreeting = `Good ${timeOfDay}, ${firstName}! 👋`;
      let introContent = `I'm Nex, your new AI business partner. My purpose is to help you streamline operations, make smarter decisions, and achieve your goals faster.

I'm designed to understand your business, learn your preferences, and become your trusted right-hand assistant.

Before we dive in, I want to make sure I'm on the right track.`;

      if (userContext?.role && company?.name) {
        introContent += `\n\nI understand you're a **${userContext.role}** at **${company.name}**.`;
      }

      if (businessContext?.industry) {
        introContent += `\n\nI see you're in the **${businessContext.industry}** industry.`;
      }

      introContent += `\n\nWhat's the biggest challenge you're facing right now that I can help you solve?`;

      const welcomeMessage: OnboardingChatMessage = {
        id: 'welcome',
        content: personalizedGreeting + '\n\n' + introContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'welcome',
          userContext,
          businessContext
        }
      };

      set({
        messages: [welcomeMessage],
        hasInitialized: true
      });

      logger.info('Onboarding chat initialized successfully', { 
        userId: user.id, 
        hasUserContext: !!userContext,
        hasBusinessContext: !!businessContext 
      });
    } catch (error) {
      logger.error('Failed to initialize onboarding chat:', error);
    }
  },

  addMessage: (message) => {
    // Validate required parameters
    if (!message.content || typeof message.content !== 'string') {
      logger.error('Message content is required and must be a string');
      return;
    }

    if (!message.role || !['user', 'assistant'].includes(message.role)) {
      logger.error('Message role must be either "user" or "assistant"');
      return;
    }

    try {
      const newMessage: OnboardingChatMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      set(state => ({
        messages: [...state.messages, newMessage]
      }));

      logger.info('Message added to onboarding chat', { 
        role: message.role, 
        contentLength: message.content.length 
      });
    } catch (error) {
      logger.error('Failed to add message to onboarding chat:', error);
    }
  },

  setTyping: (isTyping: boolean) => {
    // Validate required parameters
    if (typeof isTyping !== 'boolean') {
      logger.error('Typing status must be a boolean');
      return;
    }

    try {
      set({ isTyping });
      if (isTyping) {
        logger.info('Onboarding chat typing started');
      } else {
        logger.info('Onboarding chat typing stopped');
      }
    } catch (error) {
      logger.error('Failed to set typing status:', error);
    }
  },

  clearMessages: () => {
    try {
      set({ messages: [] });
      logger.info('Onboarding chat messages cleared');
    } catch (error) {
      logger.error('Failed to clear onboarding chat messages:', error);
    }
  },

  updateMessage: (id: string, updates: Partial<OnboardingChatMessage>) => {
    // Validate required parameters
    if (!id || typeof id !== 'string') {
      logger.error('Message ID is required and must be a string');
      return;
    }

    try {
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      }));
      logger.info('Onboarding chat message updated', { messageId: id });
    } catch (error) {
      logger.error('Failed to update onboarding chat message:', error);
    }
  },

  removeMessage: (id: string) => {
    // Validate required parameters
    if (!id || typeof id !== 'string') {
      logger.error('Message ID is required and must be a string');
      return;
    }

    try {
      set(state => ({
        messages: state.messages.filter(msg => msg.id !== id)
      }));
      logger.info('Onboarding chat message removed', { messageId: id });
    } catch (error) {
      logger.error('Failed to remove onboarding chat message:', error);
    }
  }
}));

export const useOnboardingChatStore = createSelectors(useOnboardingChatStoreBase); 
