import React from 'react';

// Mock data
const users = [
  { id: 1, name: 'Alice', email: 'alice@email.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob', email: 'bob@email.com', role: 'Manager', status: 'Active' },
  { id: 3, name: 'Carol', email: 'carol@email.com', role: 'User', status: 'Invited' },
];
const teams = [
  { id: 1, name: 'Sales', members: 5 },
  { id: 2, name: 'Finance', members: 3 },
  { id: 3, name: 'Operations', members: 4 },
];
const activityLog = [
  { action: 'Invited user', who: 'Alice', date: '2024-06-10' },
  { action: 'Changed logo', who: 'Bob', date: '2024-06-09' },
];
const aiInsights = [
  'Carol has not accepted her invite (3 days).',
  'No security issues detected.',
];

export default function AdminHome() {
  return (
    <div className="p-8 space-y-8">
      {/* Quick Actions */}
      <QuickActions />
      {/* User Management */}
      <div className="rounded-xl border p-4 bg-card">
        <h3 className="font-semibold mb-2">User Management</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Team Management */}
      <div className="rounded-xl border p-4 bg-card">
        <h3 className="font-semibold mb-2">Team Management</h3>
        <ul className="divide-y">
          {teams.map((team) => (
            <li key={team.id} className="py-2 flex justify-between">
              <span>{team.name}</span>
              <span className="text-xs text-muted-foreground dark:text-gray-200">{team.members} members</span>
            </li>
          ))}
        </ul>
      </div>
      {/* System Settings */}
      <div className="rounded-xl border p-4 bg-card">
        <h3 className="font-semibold mb-2">System Settings</h3>
        <ul className="list-disc pl-5">
          <li>Branding: <span className="text-muted-foreground dark:text-gray-200">Nexus OS</span></li>
          <li>Integrations: <span className="text-muted-foreground dark:text-gray-200">QuickBooks, Slack</span></li>
          <li>Preferences: <span className="text-muted-foreground dark:text-gray-200">Dark mode enabled</span></li>
        </ul>
      </div>
      {/* Activity Log & AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4 bg-card">
          <h3 className="font-semibold mb-2">Activity Log</h3>
          <ul className="divide-y">
            {activityLog.map((a, i) => (
              <li key={i} className="py-2">
                {a.action} by <span className="font-medium">{a.who}</span> <span className="text-xs text-muted-foreground dark:text-gray-200">({a.date})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4 bg-card">
          <h3 className="font-semibold mb-2">AI Insights</h3>
          <ul className="list-disc pl-5">
            {aiInsights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Stub: QuickActions
function QuickActions() {
  return (
    <div className="rounded-xl border p-4 mb-8 bg-card">
      <h3 className="font-semibold mb-2">Quick Actions</h3>
      <div className="flex gap-2 flex-wrap">
        <button className="bg-primary text-white rounded px-4 py-2">Invite User</button>
        <button className="bg-secondary text-black rounded px-4 py-2">Add Team</button>
        <button className="bg-muted text-black rounded px-4 py-2">Change Logo</button>
      </div>
    </div>
  );
} 