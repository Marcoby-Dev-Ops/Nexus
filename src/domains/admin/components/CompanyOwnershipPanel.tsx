import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Crown, Users, AlertTriangle } from 'lucide-react';
import { useCompanyOwnership } from '@/shared/hooks/useCompanyOwnership';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/lib/supabase';

interface CompanyOwnershipPanelProps {
  companyId: string;
  companyName: string;
}

interface CompanyMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role: string;
}

export const CompanyOwnershipPanel: React.FC<CompanyOwnershipPanelProps> = ({
  companyId,
  companyName
}) => {
  const { user } = useAuth();
  const {
    owner,
    isOwner,
    isLoading,
    isTransferring,
    error,
    stats,
    getOwner,
    checkOwnership,
    transferOwnership,
    getOwnershipStats
  } = useCompanyOwnership();

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (companyId) {
      getOwner(companyId);
      checkOwnership(companyId);
      getOwnershipStats();
      loadCompanyMembers();
    }
  }, [companyId, getOwner, checkOwnership, getOwnershipStats]);

  const loadCompanyMembers = async () => {
    if (!companyId) return;

    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, display_name, role')
        .eq('company_id', companyId)
        .order('role', { ascending: false })
        .order('first_name');

      if (error) {
        console.error('Error loading company members:', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading company members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner || !user?.id) return;

    const result = await transferOwnership({
      companyId,
      newOwnerId: selectedNewOwner,
      currentUserId: user.id
    });

    if (result.success) {
      setShowTransferDialog(false);
      setSelectedNewOwner('');
      // Refresh data
      await getOwner(companyId);
      await checkOwnership(companyId);
      await loadCompanyMembers();
    }
  };

  const getDisplayName = (member: CompanyMember) => {
    if (member.display_name) return member.display_name;
    if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`;
    return member.email;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="default" className="bg-yellow-500"><Crown className="w-3 h-3 mr-1" />Owner</Badge>;
      case 'admin':
        return <Badge variant="secondary">Admin</Badge>;
      case 'manager':
        return <Badge variant="outline">Manager</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading ownership information...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Owner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Company Owner
          </CardTitle>
          <CardDescription>
            The chief administrator with full control over {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {owner ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={owner.avatar_url} />
                <AvatarFallback>
                  {owner.display_name?.charAt(0) || owner.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {owner.display_name || `${owner.first_name} ${owner.last_name}` || owner.email}
                </div>
                <div className="text-sm text-muted-foreground">{owner.email}</div>
                <div className="mt-1">
                  <Badge variant="default" className="bg-yellow-500">
                    <Crown className="w-3 h-3 mr-1" />
                    Owner
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No owner assigned to this company. Contact support to resolve this issue.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ownership Transfer */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Ownership</CardTitle>
            <CardDescription>
              Transfer ownership to another team member. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Transfer Ownership
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Company Ownership</DialogTitle>
                  <DialogDescription>
                    Select a new owner for {companyName}. The new owner will have full administrative control.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">New Owner</label>
                    <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members
                          .filter(member => member.id !== user?.id)
                          .map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {getDisplayName(member)} ({member.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowTransferDialog(false)}
                    disabled={isTransferring}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTransferOwnership}
                    disabled={!selectedNewOwner || isTransferring}
                  >
                    {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Transfer Ownership
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Company Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
          <CardDescription>
            All members of {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Loading members...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {getDisplayName(member).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{getDisplayName(member)}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    {member.id === user?.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ownership Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <div className="text-sm text-muted-foreground">Total Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.companiesWithOwners}</div>
              <div className="text-sm text-muted-foreground">With Owners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.orphanedCompanies}</div>
              <div className="text-sm text-muted-foreground">Orphaned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 