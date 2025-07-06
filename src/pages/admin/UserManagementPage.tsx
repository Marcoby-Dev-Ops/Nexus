import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/lib/constants';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session) {
        setLoading(false);
        setError('Authentication is required to view users.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/get_users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch users');
        }

        const data = await res.json();
        setUsers(data.users.users || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !session) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/update_user_role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: selectedUser.id, role: newRole }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update role');
      }

      const { user: updatedUser } = await res.json();
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setIsModalOpen(false);
    } catch (e: any) {
      setUpdateError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const renderUserTable = () => {
    if (loading) {
      return (
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error: {error}</p>;
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Signed Up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} onClick={() => handleUserSelect(user)} className="cursor-pointer">
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  };

  return (
    <PageLayout title="User Management">
      <p className="mb-6">Here you can manage all the users in the system.</p>
      {renderUserTable()}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit User">
        {selectedUser && (
          <div className="space-y-4">
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Signed Up:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {updateError && <p className="text-destructive">{updateError}</p>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleRoleUpdate} disabled={updating}>
                {updating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}; 