import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

export const AdminPage: React.FC = () => {
  return (
    <PageLayout>
      <p>Welcome to the admin dashboard. Use the navigation on the left to manage users, roles, and tenants.</p>
    </PageLayout>
  );
}; 