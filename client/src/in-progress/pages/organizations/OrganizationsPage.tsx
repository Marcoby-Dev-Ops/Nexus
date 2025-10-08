import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/ui/components/Toast';
import { useAuth } from '@/hooks/index';
import { useOrganization } from '@/shared/hooks/useOrganization';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import { CreateOrganizationForm } from '@/components/organization/CreateOrganizationForm';
import { Building2, Plus, Users, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizationsPage: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { createOrganization } = useOrganization();
  const {
    orgs: organizations,
    loading,
    loadMemberships,
    clearCurrentOrg
  } = useOrganizationStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Check if user has valid authentication session
  const hasValidSession = () => {
    try {
      const sessionData = localStorage.getItem('authentik_session');
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      // Check both possible locations for the access token
      return !!(session?.accessToken || session?.session?.accessToken);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Wait for auth to be fully loaded and user to be authenticated
    if (authLoading) return;
    if (!user?.id) return;
    if (!isAuthenticated) return;
    if (!hasValidSession()) return;
    
    loadOrganizations();
  }, [user?.id, authLoading, isAuthenticated]);

  const loadOrganizations = async () => {
    if (!user) return;
    
    try {
      await loadMemberships(user.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive'
      });
    }
  };

  const handleOrganizationCreated = async (orgId: string, profileId?: string) => {
    setShowCreateForm(false);
    await loadOrganizations();
    toast({
      title: 'Success!',
      description: 'Organization created successfully',
      variant: 'default'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your business organizations and teams
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Create Organization Form */}
      {showCreateForm && (
        <Card>
          <CardContent className="p-6">
            <CreateOrganizationForm
              onSuccess={handleOrganizationCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                </div>
                <Link to={`/organizations/${org.id}`}>
                  <Button variant="ghost" size="sm" className="px-3 py-2">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {org.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {org.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{org.member_count || 0} members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link to={`/organizations/${org.id}/settings`}>
                    <Button variant="outline" size="sm" className="px-3 py-2">
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {organizations.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Organizations</h3>
            <p className="text-muted-foreground mb-6">
              Create your first organization to start organizing your business knowledge and teams.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
