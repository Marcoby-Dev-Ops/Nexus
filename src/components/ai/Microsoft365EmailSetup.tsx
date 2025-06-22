import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { unifiedInboxService } from '@/lib/services/unifiedInboxService';
import { supabase } from '@/lib/supabase';

interface Microsoft365EmailSetupProps {
  onEmailAccountCreated?: () => void;
}

const Microsoft365EmailSetup: React.FC<Microsoft365EmailSetupProps> = ({
  onEmailAccountCreated
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [emailAccount, setEmailAccount] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    checkCurrentUser();
    checkExistingEmailAccount();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const checkExistingEmailAccount = async () => {
    setIsChecking(true);
    try {
      const accounts = await unifiedInboxService.getEmailAccounts();
      const outlookAccount = accounts.find(acc => acc.provider === 'outlook');
      setEmailAccount(outlookAccount || null);
    } catch (error) {
      console.error('Error checking email accounts:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const createEmailAccount = async () => {
    if (!user?.email) {
      addNotification({
        type: 'error',
        message: 'No email address found in your Microsoft account'
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User session not found. Please log in again.');
      }
      
      if (!session.provider_token) {
        throw new Error('Microsoft provider token not found in session.');
      }

      const accountData = {
        email_address: user.email,
        display_name: user.user_metadata?.full_name || user.email,
        provider: 'outlook' as const,
        sync_enabled: true,
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token ?? undefined,
        token_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
      };

      const account = await unifiedInboxService.addEmailAccount(accountData);
      setEmailAccount(account);
      
      addNotification({
        type: 'success',
        message: 'Microsoft 365 email account created successfully!'
      });

      onEmailAccountCreated?.();
      
      // Automatically start sync
      await startEmailSync(account.id);

    } catch (error) {
      console.error('Error creating email account:', error);
      addNotification({
        type: 'error',
        message: 'Failed to create email account. Please try again.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const startEmailSync = async (accountId?: string) => {
    const targetAccountId = accountId || emailAccount?.id;
    if (!targetAccountId) return;

    setIsSyncing(true);
    setSyncStatus('Starting email sync...');
    
    try {
      await unifiedInboxService.startEmailSync(targetAccountId, 'full_sync');
      setSyncStatus('Email sync initiated successfully!');
      
      addNotification({
        type: 'success',
        message: 'Email sync started! Your emails will appear in the inbox shortly.'
      });

      // Check sync status periodically
      const checkSyncStatus = async () => {
        try {
          const jobs = await unifiedInboxService.getSyncJobs(targetAccountId);
          const latestJob = jobs[0];
          
          if (latestJob) {
            setSyncStatus(`Sync status: ${latestJob.status} (${latestJob.processed_messages}/${latestJob.total_messages} messages)`);
            
            if (latestJob.status === 'completed') {
              setSyncStatus('Email sync completed successfully!');
              addNotification({
                type: 'success',
                message: `Email sync completed! Processed ${latestJob.processed_messages} messages.`
              });
              onEmailAccountCreated?.();
                         } else if (latestJob.status === 'failed') {
               setSyncStatus(`Sync failed: Unknown error`);
               addNotification({
                 type: 'error',
                 message: 'Email sync failed. Please try again.'
               });
             }
          }
        } catch (error) {
          console.error('Error checking sync status:', error);
        }
      };

      // Check status every 3 seconds for up to 30 seconds
      let checks = 0;
      const maxChecks = 10;
      const interval = setInterval(() => {
        checks++;
        checkSyncStatus();
        
        if (checks >= maxChecks) {
          clearInterval(interval);
          setSyncStatus('Sync is running in the background...');
        }
      }, 3000);

    } catch (error) {
      console.error('Error starting email sync:', error);
      setSyncStatus('Failed to start email sync');
      addNotification({
        type: 'error',
        message: 'Failed to start email sync. Please try again.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Checking Microsoft 365 email setup...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-primary" />
          <span>Microsoft 365 Email Setup</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.email && (
          <Alert>
            <Mail className="w-4 h-4" />
            <AlertDescription>
              Connected Microsoft Account: <strong>{user.email}</strong>
            </AlertDescription>
          </Alert>
        )}

        {!emailAccount ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Your Microsoft 365 connection is active, but no email account has been set up yet. 
                Click below to create your email account and start syncing emails.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={createEmailAccount}
              disabled={isCreating || !user?.email}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Email Account...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Set Up Microsoft 365 Email
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Email account is set up: <strong>{emailAccount.email_address}</strong>
                <br />
                <Badge variant={emailAccount.sync_status === 'success' ? 'default' : 'secondary'} className="mt-2">
                  Status: {emailAccount.sync_status}
                </Badge>
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button 
                onClick={() => startEmailSync()}
                disabled={isSyncing}
                variant="outline"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Emails Now
                  </>
                )}
              </Button>

              <Button 
                onClick={checkExistingEmailAccount}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>

            {syncStatus && (
              <Alert>
                <AlertDescription>{syncStatus}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>This will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Create an email account linked to your Microsoft 365</li>
            <li>Start syncing your recent emails to the unified inbox</li>
            <li>Enable real-time email notifications and AI processing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default Microsoft365EmailSetup; 