import React from 'react';
import { Outlet } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { SettingsLayout } from '../../components/settings/SettingsLayout';
import { useEnhancedUser } from '../../contexts/EnhancedUserContext';

/**
 * SettingsPage - Main settings page wrapper
 * 
 * Uses the SettingsLayout component and renders the current settings section
 * via React Router's Outlet.
 */
const SettingsPage: React.FC = () => {
  const { user } = useEnhancedUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  
  return (
    <SettingsLayout 
      title="Settings"
      description="Manage your account and application preferences"
      isAdmin={isAdmin}
    >
      <Outlet />
    </SettingsLayout>
  );
};

export default SettingsPage; 