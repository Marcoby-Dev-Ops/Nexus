import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  BarChart2, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Calendar,
  Users,
  Package,
  Settings,
  Truck,
  LineChart,
  ArrowRight
} from 'lucide-react';

import { DepartmentTemplate } from '../../../components/templates/DepartmentTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Avatar } from '../../../components/ui/Avatar';

// Mock data for Operations Department
const operationsMetrics = [
  {
    label: 'On-Time Delivery',
    value: '92%',
    change: {
      value: '3%',
      positive: true,
    },
    icon: <Clock />,
  },
  {
    label: 'Productivity',
    value: '87%',
    change: {
      value: '5%',
      positive: true,
    },
    icon: <BarChart2 />,
  },
  {
    label: 'Inventory Value',
    value: '$245,320',
    change: {
      value: '2%',
      positive: false,
    },
    icon: <Package />,
  },
  {
    label: 'Active Projects',
    value: '24',
    change: {
      value: '2',
      positive: true,
    },
    icon: <CheckCircle2 />,
  },
];

// ProcessesTab Component
const ProcessesTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Processes</CardTitle>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Process
            </Button>
          </div>
          <CardDescription>Monitor and manage operational processes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                name: 'Order Fulfillment', 
                status: 'Optimal', 
                metrics: { throughput: '124 orders/day', backlog: '18 orders', efficiency: '95%' },
                lastUpdated: '10 minutes ago',
                owner: 'Sarah Johnson'
              },
              { 
                name: 'Inventory Management', 
                status: 'Warning', 
                metrics: { accuracy: '96%', stockouts: '3 items', turnover: '4.2x' },
                lastUpdated: '25 minutes ago',
                owner: 'Mike Roberts'
              },
              { 
                name: 'Supplier Management', 
                status: 'Optimal', 
                metrics: { onTimeDelivery: '94%', qualityScore: '4.8/5', costVariance: '-2.1%' },
                lastUpdated: '1 hour ago',
                owner: 'Lisa Wong'
              },
              { 
                name: 'Returns Processing', 
                status: 'Critical', 
                metrics: { volume: '32 items', processingTime: '48 hours', approvalRate: '82%' },
                lastUpdated: '2 hours ago',
                owner: 'David Lee'
              },
              { 
                name: 'Quality Assurance', 
                status: 'Optimal', 
                metrics: { passRate: '98.5%', defectRate: '0.8%', inspectionRate: '100%' },
                lastUpdated: '3 hours ago',
                owner: 'Alex Chen'
              },
            ].map((process, i) => (
              <div key={i} className="border border-border rounded-md overflow-hidden">
                <div className={`p-4 flex items-center justify-between ${
                  process.status === 'Optimal' ? 'bg-success/10 border-b border-green-500/20' :
                  process.status === 'Warning' ? 'bg-amber-500/10 border-b border-amber-500/20' :
                  'bg-destructive/10 border-b border-destructive/20'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      process.status === 'Optimal' ? 'bg-success/20 text-success' :
                      process.status === 'Warning' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {process.status === 'Optimal' ? <CheckCircle2 className="h-5 w-5" /> :
                       process.status === 'Warning' ? <AlertTriangle className="h-5 w-5" /> :
                       <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-medium">{process.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          process.status === 'Optimal' ? 'border-green-500 text-success' :
                          process.status === 'Warning' ? 'border-amber-500 text-amber-500' :
                          'border-destructive text-destructive'
                        }>
                          {process.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Updated {process.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View Details</Button>
                </div>
                <div className="p-4 bg-card">
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {Object.entries(process.metrics).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Owner:</span>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-5 w-5 text-xs">
                          <span>{process.owner.charAt(0)}</span>
                        </Avatar>
                        <span>{process.owner}</span>
                      </div>
                    </div>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      Process Map <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// InventoryTab Component
const InventoryTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Status</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Truck className="h-4 w-4 mr-2" />
                Orders
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          <CardDescription>Current inventory levels and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total SKUs', value: '1,248', trend: '+12 this month' },
                { label: 'Out of Stock', value: '24', trend: '-3 since last week' },
                { label: 'Low Stock Alert', value: '57', trend: '+5 since last week' },
              ].map((metric, i) => (
                <Card key={i} className="bg-card/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.trend}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Inventory Categories</h3>
              {[
                { category: 'Raw Materials', count: 380, value: '$87,500', utilization: 68 },
                { category: 'Work In Progress', count: 124, value: '$34,200', utilization: 45 },
                { category: 'Finished Goods', count: 744, value: '$123,620', utilization: 82 },
              ].map((category, i) => (
                <div key={i} className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>{category.count} items</span>
                        <span>{category.value}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {category.utilization}% Utilization
                    </Badge>
                  </div>
                  <Progress value={category.utilization} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border p-4 flex justify-center">
          <Button variant="outline">View Full Inventory</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Movements</CardTitle>
          <CardDescription>Latest inventory additions and depletions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'received', sku: 'RM-1042', name: 'Aluminum Sheet 3mm', quantity: 500, value: '$12,500', date: '2023-06-10', location: 'Warehouse A' },
              { type: 'depleted', sku: 'FG-2087', name: 'Wireless Headphones', quantity: 124, value: '$8,680', date: '2023-06-09', location: 'Fulfillment Center' },
              { type: 'received', sku: 'RM-2033', name: 'Circuit Boards', quantity: 1000, value: '$23,000', date: '2023-06-08', location: 'Warehouse B' },
              { type: 'transferred', sku: 'WIP-405', name: 'Partial Assemblies', quantity: 200, value: '$4,000', date: '2023-06-07', location: 'Factory Floor' },
              { type: 'depleted', sku: 'FG-1985', name: 'Smart Speakers', quantity: 85, value: '$12,750', date: '2023-06-06', location: 'Fulfillment Center' },
            ].map((movement, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-muted rounded-md transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    movement.type === 'received' ? 'bg-success/20 text-success' :
                    movement.type === 'depleted' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {movement.type === 'received' ? '📦' : movement.type === 'depleted' ? '🚚' : '🔄'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{movement.name}</p>
                      <Badge variant="outline" className="text-xs">{movement.sku}</Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Qty: {movement.quantity}</span>
                      <span>•</span>
                      <span>{movement.value}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>{movement.date}</p>
                  <p className="text-muted-foreground">{movement.location}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ProjectsTab Component
const ProjectsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Projects</CardTitle>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
          <CardDescription>Current operational improvement projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                name: 'Warehouse Optimization', 
                status: 'On Track',
                progress: 65,
                dueDate: '2023-07-15',
                owner: 'Mike Roberts',
                team: ['Sarah J.', 'David L.', 'Alex C.'],
                description: 'Reorganizing warehouse layout to improve picking efficiency and reduce fulfillment times.'
              },
              { 
                name: 'Supply Chain Resilience', 
                status: 'At Risk',
                progress: 42,
                dueDate: '2023-08-30',
                owner: 'Lisa Wong',
                team: ['Chris T.', 'Emma S.'],
                description: 'Diversifying supplier network and implementing redundancy planning for critical components.'
              },
              { 
                name: 'Automated Quality Checks', 
                status: 'On Track',
                progress: 78,
                dueDate: '2023-06-30',
                owner: 'David Lee',
                team: ['Sarah J.', 'Mike R.', 'Taylor B.'],
                description: 'Implementing computer vision system for automated quality control on production lines.'
              },
              { 
                name: 'Sustainable Packaging', 
                status: 'Delayed',
                progress: 35,
                dueDate: '2023-07-01',
                owner: 'Emma Stevens',
                team: ['Lisa W.', 'Chris T.'],
                description: 'Transitioning to eco-friendly packaging materials while maintaining product protection.'
              },
            ].map((project, i) => (
              <div key={i} className="border border-border rounded-md overflow-hidden">
                <div className={`p-4 ${
                  project.status === 'On Track' ? 'bg-success/10 border-b border-green-500/20' :
                  project.status === 'At Risk' ? 'bg-amber-500/10 border-b border-amber-500/20' :
                  'bg-destructive/10 border-b border-destructive/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          project.status === 'On Track' ? 'border-green-500 text-success' :
                          project.status === 'At Risk' ? 'border-amber-500 text-amber-500' :
                          'border-destructive text-destructive'
                        }>
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Due {project.dueDate}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Details</Button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm mb-3">{project.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{project.progress}% Complete</span>
                    <span className="text-xs text-muted-foreground">Target: 100%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 mb-4" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Owner</p>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-6 w-6">
                          <span>{project.owner.charAt(0)}</span>
                        </Avatar>
                        <span>{project.owner}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Team</p>
                      <div className="flex -space-x-2">
                        {project.team.map((member, j) => (
                          <Avatar key={j} className="h-6 w-6 border-2 border-background">
                            <span>{member.charAt(0)}</span>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// AnalyticsTab Component
const AnalyticsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operational Performance</CardTitle>
          <CardDescription>Key metrics and analytics insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Efficiency Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  [Line Chart Visualization]
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[
                    { label: 'Current', value: '87%', change: '+5%' },
                    { label: 'Target', value: '90%', status: 'Need 3% improvement' },
                  ].map((metric, i) => (
                    <div key={i}>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold">{metric.value}</p>
                        {metric.change && (
                          <Badge className="bg-success">{metric.change}</Badge>
                        )}
                        {metric.status && (
                          <span className="text-xs text-muted-foreground">{metric.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  [Area Chart Visualization]
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: 'Defect Rate', value: '0.8%', status: 'good' },
                    { label: 'First-Pass Yield', value: '96.2%', status: 'good' },
                    { label: 'Customer Returns', value: '1.2%', status: 'warning' },
                  ].map((metric, i) => (
                    <div key={i}>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-lg font-bold">{metric.value}</p>
                        <div className={`h-2 w-2 rounded-full ${
                          metric.status === 'good' ? 'bg-success' : 'bg-amber-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Process Performance</h3>
            <div className="space-y-3">
              {[
                { process: 'Order Fulfillment', metric: 'Cycle Time', current: '1.2 days', target: '1.0 days', status: 'warning' },
                { process: 'Production Line A', metric: 'Output', current: '850 units/day', target: '800 units/day', status: 'good' },
                { process: 'Inventory Management', metric: 'Accuracy', current: '96.5%', target: '98.0%', status: 'warning' },
                { process: 'Customer Support', metric: 'Resolution Time', current: '4.2 hours', target: '4.0 hours', status: 'good' },
                { process: 'Supplier Management', metric: 'On-time Delivery', current: '92%', target: '95%', status: 'warning' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-md">
                  <div>
                    <p className="font-medium">{item.process}</p>
                    <p className="text-sm text-muted-foreground">{item.metric}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.current}</p>
                      <p className="text-xs text-muted-foreground">vs {item.target} target</p>
                    </div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      item.status === 'good' ? 'bg-success/20 text-success' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {item.status === 'good' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Automated analysis of operational data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                insight: 'Bottleneck Detected', 
                description: 'The packaging station is creating a bottleneck in the fulfillment process, causing 15% of late deliveries.', 
                recommendation: 'Consider adding a second packaging station during peak hours (10AM-2PM).',
                impact: 'Could improve on-time delivery by ~7%'
              },
              { 
                insight: 'Inventory Optimization', 
                description: 'Inventory of SKU-2038 is consistently above optimal levels, tying up approximately $23,000 in excess inventory.', 
                recommendation: 'Reduce reorder quantity by 30% and increase reorder frequency.',
                impact: 'Potential $15K reduction in carrying costs'
              },
              { 
                insight: 'Quality Correlation', 
                description: 'Detected correlation between component supplier change and 2.3% increase in defect rate for Product Line B.', 
                recommendation: 'Review supplier quality control or consider reverting to previous supplier.',
                impact: 'Could save $8K/month in rework costs'
              },
            ].map((item, i) => (
              <div key={i} className="p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-md">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center">
                    <LineChart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-brand-primary">{item.insight}</p>
                  </div>
                </div>
                <p className="text-sm mb-2">{item.description}</p>
                <div className="bg-background p-3 rounded-md mb-2">
                  <p className="text-sm font-medium">Recommendation:</p>
                  <p className="text-sm">{item.recommendation}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-brand-primary border-brand-primary">
                    {item.impact}
                  </Badge>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    View Analysis <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * OperationsPage - Operations department page using standardized department template
 */
const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <DepartmentTemplate
      title="Operations"
      description="Business operations and process management"
      icon={<Building2 className="h-6 w-6" />}
      metrics={operationsMetrics}
      actions={[
        {
          label: 'New Project',
          icon: <PlusCircle className="h-4 w-4" />,
          onClick: () => navigate('/operations/projects/new'),
          primary: true,
        },
        {
          label: 'Process Map',
          icon: <Settings className="h-4 w-4" />,
          onClick: () => navigate('/operations/processes'),
        },
      ]}
      tabs={[
        { id: 'processes', label: 'Processes', content: <ProcessesTab /> },
        { id: 'inventory', label: 'Inventory', content: <InventoryTab /> },
        { id: 'projects', label: 'Projects', content: <ProjectsTab /> },
        { id: 'analytics', label: 'Analytics', content: <AnalyticsTab /> },
      ]}
      defaultTab="processes"
    />
  );
};

export default OperationsPage; 