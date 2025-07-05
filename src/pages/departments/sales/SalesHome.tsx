import React from 'react';
import { DollarSign, TrendingUp, Users, Target, ArrowUpRight, Plus, FileText, UserPlus, Handshake, Bot } from 'lucide-react';
import { PageTemplates } from '@/components/patterns/PageTemplates';
import { ContentCard } from '@/components/patterns/ContentCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

/**
 * @name SalesHome
 * @description Sales department dashboard for managing pipelines, deals, and sales performance.
 * @returns {JSX.Element} The rendered SalesHome component.
 */

// Sample data for the sales dashboard
const salesKpiData = [
  { title: 'Monthly Revenue', value: '$124,580', delta: '+12.5%', trend: 'up' },
  { title: 'Active Deals', value: 32, delta: '+8.3%', trend: 'up' },
  { title: 'Pipeline Value', value: '$456,200', delta: '+15.2%', trend: 'up' },
  { title: 'Conversion Rate', value: '24.8%', delta: '+2.1%', trend: 'up' },
];

const pipelineData = [
  { name: 'Prospects', value: 45 },
  { name: 'Qualified', value: 32 },
  { name: 'Proposal', value: 18 },
  { name: 'Negotiation', value: 12 },
  { name: 'Closed Won', value: 8 },
];

const revenueData = [
  { name: 'Jan', value: 65000 },
  { name: 'Feb', value: 59000 },
  { name: 'Mar', value: 80000 },
  { name: 'Apr', value: 81000 },
  { name: 'May', value: 56000 },
  { name: 'Jun', value: 124580 },
];

const recentDeals = [
  { company: 'Acme Corp', value: '$45,000', stage: 'Negotiation', probability: '75%' },
  { company: 'TechStart Inc', value: '$32,000', stage: 'Proposal', probability: '60%' },
  { company: 'Global Solutions', value: '$78,000', stage: 'Qualified', probability: '40%' },
  { company: 'Innovation Labs', value: '$23,000', stage: 'Closed Won', probability: '100%' },
];

const quickActions = [
  { label: 'New Deal', icon: <Handshake className="w-5 h-5" />, onClick: () => console.log('New Deal') },
  { label: 'Add Contact', icon: <UserPlus className="w-5 h-5" />, onClick: () => console.log('Add Contact') },
  { label: 'Create Proposal', icon: <FileText className="w-5 h-5" />, onClick: () => console.log('Create Proposal') },
  { label: 'Schedule Follow-up', icon: <Plus className="w-5 h-5" />, onClick: () => console.log('Schedule Follow-up') },
];

const SalesHome: React.FC = () => {
  const [tab, setTab] = React.useState('think');

  return (
    <PageTemplates.Department
      title="Sales Overview"
      subtitle="State of the union, key metrics, and next actions for Sales."
    >
      {/* Department AI Agent Panel */}
      <ContentCard title="Ask the Sales AI" variant="elevated" className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-lg bg-primary/10 text-primary">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <p className="font-medium mb-1">Need help, strategy, or insights?</p>
            <p className="text-muted-foreground text-sm mb-2">Ask the Sales AI for recommendations, analysis, or next steps.</p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">Open Sales AI</button>
          </div>
        </div>
      </ContentCard>

      {/* THINK / SEE / ACT Tabs */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {salesKpiData.map((kpi, index) => (
                <KpiCard key={index} {...kpi} />
              ))}
            </div>
            {/* Charts and Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <ContentCard 
                title="Revenue Trend" 
                variant="elevated"
                className="hover:shadow-xl transition-all duration-300"
                action={
                  <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
                    <span className="text-sm">View Details</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                }
              >
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Monthly sales performance</p>
                </div>
                <SimpleBarChart data={revenueData} />
              </ContentCard>
              <ContentCard 
                title="Sales Pipeline" 
                variant="elevated"
                className="hover:shadow-xl transition-all duration-300"
                action={
                  <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
                    <span className="text-sm">Manage Pipeline</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                }
              >
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Active deals by stage</p>
                </div>
                <SimpleBarChart data={pipelineData} />
              </ContentCard>
            </div>
            {/* Recent Deals */}
            <ContentCard 
              title="Recent Deals" 
              variant="elevated"
              action={
                <button className="px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
                  View All Deals
                </button>
              }
            >
              <div className="space-y-4">
                {recentDeals.map((deal, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{deal.company}</h4>
                        <p className="text-sm text-muted-foreground">{deal.stage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{deal.value}</div>
                      <div className="text-sm text-muted-foreground">{deal.probability}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>
          </div>
        </TabsContent>
        {/* SEE: AI-powered advice, next best actions */}
        <TabsContent value="see">
          <ContentCard title="AI-Powered Sales Advice" variant="elevated">
            <div className="text-muted-foreground">
              {/* TODO: Integrate with Sales AI agent for actionable recommendations */}
              <p>Get prioritized actions, improvement suggestions, and strategic guidance from the Sales AI.</p>
              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Follow up with high-probability deals in the Proposal stage.</li>
                <li>Review pipeline stages with the lowest conversion rates.</li>
                <li>Consider upsell opportunities for recently closed deals.</li>
                <li>Schedule a team review for stalled deals.</li>
              </ul>
            </div>
          </ContentCard>
        </TabsContent>
        {/* ACT: Quick actions, resources, playbooks */}
        <TabsContent value="act">
          <ContentCard title="Sales Resources & Quick Actions" variant="elevated">
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
            <div className="space-y-2">
              {/* TODO: Add links to playbooks, templates, and enablement materials */}
              <a href="#" className="text-primary underline">Sales Playbook</a><br />
              <a href="#" className="text-primary underline">Proposal Templates</a><br />
              <a href="#" className="text-primary underline">Enablement Materials</a>
            </div>
          </ContentCard>
        </TabsContent>
      </Tabs>
    </PageTemplates.Department>
  );
};

export default SalesHome; 