// Using Jest testing framework

// Mock the analyzeIntent function (simplified version from edge function)
function analyzeIntent(query: string): { agent: string; confidence: number; reasoning: string } {
  const keywords = {
    sales: ['sales', 'revenue', 'deals', 'pipeline', 'customers', 'prospects', 'quota', 'crm'],
    marketing: ['marketing', 'campaigns', 'leads', 'website', 'traffic', 'conversion', 'brand', 'seo'],
    finance: ['finance', 'budget', 'costs', 'profit', 'cash', 'expenses', 'financial', 'roi'],
    operations: ['operations', 'projects', 'tickets', 'capacity', 'team', 'process', 'efficiency', 'automation']
  };

  const queryLower = query.toLowerCase();
  let maxScore = 0;
  let bestAgent = 'executive';

  // Score each department based on keyword matches
  for (const [dept, words] of Object.entries(keywords)) {
    const score = words.filter(word => queryLower.includes(word)).length;
    if (score > maxScore) {
      maxScore = score;
      bestAgent = dept;
    }
  }

  // Strategic/high-level queries should go to Executive Assistant
  const strategicKeywords = ['strategy', 'planning', 'vision', 'roadmap', 'priorities', 'goals', 'overall', 'business'];
  const isStrategic = strategicKeywords.some(word => queryLower.includes(word));

  if (isStrategic || maxScore === 0) {
    return {
      agent: 'executive',
      confidence: isStrategic ? 0.9 : 0.6,
      reasoning: isStrategic 
        ? 'Query involves strategic planning - routing to Executive Assistant'
        : 'General query without specific department focus - routing to Executive Assistant'
    };
  }

  return {
    agent: bestAgent,
    confidence: Math.min(0.9, maxScore * 0.3),
    reasoning: `Query contains ${maxScore} ${bestAgent} keywords - routing to ${bestAgent} specialist`
  };
}

describe('Supervisor Agent Routing', () => {
  describe('analyzeIntent', () => {
    describe('Sales Query Routing', () => {
      it('should route sales pipeline queries to sales agent', () => {
        const result = analyzeIntent('How can I improve my sales pipeline?');
        expect(result.agent).toBe('sales');
        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.reasoning).toContain('sales');
      });

      it('should route revenue queries to sales agent', () => {
        const result = analyzeIntent('What strategies can increase our revenue?');
        expect(result.agent).toBe('sales');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should route CRM queries to sales agent', () => {
        const result = analyzeIntent('How do I manage customers in our CRM?');
        expect(result.agent).toBe('sales');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('Marketing Query Routing', () => {
      it('should route marketing campaign queries to marketing agent', () => {
        const result = analyzeIntent('How can I optimize our marketing campaigns?');
        expect(result.agent).toBe('marketing');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('should route SEO queries to marketing agent', () => {
        const result = analyzeIntent('What SEO strategies should we implement?');
        expect(result.agent).toBe('marketing');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should route brand queries to marketing agent', () => {
        const result = analyzeIntent('How can we improve our brand awareness?');
        expect(result.agent).toBe('marketing');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('Finance Query Routing', () => {
      it('should route budget queries to finance agent', () => {
        const result = analyzeIntent('How can I optimize our budget allocation?');
        expect(result.agent).toBe('finance');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('should route cost reduction queries to finance agent', () => {
        const result = analyzeIntent('What are the best ways to reduce costs?');
        expect(result.agent).toBe('finance');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should route ROI queries to finance agent', () => {
        const result = analyzeIntent('How do I calculate ROI for this project?');
        expect(result.agent).toBe('finance');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('Operations Query Routing', () => {
      it('should route process optimization queries to operations agent', () => {
        const result = analyzeIntent('How can I improve our operational efficiency?');
        expect(result.agent).toBe('operations');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('should route automation queries to operations agent', () => {
        const result = analyzeIntent('What processes should we automate?');
        expect(result.agent).toBe('operations');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should route team capacity queries to operations agent', () => {
        const result = analyzeIntent('How do I manage team capacity and projects?');
        expect(result.agent).toBe('operations');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    describe('Strategic Query Routing', () => {
      it('should route strategic planning queries to executive', () => {
        const result = analyzeIntent('What should our business strategy be for next year?');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.9);
        expect(result.reasoning).toContain('strategic planning');
      });

      it('should route vision queries to executive', () => {
        const result = analyzeIntent('Help me define our company vision');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.9);
      });

      it('should route roadmap queries to executive', () => {
        const result = analyzeIntent('What should be our product roadmap priorities?');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.9);
      });

      it('should route overall business queries to executive', () => {
        const result = analyzeIntent('How is our overall business performance?');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.9);
      });
    });

    describe('Ambiguous Query Handling', () => {
      it('should route simple greetings to executive with lower confidence', () => {
        const result = analyzeIntent('Hello');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.6);
        expect(result.reasoning).toContain('General query');
      });

      it('should route vague help requests to executive', () => {
        const result = analyzeIntent('Can you help me?');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.6);
      });

      it('should route empty queries to executive', () => {
        const result = analyzeIntent('');
        expect(result.agent).toBe('executive');
        expect(result.confidence).toBe(0.6);
      });
    });

    describe('Multi-keyword Query Routing', () => {
      it('should route to highest scoring agent for multi-keyword queries', () => {
        const result = analyzeIntent('How can I optimize our marketing budget and reduce costs?');
        // Should route to finance (2 keywords) or marketing (1 keyword) - finance should win
        expect(['finance', 'marketing']).toContain(result.agent);
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should handle sales and marketing overlap', () => {
        const result = analyzeIntent('How can I improve sales leads from marketing campaigns?');
        // Should route to sales or marketing based on keyword count
        expect(['sales', 'marketing']).toContain(result.agent);
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    describe('Confidence Scoring', () => {
      it('should have high confidence for strategic queries', () => {
        const result = analyzeIntent('What should our strategic priorities be?');
        expect(result.confidence).toBe(0.9);
      });

      it('should have moderate confidence for department-specific queries', () => {
        const result = analyzeIntent('How can I improve sales performance?');
        expect(result.confidence).toBeGreaterThan(0.3);
        expect(result.confidence).toBeLessThan(0.9);
      });

      it('should have lower confidence for ambiguous queries', () => {
        const result = analyzeIntent('What do you think?');
        expect(result.confidence).toBe(0.6);
      });

      it('should cap confidence at 0.9 for non-strategic queries', () => {
        const result = analyzeIntent('sales revenue deals pipeline customers prospects quota');
        expect(result.confidence).toBeLessThanOrEqual(0.9);
      });
    });

    describe('Case Sensitivity', () => {
      it('should handle uppercase queries correctly', () => {
        const result = analyzeIntent('HOW CAN I IMPROVE SALES?');
        expect(result.agent).toBe('sales');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should handle mixed case queries correctly', () => {
        const result = analyzeIntent('What Marketing Strategies Should We Use?');
        expect(result.agent).toBe('marketing');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });

    describe('Edge Cases', () => {
      it('should handle queries with special characters', () => {
        const result = analyzeIntent('How can I improve sales? What about marketing?');
        expect(['sales', 'marketing']).toContain(result.agent);
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should handle very long queries', () => {
        const longQuery = 'I need help with sales ' + 'and revenue '.repeat(100);
        const result = analyzeIntent(longQuery);
        expect(result.agent).toBe('sales');
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should handle queries with numbers', () => {
        const result = analyzeIntent('How can I increase sales by 20% this quarter?');
        expect(result.agent).toBe('sales');
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });
  });

  describe('Routing Metadata', () => {
    it('should provide meaningful reasoning for routing decisions', () => {
      const result = analyzeIntent('How can I improve our sales pipeline?');
      expect(result.reasoning).toContain('sales');
      expect(result.reasoning).toContain('keywords');
    });

    it('should provide reasoning for strategic routing', () => {
      const result = analyzeIntent('What should our business strategy be?');
      expect(result.reasoning).toContain('strategic planning');
      expect(result.reasoning).toContain('Executive Assistant');
    });

    it('should provide reasoning for fallback routing', () => {
      const result = analyzeIntent('Hello there');
      expect(result.reasoning).toContain('General query');
      expect(result.reasoning).toContain('Executive Assistant');
    });
  });
});

// Integration test helpers
export const testQueries = {
  sales: [
    'How can I improve my sales pipeline?',
    'What strategies can increase our revenue?',
    'How do I manage customers in our CRM?',
    'What is our conversion rate?'
  ],
  marketing: [
    'How can I optimize our marketing campaigns?',
    'What SEO strategies should we implement?',
    'How can we improve our brand awareness?',
    'What is our website traffic like?'
  ],
  finance: [
    'How can I optimize our budget allocation?',
    'What are the best ways to reduce costs?',
    'How do I calculate ROI for this project?',
    'What are our profit margins?'
  ],
  operations: [
    'How can I improve our operational efficiency?',
    'What processes should we automate?',
    'How do I manage team capacity and projects?',
    'What tickets are open?'
  ],
  executive: [
    'What should our business strategy be for next year?',
    'Help me define our company vision',
    'What should be our product roadmap priorities?',
    'How is our overall business performance?'
  ],
  ambiguous: [
    'Hello',
    'Can you help me?',
    'What do you think?',
    'Hi there'
  ]
};

export { analyzeIntent }; 