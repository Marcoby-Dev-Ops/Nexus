import React from 'react';
import { useIntegrations } from '@/hooks/integrations/useIntegrations';

// TODO(IntegrationsDashboard Placeholder): This simplified placeholder exists to keep
// the app building while the full Integrations dashboard (with OAuth + CRUD flows)
// is refactored and lint noise reduced. It should be removed once:
// 1. The production dashboard under 'src/integrations/pages/IntegrationsDashboard.tsx' is
//    fully verified with unified hooks (useIntegrations + useOAuthIntegrations) and passes lint.
// 2. All pages/routes reference the real dashboard. At that point delete this file and any
//    stale alias imports pointing at the in-progress directory.
// 3. Ensure no Storybook stories or tests still import from 'in-progress/...'.
// Removal target milestone: Post integration hook unification & database helper migration.
export const IntegrationsDashboard: React.FC = () => {
  const { integrations, isLoading, error } = useIntegrations();
  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading integrations...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error loading integrations</div>;
  return (
    <div className="p-6 text-sm text-gray-500">
      <h1 className="text-xl font-semibold mb-4">Integrations (Placeholder)</h1>
      <p className="mb-2">This simplified dashboard replaces a complex implementation during lint remediation.</p>
      <p className="mb-4">Integrations loaded: {integrations.length}</p>
      <ul className="list-disc pl-5 space-y-1">
        {integrations.map(i => <li key={i.id}>{i.id} – {i.type}</li>)}
      </ul>
    </div>
  );
};
