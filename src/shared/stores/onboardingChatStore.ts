import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { EnhancedUser } from '@/shared/lib/types/userProfile';

interface OnboardingMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  type: 'message' | 'introduction' | 'data-collected' | 'relationship-building';
  metadata?: {
    step?: string;
    dataCollected?: Record<string, any>;
    suggestions?: string[];
    emotion?: 'excited' | 'thoughtful' | 'supportive' | 'celebratory' | 'friendly';
  };
}

interface OnboardingChatState {
  messages: OnboardingMessage[];
  isTyping: boolean;
  hasInitialized: boolean;
  initialize: (user: EnhancedUser | null) => void;
  addMessage: (message: Omit<OnboardingMessage, 'id' | 'timestamp'>) => void;
  setIsTyping: (isTyping: boolean) => void;
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

const useOnboardingChatStoreBase = create<OnboardingChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  hasInitialized: false,

  initialize: (user) => {
    console.log('[OnboardingChatStore] Initialize called. Has initialized?', get().hasInitialized);
    if (get().hasInitialized || !user) return;
    console.log('[OnboardingChatStore] Initializing for the first time...');

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

    if (userContext?.biggest_challenge) {
      introContent += ` It looks like a key focus for you is **tackling the challenge of '${userContext.biggest_challenge}'**.`;
      introContent += `\n\nI'm confident we can make significant progress on that together.`;
    } else if (businessContext?.business_priorities && businessContext.business_priorities.length > 0) {
      introContent += ` It looks like a key priority for you and the team is **'${businessContext.business_priorities[0]}'**.`;
      introContent += `\n\nI'm ready to help you focus on that.`;
    }

    introContent += `\n\nReady to start our partnership and build your context-aware workspace?`;

    const introMessage: OnboardingMessage = {
      id: '1',
      role: 'assistant',
      content: `${personalizedGreeting}\n\n${introContent}`,
      timestamp: new Date(),
      type: 'introduction',
      metadata: {
        step: 'introduction',
        emotion: 'friendly',
        suggestions: [
          '🚀 Yes, let\'s get started!',
          '🤔 Tell me more about what you can do',
          '💼 How will you help my business?',
          '⚡ What makes you different?'
        ]
      }
    };

    console.log('[OnboardingChatStore] Setting initial message.');
    set({ messages: [introMessage], hasInitialized: true });
  },

  addMessage: (message) => {
    const newMessage: OnboardingMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    set(state => ({ messages: [...state.messages, newMessage] }));
  },

  setIsTyping: (isTyping) => set({ isTyping }),
}));

export const useOnboardingChatStore = createSelectors(useOnboardingChatStoreBase); 