import React from 'react';

// Mock data
const featuredModules = [
  { name: 'Invoice', description: 'Manage and send invoices.', featured: true },
  { name: 'Analytics', description: 'Business analytics and insights.', featured: true },
  { name: 'CRM', description: 'Customer relationship management.', featured: false },
  { name: 'Inventory', description: 'Track stock and orders.', featured: false },
];
const recentlyAdded = [
  { name: 'Payroll', description: 'Automate payroll and compliance.' },
  { name: 'Time Tracking', description: 'Track employee hours and productivity.' },
];
const aiRecommendations = [
  'You might like: "Expense Management" module.',
  'Integrate with QuickBooks for seamless accounting.',
];

export default function Marketplace() {
  return (
    <div className="p-8 space-y-8">
      {/* Featured Modules */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Featured Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredModules.filter(m => m.featured).map((mod) => (
            <ModuleCard key={mod.name} name={mod.name} description={mod.description} />
          ))}
        </div>
      </div>
      {/* Quick Actions */}
      <QuickActions />
      {/* Recently Added */}
      <div>
        <h3 className="font-semibold mb-2">Recently Added</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentlyAdded.map((mod) => (
            <ModuleCard key={mod.name} name={mod.name} description={mod.description} />
          ))}
        </div>
      </div>
      {/* AI Recommendations */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">AI Recommendations</h3>
        <ul className="list-disc pl-5">
          {aiRecommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Stub: ModuleCard
function ModuleCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="rounded-lg border p-4 shadow bg-white">
      <h4 className="font-semibold mb-1">{name}</h4>
      <p className="text-muted-foreground mb-2 text-sm">{description}</p>
      <button className="bg-primary text-white rounded px-4 py-2 text-sm">Install</button>
    </div>
  );
}

// Stub: QuickActions
function QuickActions() {
  return (
    <div className="rounded-xl border p-4 mb-8">
      <h3 className="font-semibold mb-2">Quick Actions</h3>
      <div className="flex gap-2 flex-wrap">
        <button className="bg-primary text-white rounded px-4 py-2">Browse All</button>
        <button className="bg-secondary text-black rounded px-4 py-2">Request Module</button>
      </div>
    </div>
  );
} 