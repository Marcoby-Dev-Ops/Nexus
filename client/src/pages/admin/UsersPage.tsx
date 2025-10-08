import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { userService } from '@/services/core/UserService';
import { useToast } from '@/shared/components/ui/use-toast';
import { Trash2, Edit2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: async () => {
      const result = query ? await userService.search(query) : await userService.list();
      if (!result.success) throw new Error(result.error || 'Failed to load users');
      return result.data || [];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await userService.delete(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete user');
      return result.data;
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User deleted', description: 'User was removed successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: String(err?.message || err) });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const result = await userService.update(id, patch);
      if (!result.success) throw new Error(result.error || 'Failed to update user');
      return result.data;
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User updated', description: 'Changes saved.' });
    },
    onError: (err: any) => {
      toast({ title: 'Update failed', description: String(err?.message || err) });
    }
  });

  return (
    <PageLayout title="User Management">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Search, inspect, and manage application users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by name or email" />
              </div>
              <div className="ml-4 flex-shrink-0 space-x-2">
                <Button onClick={() => refetch()} disabled={isLoading}>Refresh</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users || []).map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.full_name || `${u.first_name || ''} ${u.last_name || ''}`}</TableCell>
                    <TableCell>{u.email || u.business_email || '-'}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: u.id, patch: { role: u.role === 'admin' ? 'user' : 'admin' } })}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(u.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default UsersPage;
