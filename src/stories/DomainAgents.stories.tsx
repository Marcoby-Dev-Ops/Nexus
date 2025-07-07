import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import DomainAgentIndicator from '@/components/chat/DomainAgentIndicator';
import { agentRegistry, getAgentsByDepartment, getAllAgents } from '@/lib/ai/agentRegistry';

const meta = {
  title: 'Features/Domain Agents',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Domain Agents provide specialized AI assistants with department-specific knowledge, tools, and contextual awareness for different business functions.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock domain capabilities data
const mockDomainCapabilities = {
  sales: {
    tools: ['crm_integration', 'pipeline_analysis', 'lead_scoring', 'sales_forecasting'],
    expertise: ['Pipeline Management', 'Revenue Optimization', 'Sales Strategy', 'Lead Qualification'],
    insights: ['4 open deals worth $205,000', 'Conversion rate: 16.7%', 'Average deal size: $51,250']
  },
  marketing: {
    tools: ['campaign_analysis', 'seo_tools', 'social_media_analytics', 'content_generation'],
    expertise: ['Marketing Strategy', 'Growth Hacking', 'Brand Management', 'Digital Marketing'],
    insights: ['Website traffic: 3,500 visitors', 'Lead conversion: 4.2%', 'Social engagement up 15%']
  },
  finance: {
    tools: ['financial_modeling', 'budget_analysis', 'cost_optimization', 'roi_calculation'],
    expertise: ['Financial Planning', 'Budget Management', 'Cost Analysis', 'Financial Modeling'],
    insights: ['Monthly revenue: $45,000', 'Profit margin: 28%', 'Cash flow: $12,000']
  },
  operations: {
    tools: ['process_optimization', 'automation_tools', 'performance_monitoring', 'workflow_design'],
    expertise: ['Process Optimization', 'Automation', 'Operational Efficiency', 'Performance Monitoring'],
    insights: ['Service uptime: 99.9%', 'Automation coverage: 78%', 'Asset utilization: 82%']
  }
};

// Mock routing data
const mockRouting = {
  sales: {
    agent: 'sales-dept',
    confidence: 0.85,
    reasoning: 'Query contains 3 sales keywords - routing to sales specialist'
  },
  marketing: {
    agent: 'marketing-dept',
    confidence: 0.92,
    reasoning: 'Query involves marketing strategy - routing to marketing specialist'
  },
  finance: {
    agent: 'finance-dept',
    confidence: 0.78,
    reasoning: 'Query contains 2 finance keywords - routing to finance specialist'
  },
  operations: {
    agent: 'operations-dept',
    confidence: 0.88,
    reasoning: 'Query involves process optimization - routing to operations specialist'
  },
  executive: {
    agent: 'executive',
    confidence: 0.95,
    reasoning: 'Query involves strategic planning - routing to Executive Assistant'
  }
};

export const AgentRegistry: Story = {
  render: () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    
    const departments = ['all', 'sales', 'marketing', 'finance', 'operations', 'support'];
    const agents = selectedDepartment === 'all' 
      ? getAllAgents() 
      : getAgentsByDepartment(selectedDepartment);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Domain Agent Registry</h2>
          <p className="text-muted-foreground">
            Explore the specialized AI agents available for different business departments.
          </p>
          
          <div className="flex gap-2 flex-wrap">
            {departments.map(dept => (
              <Button
                key={dept}
                variant={selectedDepartment === dept ? 'default' : 'outline'}
                onClick={() => setSelectedDepartment(dept)}
                className="capitalize"
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Card key={agent.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div>
                    <div className="text-lg">{agent.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {agent.type}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                
                {agent.specialties && agent.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Specialties:</h4>
                    <div className="flex flex-wrap gap-1">
                      {agent.specialties.slice(0, 3).map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {agent.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {agent.knowledgeBase?.frameworks && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Frameworks:</h4>
                    <p className="text-xs text-muted-foreground">
                      {agent.knowledgeBase.frameworks.slice(0, 3).join(', ')}
                      {agent.knowledgeBase.frameworks.length > 3 && '...'}
                    </p>
                  </div>
                )}

                {agent.personality && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Personality:</h4>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {agent.personality.communicationStyle}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {agent.personality.expertise_level}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
};

export const DomainAgentIndicators: Story = {
  render: () => {
    const [showDetails, setShowDetails] = useState(false);
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Domain Agent Indicators</h2>
          <p className="text-muted-foreground">
            Visual indicators showing agent routing, capabilities, and domain-specific insights.
          </p>
          
          <Button 
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Query Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainAgentIndicator
                agentId="sales-dept"
                routing={mockRouting.sales}
                domainCapabilities={mockDomainCapabilities.sales}
                showDetails={showDetails}
              />
              <div className="mt-4 p-4 bg-background rounded">
                <p className="text-sm text-muted-foreground">
                  <strong>User Query:</strong> "How is our sales pipeline performing this quarter?"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Query Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainAgentIndicator
                agentId="marketing-dept"
                routing={mockRouting.marketing}
                domainCapabilities={mockDomainCapabilities.marketing}
                showDetails={showDetails}
              />
              <div className="mt-4 p-4 bg-background rounded">
                <p className="text-sm text-muted-foreground">
                  <strong>User Query:</strong> "What marketing campaigns should we run to increase lead generation?"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finance Query Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainAgentIndicator
                agentId="finance-dept"
                routing={mockRouting.finance}
                domainCapabilities={mockDomainCapabilities.finance}
                showDetails={showDetails}
              />
              <div className="mt-4 p-4 bg-background rounded">
                <p className="text-sm text-muted-foreground">
                  <strong>User Query:</strong> "Can you analyze our budget variance for this month?"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations Query Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainAgentIndicator
                agentId="operations-dept"
                routing={mockRouting.operations}
                domainCapabilities={mockDomainCapabilities.operations}
                showDetails={showDetails}
              />
              <div className="mt-4 p-4 bg-background rounded">
                <p className="text-sm text-muted-foreground">
                  <strong>User Query:</strong> "How can we optimize our operational processes to reduce costs?"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executive Strategic Query</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainAgentIndicator
                agentId="executive"
                routing={mockRouting.executive}
                showDetails={showDetails}
              />
              <div className="mt-4 p-4 bg-background rounded">
                <p className="text-sm text-muted-foreground">
                  <strong>User Query:</strong> "What should our strategic priorities be for next quarter?"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
};

export const AgentCapabilitiesComparison: Story = {
  render: () => {
    const departmentAgents = [
      { agent: agentRegistry.find(a => a.id === 'sales-dept'), capabilities: mockDomainCapabilities.sales },
      { agent: agentRegistry.find(a => a.id === 'marketing-dept'), capabilities: mockDomainCapabilities.marketing },
      { agent: agentRegistry.find(a => a.id === 'finance-dept'), capabilities: mockDomainCapabilities.finance },
      { agent: agentRegistry.find(a => a.id === 'operations-dept'), capabilities: mockDomainCapabilities.operations }
    ].filter(item => item.agent);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Agent Capabilities Comparison</h2>
          <p className="text-muted-foreground">
            Compare the tools, expertise, and insights available to different domain agents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departmentAgents.map(({ agent, capabilities }) => (
            <Card key={agent!.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{agent!.avatar}</span>
                  <div>
                    <div>{agent!.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {agent!.department}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Available Tools:</h4>
                  <div className="flex flex-wrap gap-1">
                    {capabilities.tools.map((tool, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tool.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Expertise Areas:</h4>
                  <div className="flex flex-wrap gap-1">
                    {capabilities.expertise.map((expertise, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {expertise}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Recent Insights:</h4>
                  <div className="space-y-1">
                    {capabilities.insights.map((insight, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground bg-background p-2 rounded">
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
};

export const ManualTestCases: Story = {
  render: () => {
    const [selectedTest, setSelectedTest] = useState<number | null>(null);
    
    const testCases = [
      {
        id: 1,
        title: 'Sales Pipeline Analysis',
        query: 'How is our sales pipeline performing this quarter?',
        expectedAgent: 'Sales Director',
        expectedTools: ['crm_integration', 'pipeline_analysis', 'sales_forecasting'],
        expectedInsights: ['Open deals analysis', 'Conversion rate trends', 'Revenue forecasting'],
        verification: [
          'Agent is correctly routed to Sales Director',
          'Sales-specific tools are available',
          'Pipeline insights are displayed',
          'Confidence score is above 80%'
        ]
      },
      {
        id: 2,
        title: 'Marketing Campaign Strategy',
        query: 'What marketing campaigns should we run to increase lead generation?',
        expectedAgent: 'Marketing Director',
        expectedTools: ['campaign_analysis', 'seo_tools', 'content_generation'],
        expectedInsights: ['Website traffic trends', 'Lead conversion metrics', 'Campaign performance'],
        verification: [
          'Agent is correctly routed to Marketing Director',
          'Marketing-specific tools are available',
          'Campaign insights are displayed',
          'Confidence score is above 80%'
        ]
      },
      {
        id: 3,
        title: 'Financial Budget Analysis',
        query: 'Can you analyze our budget variance for this month?',
        expectedAgent: 'Finance Director',
        expectedTools: ['financial_modeling', 'budget_analysis', 'cost_optimization'],
        expectedInsights: ['Monthly revenue data', 'Profit margin analysis', 'Cash flow status'],
        verification: [
          'Agent is correctly routed to Finance Director',
          'Finance-specific tools are available',
          'Financial insights are displayed',
          'Confidence score is above 70%'
        ]
      },
      {
        id: 4,
        title: 'Operations Process Optimization',
        query: 'How can we optimize our operational processes to reduce costs?',
        expectedAgent: 'Operations Director',
        expectedTools: ['process_optimization', 'automation_tools', 'performance_monitoring'],
        expectedInsights: ['Service uptime metrics', 'Automation coverage', 'Process efficiency'],
        verification: [
          'Agent is correctly routed to Operations Director',
          'Operations-specific tools are available',
          'Operational insights are displayed',
          'Confidence score is above 80%'
        ]
      },
      {
        id: 5,
        title: 'Strategic Planning Query',
        query: 'What should our strategic priorities be for next quarter?',
        expectedAgent: 'Executive Assistant',
        expectedTools: ['business_intelligence', 'strategic_planning', 'performance_dashboard'],
        expectedInsights: ['Overall business health', 'Cross-department performance', 'Strategic recommendations'],
        verification: [
          'Agent is correctly routed to Executive Assistant',
          'Executive-level tools are available',
          'Strategic insights are displayed',
          'Confidence score is above 90%'
        ]
      }
    ];

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Manual Test Cases</h2>
          <p className="text-muted-foreground">
            Test scenarios to verify domain agent routing and capabilities work correctly.
          </p>
        </div>

        <div className="space-y-4">
          {testCases.map(testCase => (
            <Card key={testCase.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Case {testCase.id}: {testCase.title}</span>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTest(selectedTest === testCase.id ? null : testCase.id)}
                  >
                    {selectedTest === testCase.id ? 'Hide' : 'Show'} Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded">
                  <p className="text-sm">
                    <strong>Query:</strong> "{testCase.query}"
                  </p>
                </div>

                {selectedTest === testCase.id && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Expected Results:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Agent:</p>
                          <Badge variant="secondary">{testCase.expectedAgent}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Tools:</p>
                          <div className="flex flex-wrap gap-1">
                            {testCase.expectedTools.map((tool, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tool.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Expected Insights:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {testCase.expectedInsights.map((insight, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">{insight}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Verification Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {testCase.verification.map((step, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="p-4 bg-success/5 rounded">
                      <p className="text-sm text-success">
                        <strong>How to Test:</strong> Use this query in the Chat interface and verify the agent routing, tools, and insights match the expected results.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
}; 