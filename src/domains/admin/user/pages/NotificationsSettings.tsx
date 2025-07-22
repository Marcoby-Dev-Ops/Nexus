import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { toast } from 'sonner';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Save,
  XCircle,
  Zap,
  Users,
  BarChart3,
  Shield,
  Globe,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';

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
  const { user } = useAuthContext();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    globalEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    channels: [
      {
        id: 'email',
        name: 'Email',
        type: 'email',
        enabled: true,
        icon: <Mail className="w-4 h-4" />
      },
      {
        id: 'push',
        name: 'Push Notifications',
        type: 'push',
        enabled: true,
        icon: <Bell className="w-4 h-4" />
      },
      {
        id: 'sms',
        name: 'SMS',
        type: 'sms',
        enabled: false,
        icon: <Smartphone className="w-4 h-4" />
      },
      {
        id: 'in_app',
        name: 'In-App',
        type: 'in_app',
        enabled: true,
        icon: <MessageSquare className="w-4 h-4" />
      }
    ],
    categories: [
      {
        id: 'security',
        name: 'Security & Privacy',
        description: 'Login alerts, password changes, and security updates',
        icon: <Shield className="w-4 h-4" />,
        channels: {
          email: true,
          push: true,
          sms: true,
          in_app: true
        },
        frequency: 'immediate'
      },
      {
        id: 'business',
        name: 'Business Updates',
        description: 'Important business metrics and performance alerts',
        icon: <BarChart3 className="w-4 h-4" />,
        channels: {
          email: true,
          push: false,
          sms: false,
          in_app: true
        },
        frequency: 'daily'
      },
      {
        id: 'integrations',
        name: 'Integration Status',
        description: 'Integration sync status and connection issues',
        icon: <Zap className="w-4 h-4" />,
        channels: {
          email: false,
          push: true,
          sms: false,
          in_app: true
        },
        frequency: 'immediate'
      },
      {
        id: 'team',
        name: 'Team Activity',
        description: 'Team member activities and collaboration updates',
        icon: <Users className="w-4 h-4" />,
        channels: {
          email: false,
          push: false,
          sms: false,
          in_app: true
        },
        frequency: 'daily'
      },
      {
        id: 'calendar',
        name: 'Calendar & Events',
        description: 'Meeting reminders and calendar updates',
        icon: <Calendar className="w-4 h-4" />,
        channels: {
          email: true,
          push: true,
          sms: false,
          in_app: true
        },
        frequency: 'immediate'
      },
      {
        id: 'documents',
        name: 'Document Updates',
        description: 'Document changes and collaboration updates',
        icon: <FileText className="w-4 h-4" />,
        channels: {
          email: false,
          push: false,
          sms: false,
          in_app: true
        },
        frequency: 'daily'
      },
      {
        id: 'billing',
        name: 'Billing & Payments',
        description: 'Payment confirmations and billing alerts',
        icon: <DollarSign className="w-4 h-4" />,
        channels: {
          email: true,
          push: false,
          sms: false,
          in_app: true
        },
        frequency: 'immediate'
      },
      {
        id: 'analytics',
        name: 'Analytics & Insights',
        description: 'Performance reports and trend analysis',
        icon: <TrendingUp className="w-4 h-4" />,
        channels: {
          email: true,
          push: false,
          sms: false,
          in_app: true
        },
        frequency: 'weekly'
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotificationPreferences();
    }
  }, [user?.id]);

  const fetchNotificationPreferences = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      // In a real implementation, you would fetch from your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      
      // Simulate saving preferences
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Notification preferences saved successfully');
    } catch (error) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  className="w-full px-3 py-2 border rounded-md mt-1"
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
                  className="w-full px-3 py-2 border rounded-md mt-1"
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Notification Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preview
          </CardTitle>
          <CardDescription>
            See how your notifications will appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">New login detected</p>
                  <p className="text-sm text-muted-foreground">
                    A new login was detected from San Francisco, CA
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date().toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Daily business summary</p>
                  <p className="text-sm text-muted-foreground">
                    Your business metrics for today are ready
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date().toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsSettings; 