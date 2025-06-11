import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, FileText, PlusCircle, LineChart, BarChart2, Download, Filter, Calendar } from 'lucide-react';

import { DepartmentTemplate } from '../../../components/templates/DepartmentTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';

// Mock data for Finance Department
const financeMetrics = [
  {
    label: 'Revenue YTD',
    value: '$382,500',
    change: {
      value: '12%',
      positive: true,
    },
    icon: <DollarSign />,
  },
  {
    label: 'Expenses YTD',
    value: '$215,320',
    change: {
      value: '5%',
      positive: false,
    },
    icon: <CreditCard />,
  },
  {
    label: 'Outstanding Invoices',
    value: '$47,250',
    change: {
      value: '3%',
      positive: false,
    },
    icon: <FileText />,
  },
  {
    label: 'Cash Flow',
    value: '$32,180',
    change: {
      value: '8%',
      positive: true,
    },
    icon: <LineChart />,
  },
];

const recentInvoices = [
  { id: 'INV-1024', customer: 'Acme Corp', amount: '$12,000', status: 'paid', issueDate: '2023-06-01', dueDate: '2023-06-15' },
  { id: 'INV-1023', customer: 'TechGiant', amount: '$24,500', status: 'pending', issueDate: '2023-06-01', dueDate: '2023-06-15' },
  { id: 'INV-1022', customer: 'Cloudify', amount: '$8,300', status: 'overdue', issueDate: '2023-05-15', dueDate: '2023-05-30' },
  { id: 'INV-1021', customer: 'Innovate Inc', amount: '$15,700', status: 'paid', issueDate: '2023-05-15', dueDate: '2023-05-30' },
  { id: 'INV-1020', customer: 'Globex Corp', amount: '$32,100', status: 'paid', issueDate: '2023-05-01', dueDate: '2023-05-15' },
];

const recentExpenses = [
  { id: 'EXP-578', category: 'Software Subscriptions', amount: '$2,450', date: '2023-06-05', status: 'approved', paymentMethod: 'Company Card' },
  { id: 'EXP-577', category: 'Office Supplies', amount: '$850', date: '2023-06-02', status: 'approved', paymentMethod: 'Company Card' },
  { id: 'EXP-576', category: 'Travel', amount: '$3,200', date: '2023-05-28', status: 'pending', paymentMethod: 'Reimbursement' },
  { id: 'EXP-575', category: 'Marketing', amount: '$5,700', date: '2023-05-25', status: 'approved', paymentMethod: 'Company Card' },
  { id: 'EXP-574', category: 'Hardware', amount: '$12,300', date: '2023-05-20', status: 'approved', paymentMethod: 'Direct Payment' },
];

// InvoicesTab Component
const InvoicesTab = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
        <CardDescription>Manage your invoices and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoice.amount}</TableCell>
                <TableCell>
                  <Badge className={
                    invoice.status === 'paid' ? 'bg-green-500' :
                    invoice.status === 'pending' ? 'bg-amber-500' :
                    'bg-destructive'
                  }>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>{invoice.issueDate}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="border-t border-border p-4 flex justify-center">
        <Button variant="outline">View All Invoices</Button>
      </CardFooter>
    </Card>
  );
};

// ExpensesTab Component
const ExpensesTab = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expenses</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
        <CardDescription>Track and manage company expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExpenses.map((expense) => (
              <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{expense.id}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.amount}</TableCell>
                <TableCell>{expense.date}</TableCell>
                <TableCell>
                  <Badge className={
                    expense.status === 'approved' ? 'bg-green-500' :
                    expense.status === 'pending' ? 'bg-amber-500' :
                    'bg-destructive'
                  }>
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell>{expense.paymentMethod}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="border-t border-border p-4 flex justify-center">
        <Button variant="outline">View All Expenses</Button>
      </CardFooter>
    </Card>
  );
};

// BudgetingTab Component
const BudgetingTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Current fiscal year budget allocation and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { category: 'Marketing', allocated: 120000, spent: 58000 },
              { category: 'Operations', allocated: 250000, spent: 182000 },
              { category: 'Product Development', allocated: 300000, spent: 175000 },
              { category: 'Sales', allocated: 180000, spent: 120000 },
              { category: 'Administration', allocated: 85000, spent: 52000 },
            ].map((budget) => {
              const percentage = Math.round((budget.spent / budget.allocated) * 100);
              return (
                <div key={budget.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{budget.category}</span>
                    <span>${budget.spent.toLocaleString()} / ${budget.allocated.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage}% spent</span>
                      <span>{Math.round((budget.allocated - budget.spent) / 1000)}k remaining</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Calendar</CardTitle>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>
          <CardDescription>Upcoming budget events and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { event: 'Q3 Budget Planning', date: 'June 15, 2023', description: 'Finalize department budgets for Q3' },
              { event: 'Mid-Year Budget Review', date: 'June 30, 2023', description: 'Review YTD performance against budget' },
              { event: 'Annual Forecast Update', date: 'July 15, 2023', description: 'Update annual forecast based on H1 performance' },
              { event: 'Q4 Budget Allocation', date: 'September 1, 2023', description: 'Allocate Q4 budget to departments' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted transition-colors">
                <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{item.event}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                  <p className="text-sm mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ReportsTab Component
const ReportsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financial Reports</CardTitle>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
          <CardDescription>View and download financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Monthly Financial Statement', description: 'P&L, balance sheet, and cash flow', date: '2023-06-01', type: 'PDF' },
              { name: 'Quarterly Tax Report', description: 'Tax summary for Q2 2023', date: '2023-06-15', type: 'XLSX' },
              { name: 'Expense Analysis', description: 'Breakdown of expenses by category', date: '2023-06-01', type: 'PDF' },
              { name: 'Revenue Forecast', description: 'Projected revenue for next 12 months', date: '2023-05-15', type: 'PDF' },
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

      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>AI-generated insights from your financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { insight: 'Cash Flow Trend', description: 'Your cash flow has improved by 15% compared to last quarter', icon: <LineChart /> },
              { insight: 'Expense Outliers', description: 'Marketing expenses increased 23% in May - consider reviewing for optimization', icon: <BarChart2 /> },
              { insight: 'Revenue Growth', description: 'Consistent 8% monthly revenue growth since January - exceeding projections', icon: <LineChart /> },
            ].map((item, i) => (
              <div key={i} className="p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-brand-primary">{item.insight}</p>
                    <p className="text-sm">{item.description}</p>
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

/**
 * FinancePage - Finance department page using standardized department template
 */
const FinancePage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <DepartmentTemplate
      title="Finance"
      description="Accounting, invoices, and financial operations"
      icon={<CreditCard className="h-6 w-6" />}
      metrics={financeMetrics}
      actions={[
        {
          label: 'New Invoice',
          icon: <PlusCircle className="h-4 w-4" />,
          onClick: () => navigate('/finance/invoices/new'),
          primary: true,
        },
        {
          label: 'Add Expense',
          icon: <PlusCircle className="h-4 w-4" />,
          onClick: () => navigate('/finance/expenses/new'),
        },
      ]}
      tabs={[
        { id: 'invoices', label: 'Invoices', content: <InvoicesTab /> },
        { id: 'expenses', label: 'Expenses', content: <ExpensesTab /> },
        { id: 'budgeting', label: 'Budgeting', content: <BudgetingTab /> },
        { id: 'reports', label: 'Reports', content: <ReportsTab /> },
      ]}
      defaultTab="invoices"
    />
  );
};

export default FinancePage; 