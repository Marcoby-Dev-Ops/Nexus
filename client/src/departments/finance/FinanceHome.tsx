import { KpiCard } from '../../components/dashboard/KpiCard';
import { SimpleBarChart } from '../../components/dashboard/SimpleBarChart';
import React from 'react';

// Mock data
const financeSummary = {
  mtdRevenue: 12000,
  qtdRevenue: 34000,
  ytdRevenue: 120000,
  cashOnHand: 45000,
  expenses: 8000,
  netProfit: 4000,
};
const invoices = [
  { number: 'INV-001', client: 'Acme Corp', amount: 2500, status: 'Paid', due: '2024-06-01' },
  { number: 'INV-002', client: 'Beta LLC', amount: 1800, status: 'Unpaid', due: '2024-06-15' },
  { number: 'INV-003', client: 'Gamma Inc.', amount: 3200, status: 'Overdue', due: '2024-05-30' },
];
const expenses = [
  { category: 'Salaries', amount: 4000 },
  { category: 'Software', amount: 1200 },
  { category: 'Marketing', amount: 900 },
  { category: 'Travel', amount: 600 },
];
const recentExpenses = [
  { date: '2024-06-10', category: 'Software', amount: 200 },
  { date: '2024-06-09', category: 'Travel', amount: 150 },
];
const cashFlowData = [
  { name: 'Week 1', value: 5000 },
  { name: 'Week 2', value: 3000 },
  { name: 'Week 3', value: 7000 },
  { name: 'Week 4', value: 2000 },
];
const aiInsights = [
  'Upcoming bill: $1,200 due to AWS on 2024-06-20.',
  'Unusual spending detected in Marketing category.',
  'Cash flow risk: Low balance projected in 2 weeks.',
];
const activityFeed = [
  { type: 'payment', note: 'Received $2,500 from Acme Corp', date: '2024-06-10' },
  { type: 'expense', note: 'Paid $200 for software', date: '2024-06-09' },
];

export default function FinanceHome() {
  return (
    <div className="p-8 space-y-8">
      {/* Finance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="MTD Revenue" value={`$${financeSummary.mtdRevenue.toLocaleString()}`} />
        <KpiCard title="YTD Revenue" value={`$${financeSummary.ytdRevenue.toLocaleString()}`} />
        <KpiCard title="Cash on Hand" value={`$${financeSummary.cashOnHand.toLocaleString()}`} />
        <KpiCard title="Net Profit" value={`$${financeSummary.netProfit.toLocaleString()}`} />
      </div>
      {/* Cash Flow Chart & Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Cash Flow</h3>
          <SimpleBarChart data={cashFlowData} />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Top Expenses</h3>
          <ul className="divide-y">
            {expenses.map((e) => (
              <li key={e.category} className="flex justify-between py-2">
                <span>{e.category}</span>
                <span>${e.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Invoices Table */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Invoices</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Invoice #</th>
              <th className="text-left p-2">Client</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.number} className="border-t">
                <td className="p-2">{inv.number}</td>
                <td className="p-2">{inv.client}</td>
                <td className="p-2">${inv.amount.toLocaleString()}</td>
                <td className="p-2">{inv.status}</td>
                <td className="p-2">{inv.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Recent Expenses & AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Recent Expenses</h3>
          <ul className="divide-y">
            {recentExpenses.map((e, i) => (
              <li key={i} className="py-2">
                <span>{e.date}</span> - <span>{e.category}</span> <span className="text-xs text-muted-foreground dark:text-gray-200">${e.amount}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">AI Insights</h3>
          <ul className="list-disc pl-5">
            {aiInsights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
      {/* Activity Feed */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">Activity Feed</h3>
        <ul className="divide-y">
          {activityFeed.map((a, i) => (
            <li key={i} className="py-2">
              {a.type === 'payment' ? '💸' : '🧾'} {a.note} <span className="text-xs text-muted-foreground dark:text-gray-200">({a.date})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 