import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface EmailSyncTesterProps {
  onSyncComplete?: () => void;
}

const EmailSyncTester: React.FC<EmailSyncTesterProps> = ({ onSyncComplete }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'missing' | 'expired'>('unknown');
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkTokenStatus = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check for stored Microsoft Graph tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('ai_integrations_oauth')
        .select('access_token, refresh_token, expires_at, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'microsoft_graph')
        .single();

      if (tokenError || !tokenData) {
        setTokenStatus('missing');
      } else if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
        setTokenStatus('expired');
      } else {
        setTokenStatus('valid');
      }

      // Check for email accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('ai_email_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (!accountsError) {
        setEmailAccounts(accounts || []);
      }

    } catch (err) {
      console.error('Token check failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to check token status');
    } finally {
      setIsChecking(false);
    }
  };

  const triggerEmailSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find Outlook email account
      const outlookAccount = emailAccounts.find(acc => acc.provider === 'outlook');
      if (!outlookAccount) {
        throw new Error('No Outlook email account found. Please set up email integration first.');
      }

      // Call the email sync edge function
      const { data, error } = await supabase.functions.invoke('ai_email_sync', {
        body: {
          account_id: outlookAccount.id,
          job_type: 'incremental_sync',
          sync_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        }
      });

      if (error) {
        throw new Error(error.message || 'Email sync failed');
      }

      setSyncResult(data);
      onSyncComplete?.();

    } catch (err) {
      console.error('Email sync failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync emails');
    } finally {
      setIsSyncing(false);
    }
  };

  const getTokenStatusBadge = () => {
    switch (tokenStatus) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'missing':
        return <Badge variant="outline">Missing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Email Sync Tester</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Token Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Microsoft Graph Token:</span>
            {getTokenStatusBadge()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkTokenStatus}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Email Accounts */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Email Accounts:</h4>
          {emailAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No email accounts configured</p>
          ) : (
            emailAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <span className="text-sm font-medium">{account.email_address}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {account.provider}
                  </Badge>
                </div>
                <Badge variant={account.is_active ? 'default' : 'secondary'}>
                  {account.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))
          )}
        </div>

        {/* Sync Result */}
        {syncResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription className="text-green-800">
              <strong>Sync Complete!</strong><br />
              Total: {syncResult.total_messages} | 
              Processed: {syncResult.processed_messages} | 
              Errors: {syncResult.error_count}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={triggerEmailSync}
            disabled={isSyncing || tokenStatus !== 'valid' || emailAccounts.length === 0}
            className="flex-1"
          >
            {isSyncing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Syncing Emails...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Test Email Sync
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          This will test the Microsoft Graph email sync functionality using your stored tokens.
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailSyncTester; 