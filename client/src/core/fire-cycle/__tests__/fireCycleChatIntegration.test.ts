import { FireCycleChatIntegration } from '../fireCycleChatIntegration';
import type { UserContext } from '../fireCycleLogic';

// Mock the thoughtsService
jest.mock('@/services/help-center/thoughtsService', () => ({
  thoughtsService: {
    createThought: jest.fn().mockResolvedValue({
      id: 'test-thought-id',
      content: 'Test thought',
      category: 'focus',
      status: 'concept'
    })
  }
}));

describe('FireCycleChatIntegration', () => {
  let integration: FireCycleChatIntegration;
  let mockUserContext: UserContext;

  beforeEach(() => {
    mockUserContext = {
      userId: 'test-user-id',
      companyId: 'test-company-id',
      userRole: 'user',
      companyName: 'Test Company',
      userPreferences: {
        autoTrigger: true,
        confidenceThreshold: 0.7,
        enableNotifications: true
      }
    };

    integration = new FireCycleChatIntegration(mockUserContext);
  });

  describe('analyzeChatMessage', () => {
    it('should detect focus phase triggers', async () => {
      const messages = [
        'I want to start a blog about technology',
        'We need to improve our customer service',
        'I should launch a new product',
        'I\'m thinking about expanding to Europe'
      ];

      for (const message of messages) {
        const response = await integration.analyzeChatMessage(message, 'test-user-id', 'test-company-id');
        
        expect(response).toBeDefined();
        expect(response.confidence).toBeGreaterThan(0.6);
        expect(response.firePhase).toBe('focus');
        expect(response.trigger).toBeDefined();
        expect(response.originalMessage).toBe(message);
      }
    });

    it('should detect insight phase triggers', async () => {
      const messages = [
        'This is a great opportunity for our business',
        'That is exactly what we need',
        'I believe we should focus on mobile users',
        'We could expand into the European market'
      ];

      for (const message of messages) {
        const response = await integration.analyzeChatMessage(message, 'test-user-id', 'test-company-id');
        
        expect(response).toBeDefined();
        expect(response.confidence).toBeGreaterThan(0.6);
        expect(response.firePhase).toBe('insight');
        expect(response.trigger).toBeDefined();
        expect(response.originalMessage).toBe(message);
      }
    });

    it('should detect roadmap phase triggers', async () => {
      const messages = [
        'I plan to launch the product next month',
        'We\'re planning to expand to three new markets',
        'Let\'s implement this new feature',
        'We should create a detailed timeline'
      ];

      for (const message of messages) {
        const response = await integration.analyzeChatMessage(message, 'test-user-id', 'test-company-id');
        
        expect(response).toBeDefined();
        expect(response.confidence).toBeGreaterThan(0.6);
        expect(response.firePhase).toBe('roadmap');
        expect(response.trigger).toBeDefined();
        expect(response.originalMessage).toBe(message);
      }
    });

    it('should detect execute phase triggers', async () => {
      const messages = [
        'I\'m going to start working on this tomorrow',
        'We will implement this feature next week',
        'I\'m starting the development process',
        'Let\'s begin with the user research'
      ];

      for (const message of messages) {
        const response = await integration.analyzeChatMessage(message, 'test-user-id', 'test-company-id');
        
        expect(response).toBeDefined();
        expect(response.confidence).toBeGreaterThan(0.6);
        expect(response.firePhase).toBe('execute');
        expect(response.trigger).toBeDefined();
        expect(response.originalMessage).toBe(message);
      }
    });

    it('should not trigger for regular conversation', async () => {
      const messages = [
        'Hello, how are you?',
        'What\'s the weather like today?',
        'Can you help me with something?',
        'Thanks for your help'
      ];

      for (const message of messages) {
        const response = await integration.analyzeChatMessage(message, 'test-user-id', 'test-company-id');
        
        expect(response).toBeDefined();
        expect(response.confidence).toBeLessThan(0.5);
        expect(response.trigger).toBeNull();
      }
    });

    it('should generate appropriate suggested actions', async () => {
      const response = await integration.analyzeChatMessage(
        'I want to start a blog about technology',
        'test-user-id',
        'test-company-id'
      );

      expect(response.suggestedActions).toBeDefined();
      expect(response.suggestedActions.length).toBeGreaterThan(0);
      expect(response.suggestedActions).toContain('Research blogging platforms');
    });

    it('should generate next steps', async () => {
      const response = await integration.analyzeChatMessage(
        'We need to improve our customer service',
        'test-user-id',
        'test-company-id'
      );

      expect(response.nextSteps).toBeDefined();
      expect(response.nextSteps.length).toBeGreaterThan(0);
    });
  });

  describe('createThoughtFromMessage', () => {
    it('should create a thought from a message', async () => {
      const message = 'I want to start a blog about technology';
      
      const thought = await integration.createThoughtFromMessage(message, 'test-user-id', 'test-company-id');
      
      expect(thought).toBeDefined();
      expect(thought.content).toBe(message);
      expect(thought.category).toBe('focus');
      expect(thought.status).toBe('concept');
    });
  });

  describe('getSuggestedActions', () => {
    it('should return suggested actions for focus phase', () => {
      const actions = integration.getSuggestedActions('focus');
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions).toContain('Define clear objectives');
    });

    it('should return suggested actions for insight phase', () => {
      const actions = integration.getSuggestedActions('insight');
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions).toContain('Research market trends');
    });

    it('should return suggested actions for roadmap phase', () => {
      const actions = integration.getSuggestedActions('roadmap');
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions).toContain('Create detailed timeline');
    });

    it('should return suggested actions for execute phase', () => {
      const actions = integration.getSuggestedActions('execute');
      
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions).toContain('Begin implementation');
    });
  });

  describe('getFirePhaseInsights', () => {
    it('should return insights for focus phase', () => {
      const insights = integration.getFirePhaseInsights('focus');
      
      expect(insights).toBeDefined();
      expect(insights?.description).toBeDefined();
      expect(insights?.keyQuestions).toBeDefined();
      expect(insights?.keyQuestions.length).toBeGreaterThan(0);
    });

    it('should return insights for insight phase', () => {
      const insights = integration.getFirePhaseInsights('insight');
      
      expect(insights).toBeDefined();
      expect(insights?.description).toBeDefined();
      expect(insights?.keyQuestions).toBeDefined();
      expect(insights?.keyQuestions.length).toBeGreaterThan(0);
    });

    it('should return insights for roadmap phase', () => {
      const insights = integration.getFirePhaseInsights('roadmap');
      
      expect(insights).toBeDefined();
      expect(insights?.description).toBeDefined();
      expect(insights?.keyQuestions).toBeDefined();
      expect(insights?.keyQuestions.length).toBeGreaterThan(0);
    });

    it('should return insights for execute phase', () => {
      const insights = integration.getFirePhaseInsights('execute');
      
      expect(insights).toBeDefined();
      expect(insights?.description).toBeDefined();
      expect(insights?.keyQuestions).toBeDefined();
      expect(insights?.keyQuestions.length).toBeGreaterThan(0);
    });
  });
}); 