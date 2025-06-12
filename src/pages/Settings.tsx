import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        {/* Profile Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <Input
                type="text"
                value={user?.id || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <Input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            {message && (
              <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                {message.text}
              </Alert>
            )}

            <Button
              type="submit"
              isLoading={loading}
              disabled={loading}
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications about your account
                </p>
              </div>
              <Button variant="secondary" disabled>
                Coming Soon
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="secondary" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 