import { KpiCard } from '../../components/dashboard/KpiCard';
import React from 'react';

// Mock data
const opsSummary = [
  { title: 'Open Tasks', value: 12 },
  { title: 'In Progress', value: 7 },
  { title: 'Completed', value: 34 },
  { title: 'Overdue', value: 2 },
];
const kanban = {
  todo: [
    { id: 1, task: 'Order supplies' },
    { id: 2, task: 'Schedule team meeting' },
  ],
  inProgress: [
    { id: 3, task: 'Inventory check' },
  ],
  done: [
    { id: 4, task: 'Send weekly report' },
  ],
};
const activityFeed = [
  { type: 'task', note: 'Completed inventory check', date: '2024-06-10' },
  { type: 'process', note: 'Updated SOP for onboarding', date: '2024-06-09' },
];
const aiSuggestions = [
  '2 tasks are overdue. Consider reassigning.',
  'No process bottlenecks detected.',
];

export default function OperationsHome() {
  return (
    <div className="p-8 space-y-8">
      {/* Operations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {opsSummary.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} />
        ))}
      </div>
      {/* Kanban Board */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Kanban Board</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KanbanColumn title="To Do" items={kanban.todo} />
          <KanbanColumn title="In Progress" items={kanban.inProgress} />
          <KanbanColumn title="Done" items={kanban.done} />
        </div>
      </div>
      {/* Activity Feed & AI Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Activity Feed</h3>
          <ul className="divide-y">
            {activityFeed.map((a, i) => (
              <li key={i} className="py-2">
                {a.note} <span className="text-xs text-muted-foreground dark:text-gray-200">({a.date})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">AI Suggestions</h3>
          <ul className="list-disc pl-5">
            {aiSuggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Stub: KanbanColumn
function KanbanColumn({ title, items }: { title: string; items: { id: number; task: string }[] }) {
  return (
    <div className="bg-muted rounded-lg p-3 min-h-[120px]">
      <h4 className="font-semibold mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="bg-white rounded p-2 shadow text-sm">{item.task}</li>
        ))}
      </ul>
    </div>
  );
} 