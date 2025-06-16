import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Check, X, ExternalLink, RefreshCw, Settings } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Separator } from '../../components/ui/Separator';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ManageIntegrationModal } from '@/components/settings/ManageIntegrationModal';

// Mock integrations data
const availableIntegrations = [
  { 
    id: 'slack', 
    name: 'Slack', 
    description: 'Connect with your Slack workspace to send notifications and updates.',
    category: 'communication',
    icon: '🔵',
    popular: true
  },
  { 
    id: 'google-calendar', 
    name: 'Google Calendar', 
    description: 'Sync your calendar events and meetings.',
    category: 'productivity',
    icon: '📅',
    popular: true
  },
  { 
    id: 'github', 
    name: 'GitHub', 
    description: 'Connect your GitHub repositories for issue tracking and code management.',
    category: 'development',
    icon: '🐙',
    popular: true
  },
  { 
    id: 'dropbox', 
    name: 'Dropbox', 
    description: 'Connect your Dropbox account to access your files and documents.',
    category: 'storage',
    icon: '📦',
    popular: false
  },
  { 
    id: 'paypal', 
    name: 'PayPal', 
    description: 'Sync transactions and revenue data from PayPal.',
    category: 'payment',
    icon: '💰',
    popular: true
  },
  { 
    id: 'salesforce', 
    name: 'Salesforce', 
    description: 'Integrate with Salesforce CRM for customer data synchronization.',
    category: 'crm',
    icon: '☁️',
    popular: false
  },
  { 
    id: 'zapier', 
    name: 'Zapier', 
    description: 'Connect with thousands of apps through Zapier automations.',
    category: 'automation',
    icon: '⚡',
    popular: true
  },
  { 
    id: 'stripe', 
    name: 'Stripe', 
    description: 'Process payments and manage subscriptions with Stripe.',
    category: 'payment',
    icon: '💳',
    popular: false
  },
  { 
    id: 'google-drive', 
    name: 'Google Drive', 
    description: 'Access and manage your Google Drive files and documents.',
    category: 'storage',
    icon: '📝',
    popular: false
  },
];

type ConnectedIntegration = {
  provider: string;
  status: 'active' | 'error';
  lastSync: string | null;
};

/**
 * IntegrationsPage - Manage third-party integrations
 * 
 * Allows users to:
 * - View and manage connected integrations
 * - Add new integrations
 * - Configure integration settings
 * - Browse available integrations by category
 */
const IntegrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  const [manageProvider, setManageProvider] = useState<string | null>(null);
  
  // Fetch connected integrations for this organisation
  useEffect(() => {
    async function loadIntegrations() {
      if (!user?.company_id) return;
      const { data, error } = await (supabase as any)
        .from('ai_integrations')
        .select('provider, updated_at')
        .eq('org_id', user.company_id);
      if (!error && data) {
        setConnectedIntegrations(
          data.map((row: any) => ({
            provider: row.provider,
            status: 'active',
            lastSync: row.updated_at,
          }))
        );

        // Realtime subscription to updates
        const channel = supabase.channel('ai_integrations')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'ai_integrations', filter: `org_id=eq.${user.company_id}` },
            (payload) => {
              const row: any = payload.new ?? payload.old;
              setConnectedIntegrations((prev) => {
                const others = prev.filter((i) => i.provider !== row.provider);
                return [
                  ...others,
                  { provider: row.provider, status: 'active', lastSync: row.updated_at },
                ];
              });
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
    loadIntegrations();
  }, [user]);
  
  // Filter available integrations based on search and category
  const filteredIntegrations = availableIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || integration.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Check if an integration is already connected
  const isConnected = (id: string) => {
    return connectedIntegrations.some((integration) => integration.provider === id);
  };
  
  const handleConnectPayPal = () => {
    if (!user?.company_id) {
      alert('Missing organisation context');
      return;
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!clientId || !supabaseUrl) {
      alert('PayPal or Supabase env vars not set');
      return;
    }

    const redirectUri = `${supabaseUrl}/functions/v1/paypal_oauth_callback`;
    const scopes = encodeURIComponent('openid profile https://uri.paypal.com/services/paypalattributes');
    const state = encodeURIComponent(user.company_id);
    const base = import.meta.env.VITE_PAYPAL_ENV === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';

    const url = `${base}/signin/authorize?response_type=code&client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    window.open(url, '_blank', 'width=600,height=800');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">Connect with external services and tools</p>
      </div>
      
      <Separator />
      
      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2" />
            Connected Integrations
          </CardTitle>
          <CardDescription>Manage your connected third-party services</CardDescription>
        </CardHeader>
        <CardContent>
          {connectedIntegrations.length > 0 ? (
            <div className="space-y-4">
              {connectedIntegrations.map((integration) => (
                <div key={integration.provider} className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-md bg-card border border-border flex items-center justify-center text-xl">
                      {integration.provider.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{integration.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm mr-2">
                      <div className="flex items-center">
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : '—'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No integrations connected yet</p>
              <Button variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Browse Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Browse Integrations</CardTitle>
          <CardDescription>Discover and connect with third-party services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs 
              defaultValue="all" 
              className="w-full sm:w-auto"
              value={activeCategory}
              onValueChange={setActiveCategory}
            >
              <TabsList className="grid grid-cols-4 sm:grid-cols-7">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
                <TabsTrigger value="productivity">Productivity</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
                <TabsTrigger value="crm">CRM</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Integrations Grid */}
          {filteredIntegrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => {
                const connected = isConnected(integration.id);
                
                return (
                  <Card key={integration.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-md bg-card border border-border flex items-center justify-center text-xl">
                            {integration.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            {integration.popular && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                        {connected ? (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {integration.description}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Badge variant="outline">
                        {integration.category}
                      </Badge>
                      <Button 
                        variant={connected ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          if (connected) {
                            setManageProvider(integration.id);
                          } else if (integration.id === 'paypal') {
                            handleConnectPayPal();
                          } else {
                            // Placeholder for other integrations
                            alert('Connect flow not implemented yet');
                          }
                        }}
                      >
                        {connected ? 'Manage' : 'Connect'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No matching integrations found</p>
              <Button variant="outline" className="mt-2" onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border p-4 flex justify-center">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Integration Marketplace
          </Button>
        </CardFooter>
      </Card>

      {/* Manage Modal */}
      {user?.company_id && (
        <ManageIntegrationModal
          provider={manageProvider}
          open={!!manageProvider}
          onClose={() => setManageProvider(null)}
          orgId={user.company_id}
        />
      )}
    </div>
  );
};

export default IntegrationsPage; 