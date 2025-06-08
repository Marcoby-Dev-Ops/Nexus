import React from 'react';
import { Users, Settings, Shield, Activity, Database, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { PageTemplates } from '@/components/patterns/PageTemplates';
import { ContentCard } from '@/components/patterns/ContentCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';

/**
 * @name AdminHome
 * @description Admin panel dashboard for managing NEXUS settings and system administration.
 * @returns {JSX.Element} The rendered AdminHome component.
 */

// Sample data for the admin dashboard
const adminKpiData = [
  { title: 'Active Users', value: 24, delta: '+3', trend: 'up' },
  { title: 'System Uptime', value: '99.9%', delta: '+0.1%', trend: 'up' },
  { title: 'Storage Used', value: '1.2TB', delta: '+8.5%', trend: 'up' },
  { title: 'API Calls', value: '45.2K', delta: '+12.3%', trend: 'up' },
];

const userActivityData = [
  { name: 'Mon', value: 18 },
  { name: 'Tue', value: 22 },
  { name: 'Wed', value: 19 },
  { name: 'Thu', value: 24 },
  { name: 'Fri', value: 21 },
  { name: 'Sat', value: 8 },
  { name: 'Sun', value: 6 },
];

const systemHealthData = [
  { name: 'CPU', value: 65 },
  { name: 'Memory', value: 78 },
  { name: 'Storage', value: 45 },
  { name: 'Network', value: 32 },
];

const recentUsers = [
  { name: 'John Doe', email: 'john@company.com', role: 'Admin', lastActive: '2 minutes ago', status: 'online' },
  { name: 'Jane Smith', email: 'jane@company.com', role: 'Manager', lastActive: '15 minutes ago', status: 'online' },
  { name: 'Mike Johnson', email: 'mike@company.com', role: 'User', lastActive: '1 hour ago', status: 'offline' },
  { name: 'Sarah Wilson', email: 'sarah@company.com', role: 'User', lastActive: '2 hours ago', status: 'offline' },
];

const systemAlerts = [
  { type: 'warning', message: 'High memory usage detected on server 2', time: '5 minutes ago' },
  { type: 'info', message: 'Scheduled backup completed successfully', time: '1 hour ago' },
  { type: 'success', message: 'System update installed successfully', time: '2 hours ago' },
  { type: 'warning', message: 'SSL certificate expires in 30 days', time: '1 day ago' },
];

const quickActions = [
  { label: 'User Management', icon: <Users className="w-5 h-5" />, onClick: () => console.log('User Management') },
  { label: 'System Settings', icon: <Settings className="w-5 h-5" />, onClick: () => console.log('System Settings') },
  { label: 'Security Center', icon: <Shield className="w-5 h-5" />, onClick: () => console.log('Security Center') },
  { label: 'System Logs', icon: <Activity className="w-5 h-5" />, onClick: () => console.log('System Logs') },
];

const AdminHome: React.FC = () => {
  return (
    <PageTemplates.Department
      title="Admin Panel"
      subtitle="Manage your NEXUS settings, users, and system administration"
    >
      {/* Quick Actions */}
      <ContentCard title="Quick Actions" variant="elevated" className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="p-4 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 mb-3">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </ContentCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {adminKpiData.map((kpi, index) => (
          <KpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* System Health and User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ContentCard 
          title="User Activity" 
          variant="elevated"
          className="hover:shadow-xl transition-all duration-300"
        >
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Daily active users (last 7 days)</p>
          </div>
          <SimpleBarChart data={userActivityData} />
        </ContentCard>

        <ContentCard 
          title="System Health" 
          variant="elevated"
          className="hover:shadow-xl transition-all duration-300"
        >
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Resource utilization percentage</p>
          </div>
          <SimpleBarChart data={systemHealthData} />
        </ContentCard>
      </div>

      {/* Recent Users and System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ContentCard 
          title="Recent Users" 
          variant="elevated"
          action={
            <button className="px-4 py-2 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
              Manage Users
            </button>
          }
        >
          <div className="space-y-4">
            {recentUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{user.name}</h4>
                    <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'online' ? 'bg-success/10 text-success' : 'bg-muted text-foreground'
                  }`}>
                    {user.status}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{user.lastActive}</p>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard 
          title="System Alerts" 
          variant="elevated"
          action={
            <button className="px-4 py-2 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
              View All Alerts
            </button>
          }
        >
          <div className="space-y-4">
            {systemAlerts.map((alert, index) => {
              const getIcon = (type: string) => {
                switch (type) {
                  case 'warning': return <AlertTriangle className="w-5 h-5" />;
                  case 'success': return <CheckCircle className="w-5 h-5" />;
                  case 'info': return <Activity className="w-5 h-5" />;
                  default: return <Activity className="w-5 h-5" />;
                }
              };

              const getColor = (type: string) => {
                switch (type) {
                  case 'warning': return 'bg-warning/10 text-warning';
                  case 'success': return 'bg-success/10 text-success';
                  case 'info': return 'bg-primary/10 text-primary';
                  default: return 'bg-muted text-muted-foreground';
                }
              };

              return (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                  <div className={`p-2 rounded-lg ${getColor(alert.type)}`}>
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ContentCard>
      </div>
    </PageTemplates.Department>
  );
};

export default AdminHome; 