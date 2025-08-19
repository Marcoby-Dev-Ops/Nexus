import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { 
  Zap, 
  Play, 
  Pause, 
  StopCircle, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Plus,
  BarChart3,
  Activity,
  Target,
  TrendingUp
} from 'lucide-react';
import { BusinessProcessAutomationService } from '@/shared/services/BusinessProcessAutomationService';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'stopped' | 'draft';
  category: 'email' | 'data-sync' | 'lead-nurturing' | 'reporting' | 'customer-service';
  triggers: string[];
  actions: string[];
  efficiency: number; // percentage
  timeSaved: number; // hours per month
  costSavings: number; // dollars per month
  lastRun?: Date;
  nextRun?: Date;
  errorCount: number;
  successRate: number;
}

interface AutomationOpportunity {
  id: string;
  title: string;
  description: string;
  category: 'email' | 'data-sync' | 'lead-nurturing' | 'reporting' | 'customer-service';
  potentialTimeSaved: number; // hours per month
  potentialCostSavings: number; // dollars per month
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  prerequisites: string[];
  estimatedSetupTime: number; // hours
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const ProcessAutomationPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'email' | 'data-sync' | 'lead-nurturing' | 'reporting' | 'customer-service'>('all');
  const [selectedTab, setSelectedTab] = useState<'workflows' | 'opportunities' | 'analytics'>('workflows');

  useEffect(() => {
    if (user?.id) {
      loadAutomationData();
    }
  }, [user?.id]);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      
      // Mock automation data - in real implementation, use BusinessProcessAutomationService
      const mockWorkflows: AutomationWorkflow[] = [
        {
          id: 'email-followup',
          name: 'Email Follow-up Automation',
          description: 'Automatically sends follow-up emails to leads based on engagement',
          status: 'active',
          category: 'email',
          triggers: ['Lead created', 'Email opened', 'No response after 3 days'],
          actions: ['Send follow-up email', 'Update lead status', 'Schedule next follow-up'],
          efficiency: 85,
          timeSaved: 12,
          costSavings: 240,
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          errorCount: 2,
          successRate: 94
        },
        {
          id: 'data-sync',
          name: 'Data Synchronization',
          description: 'Syncs customer data between CRM and email marketing platform',
          status: 'active',
          category: 'data-sync',
          triggers: ['New customer', 'Customer update', 'Daily sync'],
          actions: ['Update CRM record', 'Sync email list', 'Log sync activity'],
          efficiency: 92,
          timeSaved: 8,
          costSavings: 160,
          lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          nextRun: new Date(Date.now() + 23.5 * 60 * 60 * 1000), // 23.5 hours from now
          errorCount: 0,
          successRate: 100
        },
        {
          id: 'lead-nurturing',
          name: 'Lead Nurturing Campaign',
          description: 'Automated lead nurturing based on behavior and engagement',
          status: 'paused',
          category: 'lead-nurturing',
          triggers: ['Lead downloads content', 'Website visit', 'Email click'],
          actions: ['Send nurture email', 'Update lead score', 'Assign to sales rep'],
          efficiency: 78,
          timeSaved: 15,
          costSavings: 300,
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          errorCount: 5,
          successRate: 87
        }
      ];

      const mockOpportunities: AutomationOpportunity[] = [
        {
          id: 'invoice-reminders',
          title: 'Invoice Reminder Automation',
          description: 'Automatically send payment reminders for overdue invoices',
          category: 'email',
          potentialTimeSaved: 6,
          potentialCostSavings: 120,
          effort: 'low',
          impact: 'high',
          prerequisites: ['Accounting system integration', 'Email templates'],
          estimatedSetupTime: 4,
          priority: 'high'
        },
        {
          id: 'customer-onboarding',
          title: 'Customer Onboarding Workflow',
          description: 'Automated welcome series and onboarding process for new customers',
          category: 'customer-service',
          potentialTimeSaved: 10,
          potentialCostSavings: 200,
          effort: 'medium',
          impact: 'high',
          prerequisites: ['Customer database', 'Email sequences'],
          estimatedSetupTime: 8,
          priority: 'medium'
        },
        {
          id: 'report-generation',
          title: 'Automated Report Generation',
          description: 'Generate and distribute weekly/monthly reports automatically',
          category: 'reporting',
          potentialTimeSaved: 4,
          potentialCostSavings: 80,
          effort: 'low',
          impact: 'medium',
          prerequisites: ['Data sources', 'Report templates'],
          estimatedSetupTime: 6,
          priority: 'low'
        }
      ];

      setWorkflows(mockWorkflows);
      setOpportunities(mockOpportunities);
      
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'stopped': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredWorkflows = workflows.filter(workflow => 
    selectedCategory === 'all' || workflow.category === selectedCategory
  );

  const filteredOpportunities = opportunities.filter(opportunity => 
    selectedCategory === 'all' || opportunity.category === selectedCategory
  );

  const totalTimeSaved = workflows.reduce((sum, workflow) => sum + workflow.timeSaved, 0);
  const totalCostSavings = workflows.reduce((sum, workflow) => sum + workflow.costSavings, 0);
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Process Automation</h1>
            <p className="text-muted-foreground">Automate repetitive tasks and workflows</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Process Automation</h1>
          <p className="text-muted-foreground">Automate repetitive tasks and workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadAutomationData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">of {workflows.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTimeSaved}h</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCostSavings}</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">available</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="opportunities">Automation Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by Category:</span>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              <option value="email">Email</option>
              <option value="data-sync">Data Sync</option>
              <option value="lead-nurturing">Lead Nurturing</option>
              <option value="reporting">Reporting</option>
              <option value="customer-service">Customer Service</option>
            </select>
          </div>

          {/* Workflows Grid */}
          <div className="grid gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm font-medium">Efficiency</p>
                      <div className="flex items-center gap-2">
                        <Progress value={workflow.efficiency} className="flex-1 h-2" />
                        <span className="text-sm font-bold">{workflow.efficiency}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Time Saved</p>
                      <p className="text-lg font-bold">{workflow.timeSaved}h/month</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cost Savings</p>
                      <p className="text-lg font-bold">${workflow.costSavings}/month</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Success Rate</p>
                      <p className="text-lg font-bold">{workflow.successRate}%</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium mb-2">Triggers</p>
                        <div className="space-y-1">
                          {workflow.triggers.map((trigger, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 bg-current rounded-full"></div>
                              {trigger}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Actions</p>
                        <div className="space-y-1">
                          {workflow.actions.map((action, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 bg-current rounded-full"></div>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by Category:</span>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              <option value="email">Email</option>
              <option value="data-sync">Data Sync</option>
              <option value="lead-nurturing">Lead Nurturing</option>
              <option value="reporting">Reporting</option>
              <option value="customer-service">Customer Service</option>
            </select>
          </div>

          {/* Opportunities Grid */}
          <div className="grid gap-6">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(opportunity.priority)}>
                        {opportunity.priority} priority
                      </Badge>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Implement
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm font-medium">Potential Time Saved</p>
                      <p className="text-lg font-bold">{opportunity.potentialTimeSaved}h/month</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Potential Cost Savings</p>
                      <p className="text-lg font-bold">${opportunity.potentialCostSavings}/month</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Effort</p>
                      <p className={`text-lg font-bold ${getEffortColor(opportunity.effort)}`}>
                        {opportunity.effort}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Impact</p>
                      <p className={`text-lg font-bold ${getImpactColor(opportunity.impact)}`}>
                        {opportunity.impact}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium mb-2">Prerequisites</p>
                        <div className="space-y-1">
                          {opportunity.prerequisites.map((prereq, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-1 h-1 bg-current rounded-full"></div>
                              {prereq}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Setup Details</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Estimated setup time: {opportunity.estimatedSetupTime} hours</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Automation Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Average Efficiency</p>
                    <p className="text-2xl font-bold">
                      {Math.round(workflows.reduce((sum, w) => sum + w.efficiency, 0) / workflows.length)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Time Saved</p>
                    <p className="text-2xl font-bold">{totalTimeSaved} hours/month</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Cost Savings</p>
                    <p className="text-2xl font-bold">${totalCostSavings}/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows.slice(0, 3).map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{workflow.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last run: {workflow.lastRun?.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcessAutomationPage;
