import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  LineChart, 
  BarChart3, 
  Filter,
  Calendar,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Percent,
  UserPlus,
  Phone,
  AlertCircle,
  Activity,
  Lightbulb,
  Zap,
  TrendingUp,
  Brain
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Separator } from '@/shared/components/ui/Separator';
import { Progress } from '@/shared/components/ui/Progress';
import { Input } from '@/shared/components/ui/Input';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/Avatar';
import { useSystemContext } from '@/core/hooks/SystemContext';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { API_CONFIG } from '@/core/constants';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import Modal from '@/shared/components/ui/Modal';

interface PerformanceMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

interface TopOpportunity {
  id: string;
  company: string;
  probability: number;
  value: number;
  stage: string;
  nextAction: string;
  nextActionDate: string;
  rep: {
    name: string;
    avatar: string;
  };
}

/**
 * SalesPerformancePage - Sales dashboard with leads, pipeline, and performance metrics
 */
const SalesPerformancePage: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<TopOpportunity | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isTalkingPointsModalOpen, setIsTalkingPointsModalOpen] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [generatingTalkingPoints, setGeneratingTalkingPoints] = useState(false);
  const [talkingPointsError, setTalkingPointsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!session) {
        setLoading(false);
        setError('Authentication is required to get performance metrics.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/get_sales_performance`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch performance metrics');
        }

        const data = await res.json();
        setPerformanceMetrics(data.metrics || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [session]);

  // Performance Metrics
  /*
  const performanceMetrics = [
    {
// ... existing code ...
      color: 'text-amber-500'
    }
  ];
  */

  // Pipeline Stages
  const pipelineStages = [
    { id: 'lead', name: 'Lead', count: 76, value: 541200, color: 'bg-info/20' },
    { id: 'qualified', name: 'Qualified', count: 42, value: 312600, color: 'bg-info/30' },
    { id: 'proposal', name: 'Proposal', count: 24, value: 189300, color: 'bg-info/40' },
    { id: 'negotiation', name: 'Negotiation', count: 15, value: 126800, color: 'bg-primary' },
    { id: 'closed', name: 'Closed Won', count: 9, value: 87400, color: 'bg-success' }
  ];

  // Sales Team Performance
  const teamPerformance = [
    { 
      id: 'alex', 
      name: 'Alex Rodriguez', 
      avatar: '/avatars/alex.jpg', 
      deals: 12, 
      revenue: 92480, 
      quota: 100000,
      progress: 92.5
    },
    { 
      id: 'jordan', 
      name: 'Jordan Lee', 
      avatar: '/avatars/jordan.jpg', 
      deals: 8, 
      revenue: 64290, 
      quota: 80000,
      progress: 80.4
    },
    { 
      id: 'taylor', 
      name: 'Taylor Wong', 
      avatar: '/avatars/taylor.jpg', 
      deals: 7, 
      revenue: 51620, 
      quota: 80000,
      progress: 64.5
    },
    { 
      id: 'sam', 
      name: 'Sam Jackson', 
      avatar: '/avatars/sam.jpg', 
      deals: 5, 
      revenue: 37999, 
      quota: 60000,
      progress: 63.3
    }
  ];

  // Recent Deals
  const recentDeals = [
    {
      id: 'deal1',
      company: 'Acme Corporation',
      status: 'won',
      value: 32400,
      rep: { name: 'Alex Rodriguez', avatar: '/avatars/alex.jpg' },
      closedDate: '2023-06-12',
      product: 'Enterprise Plan'
    },
    {
      id: 'deal2',
      company: 'TechGiant Solutions',
      status: 'won',
      value: 28750,
      rep: { name: 'Jordan Lee', avatar: '/avatars/jordan.jpg' },
      closedDate: '2023-06-10',
      product: 'Professional Services'
    },
    {
      id: 'deal3',
      company: 'Stellar Industries',
      status: 'lost',
      value: 18500,
      rep: { name: 'Taylor Wong', avatar: '/avatars/taylor.jpg' },
      closedDate: '2023-06-08',
      product: 'Enterprise Plan'
    },
    {
      id: 'deal4',
      company: 'Quantum Innovations',
      status: 'won',
      value: 12750,
      rep: { name: 'Sam Jackson', avatar: '/avatars/sam.jpg' },
      closedDate: '2023-06-05',
      product: 'Team Plan'
    },
    {
      id: 'deal5',
      company: 'Global Ventures Inc',
      status: 'pending',
      value: 43200,
      rep: { name: 'Alex Rodriguez', avatar: '/avatars/alex.jpg' },
      closedDate: null,
      product: 'Enterprise Plan'
    }
  ];

  // Top Opportunities
  const topOpportunities = [
    {
      id: 'opp1',
      company: 'Mega Industries',
      probability: 80,
      value: 85000,
      stage: 'Negotiation',
      nextAction: 'Contract Review',
      nextActionDate: '2023-06-18',
      rep: { name: 'Jordan Lee', avatar: '/avatars/jordan.jpg' }
    },
    {
      id: 'opp2',
      company: 'Pinnacle Systems',
      probability: 65,
      value: 67500,
      stage: 'Proposal',
      nextAction: 'Technical Demo',
      nextActionDate: '2023-06-20',
      rep: { name: 'Alex Rodriguez', avatar: '/avatars/alex.jpg' }
    },
    {
      id: 'opp3',
      company: 'Horizon Partners',
      probability: 50,
      value: 54200,
      stage: 'Qualified',
      nextAction: 'Solution Presentation',
      nextActionDate: '2023-06-23',
      rep: { name: 'Sam Jackson', avatar: '/avatars/sam.jpg' }
    }
  ];

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filter deals based on search
  const filteredDeals = recentDeals.filter(deal => 
    deal.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
    deal.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'syncing': return 'bg-primary/10 text-primary border-primary/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'paused': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const SystemSalesCards: React.FC = () => {
    const { integrationStatus, businessHealth, aiInsights, loading: systemLoading, refresh } = useSystemContext();
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {/* System Health Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              System Health
            </CardTitle>
            <CardDescription>Business health score and trend</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="mb-4">
              <div className="text-4xl font-bold flex items-center gap-2">
                {systemLoading ? '...' : businessHealth.score}
                <span className={`text-base font-medium ${businessHealth.trend === 'up' ? 'text-success' : businessHealth.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>({businessHealth.trend})</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {businessHealth.summary}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={systemLoading}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </CardContent>
        </Card>
        {/* AI Opportunities Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" />
              AI Opportunities
            </CardTitle>
            <CardDescription>AI-generated insights and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              {systemLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : aiInsights.length === 0 ? (
                <div className="text-muted-foreground">No insights available</div>
              ) : (
                aiInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className={`p-2 rounded border-l-4 ${
                    insight.impact === 'high' ? 'border-destructive bg-destructive/5' :
                    insight.impact === 'medium' ? 'border-warning bg-warning/5' :
                    'border-muted bg-muted/5'
                  }`}>
                    <div className="font-semibold flex items-center gap-2">
                      {insight.type === 'opportunity' && <Zap className="w-4 h-4 text-success" />}
                      {insight.type === 'alert' && <AlertCircle className="w-4 h-4 text-destructive" />}
                      {insight.type === 'trend' && <TrendingUp className="w-4 h-4 text-primary" />}
                      {insight.type === 'optimization' && <Lightbulb className="w-4 h-4 text-warning" />}
                      {insight.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{insight.description}</div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/ai-hub'}>
              <Brain className="w-4 h-4 mr-2" /> Explore AI Hub
            </Button>
          </CardContent>
        </Card>
        {/* Integrations Status Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Integrations
            </CardTitle>
            <CardDescription>Status of connected services</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              {systemLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : integrationStatus.length === 0 ? (
                <div className="text-muted-foreground">No integrations connected</div>
              ) : (
                integrationStatus.slice(0, 3).map((integration) => (
                  <div key={integration.id} className="flex items-center gap-2 p-2 rounded border border-border">
                    {getStatusIcon(integration.status)}
                    <span className="font-medium">{integration.name}</span>
                    <span className={`text-xs ml-auto px-2 py-0.5 rounded ${getStatusColor(integration.status)}`}>{integration.status}</span>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/integrations'}>
              <RefreshCw className="w-4 h-4 mr-2" /> Manage Integrations
            </Button>
          </CardContent>
        </Card>
        {/* Quick Actions Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-success" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump to key workflows</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/sales/performance'}>
                View Sales Performance
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/sales/pipeline'}>
                View Pipeline
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/ai-hub'}>
                Ask AI for Sales Insight
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPerformanceMetrics = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-destructive p-4 border border-destructive/20 rounded-md col-span-full">
          <p>Could not load performance metrics: {error}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map(metric => (
          <Card key={metric.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <div className="font-medium">{metric.title}</div>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center pt-1">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className={`h-4 w-4 mr-1 ${metric.id === 'leads' ? 'text-destructive' : 'text-success'}`} />
                ) : (
                  <ArrowDownRight className={`h-4 w-4 mr-1 ${metric.id === 'leads' ? 'text-success' : 'text-destructive'}`} />
                )}
                <p className={`text-sm ${
                  (metric.trend === 'up' && metric.id !== 'leads') || (metric.trend === 'down' && metric.id === 'leads')
                    ? 'text-success'
                    : 'text-destructive'
                }`}>
                  {metric.change} from previous {activeTimeframe}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const handleGenerateFollowup = async (opportunity: TopOpportunity) => {
    if (!session) {
      setGenerationError('Authentication is required to generate emails.');
      return;
    }

    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
    setGeneratingEmail(true);
    setGenerationError(null);
    setGeneratedEmail('');

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/generate_followup_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ opportunity }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate email');
      }

      const data = await res.json();
      setGeneratedEmail(data.email || '');
    } catch (e: any) {
      setGenerationError(e.message);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleGetTalkingPoints = async (opportunity: TopOpportunity) => {
    if (!session) {
      setTalkingPointsError('Authentication is required to get talking points.');
      return;
    }

    setSelectedOpportunity(opportunity);
    setIsTalkingPointsModalOpen(true);
    setGeneratingTalkingPoints(true);
    setTalkingPointsError(null);
    setTalkingPoints([]);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/get_talking_points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ opportunity }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to get talking points');
      }

      const data = await res.json();
      setTalkingPoints(data.talkingPoints || []);
    } catch (e: any) {
      setTalkingPointsError(e.message);
    } finally {
      setGeneratingTalkingPoints(false);
    }
  };

  return (
    <>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Follow-up Email">
        {generatingEmail && <p>Generating email...</p>}
        {generationError && <p className="text-destructive">Error: {generationError}</p>}
        {generatedEmail && (
          <div>
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md">{generatedEmail}</pre>
            <div className="flex justify-end mt-4">
              <Button onClick={() => navigator.clipboard.writeText(generatedEmail)}>Copy to Clipboard</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={isTalkingPointsModalOpen} onClose={() => setIsTalkingPointsModalOpen(false)} title="AI-Generated Talking Points">
        {generatingTalkingPoints && <p>Generating talking points...</p>}
        {talkingPointsError && <p className="text-destructive">Error: {talkingPointsError}</p>}
        {talkingPoints.length > 0 && (
          <ul className="list-disc list-inside space-y-2">
            {talkingPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        )}
      </Modal>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sales Performance</h1>
          <div className="flex items-center gap-2">
            <Select defaultValue={activeTimeframe} onValueChange={setActiveTimeframe}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Timeframe</SelectLabel>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {renderPerformanceMetrics()}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Pipeline Summary & Team Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Pipeline Summary
                  </CardTitle>
                  <CardDescription>
                    Current sales pipeline by stage
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {pipelineStages.map(stage => (
                    <div key={stage.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">{stage.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {stage.count} deals • {formatCurrency(stage.value)}
                        </div>
                      </div>
                      <Progress value={(stage.count / pipelineStages[0].count) * 100} className={`h-2 ${stage.color}`} />
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('pipeline')}>
                    View Full Pipeline
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-primary" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>
                    Sales team quota attainment
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  {teamPerformance.slice(0, 3).map(member => (
                    <div key={member.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium">{member.name}</div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(member.revenue)} / {formatCurrency(member.quota)}
                        </div>
                      </div>
                      <Progress 
                        value={member.progress} 
                        className={`h-2 ${member.progress >= 100 ? 'bg-success' : 'bg-primary'}`} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <div>{member.deals} deals closed</div>
                        <div>{member.progress}% of quota</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('team')}>
                    View All Team Members
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Top Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Top Opportunities</CardTitle>
                <CardDescription>High-value deals to focus on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topOpportunities.map(opp => (
                    <Card key={opp.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={opp.rep.avatar} />
                            <AvatarFallback>{opp.rep.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{opp.company}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(opp.value)} • {opp.probability}% probability
                            </p>
                            <p className="text-xs text-muted-foreground">Next action: {opp.nextAction} on {opp.nextActionDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Button variant="secondary" size="sm" onClick={() => handleGenerateFollowup(opp)}>
                            <Zap className="h-4 w-4 mr-2" />
                            Generate Follow-up
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleGetTalkingPoints(opp)}>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Get Talking Points
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Pipeline</CardTitle>
                <CardDescription>
                  All active opportunities by stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Pipeline details would go here */}
                <div className="text-center py-12 text-muted-foreground">
                  Pipeline visualization and detailed stage breakdowns would be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Team Performance</CardTitle>
                <CardDescription>
                  Individual performance metrics and quota attainment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Team details would go here */}
                <div className="text-center py-12 text-muted-foreground">
                  Detailed team performance metrics, activities, and comparisons would be displayed here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Recent Deals</CardTitle>
                    <CardDescription>
                      Recently closed and pending deals
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search deals..."
                      className="pl-8 w-full md:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredDeals.length > 0 ? (
                    filteredDeals.map(deal => (
                      <div key={deal.id} className="flex items-center justify-between p-4 rounded-md hover:bg-muted/50">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">{deal.company}</div>
                            <div className="text-xs text-muted-foreground">
                              {deal.product} • {deal.closedDate || 'Pending'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(deal.value)}</div>
                            <div className="text-xs">
                              {deal.status === 'won' ? (
                                <span className="text-success flex items-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Won
                                </span>
                              ) : deal.status === 'lost' ? (
                                <span className="text-destructive flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Lost
                                </span>
                              ) : (
                                <span className="text-amber-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={deal.rep.avatar} alt={deal.rep.name} />
                            <AvatarFallback>{deal.rep.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No deals found matching your search.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Deals
                </Button>
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SalesPerformancePage; 