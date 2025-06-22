import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, LineChart, Users, PlusCircle, FileText, Download, Filter } from 'lucide-react';

import { DepartmentTemplate } from '../../../components/templates/DepartmentTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Avatar } from '../../../components/ui/Avatar';

// Mock data for Sales Department
const salesMetrics = [
  {
    label: 'Revenue This Month',
    value: '$47,500',
    change: {
      value: '12%',
      positive: true,
    },
    icon: <LineChart />,
  },
  {
    label: 'Open Deals',
    value: '24',
    change: {
      value: '3',
      positive: true,
    },
    icon: <Briefcase />,
  },
  {
    label: 'Contacts',
    value: '847',
    change: {
      value: '21',
      positive: true,
    },
    icon: <Users />,
  },
  {
    label: 'Conversion Rate',
    value: '8.2%',
    change: {
      value: '0.5%',
      positive: false,
    },
    icon: <LineChart />,
  },
];

const recentDeals = [
  { id: 1, company: 'Acme Corp', value: '$12,000', stage: 'Negotiation', probability: 70, contact: 'Sarah Johnson', date: '2023-06-15' },
  { id: 2, company: 'TechGiant', value: '$24,500', stage: 'Proposal', probability: 50, contact: 'Mike Roberts', date: '2023-06-12' },
  { id: 3, company: 'Cloudify', value: '$8,300', stage: 'Discovery', probability: 30, contact: 'David Lee', date: '2023-06-10' },
  { id: 4, company: 'Innovate Inc', value: '$15,700', stage: 'Closed Won', probability: 100, contact: 'Lisa Wong', date: '2023-06-08' },
  { id: 5, company: 'Globex Corp', value: '$32,100', stage: 'Negotiation', probability: 60, contact: 'Chris Taylor', date: '2023-06-05' },
];

// Sales Activities Tab Content
const SalesActivitiesTab = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <CardDescription>Your latest sales activities and interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[
            { type: 'call', contact: 'Sarah Johnson', company: 'Acme Corp', time: '2 hours ago', notes: 'Discussed proposal details, client has concerns about timeline' },
            { type: 'email', contact: 'David Lee', company: 'Cloudify', time: 'Yesterday', notes: 'Sent updated pricing based on new requirements' },
            { type: 'meeting', contact: 'Team Meeting', company: 'Internal', time: 'Yesterday', notes: 'Weekly sales review' },
            { type: 'email', contact: 'Chris Taylor', company: 'Globex Corp', time: '2 days ago', notes: 'Proposal accepted, scheduling follow-up call' },
            { type: 'call', contact: 'Lisa Wong', company: 'Innovate Inc', time: '3 days ago', notes: 'Deal closed! Planning onboarding call next week' },
          ].map((activity, i) => (
            <div key={i} className="flex items-start space-x-4 p-3 hover:bg-muted rounded-md transition-colors">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${
                activity.type === 'call' ? 'bg-success' : 
                activity.type === 'email' ? 'bg-primary' : 'bg-amber-500'
              }`}>
                {activity.type === 'call' ? '📞' : activity.type === 'email' ? '✉️' : '📅'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {activity.type === 'call' ? 'Call with ' : 
                     activity.type === 'email' ? 'Email to ' : 'Meeting: '}
                    {activity.contact}
                  </p>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.company}</p>
                <p className="mt-1 text-sm">{activity.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Deals Tab Content
const DealsTab = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pipeline</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </div>
        </div>
        <CardDescription>Your active deals and opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentDeals.map((deal) => (
              <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{deal.company}</TableCell>
                <TableCell>{deal.value}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    deal.stage === 'Closed Won' ? 'border-green-500 text-success' :
                    deal.stage === 'Negotiation' ? 'border-amber-500 text-amber-500' :
                    deal.stage === 'Proposal' ? 'border-blue-500 text-primary' :
                    'border-gray-500 text-gray-500'
                  }>
                    {deal.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={deal.probability} className="h-2 w-20" />
                    <span className="text-sm">{deal.probability}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <span>{deal.contact.charAt(0)}</span>
                    </Avatar>
                    <span>{deal.contact}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(deal.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Contacts Tab Content
const ContactsTab = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contacts</CardTitle>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
        <CardDescription>Your network of customers and prospects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Sarah Johnson', company: 'Acme Corp', title: 'VP of Operations', email: 'sarah@acme.com', phone: '(555) 123-4567' },
            { name: 'Mike Roberts', company: 'TechGiant', title: 'CTO', email: 'mike@techgiant.com', phone: '(555) 234-5678' },
            { name: 'David Lee', company: 'Cloudify', title: 'Procurement Manager', email: 'david@cloudify.com', phone: '(555) 345-6789' },
            { name: 'Lisa Wong', company: 'Innovate Inc', title: 'CEO', email: 'lisa@innovate.com', phone: '(555) 456-7890' },
            { name: 'Chris Taylor', company: 'Globex Corp', title: 'Director of IT', email: 'chris@globex.com', phone: '(555) 567-8901' },
            { name: 'Amanda Chen', company: 'Initech', title: 'COO', email: 'amanda@initech.com', phone: '(555) 678-9012' },
          ].map((contact, i) => (
            <Card key={i} className="hover:border-brand-primary cursor-pointer transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12">
                    <span className="text-lg">{contact.name.charAt(0)}</span>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                    <p className="text-sm font-medium mt-1">{contact.company}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs">{contact.email}</p>
                      <p className="text-xs">{contact.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Reports Tab Content
const ReportsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Reports</CardTitle>
        <CardDescription>View and download sales reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { name: 'Monthly Sales Summary', description: 'Overview of sales performance', date: '2023-06-01', type: 'PDF' },
            { name: 'Pipeline Forecast', description: 'Projected deals and revenue', date: '2023-06-01', type: 'XLSX' },
            { name: 'Team Performance', description: 'Individual and team metrics', date: '2023-06-01', type: 'PDF' },
            { name: 'Quarterly Review', description: 'Detailed quarterly analysis', date: '2023-05-01', type: 'PDF' },
          ].map((report, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted transition-colors">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-brand-primary/10 rounded-md flex items-center justify-center text-brand-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{report.type}</Badge>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * SalesPage - Sales department page using standardized department template
 */
const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <DepartmentTemplate
      title="Sales"
      description="CRM, deals, and customer management"
      icon={<Briefcase className="h-6 w-6" />}
      metrics={salesMetrics}
      actions={[
        {
          label: 'New Deal',
          icon: <PlusCircle className="h-4 w-4" />,
          onClick: () => navigate('/sales/deals/new'),
          primary: true,
        },
        {
          label: 'Import Contacts',
          icon: <Download className="h-4 w-4" />,
          onClick: () => navigate('/sales/contacts/import'),
        },
      ]}
      tabs={[
        { id: 'deals', label: 'Deals', content: <DealsTab /> },
        { id: 'activities', label: 'Activities', content: <SalesActivitiesTab /> },
        { id: 'contacts', label: 'Contacts', content: <ContactsTab /> },
        { id: 'reports', label: 'Reports', content: <ReportsTab /> },
      ]}
      defaultTab="deals"
    />
  );
};

export default SalesPage; 