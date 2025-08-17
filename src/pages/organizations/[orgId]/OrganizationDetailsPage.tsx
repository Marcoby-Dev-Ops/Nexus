import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/ui/components/Toast';
import { useAuth } from '@/hooks/index';
import { useOrganizationStore, type Organization, type OrganizationMember } from '@/shared/stores/organizationStore';
import { Building2, Users, Settings, Calendar, ArrowLeft, Edit, Plus } from 'lucide-react';

export const OrganizationDetailsPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    currentOrg: organization,
    currentOrgMembers: members,
    loading,
    loadOrganizationDetails,
    loadOrganizationMembers,
    clearCurrentOrg
  } = useOrganizationStore();

  useEffect(() => {
    if (orgId) {
      loadOrganizationDetails(orgId);
      loadOrganizationMembers(orgId);
    }

    // Cleanup when component unmounts
    return () => {
      clearCurrentOrg();
    };
  }, [orgId]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading organization...</p>
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
                      <Link to="/organizations">
                        <Button variant="ghost" size="sm">
                          <div className="flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                          </div>
                        </Button>
                      </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <p className="text-muted-foreground">
              Organization details and member management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
                      <Link to={`/organizations/${orgId}/settings`}>
                        <Button variant="outline">
                          <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </div>
                        </Button>
                      </Link>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  Organization Information
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg font-semibold">{organization.name}</p>
              </div>
              {organization.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{organization.description}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{organization.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  Members ({members.length})
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.user?.name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      {member.is_primary && (
                        <Badge variant="outline">Primary</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                              <Link to={`/organizations/${orgId}/business-profile`}>
                                <Button variant="outline" className="w-full justify-start">
                                  <div className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Business Profile
                                  </div>
                                </Button>
                              </Link>
                              <Link to={`/organizations/${orgId}/members`}>
                                <Button variant="outline" className="w-full justify-start">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Manage Members
                                  </div>
                                </Button>
                              </Link>
                              <Link to={`/organizations/${orgId}/settings`}>
                                <Button variant="outline" className="w-full justify-start">
                                  <div className="flex items-center">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Organization Settings
                                  </div>
                                </Button>
                              </Link>
            </CardContent>
          </Card>

          {/* Organization Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="font-semibold">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Projects</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Knowledge Items</span>
                <span className="font-semibold">24</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
