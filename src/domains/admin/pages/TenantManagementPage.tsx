import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from "@/core/supabase";
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table';
import Modal from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Building, Users, Calendar, Mail, Phone, Globe, Edit, Trash2, Plus, CreditCard, BarChart3, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
interface Tenant {
  id: string;
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'suspended' | 'pending';
  createdat: string;
  updatedat: string;
  user_count?: number;
  subscription_tier?: string;
  // Billing & Licensing
  billing_status?: 'active' | 'past_due' | 'cancelled' | 'trial';
  subscription_plan?: 'free' | 'pro' | 'enterprise' | 'custom';
  monthly_revenue?: number;
  total_revenue?: number;
  next_billing_date?: string;
  contract_end_date?: string;
  license_count?: number;
  license_usage?: number;
  // Usage Metrics
  monthly_messages?: number;
  monthly_messages_limit?: number;
  storage_used_gb?: number;
  storage_limit_gb?: number;
  // Contact & Sales
  account_manager?: string;
  sales_rep?: string;
  contract_value?: number;
  renewal_date?: string;
}

export const TenantManagementPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBilling, setFilterBilling] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'analytics'>('list');
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState<Tenant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Form state for creating/editing tenants
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    size: '',
    status: 'active' as 'active' | 'suspended' | 'pending',
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch companies (tenants) from the database
      

      if (companiesError) {
        throw companiesError;
      }

      // Transform the data to match our Tenant interface with enhanced billing/licensing data
      const transformedTenants: Tenant[] = (companies || []).map((company: any) => ({
        id: company.id,
        name: company.name || 'Unnamed Company',
        domain: company.domain,
        email: company.email,
        phone: company.phone,
        website: company.website,
        industry: company.industry,
        size: company.size,
        status: company.status || 'active',
        createdat: company.created_at,
        updatedat: company.updated_at,
        usercount: company.user_profiles?.[0]?.count || 0,
        subscriptiontier: company.subscription_tier || 'free',
        // Enhanced billing & licensing data (mock data for now)
        billingstatus: company.billing_status || 'active',
        subscriptionplan: company.subscription_plan || 'free',
        monthlyrevenue: company.monthly_revenue || 0,
        totalrevenue: company.total_revenue || 0,
        nextbilling_date: company.next_billing_date || null,
        contractend_date: company.contract_end_date || null,
        licensecount: company.license_count || 0,
        licenseusage: company.license_usage || 0,
        monthlymessages: company.monthly_messages || 0,
        monthlymessages_limit: company.monthly_messages_limit || 1000,
        storageused_gb: company.storage_used_gb || 0,
        storagelimit_gb: company.storage_limit_gb || 10,
        accountmanager: company.account_manager || null,
        salesrep: company.sales_rep || null,
        contractvalue: company.contract_value || 0,
        renewaldate: company.renewal_date || null,
      }));

      setTenants(transformedTenants);
    } catch (e: any) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching tenants: ', e);
      setError(e.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      website: tenant.website || '',
      industry: tenant.industry || '',
      size: tenant.size || '',
      status: tenant.status,
    });
    setIsModalOpen(true);
  };

  const handleCreateTenant = () => {
    setFormData({
      name: '',
      domain: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      size: '',
      status: 'active',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveTenant = async () => {
    if (!formData.name.trim()) {
      setUpdateError('Company name is required');
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      if (selectedTenant) {
        // Update existing tenant
        const { data, error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            domain: formData.domain || null,
            email: formData.email || null,
            phone: formData.phone || null,
            website: formData.website || null,
            industry: formData.industry || null,
            size: formData.size || null,
            status: formData.status,
            updatedat: new Date().toISOString(),
          })
          .eq('id', selectedTenant.id)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setTenants(tenants.map(t => t.id === selectedTenant.id ? { ...t, ...data } : t));
        setIsModalOpen(false);
      } else {
        // Create new tenant
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            domain: formData.domain || null,
            email: formData.email || null,
            phone: formData.phone || null,
            website: formData.website || null,
            industry: formData.industry || null,
            size: formData.size || null,
            status: formData.status,
          })
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        setTenants([{ ...data, usercount: 0, subscriptiontier: 'free' }, ...tenants]);
        setIsCreateModalOpen(false);
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error saving tenant: ', e);
      setUpdateError(e.message || 'Failed to save tenant');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      // Remove from local state
      setTenants(tenants.filter(t => t.id !== tenantId));
      setIsModalOpen(false);
    } catch (e: any) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error deleting tenant: ', e);
      setUpdateError(e.message || 'Failed to delete tenant');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      suspended: 'destructive',
      pending: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getBillingStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pastdue: 'destructive',
      cancelled: 'outline',
      trial: 'outline',
    } as const;

    const colors = {
      active: 'text-green-600',
      pastdue: 'text-red-600',
      cancelled: 'text-gray-600',
      trial: 'text-blue-600',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        <div className={`flex items-center space-x-1 ${colors[status as keyof typeof colors] || ''}`}>
          {status === 'active' && <CheckCircle className="w-3 h-3" />}
          {status === 'past_due' && <AlertCircle className="w-3 h-3" />}
          {status === 'trial' && <Clock className="w-3 h-3" />}
          <span>{status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</span>
        </div>
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      free: 'outline',
      pro: 'default',
      enterprise: 'default',
      custom: 'outline',
    } as const;

    const colors = {
      free: 'text-gray-600',
      pro: 'text-blue-600',
      enterprise: 'text-purple-600',
      custom: 'text-orange-600',
    } as const;

    return (
      <Badge variant={variants[plan as keyof typeof variants] || 'outline'}>
        <span className={colors[plan as keyof typeof colors] || ''}>
          {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    const matchesBilling = filterBilling === 'all' || tenant.billing_status === filterBilling;
    const matchesPlan = filterPlan === 'all' || tenant.subscription_plan === filterPlan;
    return matchesSearch && matchesStatus && matchesBilling && matchesPlan;
  });

  const renderTenantTable = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <Skeleton className="h-6 w-[80px]" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={fetchTenants} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (filteredTenants.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' 
                ? 'No tenants match your search criteria' 
                : 'No tenants found'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
              <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan & Billing</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {filteredTenants.map(tenant => (
            <TableRow key={tenant.id} className="cursor-pointer hover: bg-muted/50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{tenant.name}</div>
                    {tenant.domain && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        {tenant.domain}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {tenant.email && (
                    <div className="text-sm flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {tenant.email}
                    </div>
                  )}
                  {tenant.phone && (
                    <div className="text-sm flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {tenant.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getPlanBadge(tenant.subscription_plan || 'free')}
                    {getBillingStatusBadge(tenant.billing_status || 'active')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {tenant.user_count || 0} users
                    </div>
                    {tenant.next_billing_date && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Next: {new Date(tenant.next_billing_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-green-600">
                    {formatCurrency(tenant.monthly_revenue || 0)}/mo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: {formatCurrency(tenant.total_revenue || 0)}
                  </div>
                  {tenant.contract_value && tenant.contract_value > 0 && (
                    <div className="text-xs text-blue-600">
                      Contract: {formatCurrency(tenant.contract_value)}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>Messages</span>
                      <span className={getUsageColor(getUsagePercentage(tenant.monthly_messages || 0, tenant.monthly_messages_limit || 1000))}>
                        {tenant.monthly_messages || 0}/{tenant.monthly_messages_limit || 1000}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          getUsagePercentage(tenant.monthly_messages || 0, tenant.monthly_messages_limit || 1000) >= 90 
                            ? 'bg-red-600' 
                            : getUsagePercentage(tenant.monthly_messages || 0, tenant.monthly_messages_limit || 1000) >= 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${getUsagePercentage(tenant.monthly_messages || 0, tenant.monthly_messages_limit || 1000)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>Storage</span>
                      <span className={getUsageColor(getUsagePercentage(tenant.storage_used_gb || 0, tenant.storage_limit_gb || 10))}>
                        {tenant.storage_used_gb || 0}GB/{tenant.storage_limit_gb || 10}GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          getUsagePercentage(tenant.storage_used_gb || 0, tenant.storage_limit_gb || 10) >= 90 
                            ? 'bg-red-600' 
                            : getUsagePercentage(tenant.storage_used_gb || 0, tenant.storage_limit_gb || 10) >= 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${getUsagePercentage(tenant.storage_used_gb || 0, tenant.storage_limit_gb || 10)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(tenant.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTenantForDetails(tenant);
                      setIsDetailsModalOpen(true);
                    }}
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTenantSelect(tenant);
                    }}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTenant(tenant.id);
                    }}
                    className="text-destructive hover: text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <PageLayout title="Tenant Management">
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{tenants.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Tenants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold">
                  {tenants.filter(t => t.status === 'active').length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Active Tenants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-warning" />
                <span className="text-2xl font-bold">
                  {tenants.reduce((sum, t) => sum + (t.user_count || 0), 0)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold">
                  {tenants.filter(t => t.status === 'suspended').length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Suspended</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tenants</CardTitle>
                <CardDescription>Manage all tenant organizations in the system</CardDescription>
              </div>
              <Button onClick={handleCreateTenant} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                Add Tenant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm: flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
                <select
                  value={filterBilling}
                  onChange={(e) => setFilterBilling(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="all">All Billing</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="trial">Trial</option>
                </select>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            {renderTenantTable()}
          </CardContent>
        </Card>
      </div>

      {/* Edit Tenant Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Tenant">
        {selectedTenant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https: //example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="size">Company Size</Label>
                <select
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            {updateError && <p className="text-destructive">{updateError}</p>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTenant} disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Tenant Modal */}
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Tenant">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-name">Company Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-domain">Domain</Label>
              <Input
                id="create-domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="create-website">Website</Label>
            <Input
              id="create-website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https: //example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="create-industry">Industry</Label>
              <Input
                id="create-industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-size">Company Size</Label>
              <select
                id="create-size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>
          {updateError && <p className="text-destructive">{updateError}</p>}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTenant} disabled={updating}>
              {updating ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tenant Details Modal */}
      <Modal open={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Tenant Details">
        {selectedTenantForDetails && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Domain</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.domain || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Industry</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.industry || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company Size</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.size || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.website || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedTenantForDetails.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Billing & Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  Billing & Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Subscription Plan</Label>
                  <div className="mt-1">{getPlanBadge(selectedTenantForDetails.subscription_plan || 'free')}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Billing Status</Label>
                  <div className="mt-1">{getBillingStatusBadge(selectedTenantForDetails.billing_status || 'active')}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monthly Revenue</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedTenantForDetails.monthly_revenue || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Revenue</Label>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(selectedTenantForDetails.total_revenue || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Next Billing Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenantForDetails.next_billing_date 
                      ? new Date(selectedTenantForDetails.next_billing_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contract End Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenantForDetails.contract_end_date 
                      ? new Date(selectedTenantForDetails.contract_end_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
                {selectedTenantForDetails.contract_value && selectedTenantForDetails.contract_value > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Contract Value</Label>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(selectedTenantForDetails.contract_value)}
                    </p>
                  </div>
                )}
                {selectedTenantForDetails.renewal_date && (
                  <div>
                    <Label className="text-sm font-medium">Renewal Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTenantForDetails.renewal_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage & Licensing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  Usage & Licensing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">User Licenses</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedTenantForDetails.license_usage || 0} / {selectedTenantForDetails.license_count || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${getUsagePercentage(selectedTenantForDetails.license_usage || 0, selectedTenantForDetails.license_count || 1)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Monthly Messages</Label>
                    <span className={`text-sm ${getUsageColor(getUsagePercentage(selectedTenantForDetails.monthly_messages || 0, selectedTenantForDetails.monthly_messages_limit || 1000))}`}>
                      {selectedTenantForDetails.monthly_messages || 0} / {selectedTenantForDetails.monthly_messages_limit || 1000}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(selectedTenantForDetails.monthly_messages || 0, selectedTenantForDetails.monthly_messages_limit || 1000) >= 90 
                          ? 'bg-red-600' 
                          : getUsagePercentage(selectedTenantForDetails.monthly_messages || 0, selectedTenantForDetails.monthly_messages_limit || 1000) >= 75 
                          ? 'bg-yellow-500' 
                          : 'bg-green-600'
                      }`}
                      style={{ 
                        width: `${getUsagePercentage(selectedTenantForDetails.monthly_messages || 0, selectedTenantForDetails.monthly_messages_limit || 1000)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Storage Usage</Label>
                    <span className={`text-sm ${getUsageColor(getUsagePercentage(selectedTenantForDetails.storage_used_gb || 0, selectedTenantForDetails.storage_limit_gb || 10))}`}>
                      {selectedTenantForDetails.storage_used_gb || 0}GB / {selectedTenantForDetails.storage_limit_gb || 10}GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(selectedTenantForDetails.storage_used_gb || 0, selectedTenantForDetails.storage_limit_gb || 10) >= 90 
                          ? 'bg-red-600' 
                          : getUsagePercentage(selectedTenantForDetails.storage_used_gb || 0, selectedTenantForDetails.storage_limit_gb || 10) >= 75 
                          ? 'bg-yellow-500' 
                          : 'bg-green-600'
                      }`}
                      style={{ 
                        width: `${getUsagePercentage(selectedTenantForDetails.storage_used_gb || 0, selectedTenantForDetails.storage_limit_gb || 10)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  Account Management
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Account Manager</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.account_manager || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sales Representative</Label>
                  <p className="text-sm text-muted-foreground">{selectedTenantForDetails.sales_rep || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Active Users</Label>
                  <p className="text-lg font-semibold">{selectedTenantForDetails.user_count || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTenantForDetails.status)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsDetailsModalOpen(false);
                handleTenantSelect(selectedTenantForDetails);
              }}>
                Edit Tenant
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}; 