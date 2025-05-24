import { KpiCard } from '../../components/dashboard/KpiCard';
import { SimpleBarChart } from '../../components/dashboard/SimpleBarChart';
import React from 'react';

// Mock data
const revenueSummary = {
  mtd: 12000,
  qtd: 34000,
  ytd: 120000,
  forecast: 15000,
  actual: 12000,
  goalPercent: 80,
  avgDealSize: 4000,
  avgSalesCycleDays: 32,
};
const pipeline = [
  { stage: 'Lead', count: 20, total: 20000, weighted: 5000 },
  { stage: 'Qualified', count: 10, total: 15000, weighted: 9000 },
  { stage: 'Proposal', count: 5, total: 10000, weighted: 7000 },
  { stage: 'Closed Won', count: 3, total: 12000, weighted: 12000 },
];
const topPerformers = [
  { rep: 'Alice', revenue: 8000, dealsClosed: 3 },
  { rep: 'Bob', revenue: 6000, dealsClosed: 2 },
];
const deals = [
  { name: 'Acme Corp', value: 5000, stage: 'Proposal', owner: 'Alice', closeDate: '2024-06-20', status: 'Active' },
  { name: 'Beta LLC', value: 7000, stage: 'Qualified', owner: 'Bob', closeDate: '2024-06-25', status: 'Active' },
];
const activityFeed = [
  { type: 'call', rep: 'Alice', note: 'Discussed pricing', date: '2024-06-10' },
  { type: 'email', rep: 'Bob', note: 'Sent proposal', date: '2024-06-09' },
];
const aiRecommendations = [
  'Deal with Beta LLC likely to close this week.',
  'Follow up with Gamma Inc. (dormant 14 days).',
];
const funnelData = pipeline.map((s) => ({ name: s.stage, value: s.count }));
const trendlineData = [
  { name: 'Mon', value: 2000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2500 },
  { name: 'Thu', value: 4000 },
  { name: 'Fri', value: 1500 },
];

export default function SalesHome() {
  return (
    <div className="p-8 space-y-8">
      {/* Revenue Summary & Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="MTD Revenue" value={`$${revenueSummary.mtd.toLocaleString()}`} />
        <KpiCard title="QTD Revenue" value={`$${revenueSummary.qtd.toLocaleString()}`} />
        <KpiCard title="YTD Revenue" value={`$${revenueSummary.ytd.toLocaleString()}`} />
        <KpiCard title="% to Goal" value={`${revenueSummary.goalPercent}%`} />
      </div>
      {/* Pipeline Funnel & Trendline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Pipeline Funnel</h3>
          <SimpleBarChart data={funnelData} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Revenue Trend</h3>
          <SimpleBarChart data={trendlineData} />
        </div>
      </div>
      {/* Top Performers */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Top Performers</h3>
        <ul className="divide-y">
          {topPerformers.map((rep) => (
            <li key={rep.rep} className="flex justify-between py-2">
              <span>{rep.rep}</span>
              <span>${rep.revenue.toLocaleString()} ({rep.dealsClosed} deals)</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Quick Actions Panel */}
      <QuickActionsPanel />
      {/* Deals Table */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Deals</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Deal</th>
              <th className="text-left p-2">Value</th>
              <th className="text-left p-2">Stage</th>
              <th className="text-left p-2">Owner</th>
              <th className="text-left p-2">Close Date</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.name} className="border-t">
                <td className="p-2">{deal.name}</td>
                <td className="p-2">${deal.value.toLocaleString()}</td>
                <td className="p-2">{deal.stage}</td>
                <td className="p-2">{deal.owner}</td>
                <td className="p-2">{deal.closeDate}</td>
                <td className="p-2">{deal.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Activity Feed & AI Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Activity Feed</h3>
          <ul className="divide-y">
            {activityFeed.map((a, i) => (
              <li key={i} className="py-2">
                <span className="font-medium">{a.rep}</span> {a.type} - {a.note} <span className="text-xs text-muted-foreground">({a.date})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">AI Recommendations</h3>
          <ul className="list-disc pl-5">
            {aiRecommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Stub: QuickActionsPanel
function QuickActionsPanel() {
  return (
    <div className="rounded-xl border p-4 mb-8">
      <h3 className="font-semibold mb-2">Quick Actions</h3>
      <div className="flex gap-2 flex-wrap">
        <button className="bg-primary text-white rounded px-4 py-2">Add Deal</button>
        <button className="bg-secondary text-black rounded px-4 py-2">Log Activity</button>
        <button className="bg-muted text-black rounded px-4 py-2">Create Quote</button>
        <button className="bg-muted text-black rounded px-4 py-2">Send Follow-up</button>
      </div>
    </div>
  );
} 