import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Separator } from '@/shared/components/ui/Separator';
import { Download, Trash2, Eye, Shield, Loader2 } from 'lucide-react';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';

interface PrivacySettingsState {
  collectAnalytics: boolean;
  marketingCommunications: boolean;
  thirdPartySharing: boolean;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettingsState = {
  collectAnalytics: true,
  marketingCommunications: true,
  thirdPartySharing: true,
};

const DataPrivacySettings: React.FC = () => {
  const { preferences, updatePreferences, loading } = useUserPreferences();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettingsState>(DEFAULT_PRIVACY_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from preferences
  useEffect(() => {
    if (preferences?.preferences?.privacy_settings) {
      setSettings({
        ...DEFAULT_PRIVACY_SETTINGS,
        ...preferences.preferences.privacy_settings,
      });
    }
  }, [preferences]);

  const handleToggle = async (key: keyof PrivacySettingsState, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      const result = await updatePreferences({
        preferences: {
          ...(preferences?.preferences || {}),
          privacy_settings: newSettings,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update privacy settings');
      }
    } catch (error) {
      logger.error('Failed to update privacy settings', { error, key, value });
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings. Please try again.',
        variant: 'destructive',
      });
      // Revert local state on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    toast({
      title: 'Data Export Started',
      description: 'Your data is being prepared for export. You will receive an email once it is ready.',
    });
  };

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
      <div>
        <h3 className="text-lg font-medium">Data & Privacy</h3>
        <p className="text-sm text-muted-foreground">
          Manage your data privacy settings and export your information.
        </p>
      </div>

      <div className="space-y-4">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Your Data
            </CardTitle>
            <CardDescription>
              Download a copy of all your data in JSON format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control how your data is used and shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analytics & Usage Data</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to collect anonymous usage data to improve the service
                </p>
              </div>
              <Switch
                id="analytics"
                checked={settings.collectAnalytics}
                onCheckedChange={(val) => handleToggle('collectAnalytics', val)}
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and improvements
                </p>
              </div>
              <Switch
                id="marketing"
                checked={settings.marketingCommunications}
                onCheckedChange={(val) => handleToggle('marketingCommunications', val)}
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="third-party">Third-party Integrations</Label>
                <p className="text-sm text-muted-foreground">
                  Allow data sharing with connected services
                </p>
              </div>
              <Switch
                id="third-party"
                checked={settings.thirdPartySharing}
                onCheckedChange={(val) => handleToggle('thirdPartySharing', val)}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataPrivacySettings;

