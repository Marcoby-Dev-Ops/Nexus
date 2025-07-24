/**
 * World-Class User Management Dashboard
 * 
 * Inspired by:
 * - Google Workspace Admin Console
 * - Microsoft 365 Admin Center
 * - Modern SaaS platforms
 */

import React, { useState } from 'react';
import { useUserManagement } from '@/shared/hooks/useUserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings, 
  Mail, 
  Smartphone,
  TrendingUp,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserManagementDashboardProps {
  className?: string;
}

export const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({ className }) => {
  const {
    // State
    profile,
    sessions,
    activities,
    analytics,
    preferences,
    securitySettings,
    onboardingFlow,
    invitations,
    pendingInvitations,
    isLoading,
    isUpdating,
    error,
    
    // Actions
    updateProfile,
    refreshProfile,
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    getActivityLog,
    trackActivity,
    inviteUser,
    cancelInvitation,
    resendInvitation,
    updateSecuritySettings,
    enableMFA,
    disableMFA,
    verifyMFA,
    startOnboarding,
    completeOnboardingStep,
    updatePreferences,
    clearError,
    retry
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  const handleInviteUser = async () => {
    if (!inviteEmail || !profile?.company_id) return;
    
    const result = await inviteUser(inviteEmail, inviteRole, profile.company_id);
    if (result.success) {
      setInviteEmail('');
      setInviteRole('user');
    }
  };

  const handleEnableMFA = async () => {
    const result = await enableMFA('totp');
    if (result.success) {
      setShowMfaSetup(true);
    }
  };

  const handleVerifyMFA = async () => {
    const result = await verifyMFA(mfaCode);
    if (result.success) {
      setShowMfaSetup(false);
      setMfaCode('');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (confirm('Are you sure you want to revoke all sessions? This will log out all devices except this one.')) {
      await revokeAllSessions();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user management data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, security, and access across your organization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshProfile}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={retry}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* User Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.login_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active in last 30 days
                </p>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Level</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securitySettings?.require_mfa ? 'Enhanced' : 'Basic'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {securitySettings?.require_mfa ? 'MFA Enabled' : 'MFA Disabled'}
                </p>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all devices
                </p>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingInvitations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common user management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleInviteUser} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
                <Button variant="outline" onClick={handleEnableMFA} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Enable MFA
                </Button>
                <Button variant="outline" onClick={handleRevokeAllSessions} className="w-full">
                  <UserX className="h-4 w-4 mr-2" />
                  Revoke All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Invite User */}
          <Card>
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
              <CardDescription>
                Send an invitation to join your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleInviteUser} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Users who haven't accepted their invitations yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Role: {invitation.role} • Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitation(invitation.id)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* MFA Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!securitySettings?.require_mfa ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">
                      MFA is not enabled. Enable it for enhanced security.
                    </span>
                  </div>
                  <Button onClick={handleEnableMFA}>
                    <Lock className="h-4 w-4 mr-2" />
                    Enable MFA
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-muted-foreground">
                      MFA is enabled and active.
                    </span>
                  </div>
                  <Button variant="outline" onClick={() => disableMFA()}>
                    <Unlock className="h-4 w-4 mr-2" />
                    Disable MFA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MFA Setup Modal */}
          {showMfaSetup && (
            <Card>
              <CardHeader>
                <CardTitle>Complete MFA Setup</CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mfa-code">Verification Code</Label>
                    <Input
                      id="mfa-code"
                      type="text"
                      placeholder="123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleVerifyMFA}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                    <Button variant="outline" onClick={() => setShowMfaSetup(false)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <select
                    className="px-3 py-2 border border-input rounded-md"
                    value={securitySettings?.session_timeout_minutes || 30}
                    onChange={(e) => updateSecuritySettings({ session_timeout_minutes: parseInt(e.target.value) })}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts
                    </p>
                  </div>
                  <Button
                    variant={securitySettings?.login_notifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSecuritySettings({ login_notifications: !securitySettings?.login_notifications })}
                  >
                    {securitySettings?.login_notifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Suspicious Activity Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get alerts for unusual account activity
                    </p>
                  </div>
                  <Button
                    variant={securitySettings?.suspicious_activity_alerts ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSecuritySettings({ suspicious_activity_alerts: !securitySettings?.suspicious_activity_alerts })}
                  >
                    {securitySettings?.suspicious_activity_alerts ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent account activity and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {activity.ip_address}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Manage your active login sessions across devices
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleRevokeAllSessions}>
                  <UserX className="h-4 w-4 mr-2" />
                  Revoke All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {session.device_info?.browser || 'Unknown Browser'} on {session.device_info?.os || 'Unknown OS'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last active: {new Date(session.last_activity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {session.ip_address}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* User Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Button
                    variant={preferences?.notifications?.email ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePreferences({ 
                      notifications: { 
                        ...preferences?.notifications, 
                        email: !preferences?.notifications?.email 
                      } 
                    })}
                  >
                    {preferences?.notifications?.email ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Button
                    variant={preferences?.notifications?.push ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePreferences({ 
                      notifications: { 
                        ...preferences?.notifications, 
                        push: !preferences?.notifications?.push 
                      } 
                    })}
                  >
                    {preferences?.notifications?.push ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile information
                    </p>
                  </div>
                  <select
                    className="px-3 py-2 border border-input rounded-md"
                    value={preferences?.privacy?.profile_visibility || 'company'}
                    onChange={(e) => updatePreferences({ 
                      privacy: { 
                        ...preferences?.privacy, 
                        profile_visibility: e.target.value as any 
                      } 
                    })}
                  >
                    <option value="public">Public</option>
                    <option value="company">Company Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 