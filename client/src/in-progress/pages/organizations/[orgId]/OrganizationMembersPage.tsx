import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/ui/components/Toast';
import { useAuth } from '@/hooks/index';
import { useOrganizationStore, type OrganizationMember } from '@/shared/stores/organizationStore';
import { Building2, ArrowLeft, Plus, Search, Mail, UserPlus, MoreVertical, Edit, Trash2 } from 'lucide-react';

export const OrganizationMembersPage: React.FC = () => {
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

  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  useEffect(() => {
    if (orgId) {
      loadOrganizationDetails(orgId);
      loadOrganizationMembers(orgId);
    }

    return () => {
      clearCurrentOrg();
    };
  }, [orgId]);

  const filteredMembers = members.filter(member => 
    member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      // TODO: Implement member invitation service call
      toast({
        title: 'Success',
        description: `Invitation sent to ${inviteEmail}`,
        variant: 'default'
      });
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      // TODO: Implement member role update service call
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this organization?`)) {
      return;
    }

    try {
      // TODO: Implement member removal service call
      toast({
        title: 'Success',
        description: `${memberName} has been removed from the organization`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
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
            <p className="text-muted-foreground">Loading organization members...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Organization Members</h1>
            <p className="text-muted-foreground">
              Manage members of {organization.name}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium mb-2">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={handleInviteMember} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredMembers.length} of {members.length} members
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{member.user?.email || 'No email'}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                  {member.is_primary && (
                    <Badge variant="outline">Primary</Badge>
                  )}
                  <div className="relative">
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {/* TODO: Add dropdown menu for member actions */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No members match your search.' : 'This organization has no members yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowInviteForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
