import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';
import { Palette, Monitor, Sun, Moon, MonitorIcon, Layout, Eye, RefreshCw, Save, Settings, Globe, Users, BarChart3, Calendar, Bell, CheckCircle2, Loader2 } from 'lucide-react';

interface AppearanceSettingsState {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  layout: 'default' | 'compact' | 'spacious';
  sidebar: 'collapsed' | 'expanded' | 'auto';
  density: 'comfortable' | 'compact' | 'spacious';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  showAvatars: boolean;
  showIcons: boolean;
}

interface LayoutPreview {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
}

const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettingsState = {
  theme: 'system',
  colorScheme: 'green',
  layout: 'default',
  sidebar: 'auto',
  density: 'comfortable',
  animations: true,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  showAvatars: true,
  showIcons: true,
};

const AppearanceSettings: React.FC = () => {
  const { preferences, updatePreferences, loading, refreshPreferences } = useUserPreferences();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppearanceSettingsState>(DEFAULT_APPEARANCE_SETTINGS);
  const [saving, setSaving] = useState(false);

  // Load settings from preferences
  useEffect(() => {
    if (preferences) {
      const extraSettings = preferences.preferences?.appearance_settings || {};
      setSettings({
        ...DEFAULT_APPEARANCE_SETTINGS,
        theme: preferences.theme || 'system',
        ...extraSettings,
      });
    }
  }, [preferences]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { theme, ...extraAppearance } = settings;

      const result = await updatePreferences({
        theme,
        preferences: {
          ...(preferences?.preferences || {}),
          appearance_settings: extraAppearance,
        },
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Appearance settings saved successfully.',
          variant: 'success',
        });
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      logger.error('Failed to save appearance settings', { error });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme: theme as 'light' | 'dark' | 'system' }));
  };

  const handleColorSchemeChange = (scheme: string) => {
    setSettings(prev => ({ ...prev, colorScheme: scheme as any }));
  };

  const handleLayoutChange = (layout: string) => {
    setSettings(prev => ({ ...prev, layout: layout as any }));
  };

  const handleSidebarChange = (sidebar: string) => {
    setSettings(prev => ({ ...prev, sidebar: sidebar as any }));
  };

  const handleDensityChange = (density: string) => {
    setSettings(prev => ({ ...prev, density: density as any }));
  };

  const handleFontSizeChange = (size: string) => {
    setSettings(prev => ({ ...prev, fontSize: size as any }));
  };

  const getColorSchemePreview = (scheme: string) => {
    const colors = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[scheme as keyof typeof colors] || 'bg-green-500';
  };

  const layoutPreviews: LayoutPreview[] = [
    {
      id: 'default',
      name: 'Default',
      description: 'Standard layout with balanced spacing',
      icon: <Layout className="w-4 h-4" />,
      preview: 'Standard layout with balanced spacing and navigation'
    },
    {
      id: 'compact',
      name: 'Compact',
      description: 'Dense layout for maximum content visibility',
      icon: <Users className="w-4 h-4" />,
      preview: 'Dense layout optimized for content-heavy workflows'
    },
    {
      id: 'spacious',
      name: 'Spacious',
      description: 'Relaxed layout with generous spacing',
      icon: <Globe className="w-4 h-4" />,
      preview: 'Relaxed layout with generous spacing and breathing room'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Appearance & Theme</h3>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel of your Nexus experience
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshPreferences}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Theme & Color
          </CardTitle>
          <CardDescription>
            Choose your preferred theme and color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme-select">Theme</Label>
              <Select value={settings.theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <MonitorIcon className="w-4 h-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Scheme */}
            <div>
              <Label>Color Scheme</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                {['green', 'blue', 'purple', 'orange', 'red'].map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => handleColorSchemeChange(scheme)}
                    className={`p-3 rounded-lg border-2 transition-all ${settings.colorScheme === scheme
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${getColorSchemePreview(scheme)} mb-2 mx-auto`} />
                    <p className="text-xs font-medium capitalize text-center">{scheme}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layout className="h-5 w-5 mr-2" />
            Layout & Spacing
          </CardTitle>
          <CardDescription>
            Customize the layout and spacing of your interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout Selection */}
          <div className="space-y-4">
            <Label>Layout Style</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {layoutPreviews.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutChange(layout.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${settings.layout === layout.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {layout.icon}
                    <span className="font-medium">{layout.name}</span>
                    {settings.layout === layout.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{layout.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="sidebar-select">Sidebar Behavior</Label>
              <Select value={settings.sidebar} onValueChange={handleSidebarChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-hide</SelectItem>
                  <SelectItem value="expanded">Always expanded</SelectItem>
                  <SelectItem value="collapsed">Always collapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="density-select">Density</Label>
              <Select value={settings.density} onValueChange={handleDensityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="font-size-select">Font Size</Label>
              <Select value={settings.fontSize} onValueChange={handleFontSizeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Visual Preferences
          </CardTitle>
          <CardDescription>
            Fine-tune your visual experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Animations</p>
              <p className="text-sm text-muted-foreground">
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch
              checked={settings.animations}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, animations: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-muted-foreground">
                Minimize animations for accessibility
              </p>
            </div>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reducedMotion: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, highContrast: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Avatars</p>
              <p className="text-sm text-muted-foreground">
                Display user avatars throughout the interface
              </p>
            </div>
            <Switch
              checked={settings.showAvatars}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAvatars: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Icons</p>
              <p className="text-sm text-muted-foreground">
                Display icons in navigation and menus
              </p>
            </div>
            <Switch
              checked={settings.showIcons}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showIcons: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your settings will look in the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-background">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${getColorSchemePreview(settings.colorScheme)}`} />
                <div>
                  <h4 className="font-medium">Sample Interface</h4>
                  <p className="text-sm text-muted-foreground">
                    This preview shows your current settings
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {settings.theme === 'system' ? 'System' : settings.theme}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Analytics</span>
                </div>
                <p className="text-xs text-muted-foreground">Sample content preview</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Calendar</span>
                </div>
                <p className="text-xs text-muted-foreground">Sample content preview</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
                <p className="text-xs text-muted-foreground">Sample content preview</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettings;

