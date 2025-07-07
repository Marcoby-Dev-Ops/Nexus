import React from 'react';
import { Settings, Truck, Package, Users, ArrowUpRight, Plus, FileText, Wrench, Activity } from 'lucide-react';
import { PageTemplates } from '@/components/patterns/PageTemplates';
import { ContentCard } from '@/components/patterns/ContentCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

/**
 * @name OperationsHome
 * @description Operations department dashboard for managing workflows, inventory, and business processes.
 * @returns {JSX.Element} The rendered OperationsHome component.
 */

// Sample data for the operations dashboard
const operationsKpiData = [
  { title: 'Active Workflows', value: 48, delta: '+12.5%', trend: 'up' },
  { title: 'Inventory Items', value: 1284, delta: '+8.3%', trend: 'up' },
  { title: 'Process Efficiency', value: '94.2%', delta: '+5.2%', trend: 'up' },
  { title: 'Team Productivity', value: '87.5%', delta: '+3.1%', trend: 'up' },
];

const workflowData = [
  { name: 'Order Processing', value: 32 },
  { name: 'Inventory Management', value: 28 },
  { name: 'Quality Control', value: 18 },
  { name: 'Shipping', value: 15 },
  { name: 'Returns', value: 8 },
];

const productivityData = [
  { name: 'Jan', value: 85 },
  { name: 'Feb', value: 82 },
  { name: 'Mar', value: 88 },
  { name: 'Apr', value: 90 },
  { name: 'May', value: 86 },
  { name: 'Jun', value: 94 },
];

const recentActivities = [
  { description: 'Workflow: Order Processing Updated', status: 'Completed', time: '2 hours ago', type: 'workflow' },
  { description: 'Inventory: Low Stock Alert - Widget A', status: 'Pending', time: '4 hours ago', type: 'inventory' },
  { description: 'Process: Quality Check Completed', status: 'Completed', time: '6 hours ago', type: 'process' },
  { description: 'Team: Training Session Scheduled', status: 'Scheduled', time: '1 day ago', type: 'team' },
];

const quickActions = [
  { label: 'New Workflow', icon: <Activity className="w-5 h-5" />, onClick: () => console.log('New Workflow') },
  { label: 'Check Inventory', icon: <Package className="w-5 h-5" />, onClick: () => console.log('Check Inventory') },
  { label: 'Process Report', icon: <FileText className="w-5 h-5" />, onClick: () => console.log('Process Report') },
  { label: 'Maintenance', icon: <Wrench className="w-5 h-5" />, onClick: () => console.log('Maintenance') },
];

const OperationsHome: React.FC = () => {
  const [tab, setTab] = React.useState('think');

  return (
    <PageTemplates.Department
      title="Operations Center"
      subtitle="Streamline workflows, manage inventory, and optimize business processes"
    >
      <Tabs value={tab} onValueChange={setTab} defaultValue="think">
        <TabsList className="mb-6">
          <TabsTrigger value="think">THINK (Analysis)</TabsTrigger>
          <TabsTrigger value="see">SEE (Advice)</TabsTrigger>
          <TabsTrigger value="act">ACT (Resources)</TabsTrigger>
        </TabsList>
        {/* THINK: KPIs, charts, summaries */}
        <TabsContent value="think">
          <div className="space-y-8">
            {/* KPI Cards */}
            <ContentCard
              title="Key Metrics"
              variant="elevated"
              className="bg-primary/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                {operationsKpiData.map((kpi, index) => (
                  <KpiCard key={index} {...kpi} />
                ))}
              </div>
            </ContentCard>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ContentCard
                title="Active Workflows"
                variant="elevated"
                className="bg-info/10 hover:shadow-xl transition-all duration-300"
                action={
                  <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
                    <span className="text-sm">Manage Workflows</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                }
              >
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Current workflow distribution</p>
                </div>
                <SimpleBarChart data={workflowData} />
              </ContentCard>
              <ContentCard
                title="Team Productivity"
                variant="elevated"
                className="bg-info/10 hover:shadow-xl transition-all duration-300"
                action={
                  <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
                    <span className="text-sm">View Details</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                }
              >
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Monthly productivity trends</p>
                </div>
                <SimpleBarChart data={productivityData} />
              </ContentCard>
            </div>
          </div>
        </TabsContent>
        {/* SEE: AI-powered advice, next best actions */}
        <TabsContent value="see">
          <ContentCard
            title="AI-Powered Operations Advice"
            variant="elevated"
            className="bg-warning/10"
          >
            <div className="text-muted-foreground">
              {/* TODO: Integrate with Operations AI agent for actionable recommendations */}
              <p>Get prioritized actions, improvement suggestions, and strategic guidance from the Operations AI.</p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Review workflows with the highest bottlenecks.</li>
                <li>Automate repetitive inventory checks.</li>
                <li>Schedule a team review for process improvements.</li>
                <li>Monitor pending inventory alerts.</li>
              </ul>
            </div>
          </ContentCard>
        </TabsContent>
        {/* ACT: Quick actions, resources, playbooks */}
        <TabsContent value="act">
          <ContentCard
            title="Operations Resources & Quick Actions"
            variant="elevated"
            className="bg-success/10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex flex-col items-center p-6 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-4 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200 mb-3">
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
            <ContentCard
              title="Recent Activities"
              variant="outlined"
              className="bg-muted/10"
              action={
                <button className="px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
                  View All Activities
                </button>
              }
            >
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const getIcon = (type: string) => {
                    switch (type) {
                      case 'workflow': return <Activity className="w-5 h-5" />;
                      case 'inventory': return <Package className="w-5 h-5" />;
                      case 'process': return <Settings className="w-5 h-5" />;
                      case 'team': return <Users className="w-5 h-5" />;
                      default: return <Activity className="w-5 h-5" />;
                    }
                  };

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'Completed': return 'bg-success/10 text-success';
                      case 'Pending': return 'bg-warning/10 text-warning';
                      case 'Scheduled': return 'bg-primary/10 text-primary';
                      default: return 'bg-muted text-muted-foreground';
                    }
                  };

                  return (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-4 rounded-lg bg-primary/10 text-primary">
                          {getIcon(activity.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{activity.description}</h4>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <div>
                        <span className={`px-4 py-4 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ContentCard>
            <div className="space-y-2 mt-6">
              {/* TODO: Add links to playbooks, templates, and enablement materials */}
              <a href="#" className="text-primary underline">Operations Playbook</a><br />
              <a href="#" className="text-primary underline">Workflow Templates</a><br />
              <a href="#" className="text-primary underline">Enablement Materials</a>
            </div>
          </ContentCard>
        </TabsContent>
      </Tabs>
    </PageTemplates.Department>
  );
};

export default OperationsHome; 