import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Check, X, ExternalLink, RefreshCw, Settings } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Separator } from '../../components/ui/Separator';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ManageIntegrationModal } from '@/components/settings/ManageIntegrationModal';
import { ContentCard } from '@/components/patterns/ContentCard';
import { useUser } from '@/lib/hooks/useUser';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { useLocation } from 'react-router-dom';

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
const IntegrationsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  const [manageProvider, setManageProvider] = useState<string | null>(null);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [settingUpCompany, setSettingUpCompany] = useState(false);
  const { integrations, isLoading, error } = useIntegrations();
  
  // Check if we're in the nested settings route
  const isNestedInSettings = location.pathname.startsWith('/settings/');
  
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
  
  const handleQuickCompanySetup = async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name.');
      return;
    }
    
    setSettingUpCompany(true);
    
    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          domain: '', // Can be filled later
          industry: 'Technology', // Default
          size: '1-10', // Default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (companyError) {
        console.error('Company creation error:', companyError);
        throw companyError;
      }
      
      // Update user profile with company_id and set as owner
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          company_id: company.id,
          role: 'owner', // Set the user as the company owner
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      
      alert('Organization created successfully! You can now connect integrations.');
      setShowQuickSetup(false);
      setCompanyName('');
      
      // Refresh the auth context to get the updated user
      window.location.reload();
      
    } catch (error) {
      console.error('Error setting up company:', error);
      alert(`Failed to set up company: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      setSettingUpCompany(false);
    }
  };

  const handleConnectHubSpot = async () => {
    if (!user?.company_id) {
      setShowQuickSetup(true);
      return;
    }
    
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please log in to connect integrations.');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: user.company_id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      } else {
        const error = await response.text();
        console.error('HubSpot connect error:', error);
        alert('Failed to initiate HubSpot connection. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting to HubSpot:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  const content = (
    <div className="space-y-8">
      {/* Quick Company Setup Modal */}
      {showQuickSetup && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Organization Setup Required</CardTitle>
            <CardDescription className="text-orange-700">
              You need to set up your organization before connecting integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                disabled={settingUpCompany}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleQuickCompanySetup} 
                disabled={settingUpCompany || !companyName.trim()}
              >
                {settingUpCompany ? 'Setting up...' : 'Create Organization'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowQuickSetup(false)}
                disabled={settingUpCompany}
              >
                Cancel
              </Button>
            </div>
            <p className="text-sm text-orange-600">
              You can complete your organization details later in the onboarding flow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Section for Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>
            Connect new applications to extend the functionality of Nexus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentCard title="HubSpot">
            <p className="text-muted-foreground mb-4">
              Connect your HubSpot account to sync contacts, companies, and deals.
            </p>
            <Button onClick={handleConnectHubSpot} variant="outline">
              Connect
            </Button>
          </ContentCard>
        </CardContent>
      </Card>

      {/* Section for Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>
            Manage your existing application connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-destructive">{error.message}</p>}
          {!isLoading && !error && integrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <ContentCard key={integration.id} title={integration.type}>
                  <p className="text-sm text-muted-foreground">Status: Active</p>
                </ContentCard>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No integrations connected yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // If we're nested in settings, just return the content (SettingsLayout is provided by parent)
  if (isNestedInSettings) {
    return content;
  }

  // If we're standalone, wrap with SettingsLayout
  return (
    <SettingsLayout
      title="Integrations"
      description="Connect and manage your third-party application integrations."
    >
      {content}
    </SettingsLayout>
  );
};

export default IntegrationsPage; 