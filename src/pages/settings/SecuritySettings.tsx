import React, { useEffect, useState } from 'react';
import { Shield, Key, Smartphone, Eye, EyeOff, AlertTriangle, LogOut, RefreshCw, Lock, Fingerprint, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Separator } from '../../components/ui/Separator';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/core/supabase';
import { useNotifications } from '../../contexts/NotificationContext';
import { Alert } from '../../components/ui/Alert';
import { toast } from 'sonner';
import { registerPasskey, handlePasskeyError, handlePasskeyRegistrationSuccess, isPasskeySupported, fetchUserPasskeys, deletePasskey } from '../../lib/utils/passkey';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/services/userService';
import { userDataService } from '@/lib/services/userDataService';
import { analyticsService } from '@/lib/services/analyticsService';

/**
 * SecuritySettings - Security and privacy settings page
 * 
 * Allows users to:
 * - Change password
 * - Enable/disable two-factor authentication
 * - View login activity
 * - Manage sessions
 * - Set privacy preferences
 */
const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [friendlyName, setFriendlyName] = useState('');
  const [showAddPasskeyDialog, setShowAddPasskeyDialog] = useState(false);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const { data: loginHistory, isLoading: isLoadingHistory } = useQuery({
      queryKey: ['loginHistory'],
      queryFn: () => userService.getLoginHistory(),
  })
  
  // Initialize analytics when user is available
  useEffect(() => {
    if (user) {
      analyticsService.init(user.id, {
        email: user.email,
        company_id: user.company?.id,
      });
    }
    return () => analyticsService.reset();
  }, [user]);
  
  // Check WebAuthn support
  const isWebAuthnSupported = isPasskeySupported();
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      analyticsService.track('password_changed');
      setMessage({ type: 'success', text: 'Password updated successfully. You will need to use the new password next time you sign in.' });
      addNotification({ message: 'Password updated successfully', type: 'success' });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      analyticsService.track('password_change_failed', { error: err instanceof Error ? err.message : 'Unknown error' });
      const errorText = err instanceof Error ? err.message : 'Failed to update password';
      setMessage({ type: 'error', text: errorText });
      addNotification({ message: errorText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle two-factor authentication
  const handleToggleTwoFactor = () => {
    const newState = !twoFactorEnabled;
    setTwoFactorEnabled(newState);
    analyticsService.track('two_factor_toggled', { enabled: newState });
    // In a real implementation, this would trigger 2FA setup flow
    console.log(`Two-factor authentication ${!newState ? 'enabled' : 'disabled'}`);
  };

  // ---------------------------------------------------------------------
  // Passkeys – fetch existing credentials
  // ---------------------------------------------------------------------
  const fetchPasskeys = async () => {
    if (!user) return;
    try {
      const data = await fetchUserPasskeys();
      setPasskeys(data);
    } catch (error) {
      console.error('[SecuritySettings] Failed to load passkeys', error);
    }
  };

  useEffect(() => {
    fetchPasskeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAddPasskey = async () => {
    try {
      if (!user) {
        toast.error('You must be signed in to register a passkey');
        return;
      }

      setIsRegisteringPasskey(true);

      // Use centralized passkey registration
      await registerPasskey({
        userId: user.id,
        friendlyName: friendlyName.trim() || undefined
      });

      analyticsService.track('passkey_registered', { friendly_name: friendlyName.trim() });
      // Success feedback and cleanup
      handlePasskeyRegistrationSuccess();
      setFriendlyName('');
      setShowAddPasskeyDialog(false);
      fetchPasskeys();
      
    } catch (err: any) {
      analyticsService.track('passkey_registration_failed', { error: err?.message });
      handlePasskeyError(err, 'registration');
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (credentialId: string) => {
    try {
      setDeletingPasskeyId(credentialId);
      
      await deletePasskey(credentialId);
      
      analyticsService.track('passkey_deleted', { credential_id: credentialId });
      toast.success('Passkey deleted successfully');
      fetchPasskeys();
    } catch (err: any) {
      analyticsService.track('passkey_deletion_failed', { credential_id: credentialId, error: err?.message });
      console.error('[SecuritySettings] Failed to delete passkey', err);
      toast.error(err?.message ?? 'Failed to delete passkey');
    } finally {
      setDeletingPasskeyId(null);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      toast.info('Preparing your data for export...');
      const userDataJson = await userDataService.exportUserData();
      
      const blob = new Blob([userDataJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-user-data-${user?.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      analyticsService.track('user_data_exported');
      toast.success('Your data has been exported successfully.');
    } catch (err) {
      analyticsService.track('user_data_export_failed', { error: err instanceof Error ? err.message : 'Unknown error' });
      toast.error('Failed to export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    try {
      setIsDeleting(true);
      toast.info('Deleting your account...');
      await userService.deleteAccount();
      analyticsService.track('account_deleted');
    } catch (err) {
      analyticsService.track('account_deletion_failed', { error: err instanceof Error ? err.message : 'Unknown error' });
      toast.error('Failed to delete your account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security & Privacy</h2>
        <p className="text-muted-foreground">Manage your account security and privacy settings</p>
      </div>
      
      <Separator />
      
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showPassword ? 'text' : 'password'} 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setShowPassword(!showPassword);
                    analyticsService.track('toggle_show_password', { on: !showPassword });
                  }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div className="text-xs space-y-1">
                <p className={newPassword.length >= 8 ? 'text-success' : 'text-muted-foreground'}>
                  • At least 8 characters
                </p>
                <p className={/[A-Z]/.test(newPassword) ? 'text-success' : 'text-muted-foreground'}>
                  • At least 1 uppercase letter
                </p>
                <p className={/[0-9]/.test(newPassword) ? 'text-success' : 'text-muted-foreground'}>
                  • At least 1 number
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type={showPassword ? 'text' : 'password'} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            
            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>
            )}

            <Button 
              type="submit" 
              isLoading={loading}
              disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Require a code from your authenticator app when signing in
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggleTwoFactor}
            />
          </div>
          
          {twoFactorEnabled && (
            <div className="p-4 bg-muted rounded-md text-sm">
              <p className="font-medium">Two-factor authentication is enabled</p>
              <p className="text-muted-foreground mt-1">
                You will be asked for a verification code when signing in from an unrecognized device.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Data & Privacy
          </CardTitle>
          <CardDescription>Manage your personal data and privacy settings.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="exportData">Export Your Data</Label>
                    <p className="text-xs text-muted-foreground">Download a JSON file containing all of your personal data.</p>
                </div>
                <Button onClick={handleExportData} isLoading={isExporting} disabled={isExporting}>
                    Export Data
                </Button>
            </div>
        </CardContent>
      </Card>
      
      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Recent Security Activity
          </CardTitle>
          <CardDescription>Review recent login activity on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingHistory && <p>Loading history...</p>}
            {!isLoadingHistory && loginHistory?.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {activity.action === 'login' ? <Fingerprint className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                  <div>
                    <p className="font-medium text-sm capitalize">{activity.action.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.action === 'login' ? 'outline' : 'destructive'} className={activity.action === 'login' ? 'text-success border-success' : ''}>
                  {activity.action === 'login' ? 'Success' : 'Failed'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Fingerprint className="h-5 w-5 mr-2" />
            Passkeys (WebAuthn)
          </CardTitle>
          <CardDescription>
            Sign in with Touch&nbsp;ID / Windows&nbsp;Hello for a password-less experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isWebAuthnSupported && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <p className="font-medium">Passkeys not supported</p>
                <p className="text-sm">Your browser doesn't support passkeys. Please use a modern browser like Chrome, Safari, or Firefox.</p>
              </div>
            </Alert>
          )}

          {passkeys.length ? (
            <div className="space-y-2">
              {passkeys.map((pk) => (
                <div
                  key={pk.credential_id}
                  className="flex items-center justify-between p-4 border border-border rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium truncate max-w-[200px]" title={pk.credential_id}>
                      {pk.friendly_name || 'Unnamed Passkey'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pk.device_type === 'single_device' ? 'Single-device' : 'Multi-device'} ·{' '}
                      {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" data-testid="passkey-badge-active">Active</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePasskey(pk.credential_id)}
                      disabled={deletingPasskeyId === pk.credential_id}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`delete-passkey-${pk.credential_id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No passkeys added yet.</p>
          )}

          <Dialog open={showAddPasskeyDialog} onOpenChange={setShowAddPasskeyDialog}>
            <DialogTrigger asChild>
              <Button disabled={!isWebAuthnSupported} data-testid="add-passkey-button">
                Add Passkey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Passkey</DialogTitle>
                <DialogDescription>
                  Give your passkey a name to help you identify it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="friendlyName">Passkey Name</Label>
                                     <Input
                     id="friendlyName"
                     placeholder="e.g., MacBook Touch ID, iPhone Face ID"
                     value={friendlyName}
                     onChange={(e) => setFriendlyName(e.target.value)}
                     data-testid="passkey-name-input"
                   />
                  <p className="text-xs text-muted-foreground">
                    Optional: helps you identify this passkey in your settings
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddPasskeyDialog(false);
                    setFriendlyName('');
                  }}
                >
                  Cancel
                </Button>
                                 <Button
                   onClick={handleAddPasskey}
                   isLoading={isRegisteringPasskey}
                   disabled={isRegisteringPasskey}
                   data-testid="create-passkey-button"
                 >
                   Create Passkey
                 </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Account
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data. This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input 
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirmation !== 'DELETE'}>
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings; 