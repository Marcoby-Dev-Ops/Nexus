import { KpiCard } from '../components/dashboard/KpiCard';
import { SimpleBarChart } from '../components/dashboard/SimpleBarChart';
import React from 'react';

// Mock data
const kpis = [
  { title: 'Total Records', value: 12450 },
  { title: 'Data Sources', value: 5 },
  { title: 'Last Sync', value: '2024-06-10' },
  { title: 'Active Reports', value: 8 },
];
const dataExplorer = [
  { id: 1, type: 'Invoice', name: 'INV-001', amount: 2500, date: '2024-06-10' },
  { id: 2, type: 'Deal', name: 'Acme Corp', amount: 5000, date: '2024-06-09' },
  { id: 3, type: 'Expense', name: 'AWS', amount: 200, date: '2024-06-08' },
];
const chartData = [
  { name: 'Jan', value: 2000 },
  { name: 'Feb', value: 3500 },
  { name: 'Mar', value: 4000 },
  { name: 'Apr', value: 3200 },
  { name: 'May', value: 5000 },
  { name: 'Jun', value: 4200 },
];
const aiInsights = [
  'No anomalies detected in the last sync.',
  'Revenue trend is up 8% over last quarter.',
];

export default function DataWarehouseHome() {
  return (
    <div className="p-8 space-y-8">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} />
        ))}
      </div>
      {/* Data Explorer */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Data Explorer</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {dataExplorer.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.type}</td>
                <td className="p-2">{row.name}</td>
                <td className="p-2">${row.amount.toLocaleString()}</td>
                <td className="p-2">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Revenue Trend</h3>
          <SimpleBarChart data={chartData} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Records by Month</h3>
          <SimpleBarChart data={chartData} />
        </div>
      </div>
      {/* AI Insights & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">AI Insights</h3>
          <ul className="list-disc pl-5">
            {aiInsights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
        <QuickActions />
      </div>
    </div>
  );
}

// Stub: QuickActions
function QuickActions() {
  return (
    <div className="rounded-xl border p-4 mb-8">
      <h3 className="font-semibold mb-2">Quick Actions</h3>
      <div className="flex gap-2 flex-wrap">
        <button className="bg-primary text-white rounded px-4 py-2">Export Data</button>
        <button className="bg-secondary text-black rounded px-4 py-2">Connect Source</button>
        <button className="bg-muted text-black rounded px-4 py-2">Run Report</button>
      </div>
    </div>
  );
} 