import React from 'react';
import { UnifiedLayout } from './UnifiedLayout';
import { MemoryRouter } from 'react-router-dom';

export default {
  title: 'Layout/UnifiedLayout',
  component: UnifiedLayout,
  decorators: [(story: any) => <MemoryRouter>{story()}</MemoryRouter>],
  parameters: {
    a11y: {
      // Accessibility notes
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-roles', enabled: true },
        ],
      },
    },
  },
};

export const Default = () => (
  <UnifiedLayout>
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Main Content</h2>
      <p>This is a demo of the UnifiedLayout with sidebar, topbar, and global search (Ctrl+K).</p>
    </div>
  </UnifiedLayout>
); 