import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from '@/core/supabase';
import { toast } from 'sonner';
import { Shield, Lock, Key, Smartphone, Monitor, Clock, Trash2, RefreshCw, Eye, EyeOff, Edit, LogOut, XCircle } from 'lucide-react';
interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
  lastLogin: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginNotifications: true,
    sessionTimeout: 30,
    passwordLastChanged: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    failedLoginAttempts: 0,
    accountLocked: false
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSecurityData();
    }
  }, [user?.id]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockSessions: ActiveSession[] = [
        {
          id: 'session_1',
          device: 'Chrome on Windows 11',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.100',
          lastActive: new Date().toISOString(),
          isCurrent: true
        },
        {
          id: 'session_2',
          device: 'Safari on iPhone 15',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.101',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isCurrent: false
        }
      ];

      setActiveSessions(mockSessions);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching security data: ', error);
      toast.error('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Update last password change date
      setSecuritySettings(prev => ({
        ...prev,
        passwordLastChanged: new Date().toISOString()
      }));
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    try {
      setLoading(true);
      
      if (enabled) {
        setShowTwoFactorModal(true);
      } else {
        // Simulate 2FA disable
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
        toast.success('Two-factor authentication disabled');
      }
    } catch (error) {
      toast.error('Failed to update two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionRevoke = async (sessionId: string) => {
    try {
      setLoading(true);
      
      // Simulate session revocation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setLoading(true);
      
      // Simulate revoking all sessions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setActiveSessions(prev => prev.filter(session => session.isCurrent));
      toast.success('All other sessions revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke sessions');
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securitySettings.twoFactorEnabled) score += 30;
    if (securitySettings.emailNotifications) score += 10;
    if (securitySettings.loginNotifications) score += 10;
    if (securitySettings.sessionTimeout <= 30) score += 20;
    if (securitySettings.failedLoginAttempts === 0) score += 30;
    
    return Math.min(score, 100);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm: flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Security & Privacy</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account security settings and privacy preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSecurityData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                <span className={getSecurityScoreColor(getSecurityScore())}>
                  {getSecurityScore()}%
                </span>
              </div>
              <div>
                <p className="font-medium">{getSecurityScoreLabel(getSecurityScore())}</p>
                <p className="text-sm text-muted-foreground">Account security</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Password Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed: {new Date(securitySettings.passwordLastChanged).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={() => setShowPasswordModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Login Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Login Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-2">Last Login</p>
              <p className="text-sm text-muted-foreground">
                {new Date(securitySettings.lastLogin).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">Failed Login Attempts</p>
              <p className="text-sm text-muted-foreground">
                {securitySettings.failedLoginAttempts} in the last 24 hours
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get notified of suspicious login attempts
              </p>
            </div>
            <Switch
              checked={securitySettings.emailNotifications}
              onCheckedChange={(checked) => setSecuritySettings(prev => ({ 
                ...prev, 
                emailNotifications: checked 
              }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Login Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new logins
              </p>
            </div>
            <Switch
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) => setSecuritySettings(prev => ({ 
                ...prev, 
                loginNotifications: checked 
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Active Sessions
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRevokeAllSessions}
              disabled={activeSessions.filter(s => !s.isCurrent).length === 0}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Revoke All Others
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No Active Sessions</h4>
              <p className="text-muted-foreground">
                Your active sessions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{session.device}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.ipAddress}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {session.isCurrent && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                    {!session.isCurrent && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSessionRevoke(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Timeout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Session Timeout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-timeout">Auto-logout after inactivity (minutes)</Label>
              <select
                id="session-timeout"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ 
                  ...prev, 
                  sessionTimeout: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border rounded-md mt-2"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              You will be automatically logged out after {securitySettings.sessionTimeout} minutes of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Change Password</h2>
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePasswordChange} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Setup Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Setup Two-Factor Authentication</h2>
                <Button variant="outline" onClick={() => setShowTwoFactorModal(false)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center p-4 border rounded-lg">
                  <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use your authenticator app to scan this QR code
                  </p>
                  <div className="bg-muted w-32 h-32 mx-auto rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">QR Code</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowTwoFactorModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
                  setShowTwoFactorModal(false);
                  toast.success('Two-factor authentication enabled');
                }}>
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings; 