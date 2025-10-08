import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings, 
  Target,
  Zap,
  Lightbulb,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react';
import { agentRegistry } from '@/lib/ai/core/agentRegistry';
import { domainAgentService } from '@/lib/ai/services/domainAgentService';
import { departmentServices } from '@/services/departments';
import type { Agent, DepartmentAgent } from '@/lib/ai/core/agentRegistry';
import type { DomainContext, AgentResponse } from '@/lib/ai/services/domainAgentService';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: Date;
  insights?: any[];
  toolsUsed?: string[];
  dataUsed?: string[];
}

const DomainAgentChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('executive-assistant');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departmentAgents, setDepartmentAgents] = useState<DepartmentAgent[]>([]);
  const [departmentData, setDepartmentData] = useState<any>({});

  useEffect(() => {
    initializeAgents();
    loadDepartmentData();
  }, []);

  const initializeAgents = () => {
    const allAgents = agentRegistry.getAllAgents();
    const deptAgents = agentRegistry.getAllDepartmentAgents();
    setAgents(allAgents);
    setDepartmentAgents(deptAgents);
  };

  const loadDepartmentData = async () => {
    try {
      const [salesData, financeData, operationsData, marketingData] = await Promise.all([
        domainAgentService.getDepartmentDataContext('sales'),
        domainAgentService.getDepartmentDataContext('finance'),
        domainAgentService.getDepartmentDataContext('operations'),
        domainAgentService.getDepartmentDataContext('marketing')
      ]);

      setDepartmentData({
        sales: salesData,
        finance: financeData,
        operations: operationsData,
        marketing: marketingData
      });
    } catch (error) {
      console.error('Error loading department data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Analyze query routing
      const routing = await domainAgentService.analyzeQueryRouting(inputMessage, {
        userContext: {
          role: 'business_owner',
          experience: 'intermediate',
          goals: ['increase_revenue', 'optimize_processes']
        },
        businessContext: {
          companyId: 'demo-company',
          industry: 'technology',
          size: 'small',
          stage: 'growth'
        }
      });

      // Get enhanced agent
      const enhancedAgent = await domainAgentService.getEnhancedAgent(routing.recommendedAgent, {
        userContext: {
          role: 'business_owner',
          experience: 'intermediate',
          goals: ['increase_revenue', 'optimize_processes']
        }
      });

      if (!enhancedAgent) {
        throw new Error('Failed to get enhanced agent');
      }

      // Generate response (simulated for demo)
      const agentResponse = await generateAgentResponse(inputMessage, enhancedAgent, routing);

      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: agentResponse.response,
        agentId: enhancedAgent.id,
        agentName: enhancedAgent.name,
        timestamp: new Date(),
        insights: agentResponse.insights,
        toolsUsed: agentResponse.toolsUsed,
        dataUsed: agentResponse.dataUsed
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        agentId: selectedAgent,
        agentName: 'AI Assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAgentResponse = async (query: string, agent: Agent | DepartmentAgent, routing: any): Promise<AgentResponse> => {
    // Simulate AI response generation with department data integration
    const agentName = agent.name;
    const agentId = agent.id;

    let response = '';
    let insights: any[] = [];
    let toolsUsed: string[] = [];
    let dataUsed: string[] = [];

    // Generate context-aware response based on agent type
    if (agent.type === 'executive') {
      response = `As your Executive Assistant, I've analyzed your query about "${query}". Based on our current business data, here's my strategic assessment:

**Cross-Department Overview:**
- Sales Pipeline: ${departmentData.sales?.leads || 0} active leads
- Financial Health: ${departmentData.finance?.metrics?.profit_margin || 0}% profit margin
- Operational Efficiency: ${departmentData.operations?.metrics?.efficiency_score || 0}% efficiency score
- Marketing Performance: ${departmentData.marketing?.campaigns || 0} active campaigns

**Strategic Recommendations:**
1. Focus on lead conversion optimization to improve revenue
2. Consider process automation to boost operational efficiency
3. Review marketing ROI to optimize campaign performance

Would you like me to dive deeper into any specific department or create an action plan?`;
      
      insights = [
        { type: 'opportunity', title: 'Revenue Optimization', description: 'Potential 15% revenue increase through pipeline optimization', confidence: 8, impact: 9 },
        { type: 'recommendation', title: 'Process Automation', description: 'Implement workflow automation to improve efficiency', confidence: 7, impact: 7 }
      ];
      
      toolsUsed = ['business_intelligence', 'strategic_planning'];
      dataUsed = ['sales_metrics', 'financial_metrics', 'operations_metrics', 'marketing_metrics'];
    } else if (agent.type === 'departmental') {
      const deptAgent = agent as DepartmentAgent;
      const deptData = departmentData[deptAgent.department];
      
      switch (deptAgent.department) {
        case 'sales':
          response = `As your VP of Sales, I've analyzed your sales pipeline and performance metrics:

**Current Sales Status:**
- Active Leads: ${deptData?.leads || 0}
- Monthly Revenue: $${deptData?.metrics?.monthly_revenue || 0}
- Conversion Rate: ${deptData?.metrics?.conversion_rate || 0}%

**Key Insights:**
1. Pipeline velocity needs improvement
2. Lead qualification process could be optimized
3. Revenue growth opportunities identified

**Immediate Actions:**
- Implement MEDDIC methodology for better lead qualification
- Focus on high-value opportunities
- Optimize follow-up sequences

Would you like me to analyze specific leads or create a revenue optimization plan?`;
          
          insights = [
            { type: 'opportunity', title: 'Pipeline Optimization', description: 'Potential 25% increase in conversion rates', confidence: 8, impact: 8 },
            { type: 'recommendation', title: 'Lead Qualification', description: 'Implement MEDDIC methodology', confidence: 9, impact: 7 }
          ];
          
          toolsUsed = ['analyze_sales_pipeline', 'optimize_revenue'];
          dataUsed = ['sales_leads', 'sales_metrics'];
          break;

        case 'finance':
          response = `As your CFO, I've reviewed your financial performance and metrics:

**Financial Overview:**
- Total Revenue: $${deptData?.metrics?.total_revenue || 0}
- Profit Margin: ${deptData?.metrics?.profit_margin || 0}%
- Cash Flow: $${deptData?.metrics?.cash_flow || 0}

**Financial Analysis:**
1. Revenue growth is strong at 15% month-over-month
2. Profit margins are healthy but could be optimized
3. Cash flow management is effective

**Strategic Recommendations:**
- Implement cost optimization initiatives
- Review pricing strategy for margin improvement
- Consider investment in growth areas

Would you like me to create a detailed financial analysis or budget optimization plan?`;
          
          insights = [
            { type: 'trend', title: 'Revenue Growth', description: 'Strong 15% month-over-month growth', confidence: 9, impact: 8 },
            { type: 'opportunity', title: 'Cost Optimization', description: 'Potential 10% cost reduction through process optimization', confidence: 7, impact: 6 }
          ];
          
          toolsUsed = ['analyze_financial_metrics', 'optimize_budget'];
          dataUsed = ['financial_transactions', 'financial_metrics'];
          break;

        case 'operations':
          response = `As your COO, I've analyzed your operational efficiency and workflows:

**Operations Status:**
- Active Workflows: ${deptData?.workflows || 0}
- Efficiency Score: ${deptData?.metrics?.efficiency_score || 0}%
- Bottlenecks Identified: ${deptData?.metrics?.bottlenecks_count || 0}

**Operational Insights:**
1. Overall efficiency is good but has room for improvement
2. Several workflow bottlenecks identified
3. Automation opportunities available

**Optimization Plan:**
- Implement workflow automation for repetitive tasks
- Standardize processes for better efficiency
- Improve resource allocation

Would you like me to create a detailed process optimization plan or automation roadmap?`;
          
          insights = [
            { type: 'opportunity', title: 'Workflow Automation', description: 'Potential 35% efficiency improvement through automation', confidence: 8, impact: 8 },
            { type: 'recommendation', title: 'Process Standardization', description: 'Implement standard operating procedures', confidence: 7, impact: 6 }
          ];
          
          toolsUsed = ['analyze_workflow_efficiency', 'optimize_processes'];
          dataUsed = ['operations_workflows', 'operations_metrics'];
          break;

        case 'marketing':
          response = `As your CMO, I've reviewed your marketing campaigns and performance:

**Marketing Overview:**
- Active Campaigns: ${deptData?.campaigns || 0}
- Total Leads: ${deptData?.analytics?.total_leads || 0}
- Conversion Rate: ${deptData?.analytics?.conversion_rate || 0}%

**Campaign Analysis:**
1. Email campaigns are performing well
2. Social media engagement is high but conversion is low
3. Content marketing shows strong ROI

**Growth Strategies:**
- Optimize social media conversion funnels
- Scale successful email campaigns
- Invest in content marketing

Would you like me to analyze specific campaigns or create a lead generation strategy?`;
          
          insights = [
            { type: 'trend', title: 'Email Performance', description: 'Email campaigns show 40% higher conversion rates', confidence: 8, impact: 7 },
            { type: 'opportunity', title: 'Social Media Optimization', description: 'Improve social media conversion rates', confidence: 6, impact: 5 }
          ];
          
          toolsUsed = ['analyze_campaign_performance', 'optimize_lead_generation'];
          dataUsed = ['marketing_campaigns', 'marketing_analytics'];
          break;
      }
    }

    return {
      agentId,
      agentName,
      response,
      insights,
      dataUsed,
      toolsUsed,
      nextSteps: ['Review detailed analysis', 'Implement recommendations', 'Schedule follow-up']
    };
  };

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'executive-assistant':
        return <Brain className="h-4 w-4" />;
      case 'sales-dept':
        return <TrendingUp className="h-4 w-4" />;
      case 'finance-dept':
        return <DollarSign className="h-4 w-4" />;
      case 'operations-dept':
        return <Settings className="h-4 w-4" />;
      case 'marketing-dept':
        return <Target className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'risk':
        return <Activity className="h-4 w-4 text-red-600" />;
      case 'recommendation':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'trend':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default:
        return <Zap className="h-4 w-4 text-purple-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Agents
              </CardTitle>
              <CardDescription>
                Select an AI agent to get specialized insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Executive Agent */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Executive Level</h3>
                <Button
                  variant={selectedAgent === 'executive-assistant' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedAgent('executive-assistant')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Executive Assistant
                </Button>
              </div>

              {/* Department Agents */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Department Level</h3>
                {departmentAgents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant={selectedAgent === agent.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    {getAgentIcon(agent.id)}
                    <span className="ml-2">{agent.name}</span>
                  </Button>
                ))}
              </div>

              {/* Department Data Overview */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Live Data Overview</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Sales Leads:</span>
                    <Badge variant="secondary">{departmentData.sales?.leads || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <Badge variant="secondary">${departmentData.finance?.metrics?.total_revenue || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency:</span>
                    <Badge variant="secondary">{departmentData.operations?.metrics?.efficiency_score || 0}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Campaigns:</span>
                    <Badge variant="secondary">{departmentData.marketing?.campaigns || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Agent Chat
              </CardTitle>
              <CardDescription>
                Ask questions and get intelligent, data-driven insights from your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with your AI agents</p>
                    <p className="text-sm">Try asking about sales, finance, operations, or marketing</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                      {message.type === 'agent' && message.agentName && (
                        <div className="flex items-center gap-2 mb-2">
                          {getAgentIcon(message.agentId || '')}
                          <span className="text-sm font-medium">{message.agentName}</span>
                        </div>
                      )}
                      
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.insights && message.insights.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-sm font-medium">Key Insights:</h4>
                          {message.insights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-white/50 rounded">
                              {getInsightIcon(insight.type)}
                              <div>
                                <div className="text-sm font-medium">{insight.title}</div>
                                <div className="text-xs opacity-75">{insight.description}</div>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    Confidence: {insight.confidence}/10
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Impact: {insight.impact}/10
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs opacity-75">
                            Tools used: {message.toolsUsed.join(', ')}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs opacity-75 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span className="text-sm">AI agent is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your business data, get insights, or request recommendations..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DomainAgentChat;
