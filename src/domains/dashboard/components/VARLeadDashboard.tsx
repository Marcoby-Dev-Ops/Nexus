import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useToast } from '@/shared/ui/components/Toast';
import { useAuth } from '@/core/auth/AuthProvider';
import { useIntegrations } from '@/domains/hooks/useIntegrations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Search, Download, Mail, Phone, Users, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
interface VARLead {
  id: string;
  email: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  score: number;
  source: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contact: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    properties: any;
  };
}

const COLORS = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#10b981',
  proposal: '#f59e0b',
  negotiation: '#ef4444',
  closed: '#22c55e',
  lost: '#6b7280'
};

const STATUS_LABELS = {
  new: 'New Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal Sent',
  negotiation: 'In Negotiation',
  closed: 'Closed Won',
  lost: 'Closed Lost'
};

export const VARLeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<VARLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<VARLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<VARLead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, scoreFilter]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/var-leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load VAR leads',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.email.toLowerCase().includes(searchLower) ||
        lead.company.toLowerCase().includes(searchLower) ||
        lead.contact.firstName?.toLowerCase().includes(searchLower) ||
        lead.contact.lastName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply score filter
    if (scoreFilter !== 'all') {
      const scoreThreshold = parseFloat(scoreFilter);
      filtered = filtered.filter(lead => lead.score >= scoreThreshold);
    }

    setFilteredLeads(filtered);
  };

  const updateLeadStatus = async (leadId: string, newStatus: VARLead['status']) => {
    try {
      const response = await fetch(`/api/var-leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update lead status');

      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      toast({
        title: 'Success',
        description: 'Lead status updated successfully',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: VARLead['status']) => {
    return COLORS[status];
  };

  const getLeadStats = () => {
    const total = leads.length;
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgScore = leads.reduce((sum, lead) => sum + lead.score, 0) / total;
    const highValueLeads = leads.filter(lead => lead.score >= 0.8).length;

    return {
      total,
      byStatus,
      avgScore,
      highValueLeads
    };
  };

  const stats = getLeadStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">VAR Lead Management</h1>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Send Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all sources
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value Leads</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highValueLeads}</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 0.8
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.avgScore * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead quality score
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.byStatus['closed'] || 0) / stats.total * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Closed won deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md: flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Statuses' },
            ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
              value,
              label
            }))
          ]}
        />
        <Select
          value={scoreFilter}
          onValueChange={setScoreFilter}
          options={[
            { value: 'all', label: 'All Scores' },
            { value: '0.8', label: 'High (≥ 0.8)' },
            { value: '0.6', label: 'Medium (≥ 0.6)' },
            { value: '0.4', label: 'Low (≥ 0.4)' }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg: grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{lead.company}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.contact.firstName} {lead.contact.lastName}
                        </p>
                      </div>
                      <Badge
                        style={{ backgroundColor: getStatusColor(lead.status) }}
                      >
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {lead.email}
                      </span>
                      {lead.contact.phone && (
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {lead.contact.phone}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Lead Score</span>
                        <span className="text-sm font-medium">
                          {(lead.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${lead.score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.byStatus).map(([status, count]) => ({
                        name: STATUS_LABELS[status as VARLead['status']],
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(stats.byStatus).map(([status], index) => (
                        <Cell
                          key={status}
                          fill={COLORS[status as VARLead['status']]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(
                      leads.reduce((acc, lead) => {
                        acc[lead.source] = (acc[lead.source] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([source, count]) => ({
                      name: source,
                      value: count
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Lead Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLead(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Company</h3>
                  <p className="text-muted-foreground">{selectedLead.company}</p>
                </div>
                <div>
                  <h3 className="font-medium">Contact</h3>
                  <p className="text-muted-foreground">
                    {selectedLead.contact.firstName} {selectedLead.contact.lastName}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-muted-foreground">{selectedLead.email}</p>
                </div>
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-muted-foreground">
                    {selectedLead.contact.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Lead Status</h3>
                <div className="flex space-x-2">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <Button
                      key={status}
                      variant={selectedLead.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateLeadStatus(selectedLead.id, status as VARLead['status'])}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={4}
                  value={selectedLead.notes || ''}
                  onChange={(e) => {
                    // Handle notes update
                  }}
                  placeholder="Add notes about this lead..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 