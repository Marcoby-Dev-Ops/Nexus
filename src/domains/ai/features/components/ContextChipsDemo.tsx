import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { ContextChips } from '@/domains/ai/features/components/ContextChips';
import ContextSourceService from '@/domains/services/contextSourceService';

/**
 * Demo component to showcase Context Chips functionality
 */
export const ContextChipsDemo: React.FC = () => {
  const mockSources = ContextSourceService.createMockContextSources();
  
  // Sample AI response that would have context sources
  const sampleResponse = `Based on your current business performance, I can see that TechCorp Inc. is performing exceptionally well this quarter. 

**Key Highlights:**
- 🚀 **Revenue Growth**: 23% increase in MRR bringing us to strong Q3 performance
- 👥 **Customer Acquisition**: 156 new customers added this quarter  
- 💯 **Retention**: Maintaining 94% customer retention rate
- 📈 **Sales Pipeline**: 45 active deals worth $2.3M in HubSpot
- 📧 **Marketing Performance**: 87% email open rate with 23% increase in qualified leads

**Recommendations:**
1. Consider increasing marketing budget allocation based on current conversion rates
2. Focus on enterprise segment expansion as outlined in your Q4 strategy document
3. Leverage the strong retention rate for upselling opportunities

Would you like me to dive deeper into any of these metrics or help you create action plans for Q4?`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Context Chips Demo</h1>
        <p className="text-muted-foreground">
          See how AI responses show their data sources for transparency and trust
        </p>
      </div>

      {/* Sample Chat Message with Context Chips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">AI</span>
            </div>
            Executive Assistant Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Response */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{sampleResponse}</div>
            </div>
          </div>
          
          {/* Context Chips */}
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-2">
              This response was generated using the following sources:
            </div>
            <ContextChips sources={mockSources} />
          </div>
        </CardContent>
      </Card>

      {/* Compact Version Example */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Version (Sidebar Chat)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm">
            Sales pipeline shows $2.3M in active deals with 87% quota attainment. Consider focusing on enterprise segment for Q4 growth.
          </div>
          
          <div className="border-t pt-3">
            <ContextChips sources={mockSources.slice(0, 2)} compact />
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>How Context Chips Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">🎯 Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Users can see exactly where AI responses get their information from, building trust and credibility.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📊 Source Types</h3>
              <p className="text-sm text-muted-foreground">
                User profile, business data, cloud documents, integrations, department metrics, and conversation history.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔍 Detailed Information</h3>
              <p className="text-sm text-muted-foreground">
                Click "Explain sources" to see confidence scores, relevance ratings, and content previews.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Smart Display</h3>
              <p className="text-sm text-muted-foreground">
                Shows most relevant sources first, with compact mode for smaller interfaces.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextChipsDemo; 