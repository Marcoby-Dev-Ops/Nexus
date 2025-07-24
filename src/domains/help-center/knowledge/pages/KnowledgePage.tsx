import React from "react";
import { ThoughtDashboard } from '@/shared/features/knowledge/components/ThoughtDashboard';

const KnowledgePage: React.FC = () => {
  // Placeholder for loading and error state (replace with real data fetching if needed)
  const [loading] = React.useState(false);
  const [error] = React.useState<string | null>(null);

  if (loading) return <div>Loading knowledge base...</div>;
  if (error) return <div role="alert">Error: {error}</div>;

  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Knowledge Management</h1>
      <ThoughtDashboard />
    </main>
  );
};

export default KnowledgePage; 