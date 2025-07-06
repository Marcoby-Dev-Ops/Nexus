import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/Dialog';
import { analytics } from './mockAnalytics'; // Using a local mock

const DataPrivacySettings: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState({
    shareData: true,
    targetedAds: true,
  });
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      analytics.track('privacy_setting_toggled', { setting: key, value: updated[key] });
      return updated;
    });
  };

  const handleExportData = () => {
    setExporting(true);
    analytics.track('data_export_requested');
    // Simulate export process
    setTimeout(() => {
      setExporting(false);
      alert('Your data export has started. You will receive an email when it is complete.');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    setDeleting(true);
    analytics.track('account_deletion_requested');
    // Simulate deletion process
    setTimeout(() => {
      setDeleting(false);
      alert('Your account deletion request has been received. This is irreversible.');
      // Here you would typically log the user out and disable their account.
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Download a copy of your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You can request an export of your personal data at any time. This will include your profile information, activity logs, and content you have created.
          </p>
          <Button onClick={handleExportData} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control how your data is used and shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="share-data">Share usage data to improve our services</Label>
            <Switch
              id="share-data"
              checked={privacySettings.shareData}
              onCheckedChange={() => handleToggle('shareData')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="targeted-ads">Allow personalized advertising</Label>
            <Switch
              id="targeted-ads"
              checked={privacySettings.targetedAds}
              onCheckedChange={() => handleToggle('targetedAds')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This action is irreversible. Once you delete your account, there is no going back. Please be certain.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Request Account Deletion'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Continue
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPrivacySettings; 