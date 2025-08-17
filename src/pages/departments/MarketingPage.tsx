import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Mail, 
  MessageSquare, 
  Share2,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { marketingService, type MarketingCampaign, type MarketingLead, type MarketingAnalytics, type MarketingPerformance } from '@/services/departments';

// Using types from the service instead of local interfaces
interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

const MarketingPage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [metrics, setMetrics] = useState<MarketingAnalytics>({
    total_leads: 0,
    conversion_rate: 0,
    cost_per_lead: 0,
    total_revenue: 0,
    active_campaigns: 0,
    email_open_rate: 0,
    social_engagement: 0,
    website_traffic: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      // Load data from the marketing service
      const [campaignsResult, leadsResult, analyticsResult, performanceResult] = await Promise.all([
        marketingService.list(),
        marketingService.getLeadsData(),
        marketingService.getAnalyticsData(),
        marketingService.getPerformanceData()
      ]);

      if (campaignsResult.success && campaignsResult.data) {
        setCampaigns(campaignsResult.data);
      }

      if (leadsResult.success && leadsResult.data) {
        setLeads(leadsResult.data);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setMetrics(analyticsResult.data);
      }

      // Store additional data for future use
      if (performanceResult.success && performanceResult.data) {
        // TODO: Use performance data for detailed analytics
      }

    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'content': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-orange-100 text-orange-800';
      case 'event': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
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
          <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
          <p className="text-gray-600 mt-2">Track campaigns, leads, and marketing performance</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.total_leads)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.conversion_rate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Lead</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.cost_per_lead)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.total_revenue)} total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_campaigns}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.email_open_rate}% email open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Website Traffic</CardTitle>
            <Eye className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.website_traffic)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.social_engagement}% social engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Monitor your marketing campaigns and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                      <Badge className={getTypeColor(campaign.type)}>
                        {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{campaign.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Target: {campaign.targetAudience}</span>
                      <span>Budget: {formatCurrency(campaign.budget)}</span>
                      <span>Spent: {formatCurrency(campaign.spent)}</span>
                      <span>{campaign.startDate} - {campaign.endDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {campaign.metrics.roas > 0 ? `${campaign.metrics.roas.toFixed(2)}x` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">ROAS</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(campaign.metrics.impressions)}</div>
                    <div className="text-sm text-gray-500">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(campaign.metrics.clicks)}</div>
                    <div className="text-sm text-gray-500">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(campaign.metrics.leads)}</div>
                    <div className="text-sm text-gray-500">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatCurrency(campaign.metrics.revenue)}</div>
                    <div className="text-sm text-gray-500">Revenue</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Channels:</span>
                  {campaign.channels.map((channel, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lead Management */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>Track and manage your marketing leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.map((lead) => (
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
                    <span>{lead.email}</span>
                    <span>Source: {lead.source}</span>
                    <span>Campaign: {lead.campaign}</span>
                    <span>Score: {lead.score}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Assigned: {lead.assignedTo}</div>
                  <div className="text-xs text-gray-400">Last: {lead.lastActivity}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPage;
