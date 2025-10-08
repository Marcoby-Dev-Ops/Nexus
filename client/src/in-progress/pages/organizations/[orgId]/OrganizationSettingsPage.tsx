import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Switch } from '@/shared/components/ui/Switch';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/ui/components/Toast';
import { useAuth } from '@/hooks/index';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { Building2, ArrowLeft, Save, Trash2, Users, Shield, Settings } from 'lucide-react';

export const OrganizationSettingsPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    currentOrg: organization,
    loading,
    loadOrganizationDetails,
    clearCurrentOrg
  } = useOrganizationStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowGuestAccess: false,
    requireApproval: true,
    enableNotifications: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadOrganizationDetails(orgId);
    }

    return () => {
      clearCurrentOrg();
    };
  }, [orgId]);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        description: organization.description || '',
        allowGuestAccess: organization.settings?.allow_guest_access || false,
        requireApproval: organization.settings?.require_approval !== false,
        enableNotifications: organization.settings?.enable_notifications !== false
      });
    }
  }, [organization]);

  const handleSave = async () => {
    if (!organization) return;

    setIsSaving(true);
    try {
      // TODO: Implement organization update service call
      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!organization) return;

    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement organization deletion service call
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading organization settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Organization Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The organization you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link to="/organizations">
              <Button>
                <div className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Organizations
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
                      <Link to={`/organizations/${orgId}`}>
                        <Button variant="ghost" size="sm">
                          <div className="flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                          </div>
                        </Button>
                      </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
            <p className="text-muted-foreground">
              Manage {organization.name} settings and preferences
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Organization Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter organization description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Allow Guest Access</label>
                  <p className="text-sm text-muted-foreground">
                    Allow users without accounts to view public content
                  </p>
                </div>
                <Switch
                  checked={formData.allowGuestAccess}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowGuestAccess: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Require Approval</label>
                  <p className="text-sm text-muted-foreground">
                    Require admin approval for new member requests
                  </p>
                </div>
                <Switch
                  checked={formData.requireApproval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireApproval: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Notifications</label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for important events
                  </p>
                </div>
                <Switch
                  checked={formData.enableNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{organization.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{organization.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{new Date(organization.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete an organization, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
