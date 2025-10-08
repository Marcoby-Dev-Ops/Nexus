/**
 * Journeys Dashboard
 * 
 * Displays and manages business journeys for guided business development and process automation in Nexus.
 * This is the core system that determines if problems, issues, updates, or new entries 
 * were properly processed and tracked.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useToast } from '@/shared/ui/components/Toast';
import { BrainTicketsService, type BrainTicket, type BrainTicketFilters } from '@/services/playbook/BrainTicketsService';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  Ticket, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Settings
} from 'lucide-react';

const BrainTicketsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const { toast } = useToast();
  const brainTicketsService = new BrainTicketsService();

  const [tickets, setTickets] = useState<BrainTicket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BrainTicketFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Load tickets and stats
  useEffect(() => {
    if (activeOrganization?.id) {
      loadTickets();
      loadStats();
    }
  }, [activeOrganization?.id, filters]);

  const loadTickets = async () => {
    if (!activeOrganization?.id) return;

    setLoading(true);
    try {
      const result = await brainTicketsService.getTickets({
        ...filters,
        organization_id: activeOrganization.id
      });

      if (result.success) {
        setTickets(result.data || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load tickets",
          type: "error"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tickets",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeOrganization?.id) return;

    try {
      const result = await brainTicketsService.getTicketStats(activeOrganization.id);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFilterChange = (key: keyof BrainTicketFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: BrainTicket['status']) => {
    try {
      const result = await brainTicketsService.updateTicket(ticketId, { status: newStatus });
      if (result.success) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        ));
        loadStats(); // Refresh stats
        toast({
          title: "Success",
          description: "Ticket status updated",
          type: "success"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update ticket",
          type: "error"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        type: "error"
      });
    }
  };

  const getPriorityColor = (priority: BrainTicket['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: BrainTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-black';
      case 'resolved': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTicketTypeIcon = (type: BrainTicket['ticket_type']) => {
    switch (type) {
      case 'problem': return <AlertTriangle className="h-4 w-4" />;
      case 'issue': return <AlertCircle className="h-4 w-4" />;
      case 'update': return <Settings className="h-4 w-4" />;
      case 'new_entry': return <Plus className="h-4 w-4" />;
      case 'improvement': return <TrendingUp className="h-4 w-4" />;
      case 'question': return <Lightbulb className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
                      <h1 className="text-3xl font-bold">Business Journeys</h1>
                      <p className="text-muted-foreground">
              Guided business development journeys and process automation
            </p>
        </div>
                  <Button onClick={loadTickets} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Journeys
          </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.ticket_type || ''}
                onValueChange={(value) => handleFilterChange('ticket_type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="problem">Problem</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="new_entry">New Entry</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority || ''}
                onValueChange={(value) => handleFilterChange('priority', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {filteredTickets.length} tickets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTicketTypeIcon(ticket.ticket_type)}
                        <h3 className="font-semibold">{ticket.title}</h3>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        {ticket.category && (
                          <Badge variant="outline">{ticket.category}</Badge>
                        )}
                      </div>
                      
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {ticket.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.source && <span>Source: {ticket.source}</span>}
                        {ticket.tags && ticket.tags.length > 0 && (
                          <div className="flex gap-1">
                            {ticket.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {ticket.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{ticket.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusUpdate(ticket.id, value as BrainTicket['status'])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrainTicketsDashboard;
