import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';

// Mock API for loading/saving preferences
const mockLoadPreferences = async () => ({
  email: true,
  push: false,
  inApp: true,
});
const mockSavePreferences = async (prefs: any) => {
  // Simulate API call
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// Mock analytics function
const analytics = {
  track: (event: string, data?: any) => {
    // Replace with real analytics integration
    console.log(`[Analytics] ${event}`, data);
  },
};

const NotificationsSettings: React.FC = () => {
  const [preferences, setPreferences] = useState({ email: false, push: false, inApp: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    mockLoadPreferences().then((prefs) => {
      setPreferences(prefs);
      setLoading(false);
    });
  }, []);

  const handleToggle = (type: keyof typeof preferences) => {
    setPreferences((prev) => {
      const updated = { ...prev, [type]: !prev[type] };
      analytics.track('notification_preference_toggled', { type, value: updated[type] });
      return updated;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await mockSavePreferences(preferences);
    setSaving(false);
    setSaved(true);
    analytics.track('notification_preferences_saved', preferences);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Preferences</h2>
        <p className="text-muted-foreground">Choose how you want to receive notifications from Nexus.</p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Enable or disable notification types.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email Notifications</span>
            <Switch checked={preferences.email} onCheckedChange={() => handleToggle('email')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Push Notifications</span>
            <Switch checked={preferences.push} onCheckedChange={() => handleToggle('push')} />
          </div>
          <div className="flex items-center justify-between">
            <span>In-App Notifications</span>
            <Switch checked={preferences.inApp} onCheckedChange={() => handleToggle('inApp')} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={saving}
            disabled={loading || saving}
            data-testid={saved ? 'saved-button' : 'save-button'}
          >
            {saved ? 'Saved' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotificationsSettings; 