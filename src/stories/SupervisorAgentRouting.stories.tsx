import type { Meta, StoryObj } from '@storybook/react-vite';
import { StreamingComposer } from '../components/chat/StreamingComposer';
import AgentPicker from '../components/chat/AgentPicker';
import { useState } from 'react';

const meta: Meta<typeof StreamingComposer> = {
  title: 'Features/Supervisor Agent Routing',
  component: StreamingComposer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Supervisor Agent Routing system that intelligently routes user queries to appropriate specialist agents based on intent analysis.'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock chat messages with routing information
const mockMessages = [
  {
    role: 'user' as const,
    content: 'How can I improve my sales pipeline?'
  },
  {
    role: 'assistant' as const,
    content: 'Based on your sales pipeline question, I can help you optimize your conversion rates and improve lead qualification. Here are some key strategies:\n\n1. **Lead Scoring**: Implement a systematic approach to scoring leads\n2. **Pipeline Stages**: Clearly define each stage of your sales process\n3. **Follow-up Automation**: Set up automated follow-up sequences\n\nWhat specific aspect of your pipeline would you like to focus on first?',
    routing: {
      agent: 'sales',
      confidence: 0.8,
      reasoning: 'Query contains 2 sales keywords - routing to sales specialist'
    }
  }
];

const mockStrategicMessages = [
  {
    role: 'user' as const,
    content: 'What should our business strategy be for next quarter?'
  },
  {
    role: 'assistant' as const,
    content: 'As your strategic advisor, I recommend focusing on three key areas for next quarter:\n\n## Strategic Priorities\n\n1. **Market Positioning**: Analyze competitive landscape and differentiation\n2. **Resource Allocation**: Optimize budget and team allocation across departments\n3. **Growth Initiatives**: Identify highest-impact growth opportunities\n\n## Framework for Decision Making\n\nI suggest using the OKR (Objectives and Key Results) framework to structure your quarterly planning. This will help align all departments around common goals.\n\nWhat specific business challenges are you facing that should influence this strategy?',
    routing: {
      agent: 'executive',
      confidence: 0.9,
      reasoning: 'Query involves strategic planning - routing to Executive Assistant'
    }
  }
];

// Agent Picker Story
export const AgentPickerWithAutoRoute: Story = {
  render: () => {
    const [selectedAgent, setSelectedAgent] = useState('auto');
    
    return (
      <div className="p-6 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Agent Selection</h3>
        <AgentPicker 
          value={selectedAgent} 
          onChange={setSelectedAgent}
        />
        <div className="mt-4 p-4 bg-background rounded-lg">
          <p className="text-sm text-muted-foreground">
            Selected: <strong>{selectedAgent === 'auto' ? 'Auto-Route (Supervisor)' : selectedAgent}</strong>
          </p>
          {selectedAgent === 'auto' && (
            <p className="text-xs text-primary mt-1">
              ✨ Queries will be automatically routed to the most appropriate specialist
            </p>
          )}
        </div>
      </div>
    );
  }
};

// Sales Query Routing Story
export const SalesQueryRouting: Story = {
  args: {
    agentId: 'auto',
    conversationId: 'sales-demo',
  },
  render: (args) => (
    <div className="h-96 p-4">
      <div className="mb-4 p-4 bg-primary/5 rounded-lg">
        <h3 className="font-semibold text-blue-900">Sales Query Routing Demo</h3>
        <p className="text-sm text-primary">
          Try asking: "How can I improve my sales pipeline?" or "What's our conversion rate?"
        </p>
      </div>
      <StreamingComposer {...args} />
    </div>
  )
};

// Strategic Query Routing Story
export const StrategicQueryRouting: Story = {
  args: {
    agentId: 'auto',
    conversationId: 'strategic-demo',
  },
  render: (args) => (
    <div className="h-96 p-4">
      <div className="mb-4 p-4 bg-secondary/5 rounded-lg">
        <h3 className="font-semibold text-purple-900">Strategic Query Routing Demo</h3>
        <p className="text-sm text-purple-700">
          Try asking: "What should our business strategy be?" or "What are our priorities?"
        </p>
      </div>
      <StreamingComposer {...args} />
    </div>
  )
};

// Routing Indicators Story
export const RoutingIndicators: Story = {
  render: () => (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Routing Indicators</h3>
      
      {/* Sales Routing Example */}
      <div className="border rounded-lg p-4">
        <div className="mb-2">
          <strong>User:</strong> How can I improve my sales pipeline?
        </div>
        <div className="bg-background p-4 rounded">
          <strong>Sales Director:</strong> Based on your sales pipeline question, I can help you optimize your conversion rates...
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
              🤖 Auto-routed to sales
            </span>
            <span className="opacity-75">
              80% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Routing Example */}
      <div className="border rounded-lg p-4">
        <div className="mb-2">
          <strong>User:</strong> What should our business strategy be?
        </div>
        <div className="bg-background p-4 rounded">
          <strong>Executive Assistant:</strong> As your strategic advisor, I recommend focusing on three key areas...
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-purple-700 rounded-full">
              🤖 Auto-routed to executive
            </span>
            <span className="opacity-75">
              90% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Ambiguous Query Example */}
      <div className="border rounded-lg p-4">
        <div className="mb-2">
          <strong>User:</strong> Can you help me?
        </div>
        <div className="bg-background p-4 rounded">
          <strong>Executive Assistant:</strong> Of course! I'm here to help with your business needs...
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground/90 rounded-full">
              🤖 Auto-routed to executive
            </span>
            <span className="opacity-75">
              60% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  )
};

// Multi-Agent Comparison Story
export const MultiAgentComparison: Story = {
  render: () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Agent Specialization Comparison</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-primary mb-2">🎯 Sales Director</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Specializes in: Sales strategy, pipeline management, revenue optimization
          </p>
          <div className="text-xs bg-primary/5 p-2 rounded">
            <strong>Sample Query:</strong> "How can I improve conversion rates?"<br/>
            <strong>Keywords:</strong> sales, revenue, deals, pipeline, customers, prospects, quota, crm
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-success mb-2">📈 Marketing Director</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Specializes in: Marketing strategy, growth hacking, brand management
          </p>
          <div className="text-xs bg-success/5 p-2 rounded">
            <strong>Sample Query:</strong> "How can I optimize our campaigns?"<br/>
            <strong>Keywords:</strong> marketing, campaigns, leads, website, traffic, conversion, brand, seo
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-yellow-700 mb-2">💰 Finance Director</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Specializes in: Financial planning, budget management, cost optimization
          </p>
          <div className="text-xs bg-warning/5 p-2 rounded">
            <strong>Sample Query:</strong> "How can I reduce costs?"<br/>
            <strong>Keywords:</strong> finance, budget, costs, profit, cash, expenses, financial, roi
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-destructive mb-2">⚙️ Operations Director</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Specializes in: Process optimization, automation, operational efficiency
          </p>
          <div className="text-xs bg-destructive/5 p-2 rounded">
            <strong>Sample Query:</strong> "How can I automate processes?"<br/>
            <strong>Keywords:</strong> operations, projects, tickets, capacity, team, process, efficiency, automation
          </div>
        </div>
      </div>

      <div className="mt-6 border-2 border-purple-200 rounded-lg p-4 bg-secondary/5">
        <h4 className="font-semibold text-purple-700 mb-2">👔 Executive Assistant (Strategic)</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Specializes in: Strategic planning, cross-department coordination, executive reporting
        </p>
        <div className="text-xs bg-secondary/10 p-2 rounded">
          <strong>Sample Query:</strong> "What should our business strategy be?"<br/>
          <strong>Strategic Keywords:</strong> strategy, planning, vision, roadmap, priorities, goals, overall, business<br/>
          <strong>Fallback:</strong> Also handles ambiguous queries and general business questions
        </div>
      </div>
    </div>
  )
};

// Test Cases Story
export const TestCases: Story = {
  render: () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Manual Test Cases</h3>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Test Case 1: Sales Query</h4>
          <div className="text-sm space-y-1">
            <p><strong>Input:</strong> "How can I improve my conversion rates?"</p>
            <p><strong>Expected:</strong> Routes to Sales Director with high confidence</p>
            <p><strong>Verification:</strong> ✅ Routing indicator shows "Sales Director"</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Test Case 2: Strategic Query</h4>
          <div className="text-sm space-y-1">
            <p><strong>Input:</strong> "What should our company priorities be for next quarter?"</p>
            <p><strong>Expected:</strong> Routes to Executive Assistant with high confidence</p>
            <p><strong>Verification:</strong> ✅ Routing indicator shows "Executive Assistant"</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Test Case 3: Ambiguous Query</h4>
          <div className="text-sm space-y-1">
            <p><strong>Input:</strong> "Can you help me?"</p>
            <p><strong>Expected:</strong> Routes to Executive Assistant with lower confidence</p>
            <p><strong>Verification:</strong> ✅ Confidence score displayed as &lt; 70%</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Test Case 4: Multi-keyword Query</h4>
          <div className="text-sm space-y-1">
            <p><strong>Input:</strong> "How can I optimize our marketing budget and reduce costs?"</p>
            <p><strong>Expected:</strong> Routes to highest-scoring agent (Finance or Marketing)</p>
            <p><strong>Verification:</strong> ✅ Reasoning explains keyword matching</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Test Case 5: Manual Override</h4>
          <div className="text-sm space-y-1">
            <p><strong>Input:</strong> Select specific agent instead of "Auto-Route"</p>
            <p><strong>Expected:</strong> No routing metadata, uses selected agent</p>
            <p><strong>Verification:</strong> ✅ No routing indicator displayed</p>
          </div>
        </div>
      </div>
    </div>
  )
}; 