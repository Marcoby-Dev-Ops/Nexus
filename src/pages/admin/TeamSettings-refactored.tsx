import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Users, Mail, MoreVertical } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { Role, hasPermission } from '@/lib/permissions';
import { PermissionGate } from '@/shared/components/patterns/PermissionGate';

// Mock team members data
const teamMembers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'member' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'guest' },
];

const TeamSettings: React.FC = () => {
  const { user } = useUser();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  
  // ✅ REFACTORED: Use RBAC utility instead of hardcoded role checks
  const canManageTeam = hasPermission(user?.role as Role, "edit_users");
  
  // Handle invitation submission
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Inviting ${inviteEmail} as ${inviteRole}`);
    setInviteEmail('');
  };

  // ✅ NEW: Helper function for role display
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'owner': return 'Owner';
      case 'member': return 'Member';
      case 'guest': return 'Guest';
      default: return role;
    }
  };

  // ✅ NEW: Helper function for badge variant
  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' || role === 'owner' ? 'default' : 'outline';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Team Management</h2>
        <p className="text-muted-foreground">Manage your team members and their access</p>
      </div>
      
      <Separator />
      
      {/* ✅ REFACTORED: Use PermissionGate for conditional rendering */}
      <PermissionGate permission="edit_users" userRole={user?.role as Role}>
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
      </PermissionGate>
      
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
                      {/* ✅ REFACTORED: Use helper functions for consistent display */}
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleDisplayName(member.role)}
                      </Badge>
                      
                      {/* ✅ NEW: Only show edit options if user has permission */}
                      <PermissionGate permission="edit_users" userRole={user?.role as Role}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* ✅ NEW: Show access denied message for users without permissions */}
      <PermissionGate 
        permission="edit_users" 
        userRole={user?.role as Role}
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to manage team members. Contact your administrator for access.
              </CardDescription>
            </CardHeader>
          </Card>
        }
        showFallback={true}
      >
        {/* Team management content is already wrapped above */}
      </PermissionGate>
    </div>
  );
};

export default TeamSettings; 