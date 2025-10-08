import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Settings, 
  Target,
  Users,
  Zap,
  Lightbulb,
  BarChart3,
  Activity,
  CheckCircle,
  Star,
  ArrowRight,
  Play
} from 'lucide-react';
import DomainAgentChat from '@/lib/ai/components/DomainAgentChat';
import { agentRegistry } from '@/lib/ai/agentRegistry';
import { domainAgentService } from '@/lib/ai/domainAgentService';

const AIAgentsDemoPage: React.FC = () => {
  const agents = agentRegistry.getAllAgents();
  const departmentAgents = agentRegistry.getAllDepartmentAgents();

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'executive-assistant':
        return <Brain className="h-6 w-6" />;
      case 'sales-dept':
        return <TrendingUp className="h-6 w-6" />;
      case 'finance-dept':
        return <DollarSign className="h-6 w-6" />;
      case 'operations-dept':
        return <Settings className="h-6 w-6" />;
      case 'marketing-dept':
        return <Target className="h-6 w-6" />;
      default:
        return <Users className="h-6 w-6" />;
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Agents Integration Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience the power of AI agents integrated with real department data. 
          Get intelligent insights, recommendations, and automated analysis across all business functions.
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Live Chat Demo</TabsTrigger>
          <TabsTrigger value="agents">Agent Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Interactive AI Agent Chat
              </CardTitle>
              <CardDescription>
                Chat with AI agents that have access to real department data and can provide intelligent insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainAgentChat />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          {/* Executive Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Executive Level - Strategic Command
              </CardTitle>
              <CardDescription>
                High-level strategic decision making and cross-departmental coordination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.filter(agent => agent.type === 'executive').map((agent) => (
                  <Card key={agent.id} className="border-2 border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {getAgentIcon(agent.id)}
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>{agent.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Expertise:</h4>
                        <div className="flex flex-wrap gap-1">
                          {agent.knowledgeBase.expertise.slice(0, 3).map((expertise, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {expertise}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Frameworks:</h4>
                        <div className="flex flex-wrap gap-1">
                          {agent.knowledgeBase.frameworks.slice(0, 2).map((framework, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {framework}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {agent.knowledgeBase.experience}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Level - Domain Experts
              </CardTitle>
              <CardDescription>
                Specialized department heads with deep expertise and real-time data access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {departmentAgents.map((agent) => (
                  <Card key={agent.id} className="border-2 border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        {getAgentIcon(agent.id)}
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>Department: {agent.department}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Data Access:</h4>
                        <div className="flex flex-wrap gap-1">
                          {agent.serviceIntegration.dataAccess.map((data, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {data}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Capabilities:</h4>
                        <div className="flex flex-wrap gap-1">
                          {agent.serviceIntegration.capabilities.slice(0, 3).map((capability, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Tools:</h4>
                        <div className="flex flex-wrap gap-1">
                          {agent.tools.slice(0, 2).map((tool, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tool.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Specialist Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Specialist Level - Technical Experts
              </CardTitle>
              <CardDescription>
                Specialized sub-agents with focused expertise in specific areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.filter(agent => agent.type === 'specialist').map((agent) => (
                  <Card key={agent.id} className="border border-purple-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {getAgentIcon(agent.id)}
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-gray-600">{agent.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 2).map((capability, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-6">
          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Intelligent Routing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Automatically routes queries to the most appropriate AI agent based on content analysis and context.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Keyword-based analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Context-aware routing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Confidence scoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Real-time Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  AI agents have access to live department data and can provide real-time insights and recommendations.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Live metrics integration</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Department service access</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Contextual insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-lg">Smart Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Generates intelligent insights with confidence scores and impact assessments.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Opportunity detection</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Risk assessment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Actionable recommendations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Tool Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Each agent has specialized tools for analysis, optimization, and automation.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Department-specific tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Automated analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Workflow automation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">Expert Personalities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Each agent has a unique personality and expertise based on real-world experience.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Professional backgrounds</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Industry expertise</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Communication styles</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Continuous Learning</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Agents learn from interactions and improve their recommendations over time.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Pattern recognition</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Performance tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Adaptive responses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Example Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Try These Example Queries
              </CardTitle>
              <CardDescription>
                Test the AI agents with these sample questions to see their capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Sales & Revenue</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">"How can I improve my sales pipeline?"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: VP of Sales</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">"What's my revenue optimization strategy?"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: VP of Sales</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">"Analyze my lead conversion rates"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: VP of Sales</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Finance & Budget</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium">"How can I optimize my budget?"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: CFO</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium">"Calculate ROI for my investments"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: CFO</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium">"Analyze my financial metrics"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: CFO</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Operations & Efficiency</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium">"How can I improve operational efficiency?"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: COO</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium">"Identify workflow bottlenecks"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: COO</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium">"Automate my business processes"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: COO</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Marketing & Growth</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium">"Analyze my marketing campaign performance"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: CMO</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium">"Optimize my lead generation strategy"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: CMO</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium">"Calculate marketing ROI"</p>
                      <p className="text-xs text-gray-600 mt-1">Routes to: CMO</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgentsDemoPage;
