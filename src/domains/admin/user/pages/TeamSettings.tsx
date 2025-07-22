import React, { useState } from 'react';
import { Users, UserPlus, Mail, Shield, MoreHorizontal, User, Check, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Separator } from '../../components/ui/Separator';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';

// Mock team member data
const teamMembers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'admin', status: 'active', lastActive: '2 hours ago' },
  { id: 2, name: 'Mike Roberts', email: 'mike@example.com', role: 'member', status: 'active', lastActive: '5 hours ago' },
  { id: 3, name: 'David Lee', email: 'david@example.com', role: 'member', status: 'active', lastActive: '1 day ago' },
  { id: 4, name: 'Emma Stevens', email: 'emma@example.com', role: 'member', status: 'invited', lastActive: 'Never' },
  { id: 5, name: 'Alex Chen', email: 'alex@example.com', role: 'member', status: 'active', lastActive: '3 days ago' },
];

// Mock team roles
const teamRoles = [
  { id: 'owner', name: 'Owner', description: 'Full access to all settings and billing' },
  { id: 'admin', name: 'Admin', description: 'Can manage team members and most settings' },
  { id: 'member', name: 'Member', description: 'Can use the application but cannot manage team settings' },
  { id: 'guest', name: 'Guest', description: 'Limited access to specific features only' },
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
  const { user } = useAuthContext();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  
  // Check if user is admin or owner
  const canManageTeam = user?.role === 'admin' || user?.role === 'owner';
  
  // Handle invitation submission
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Inviting ${inviteEmail} as ${inviteRole}`);
    // Implementation would send invitation
    setInviteEmail('');
  };
  
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
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email address"
                className="pl-9"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                type="email"
                disabled={!canManageTeam}
              />
            </div>
            <Select 
              value={inviteRole} 
              onValueChange={setInviteRole}
              disabled={!canManageTeam}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!canManageTeam}>
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
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-md hover:bg-muted transition-colors">
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
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
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
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