import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, MoreHorizontal, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Separator } from '@/shared/components/ui/Separator';
import { Badge } from '@/shared/components/ui/Badge';
import { Avatar } from '@/shared/components/ui/Avatar';
import { useAuth } from '@/hooks/index';
import { useService } from '@/shared/hooks/useService';
import { useCompany } from '@/shared/contexts/CompanyContext';
import { logger } from '@/shared/utils/logger';
import { useFormWithValidation } from '@/shared/hooks/useFormWithValidation';
import { z } from 'zod';

// Team invitation schema
const teamInvitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member', 'guest'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
});

type TeamInvitationData = z.infer<typeof teamInvitationSchema>;

// Team member interface
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  status: 'active' | 'invited' | 'inactive';
  lastActive: string;
  avatar?: string;
}

// Team role interface
interface TeamRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

// Mock team roles (could be moved to service later)
const teamRoles: TeamRole[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all settings and billing',
    permissions: ['all']
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Can manage team members and most settings',
    permissions: ['manage_team', 'manage_settings', 'view_billing']
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Can use the application but cannot manage team settings',
    permissions: ['use_app', 'create_content']
  },
  {
    id: 'guest',
    name: 'Guest',
    description: 'Limited access to specific features only',
    permissions: ['view_content']
  },
];

/**
 * TeamSettings - Team management settings page
 * 
 * Allows administrators to:
 * - View and manage team members
 * - Invite new team members
 * - Set roles and permissions
 * - Remove team members
 */
const TeamSettings: React.FC = () => {
  const { user } = useAuth();
  const { company } = useCompany();

  // Use UserService for team member management
  const userService = useService('user');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch team members data
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!company?.id) return;

      setIsLoadingTeam(true);
      try {
        const result = await userService.list({ company_id: company.id });
        if (result.success && result.data) {
          setTeamMembers(result.data);
        }
      } catch (error) {
        logger.error('Failed to fetch team members:', error);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeamMembers();
  }, [company?.id, userService]);

  // Initialize form with our new pattern
  const { form, handleSubmit, isSubmitting, isValid, errors } = useFormWithValidation({
    schema: teamInvitationSchema,
    defaultValues: {
      email: '',
      role: 'member' as const
    },
    onSubmit: async (data: TeamInvitationData) => {
      if (!company?.id) return;

      setIsInviting(true);
      try {
        const result = await userService.create({
          email: data.email,
          role: data.role,
          company_id: company.id,
          status: 'invited'
        });

        if (result.success) {
          // Reset form after successful invitation
          form.reset();
          // Refresh team members list
          const refreshResult = await userService.list({ company_id: company.id });
          if (refreshResult.success && refreshResult.data) {
            setTeamMembers(refreshResult.data);
          }
        } else {
          throw new Error(result.error || 'Failed to send invitation');
        }
      } catch (error) {
        throw new Error('Failed to send invitation');
      } finally {
        setIsInviting(false);
      }
    },
    successMessage: 'Invitation sent successfully!',
  });

  // Check if user is admin or owner
  const canManageTeam = user?.role === 'admin' || user?.role === 'owner';

  // Handle role updates
  const handleRoleUpdate = async (memberId: string, newRole: string) => {
    setIsUpdatingRole(true);
    try {
      const result = await userService.update(memberId, { role: newRole });
      if (result.success) {
        // Refresh team members list
        if (company?.id) {
          const refreshResult = await userService.list({ company_id: company.id });
          if (refreshResult.success && refreshResult.data) {
            setTeamMembers(refreshResult.data);
          }
        }
      } else {
        logger.error('Failed to update role:', result.error);
      }
    } catch (error) {
      logger.error('Failed to update role:', error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    setIsRemoving(true);
    try {
      const result = await userService.delete(memberId);
      if (result.success) {
        // Refresh team members list
        if (company?.id) {
          const refreshResult = await userService.list({ company_id: company.id });
          if (refreshResult.success && refreshResult.data) {
            setTeamMembers(refreshResult.data);
          }
        }
      } else {
        logger.error('Failed to remove member:', result.error);
      }
    } catch (error) {
      logger.error('Failed to remove member:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Show loading state while fetching team data
  if (isLoadingTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">Manage your team members and their access</p>
        </div>
        <Separator />
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading team information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert service data to team members format
  const teamMembersList: TeamMember[] = teamMembers?.map((member: any) => ({
    id: member.id,
    name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
    email: member.email,
    role: member.role || 'member',
    status: member.status || 'active',
    lastActive: member.last_login ? '2 hours ago' : 'Never',
    avatar: member.avatar_url
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Management</h2>
        <p className="text-muted-foreground">Manage your team members and their access</p>
      </div>

      <Separator />

      {/* Invite Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Invite Team Members
          </CardTitle>
          <CardDescription>Add new people to your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm: flex-row gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email address"
                className="pl-9"
                {...form.register('email')}
                disabled={!canManageTeam || isSubmitting}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value as 'admin' | 'member' | 'guest')}
              disabled={!canManageTeam || isSubmitting}
            >
              <SelectTrigger className="w-full sm: w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!canManageTeam || isSubmitting}>
              Send Invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members
          </CardTitle>
          <CardDescription>Manage your team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembersList.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-md hover: bg-muted transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <span>{member.name.charAt(0)}</span>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                        {member.role === 'admin' ? 'Admin' :
                          member.role === 'owner' ? 'Owner' : 'Member'}
                      </Badge>
                      {member.status === 'invited' && (
                        <Badge variant="outline" className="border-amber-500 text-amber-500">
                          Invited
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last active: {member.lastActive}
                    </p>
                  </div>

                  {canManageTeam && member.id.toString() !== user?.id && (
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRoleUpdate(member.id, 'admin')}>
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRoleUpdate(member.id, 'member')}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRemoveMember(member.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Role Permissions
          </CardTitle>
          <CardDescription>Understand what each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamRoles.map((role) => (
              <div key={role.id} className="p-4 border border-border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={role.id === 'owner' || role.id === 'admin' ? 'default' : 'outline'}>
                      {role.name}
                    </Badge>
                  </div>
                  {role.id === user?.role && (
                    <Badge variant="outline" className="border-success text-success">
                      Your Role
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>

                <div className="grid grid-cols-2 md: grid-cols-4 gap-2 mt-3">
                  {[
                    { permission: 'View content', owner: true, admin: true, member: true, guest: true },
                    { permission: 'Create content', owner: true, admin: true, member: true, guest: false },
                    { permission: 'Invite members', owner: true, admin: true, member: false, guest: false },
                    { permission: 'Remove members', owner: true, admin: true, member: false, guest: false },
                    { permission: 'Manage billing', owner: true, admin: false, member: false, guest: false },
                    { permission: 'Manage roles', owner: true, admin: true, member: false, guest: false },
                    { permission: 'Delete workspace', owner: true, admin: false, member: false, guest: false },
                    { permission: 'Access all features', owner: true, admin: true, member: true, guest: false },
                  ].map((perm, i) => (
                    <div key={i} className="flex items-center space-x-1 text-xs">
                      {perm[role.id as keyof typeof perm] ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span>{perm.permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamSettings; 
