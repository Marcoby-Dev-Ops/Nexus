import React, { useState } from 'react';
import { 
  BarChart, 
  PieChart, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Separator } from '../../../components/ui/Separator';
import { Progress } from '../../../components/ui/Progress';

/**
 * FinancialOperationsPage - Interactive financial dashboard for finance department
 */
const FinancialOperationsPage: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');
  const [selectedReport, setSelectedReport] = useState<string>('expenses');

  // Financial summary stats
  const financialStats = [
    { 
      id: 'revenue',
      title: 'Revenue',
      value: '$147,891.29',
      change: '+12.5%',
      trend: 'up',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      id: 'expenses',
      title: 'Expenses',
      value: '$43,128.94',
      change: '+2.3%',
      trend: 'up',
      icon: <TrendingDown className="h-4 w-4" />
    },
    {
      id: 'profit',
      title: 'Net Profit',
      value: '$104,762.35',
      change: '+15.8%',
      trend: 'up',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      id: 'runway',
      title: 'Cash Runway',
      value: '9.2 months',
      change: '-0.8 months',
      trend: 'down',
      icon: <Calendar className="h-4 w-4" />
    }
  ];

  // Expense categories
  const expenseCategories = [
    { 
      id: 'salaries',
      name: 'Salaries & Benefits',
      amount: 21580.45,
      percentage: 50.1,
      color: 'bg-primary'
    },
    { 
      id: 'software',
      name: 'Software & Services',
      amount: 8320.12,
      percentage: 19.3,
      color: 'bg-secondary'
    },
    { 
      id: 'marketing',
      name: 'Marketing & Ads',
      amount: 6128.76,
      percentage: 14.2,
      color: 'bg-pink-500'
    },
    { 
      id: 'office',
      name: 'Office & Facilities',
      amount: 4252.18,
      percentage: 9.8,
      color: 'bg-warning'
    },
    { 
      id: 'travel',
      name: 'Travel & Entertainment',
      amount: 2847.43,
      percentage: 6.6,
      color: 'bg-success'
    }
  ];

  // Recent transactions
  const recentTransactions = [
    {
      id: 'tx1',
      description: 'AWS Cloud Services',
      category: 'Software & Services',
      amount: 2450.00,
      date: '2023-06-15',
      status: 'completed'
    },
    {
      id: 'tx2',
      description: 'Q2 Marketing Campaign',
      category: 'Marketing & Ads',
      amount: 4750.00,
      date: '2023-06-12',
      status: 'completed'
    },
    {
      id: 'tx3',
      description: 'Office Lease Payment',
      category: 'Office & Facilities',
      amount: 3200.00,
      date: '2023-06-10',
      status: 'completed'
    },
    {
      id: 'tx4',
      description: 'Team Retreat',
      category: 'Travel & Entertainment',
      amount: 1850.00,
      date: '2023-06-08',
      status: 'pending'
    },
    {
      id: 'tx5',
      description: 'New Equipment Purchase',
      category: 'Office & Facilities',
      amount: 978.50,
      date: '2023-06-05',
      status: 'completed'
    }
  ];

  // Financial reports
  const financialReports = [
    {
      id: 'report1',
      name: 'Income Statement',
      period: 'May 2023',
      updatedAt: '2023-06-05',
      status: 'finalized'
    },
    {
      id: 'report2',
      name: 'Balance Sheet',
      period: 'May 2023',
      updatedAt: '2023-06-05',
      status: 'finalized'
    },
    {
      id: 'report3',
      name: 'Cash Flow Statement',
      period: 'May 2023',
      updatedAt: '2023-06-07',
      status: 'finalized'
    },
    {
      id: 'report4',
      name: 'Q2 Tax Estimate',
      period: 'Apr-Jun 2023',
      updatedAt: '2023-06-10',
      status: 'draft'
    },
    {
      id: 'report5',
      name: 'Revenue Forecast',
      period: 'Jun-Dec 2023',
      updatedAt: '2023-06-12',
      status: 'draft'
    }
  ];

  // Budget vs. Actual data
  const budgetData = [
    { category: 'Salaries', budgeted: 22000, actual: 21580.45 },
    { category: 'Software', budgeted: 8000, actual: 8320.12 },
    { category: 'Marketing', budgeted: 5000, actual: 6128.76 },
    { category: 'Office', budgeted: 4500, actual: 4252.18 },
    { category: 'Travel', budgeted: 3000, actual: 2847.43 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Operations</h1>
          <p className="text-muted-foreground">Track, analyze, and optimize your company's finances</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue={activeTimeframe} onValueChange={setActiveTimeframe}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Timeframe</SelectLabel>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map(stat => (
          <Card key={stat.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <div className="font-medium">{stat.title}</div>
                <div className={`p-2 rounded-full ${
                  stat.trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center pt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className={`h-4 w-4 mr-1 ${
                    stat.id === 'expenses' ? 'text-destructive' : 'text-success'
                  }`} />
                ) : (
                  <ArrowDownRight className={`h-4 w-4 mr-1 ${
                    stat.id === 'expenses' ? 'text-success' : 'text-destructive'
                  }`} />
                )}
                <p className={`text-sm ${
                  (stat.trend === 'up' && stat.id !== 'expenses') || (stat.trend === 'down' && stat.id === 'expenses')
                    ? 'text-success'
                    : 'text-destructive'
                }`}>
                  {stat.change} from previous {activeTimeframe}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Expense Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-primary" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>
              Where your money is going this {activeTimeframe}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expenseCategories.map(category => (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={category.percentage} className={`h-2 ${category.color}`} />
                  <span className="text-xs font-medium">{category.percentage}%</span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setSelectedReport('expenses')}>
              View Detailed Expense Report
            </Button>
          </CardFooter>
        </Card>

        {/* Middle Column - Budget vs. Actual */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              Budget vs. Actual
            </CardTitle>
            <CardDescription>
              How spending compares to your budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetData.map((item, index) => {
              const percentage = (item.actual / item.budgeted) * 100;
              const isOverBudget = item.actual > item.budgeted;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{item.category}</div>
                    <div className="text-sm flex items-center">
                      {isOverBudget ? (
                        <Badge variant="destructive" className="text-xs mr-2">Over</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs mr-2">Under</Badge>
                      )}
                      <span>
                        ${item.actual.toLocaleString('en-US', { maximumFractionDigits: 0 })} / 
                        ${item.budgeted.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isOverBudget ? 'bg-destructive' : 'bg-success'}`} 
                  />
                </div>
              );
            })}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Adjust Budget Allocations
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column - Financial Reports */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Financial Reports
            </CardTitle>
            <CardDescription>
              Access and download financial statements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {financialReports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <div>
                    <div className="font-medium text-sm">{report.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <span className="mr-2">{report.period}</span>
                      <span>·</span>
                      <span className="mx-2">Updated {report.updatedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === 'finalized' ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Final
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Generate New Report
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <CardDescription>
            Latest financial transactions across all accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <span>{transaction.category}</span>
                      <span className="mx-2">·</span>
                      <span>{transaction.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs">
                      {transaction.status === 'completed' ? (
                        <span className="text-success flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter Transactions
          </Button>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Record Transaction
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FinancialOperationsPage; 