import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  PieChart, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Activity,
  Lightbulb,
  Zap,
  Brain
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Separator } from '../../../components/ui/Separator';
import { Progress } from '../../../components/ui/Progress';
import { useSystemContext } from '../../../contexts/SystemContext';
import { useAuth } from '../../../contexts/AuthContext';
import { API_CONFIG } from '../../../lib/constants';
import { Skeleton } from '../../../components/ui/Skeleton';

interface FinancialStat {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon?: React.ReactNode;
}

/**
 * FinancialOperationsPage - Interactive financial dashboard for finance department
 */
const FinancialOperationsPage: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');
  const [selectedReport, setSelectedReport] = useState<string>('expenses');
  const [financialStats, setFinancialStats] = useState<FinancialStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!session) {
        setLoading(false);
        setError('Authentication is required to get financial stats.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/get_finance_performance`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch financial stats');
        }

        const data = await res.json();
        setFinancialStats(data.stats || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  // Expense categories
  const expenseCategories = [
    { 
      id: 'salaries',
      name: 'Salaries & Benefits',
      amount: 21580.45,
      percentage: 50.1,
      color: 'bg-primary'
    },
    { 
      id: 'software',
      name: 'Software & Services',
      amount: 8320.12,
      percentage: 19.3,
      color: 'bg-secondary'
    },
    { 
      id: 'marketing',
      name: 'Marketing & Ads',
      amount: 6128.76,
      percentage: 14.2,
      color: 'bg-pink-500'
    },
    { 
      id: 'office',
      name: 'Office & Facilities',
      amount: 4252.18,
      percentage: 9.8,
      color: 'bg-warning'
    },
    { 
      id: 'travel',
      name: 'Travel & Entertainment',
      amount: 2847.43,
      percentage: 6.6,
      color: 'bg-success'
    }
  ];

  // Recent transactions
  const recentTransactions = [
    {
      id: 'tx1',
      description: 'AWS Cloud Services',
      category: 'Software & Services',
      amount: 2450.00,
      date: '2023-06-15',
      status: 'completed'
    },
    {
      id: 'tx2',
      description: 'Q2 Marketing Campaign',
      category: 'Marketing & Ads',
      amount: 4750.00,
      date: '2023-06-12',
      status: 'completed'
    },
    {
      id: 'tx3',
      description: 'Office Lease Payment',
      category: 'Office & Facilities',
      amount: 3200.00,
      date: '2023-06-10',
      status: 'completed'
    },
    {
      id: 'tx4',
      description: 'Team Retreat',
      category: 'Travel & Entertainment',
      amount: 1850.00,
      date: '2023-06-08',
      status: 'pending'
    },
    {
      id: 'tx5',
      description: 'New Equipment Purchase',
      category: 'Office & Facilities',
      amount: 978.50,
      date: '2023-06-05',
      status: 'completed'
    }
  ];

  // Financial reports
  const financialReports = [
    {
      id: 'report1',
      name: 'Income Statement',
      period: 'May 2023',
      updatedAt: '2023-06-05',
      status: 'finalized'
    },
    {
      id: 'report2',
      name: 'Balance Sheet',
      period: 'May 2023',
      updatedAt: '2023-06-05',
      status: 'finalized'
    },
    {
      id: 'report3',
      name: 'Cash Flow Statement',
      period: 'May 2023',
      updatedAt: '2023-06-07',
      status: 'finalized'
    },
    {
      id: 'report4',
      name: 'Q2 Tax Estimate',
      period: 'Apr-Jun 2023',
      updatedAt: '2023-06-10',
      status: 'draft'
    },
    {
      id: 'report5',
      name: 'Revenue Forecast',
      period: 'Jun-Dec 2023',
      updatedAt: '2023-06-12',
      status: 'draft'
    }
  ];

  // Budget vs. Actual data
  const budgetData = [
    { category: 'Salaries', budgeted: 22000, actual: 21580.45 },
    { category: 'Software', budgeted: 8000, actual: 8320.12 },
    { category: 'Marketing', budgeted: 5000, actual: 6128.76 },
    { category: 'Office', budgeted: 4500, actual: 4252.18 },
    { category: 'Travel', budgeted: 3000, actual: 2847.43 }
  ];

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

  const SystemFinanceCards: React.FC = () => {
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
              <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/finance/operations'}>
                View Financial Operations
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/finance/reports'}>
                View Reports
              </Button>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => window.location.href = '/ai-hub'}>
                Ask AI for Finance Insight
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFinancialStats = () => {
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
          <p>Could not load financial stats: {error}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map(stat => (
          <Card key={stat.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <SystemFinanceCards />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Financial Operations</h1>
            <p className="text-muted-foreground">Track, analyze, and optimize your company's finances</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={activeTimeframe} onValueChange={setActiveTimeframe}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {renderFinancialStats()}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            {/* Overview content */}
          </TabsContent>
          <TabsContent value="expenses">
            {/* Expenses content */}
          </TabsContent>
          <TabsContent value="reports">
            {/* Reports content */}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Expense Breakdown */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                Expense Breakdown
              </CardTitle>
              <CardDescription>
                Where your money is going this {activeTimeframe}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenseCategories.map(category => (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={category.percentage} className={`h-2 ${category.color}`} />
                    <span className="text-xs font-medium">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setSelectedReport('expenses')}>
                View Detailed Expense Report
              </Button>
            </CardFooter>
          </Card>

          {/* Middle Column - Budget vs. Actual */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                Budget vs. Actual
              </CardTitle>
              <CardDescription>
                How spending compares to your budget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetData.map((item, index) => {
                const percentage = (item.actual / item.budgeted) * 100;
                const isOverBudget = item.actual > item.budgeted;
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">{item.category}</div>
                      <div className="text-sm flex items-center">
                        {isOverBudget ? (
                          <Badge variant="destructive" className="text-xs mr-2">Over</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs mr-2">Under</Badge>
                        )}
                        <span>
                          ${item.actual.toLocaleString('en-US', { maximumFractionDigits: 0 })} / 
                          ${item.budgeted.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={`h-2 ${isOverBudget ? 'bg-destructive' : 'bg-success'}`} 
                    />
                  </div>
                );
              })}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Adjust Budget Allocations
              </Button>
            </CardFooter>
          </Card>

          {/* Right Column - Financial Reports */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Financial Reports
              </CardTitle>
              <CardDescription>
                Access and download financial statements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {financialReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div>
                      <div className="font-medium text-sm">{report.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span className="mr-2">{report.period}</span>
                        <span>·</span>
                        <span className="mx-2">Updated {report.updatedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.status === 'finalized' ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Final
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Generate New Report
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <CardDescription>
              Latest financial transactions across all accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <span>{transaction.category}</span>
                        <span className="mx-2">·</span>
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs">
                        {transaction.status === 'completed' ? (
                          <span className="text-success flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="text-amber-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter Transactions
            </Button>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Record Transaction
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default FinancialOperationsPage; 