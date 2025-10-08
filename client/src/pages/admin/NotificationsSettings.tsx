import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { useAuth } from '@/hooks/index';
import { toast } from 'sonner';
import { pushNotificationService } from '@/services/core/PushNotificationService';
import {
  notificationPreferencesService,
  NotificationSettings,
  NotificationChannelSetting,
  NotificationCategorySetting
} from '@/services/core/NotificationPreferencesService';
import { Bell, Mail, Smartphone, MessageSquare, Settings, RefreshCw, Save, Zap, Users, BarChart3, Shield, Globe, Calendar, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { useNotifications } from '@/shared/hooks/NotificationContext';
interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  enabled: boolean;
  icon: React.ReactNode;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
    in_app: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

interface NotificationPreferences {
  globalEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  channels: NotificationChannel[];
  categories: NotificationCategory[];
}

const NotificationsSettings: React.FC = () => {
  const { user, session } = useAuth();
  const { addNotification } = useNotifications();
  
  // Helper function to get channel icon
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'in_app': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };
  
  // Helper function to get category icon
  const getCategoryIcon = (categoryType: string) => {
    switch (categoryType) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'business': return <BarChart3 className="w-4 h-4" />;
      case 'integrations': return <Zap className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'billing': return <DollarSign className="w-4 h-4" />;
      case 'analytics': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const mapSettingsToState = (settings: NotificationSettings): NotificationPreferences => {
    const channels = Object.entries(settings.channels || {}).map(([id, channel]) => ({
      id,
      name: channel.name,
      type: channel.type,
      enabled: channel.enabled,
      icon: getChannelIcon(channel.type)
    }));

    const categories = Object.entries(settings.categories || {}).map(([id, category]) => ({
      id,
      name: category.name,
      description: category.description,
      icon: getCategoryIcon(id),
      channels: {
        email: Boolean(category.channels?.email),
        push: Boolean(category.channels?.push),
        sms: Boolean(category.channels?.sms),
        in_app: Boolean(category.channels?.in_app)
      },
      frequency: category.frequency || 'immediate'
    }));

    return {
      globalEnabled: settings.global_enabled ?? true,
      quietHours: {
        enabled: settings.quiet_hours_enabled ?? false,
        start: settings.quiet_hours_start || '22:00',
        end: settings.quiet_hours_end || '08:00'
      },
      channels,
      categories
    };
  };

  const mapStateToSettings = (state: NotificationPreferences): NotificationSettings => {
    const channelMap = state.channels.reduce<Record<string, NotificationChannelSetting>>(
      (acc, channel) => {
        acc[channel.id] = {
          name: channel.name,
          type: channel.type,
          enabled: channel.enabled
        };
        return acc;
      },
      {}
    );

    const categoryMap = state.categories.reduce<Record<string, NotificationCategorySetting>>(
      (acc, category) => {
        acc[category.id] = {
          name: category.name,
          description: category.description,
          channels: {
            email: category.channels.email,
            push: category.channels.push,
            sms: category.channels.sms,
            in_app: category.channels.in_app
          },
          frequency: category.frequency
        };
        return acc;
      },
      {}
    );

    return {
      global_enabled: state.globalEnabled,
      quiet_hours_enabled: state.quietHours.enabled,
      quiet_hours_start: state.quietHours.start,
      quiet_hours_end: state.quietHours.end,
      channels: channelMap,
      categories: categoryMap
    };
  };
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    mapSettingsToState(notificationPreferencesService.getDefaultSettings())
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (user?.id && session?.session?.accessToken) {
      fetchNotificationPreferences();
    }
  }, [user?.id, session?.session?.accessToken]);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      const result = await notificationPreferencesService.fetchSettings(
        session?.session?.accessToken
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch notification preferences');
      }

      setPreferences(mapSettingsToState(result.data));
    } catch (error) {
      console.error('Error fetching notification preferences: ', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const payload = mapStateToSettings(preferences);

      const result = await notificationPreferencesService.saveSettings(
        payload,
        session?.session?.accessToken
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save notification preferences');
      }

      setPreferences(mapSettingsToState(result.data));
      addNotification({
        type: 'success',
        title: 'Preferences Saved',
        message: 'Notification preferences updated successfully.'
      });
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'We could not save notification settings. Please try again.'
      });
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelToggle = (channelId: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      channels: prev.channels.map(channel =>
        channel.id === channelId ? { ...channel, enabled } : channel
      )
    }));
  };

  const handleCategoryChannelToggle = (categoryId: string, channelType: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              channels: {
                ...category.channels,
                [channelType]: enabled
              }
            }
          : category
      )
    }));
  };

  const handleCategoryFrequencyChange = (categoryId: string, frequency: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === categoryId
          ? { ...category, frequency: frequency as any }
          : category
      )
    }));
  };

  const handleGlobalToggle = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, globalEnabled: enabled }));
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, enabled }
    }));
  };

  // Push notification handlers
  const handlePushToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Subscribe to push notifications
        const subscription = await pushNotificationService.subscribeToPush(user?.id || '');
        if (subscription) {
          setPushSubscribed(true);
          toast.success('Push notifications enabled successfully');
          addNotification({
            type: 'success',
            title: 'Push Enabled',
            message: 'Browser push notifications are now active.'
          });
        }
      } else {
        // Unsubscribe from push notifications
        await pushNotificationService.unsubscribeFromPush();
        setPushSubscribed(false);
        toast.success('Push notifications disabled successfully');
        addNotification({
          type: 'info',
          title: 'Push Disabled',
          message: 'Browser push notifications have been turned off.'
        });
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to toggle push notifications');
      addNotification({
        type: 'error',
        title: 'Push Toggle Failed',
        message: 'Something went wrong when updating push notifications.'
      });
    }
  };

  const handleTestPushNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
      toast.success('Test notification sent successfully');
      addNotification({
        type: 'info',
        title: 'Test Notification Sent',
        message: 'Check your browser notifications tray to confirm delivery.'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
      addNotification({
        type: 'error',
        title: 'Test Notification Failed',
        message: 'We could not send the test push notification.'
      });
    }
  };

  // Check push notification status on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      try {
        const permission = await pushNotificationService.getPermission();
        setPushPermission(permission);
        
        const isSubscribed = await pushNotificationService.isSubscribed();
        setPushSubscribed(isSubscribed);
      } catch (error) {
        console.error('Error checking push status:', error);
      }
    };

    if (user?.id) {
      checkPushStatus();
    }
  }, [user?.id]);

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'immediate': return 'Immediate';
      case 'daily': return 'Daily Digest';
      case 'weekly': return 'Weekly Digest';
      case 'never': return 'Never';
      default: return 'Immediate';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'immediate': return 'text-success';
      case 'daily': return 'text-warning';
      case 'weekly': return 'text-muted-foreground';
      case 'never': return 'text-destructive';
      default: return 'text-success';
    }
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
          <h3 className="text-lg font-medium">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotificationPreferences}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSavePreferences} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Control your overall notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">
                Turn all notifications on or off
              </p>
            </div>
            <Switch
              checked={preferences.globalEnabled}
              onCheckedChange={handleGlobalToggle}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Quiet Hours</p>
              <p className="text-sm text-muted-foreground">
                Pause notifications during specific hours
              </p>
            </div>
            <Switch
              checked={preferences.quietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
            />
          </div>
          
          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                                 <input
                   id="quiet-start"
                   type="time"
                   value={preferences.quietHours.start}
                   onChange={(e) => setPreferences(prev => ({
                     ...prev,
                     quietHours: { ...prev.quietHours, start: e.target.value }
                   }))}
                   className="w-full px-3 py-2 border rounded-md mt-1 bg-background"
                 />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                                 <input
                   id="quiet-end"
                   type="time"
                   value={preferences.quietHours.end}
                   onChange={(e) => setPreferences(prev => ({
                     ...prev,
                     quietHours: { ...prev.quietHours, end: e.target.value }
                   }))}
                   className="w-full px-3 py-2 border rounded-md mt-1 bg-background"
                 />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preferences.channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {channel.icon}
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via {channel.name.toLowerCase()}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={(enabled) => handleChannelToggle(channel.id, enabled)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Notification Categories
          </CardTitle>
          <CardDescription>
            Customize notifications for different types of events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {preferences.categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={getFrequencyColor(category.frequency)}>
                    {getFrequencyLabel(category.frequency)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Frequency</span>
                    <Select
                      value={category.frequency}
                      onValueChange={(value) => handleCategoryFrequencyChange(category.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 md: grid-cols-4 gap-3">
                    {preferences.channels.map((channel) => (
                      <div key={channel.id} className="flex items-center space-x-2">
                        <Switch
                          id={`${category.id}-${channel.id}`}
                          checked={category.channels[channel.type as keyof typeof category.channels]}
                          onCheckedChange={(enabled) => 
                            handleCategoryChannelToggle(category.id, channel.type, enabled)
                          }
                          disabled={!channel.enabled}
                        />
                        <Label htmlFor={`${category.id}-${channel.id}`} className="text-sm">
                          {channel.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default NotificationsSettings; 
