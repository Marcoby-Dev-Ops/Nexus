import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Loader2, Mail, AlertCircle, Inbox } from 'lucide-react';
import { useIntegrationProviders } from '@/domains/integrations/features/hooks/useIntegrationProviders';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { unifiedInboxService } from '@/domains/services/unifiedInboxService';
import { useSubscription } from '@/domains/admin/user/features/hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import { useUnifiedInbox } from '@/domains/hooks/useUnifiedInbox';
import type { InboxItem, InboxFilters } from '@/domains/services/unifiedInboxService';

const UnifiedInbox: React.FC = () => {
  const providers = useIntegrationProviders();
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{ id: string; provider: string; email: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<Array<{ id: string; provider: string; email: string; displayName?: string }>>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [filters, setFilters] = useState<InboxFilters>({});
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { hasAIFeatures, plan, isLoading: isSubLoading } = useSubscription();

  // Discover real Microsoft 365 accounts on mount
  React.useEffect(() => {
    const discover = async () => {
      setIsDiscovering(true);
      try {
        const discovered = await unifiedInboxService.discoverActivatableIntegrations();
        setDiscoveredAccounts(discovered.map(acc => ({
          id: acc.integrationId,
          provider: acc.provider === 'outlook' ? 'microsoft' : acc.provider,
          email: acc.email,
          displayName: acc.displayName,
        })));
      } catch (err) {
        // Optionally handle error
      } finally {
        setIsDiscovering(false);
      }
    };
    discover();
  }, []);

  // Use the new unified inbox hook
  const { items: emails, total, isLoading, isError, error, refetch } = useUnifiedInbox({ filters, limit, offset });

  const handleConnectProvider = (provider: string) => {
    if (provider === 'google') providers.google.connect();
    // Add logic for Microsoft/IMAP connect flows here
    if (provider === 'microsoft') {
      setConnectedAccounts((prev) => [...prev, { id: '2', provider: 'microsoft', email: 'user@outlook.com' }]);
    }
    if (provider === 'imap') {
      setConnectedAccounts((prev) => [...prev, { id: '3', provider: 'imap', email: 'user@customdomain.com' }]);
    }
  };

  const handleAddDiscoveredAccount = (account: { id: string; provider: string; email: string }) => {
    setConnectedAccounts((prev) => [...prev, account]);
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setFilters((prev) => ({ ...prev, account_id: id }));
    setOffset(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setOffset(0);
  };

  const handleNextPage = () => {
    if (offset + limit < total) setOffset(offset + limit);
  };
  const handlePrevPage = () => {
    if (offset - limit >= 0) setOffset(offset - limit);
  };

  const renderContent = () => {
    if (providers.isLoading) {
      return <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!providers.google.isConnected && !providers.microsoft?.isConnected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
          <Inbox className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Connect Your Email</h3>
          <p className="text-sm text-muted-foreground">Connect your email provider to see your latest emails and manage your inbox.</p>
          <div className="flex gap-4">
            <Button onClick={() => handleConnectProvider('microsoft')}>Connect Microsoft</Button>
            <Button onClick={() => handleConnectProvider('google')}>Connect Google</Button>
          </div>
          {/* Show discovered accounts for demo */}
          <div className="w-full mt-6 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Discovered Accounts:</h4>
            {discoveredAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-sm">{account.email} ({account.provider})</span>
                <Button size="sm" onClick={() => handleAddDiscoveredAccount(account)}>Add</Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isLoading) {
      return <div className="flex justify-center items-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (isError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading emails. Please try again.</AlertDescription>
        </Alert>
      );
    }

    if (!emails || emails.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Mail className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">All Caught Up!</h3>
          <p className="text-sm text-muted-foreground">You have no new emails in your inbox.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            placeholder="Search emails..."
            className="input input-bordered w-full max-w-xs"
            onChange={handleSearch}
            aria-label="Search emails"
          />
          {/* Account filter dropdown (optional) */}
          {connectedAccounts.length > 0 && (
            <select
              value={selectedAccountId || ''}
              onChange={e => handleSelectAccount(e.target.value)}
              className="input input-bordered max-w-xs"
              aria-label="Filter by account"
            >
              <option value="">All Accounts</option>
              {connectedAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.email} ({acc.provider})</option>
              ))}
            </select>
          )}
        </div>
        <ul className="divide-y divide-border rounded-lg border bg-background">
          {emails.map((email: InboxItem) => (
            <li key={email.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{email.sender_name?.[0] || email.sender_email?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{email.title || email.subject || '(No subject)'}</div>
                  <div className="text-xs text-muted-foreground truncate">{email.sender_name || email.sender_email}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{email.preview || email.body_preview || ''}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{email.item_timestamp ? new Date(email.item_timestamp).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-2">
          <Button onClick={handlePrevPage} disabled={offset === 0}>Previous</Button>
          <span className="text-xs text-muted-foreground">Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit) || 1}</span>
          <Button onClick={handleNextPage} disabled={offset + limit >= total}>Next</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-3xl mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-4">Unified Inbox</h1>
      <p className="text-muted-foreground mb-2">All your emails in one place. Search, filter, and manage your inbox across providers.</p>
      {renderContent()}
    </div>
  );
};

export default UnifiedInbox; 