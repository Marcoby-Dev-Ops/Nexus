import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { useAuth } from '@/hooks/index';
import { toast } from 'sonner';
import { Shield, Lock, Key, Smartphone, Monitor, Clock, Trash2, RefreshCw, Eye, EyeOff, Edit, LogOut, XCircle } from 'lucide-react';

// Import our new service patterns
import { useService } from '@/shared/hooks/useService';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useCompany } from '@/shared/contexts/CompanyContext';
import { logger } from '@/shared/utils/logger';
import { DateTime } from 'luxon';
import { nowIsoUtc, toLocalDisplay } from '@/shared/utils/time';

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
  const { profile, loading: profileLoading } = useUserProfile();
  const { company } = useCompany();
  
  // Use the UserService directly
  const userService = useService('user');



  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginNotifications: true,
    sessionTimeout: 30,
    passwordLastChanged: nowIsoUtc(),
    lastLogin: nowIsoUtc(),
    failedLoginAttempts: 0,
    accountLocked: false
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);

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
          lastActive: nowIsoUtc(),
          isCurrent: true
        },
        {
          id: 'session_2',
          device: 'Safari on iPhone 15',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.101',
          lastActive: DateTime.utc().minus({ hours: 2 }).toISO()!,
          isCurrent: false
        }
      ];

      setActiveSessions(mockSessions);
    } catch (error) {
      logger.error('Error fetching security data: ', error);
      toast.error('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    try {
      setLoading(true);
      
      // Update security settings
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: enabled
      }));
      
      toast.success(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Error updating 2FA settings:', error);
      toast.error('Failed to update two-factor authentication settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (type: 'email' | 'login', enabled: boolean) => {
    try {
      setLoading(true);
      
      setSecuritySettings(prev => ({
        ...prev,
        emailNotifications: type === 'email' ? enabled : prev.emailNotifications,
        loginNotifications: type === 'login' ? enabled : prev.loginNotifications
      }));
      
      toast.success(`${type === 'email' ? 'Email' : 'Login'} notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionRevoke = async (sessionId: string) => {
    try {
      setLoading(true);
      
      // Remove session from list
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast.success('Session revoked successfully');
    } catch (error) {
      logger.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setLoading(true);
      
      // Keep only current session
      setActiveSessions(prev => prev.filter(session => session.isCurrent));
      
      toast.success('All other sessions revoked successfully');
    } catch (error) {
      logger.error('Error revoking all sessions:', error);
      toast.error('Failed to revoke sessions');
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (securitySettings.twoFactorEnabled) score += 25;
    if (securitySettings.emailNotifications) score += 15;
    if (securitySettings.loginNotifications) score += 15;
    if (securitySettings.sessionTimeout <= 30) score += 20;
    if (securitySettings.failedLoginAttempts === 0) score += 25;
    return Math.min(score, 100);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg text-muted-foreground">Loading security settings...</span>
      </div>
    );
  }

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">Manage your account security and privacy</p>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
          <CardDescription>
            Your account security rating based on enabled features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                {securityScore}%
              </div>
              <div>
                <div className="font-medium">{getSecurityScoreLabel(securityScore)}</div>
                <div className="text-sm text-muted-foreground">
                  {securityScore >= 80 ? 'Your account is well protected' : 
                   securityScore >= 60 ? 'Consider enabling additional security features' :
                   'Your account needs additional security measures'}
                </div>
              </div>
            </div>
            <Badge variant={securityScore >= 80 ? 'default' : securityScore >= 60 ? 'secondary' : 'destructive'}>
              {getSecurityScoreLabel(securityScore)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your account password through Marcoby IAM (Authentik)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">
                Last changed {toLocalDisplay(securitySettings.passwordLastChanged)}
              </p>
            </div>
            <Button 
              onClick={() => {
                console.log('🔍 Button clicked!');
                alert('Button clicked - opening password change...');
                
                const authentikUrl = import.meta.env.VITE_AUTHENTIK_BASE_URL || 'https://identity.marcoby.com';
                const fullUrl = `${authentikUrl}/if/flow/default-password-change/`;
                
                console.log('🔍 Opening URL:', fullUrl);
                window.open(fullUrl, '_blank');
              }}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">
                {securitySettings.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={securitySettings.twoFactorEnabled ? 'default' : 'secondary'}>
                {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={handleTwoFactorToggle}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Security Notifications
          </CardTitle>
          <CardDescription>
            Configure security-related notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive security alerts via email
              </p>
            </div>
            <Switch
              checked={securitySettings.emailNotifications}
              onCheckedChange={(enabled) => handleNotificationToggle('email', enabled)}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Login Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Get notified of new login attempts
              </p>
            </div>
            <Switch
              checked={securitySettings.loginNotifications}
              onCheckedChange={(enabled) => handleNotificationToggle('login', enabled)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{session.device}</h4>
                  <p className="text-sm text-muted-foreground">
                    {session.location} • {session.ipAddress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last active: {toLocalDisplay(session.lastActive)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.isCurrent && (
                  <Badge variant="default">Current</Badge>
                )}
                {!session.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSessionRevoke(session.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {activeSessions.filter(s => !s.isCurrent).length > 0 && (
            <Button
              variant="outline"
              onClick={handleRevokeAllSessions}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Revoke All Other Sessions
            </Button>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default SecuritySettings; 
