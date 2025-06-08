import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Phone, Mail, FileText, User, CheckCircle, MessageSquare } from 'lucide-react';

/**
 * @interface Activity
 * @description Represents a sales activity for the feed.
 */
export interface Activity {
  type: string;
  user: string;
  description: string;
  timestamp: string;
  context: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  context: string;
}

/**
 * @name ActivityFeed
 * @description Displays a list of recent sales activities with icons, context filtering, and filter UI.
 * @param {ActivityFeedProps} props
 * @returns {JSX.Element}
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, context }) => {
  // Placeholder filter state
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Get unique types and users for dropdowns
  const types = Array.from(new Set(activities.filter(a => a.context === context).map(a => a.type)));
  const users = Array.from(new Set(activities.filter(a => a.context === context).map(a => a.user)));

  // Filter activities by context and selected filters
  const filtered = activities.filter(a =>
    a.context === context &&
    (selectedType === 'all' || a.type === selectedType) &&
    (selectedUser === 'all' || a.user === selectedUser)
  );

  const iconMap: Record<string, React.ElementType> = {
    call: Phone,
    email: Mail,
    note: MessageSquare,
    deal: FileText,
    login: User,
    closed: CheckCircle,
    payment: CheckCircle,
    expense: FileText,
    task: CheckCircle,
    process: FileText,
  };

  return (
    <div className="rounded-xl border p-4 bg-background">
      <h3 className="font-semibold mb-3">Recent Activity</h3>
      {/* Filter UI */}
      <div className="flex gap-2 mb-3">
        <select
          className="border rounded px-4 py-4 text-sm"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
        <select
          className="border rounded px-4 py-4 text-sm"
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
        >
          <option value="all">All Users</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
      </div>
      <ul className="divide-y">
        {filtered.length === 0 && (
          <li className="py-4 text-center text-muted-foreground">No recent activity.</li>
        )}
        {filtered.map((a: Activity, i: number) => {
          const Icon = iconMap[a.type] || FileText;
          return (
            <li key={i} className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40 rounded-lg px-4">
              <Icon className="w-5 h-5 text-primary/70 shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{a.user}</span> {a.description}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{a.timestamp}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      user: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      context: PropTypes.string.isRequired,
    })
  ).isRequired,
  context: PropTypes.string.isRequired,
};

export default ActivityFeed; 