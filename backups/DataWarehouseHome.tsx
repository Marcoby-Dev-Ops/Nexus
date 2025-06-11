import React from 'react';
import { Database, Search, Download, Upload, BarChart2, Users, FileText, Filter } from 'lucide-react';
import { PageTemplates } from '@/components/patterns/PageTemplates';
import { ContentCard } from '@/components/patterns/ContentCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';

/**
 * @name DataWarehouseHome
 * @description Data warehouse dashboard for accessing and analyzing business data.
 * @returns {JSX.Element} The rendered DataWarehouseHome component.
 */

// Sample data for the data warehouse dashboard
const dataKpiData = [
  { title: 'Total Records', value: '2.4M', delta: '+15.2%', trend: 'up' },
  { title: 'Data Sources', value: 12, delta: '+2', trend: 'up' },
  { title: 'Storage Used', value: '1.2TB', delta: '+8.5%', trend: 'up' },
  { title: 'Query Performance', value: '98.5%', delta: '+1.2%', trend: 'up' },
];

const usageData = [
  { name: 'Sales Data', value: 850 },
  { name: 'Customer Data', value: 650 },
  { name: 'Financial Data', value: 420 },
  { name: 'Operational Data', value: 380 },
  { name: 'Marketing Data', value: 320 },
];

const queryData = [
  { name: 'Mon', value: 45 },
  { name: 'Tue', value: 52 },
  { name: 'Wed', value: 38 },
  { name: 'Thu', value: 67 },
  { name: 'Fri', value: 85 },
  { name: 'Sat', value: 23 },
  { name: 'Sun', value: 18 },
];

const dataSources = [
  { name: 'Sales CRM', type: 'Database', status: 'Connected', lastSync: '2 minutes ago', records: '450K' },
  { name: 'E-commerce Platform', type: 'API', status: 'Connected', lastSync: '5 minutes ago', records: '1.2M' },
  { name: 'Financial System', type: 'CSV', status: 'Syncing', lastSync: '1 hour ago', records: '180K' },
  { name: 'Marketing Tools', type: 'API', status: 'Connected', lastSync: '10 minutes ago', records: '95K' },
];

const recentQueries = [
  { query: 'Monthly Sales Report', user: 'John Doe', time: '5 minutes ago', duration: '2.3s' },
  { query: 'Customer Segmentation Analysis', user: 'Jane Smith', time: '15 minutes ago', duration: '4.1s' },
  { query: 'Revenue Trend Analysis', user: 'Mike Johnson', time: '30 minutes ago', duration: '1.8s' },
  { query: 'Product Performance Metrics', user: 'Sarah Wilson', time: '45 minutes ago', duration: '3.2s' },
];

const DataWarehouseHome: React.FC = () => {
  return (
    <PageTemplates.Department
      title="Data Warehouse"
      subtitle="Access and analyze your business data with powerful querying and visualization tools"
    >
      {/* Quick Actions */}
      <ContentCard title="Quick Actions" variant="elevated" className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-6 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 group">
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200 mb-3">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
              Query Data
            </span>
          </button>
          
          <button className="flex flex-col items-center p-6 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 group">
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200 mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
              Import Data
            </span>
          </button>
          
          <button className="flex flex-col items-center p-6 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 group">
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200 mb-3">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
              Export Report
            </span>
          </button>
          
          <button className="flex flex-col items-center p-6 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 group">
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200 mb-3">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
              Create Dashboard
            </span>
          </button>
        </div>
      </ContentCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dataKpiData.map((kpi, index) => (
          <KpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ContentCard 
          title="Data Usage by Category" 
          variant="elevated"
          className="hover:shadow-xl transition-all duration-300"
        >
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Storage usage across data categories</p>
          </div>
          <SimpleBarChart data={usageData} />
        </ContentCard>

        <ContentCard 
          title="Query Activity" 
          variant="elevated"
          className="hover:shadow-xl transition-all duration-300"
        >
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Daily query volume (last 7 days)</p>
          </div>
          <SimpleBarChart data={queryData} />
        </ContentCard>
      </div>

      {/* Data Sources and Recent Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ContentCard 
          title="Data Sources" 
          variant="elevated"
          action={
            <button className="px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
              Manage Sources
            </button>
          }
        >
          <div className="space-y-4">
            {dataSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{source.name}</h4>
                    <p className="text-sm text-muted-foreground">{source.type} • {source.records} records</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-4 py-4 rounded-full text-xs font-medium ${
                    source.status === 'Connected' ? 'bg-success/10 text-success' :
                                                    source.status === 'Syncing' ? 'bg-warning/10 text-warning-foreground' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {source.status}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{source.lastSync}</p>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard 
          title="Recent Queries" 
          variant="elevated"
          action={
            <button className="px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
              Query History
            </button>
          }
        >
          <div className="space-y-4">
            {recentQueries.map((query, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{query.query}</h4>
                    <p className="text-sm text-muted-foreground">by {query.user} • {query.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{query.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>
    </PageTemplates.Department>
  );
};

export default DataWarehouseHome; 