import React, { useState } from 'react';
import { Shield, Key, Smartphone, Eye, EyeOff, AlertTriangle, LogOut, RefreshCw, Lock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Separator } from '../../components/ui/Separator';
import { Badge } from '../../components/ui/Badge';
import { useEnhancedUser } from '../../contexts/EnhancedUserContext';

// Mock security activity data
const securityActivity = [
  { type: 'login', device: 'Chrome on MacOS', location: 'San Francisco, CA', ip: '192.168.1.1', time: 'Just now', status: 'success' },
  { type: 'login', device: 'Mobile App on iPhone', location: 'San Francisco, CA', ip: '192.168.1.2', time: '2 days ago', status: 'success' },
  { type: 'login', device: 'Firefox on Windows', location: 'New York, NY', ip: '192.168.1.3', time: '5 days ago', status: 'success' },
  { type: 'failed_login', device: 'Chrome on Windows', location: 'Chicago, IL', ip: '192.168.1.4', time: '1 week ago', status: 'failed' },
  { type: 'password_change', device: 'Chrome on MacOS', location: 'San Francisco, CA', ip: '192.168.1.1', time: '2 weeks ago', status: 'success' },
];

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
  const { user } = useEnhancedUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Handle password change
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing password...');
    // Implementation would change password
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  // Toggle two-factor authentication
  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // In a real implementation, this would trigger 2FA setup flow
    console.log(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
  };
  
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
                  onClick={() => setShowPassword(!showPassword)}
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
                <p className={newPassword.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}>
                  • At least 8 characters
                </p>
                <p className={/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-muted-foreground'}>
                  • At least 1 uppercase letter
                </p>
                <p className={/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-muted-foreground'}>
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
            
            <Button type="submit" disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>
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
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">Two-factor authentication is enabled</p>
              <p className="text-muted-foreground mt-1">
                You will be asked for a verification code when signing in from an unrecognized device.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Recent Security Activity
          </CardTitle>
          <CardDescription>Recent account activity and login attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-md">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    activity.status === 'failed' 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {activity.type === 'login' 
                      ? <Lock className="h-5 w-5" /> 
                      : activity.type === 'failed_login' 
                        ? <AlertTriangle className="h-5 w-5" /> 
                        : <RefreshCw className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {activity.type === 'login' ? 'Login' : 
                        activity.type === 'failed_login' ? 'Failed login attempt' : 
                        'Password changed'}
                      </p>
                      <Badge variant={activity.status === 'failed' ? 'destructive' : 'outline'}>
                        {activity.status === 'failed' ? 'Failed' : 'Success'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.device} • {activity.location}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>{activity.time}</p>
                  <p className="text-xs text-muted-foreground">{activity.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-4 flex justify-between">
          <Button variant="outline">View All Activity</Button>
          <Button variant="destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out All Devices
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SecuritySettings; 