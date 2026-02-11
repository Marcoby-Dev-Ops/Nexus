import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/index';
import { useNavigate } from 'react-router-dom';
import { performSignOut } from '@/shared/utils/signOut';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Switch } from '@/shared/components/ui/Switch';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  Key,
  User,
  Mail,
  Smartphone,
  GraduationCap
} from 'lucide-react';

// Import auth onboarding components
import { AuthOnboardingTrigger } from '@/components/auth/AuthOnboardingTrigger';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { withPageTemplate } from '@/shared/patterns/components/PageTemplates';
function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle, setPageIcon } = useHeaderContext();
  const [activeTab, setActiveTab] = useState('general');

  // Mock settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    darkMode: false,
    autoSave: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    language: 'en',
    timezone: 'UTC',
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSignOut = async () => {
    try {
      await performSignOut();
      // performSignOut already handles redirect, so we don't need to navigate
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  useEffect(() => {
    setPageTitle?.('Settings');
    setPageIcon?.(<Settings className="h-5 w-5" />);
    return () => {
      setPageTitle?.('');
      setPageIcon?.(undefined);
    };
  }, [setPageTitle, setPageIcon]);
  const darkCard = 'rounded-xl border border-slate-700 bg-slate-800/60';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
              <p className="text-sm text-slate-300">Manage your account preferences and security</p>
            </div>
            <div className="flex items-center gap-2">
              <AuthOnboardingTrigger
                featureId="security-settings"
                variant="button"
                onStart={(moduleId) => {
                  // eslint-disable-next-line no-console
                  console.log('Started security settings module:', moduleId);
                }}
                onComplete={(moduleId) => {
                  // eslint-disable-next-line no-console
                  console.log('Completed security settings module:', moduleId);
                }}
              />
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                ← Back to Dashboard
              </Button>
            </div>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic account and interface preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Dark Mode</label>
                      <p className="text-xs text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Auto Save</label>
                      <p className="text-xs text-muted-foreground">
                        Automatically save your work
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Manage your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.fullName || ''}
                      placeholder="Enter your full name"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      placeholder="Enter your email address"
                      className="w-full p-2 border rounded-md"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed from here
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      placeholder="Tell us about yourself"
                      rows={3}
                      className="w-full p-2 border rounded-md resize-none"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input
                      type="text"
                      placeholder="Enter your location"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button>
                      Save Profile Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-xs text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Push Notifications</label>
                      <p className="text-xs text-muted-foreground">
                        Receive real-time notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Marketing Emails</label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Change Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Timeout (minutes)</label>
                    <select
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={480}>8 hours</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your data and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Profile Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Control who can see your profile information
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Public</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Data Collection</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow analytics and usage data collection
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Location Services</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow location-based features
                        </p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export, manage, or delete your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Export Data</h4>
                        <p className="text-sm text-muted-foreground">
                          Download all your data in JSON format
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all data
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Account Deactivation</h4>
                        <p className="text-sm text-muted-foreground">
                          Temporarily deactivate your account
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Deactivate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out Section */}
            <Card className={darkCard}>
              <CardHeader>
                <CardTitle>Sign Out</CardTitle>
                <CardDescription>
                  Sign out of your account on this device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 

export default withPageTemplate(SettingsPage, 'settings');
