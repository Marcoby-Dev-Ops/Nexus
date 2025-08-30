import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Phone, 
  Mail, 
  Calendar,
  Plus,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { salesService, type SalesLead, type SalesPipeline, type SalesRevenue, type SalesPerformance } from '@/services/departments';

// Using imported types from the service

interface SalesMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  activeLeads: number;
  conversionRate: number;
  averageDealSize: number;
  salesCycleDays: number;
}

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeLeads: 0,
    conversionRate: 0,
    averageDealSize: 0,
    salesCycleDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Load data from the sales service
      const [leadsResult, metricsResult, pipelineResult, revenueResult, performanceResult] = await Promise.all([
        salesService.list(),
        salesService.getMetricsSummary(),
        salesService.getPipelineData(),
        salesService.getRevenueData(),
        salesService.getPerformanceData()
      ]);

      if (leadsResult.success && leadsResult.data) {
        setLeads(leadsResult.data);
      }

      if (metricsResult.success && metricsResult.data) {
        const summary = metricsResult.data;
        setMetrics({
          totalRevenue: summary.monthly_revenue * 12, // Annualize monthly revenue
          monthlyGrowth: 12.5, // TODO: Calculate from revenue data
          activeLeads: summary.total_leads,
          conversionRate: summary.conversion_rate,
          averageDealSize: summary.avg_deal_size,
          salesCycleDays: 28 // TODO: Calculate from pipeline data
        });
      }

      // Store additional data for future use
      if (pipelineResult.success && pipelineResult.data) {
        // TODO: Use pipeline data for visualization
      }

      if (revenueResult.success && revenueResult.data) {
        // TODO: Use revenue data for charts
      }

      if (performanceResult.success && performanceResult.data) {
        // TODO: Use performance data for team metrics
      }

    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your sales pipeline and track performance</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{metrics.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeLeads}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.salesCycleDays} day sales cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Pipeline */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>Track your leads through the sales process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
            {['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed', 'Lost'].map((stage, index) => {
              const stageLeads = leads.filter(lead => {
                const stageMap = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost'];
                return lead.status === stageMap[index];
              });
              const totalValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
              
              return (
                <div key={stage} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stageLeads.length}</div>
                  <div className="text-sm text-gray-600">{stage}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(totalValue)}</div>
                </div>
              );
            })}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Management */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>Manage and track your sales leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.company}</p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Next: {lead.nextFollowUp}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(lead.value)}</div>
                  <div className="text-sm text-gray-500">Assigned: {lead.assignedTo}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPage;
