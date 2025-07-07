import React, { useMemo } from 'react';
import { DollarSign, CreditCard, Receipt, ArrowUpRight, FileText, Calculator } from 'lucide-react';
import { PageTemplates } from '@/components/patterns/PageTemplates';
import { ContentCard } from '@/components/patterns/ContentCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { useDepartmentKPIs } from '@/lib/hooks/useDepartmentKPIs';
import { usePayPalTransactions } from '@/lib/hooks/usePayPalTransactions';
import type { PayPalTransaction } from '@/lib/hooks/usePayPalTransactions';

/**
 * @name FinanceHome
 * @description Finance department dashboard for managing invoices, expenses, and financial reports.
 * @returns {JSX.Element} The rendered FinanceHome component.
 */

// Placeholder expense data until wired to live source
const expenseData = [
  { name: 'Salaries', value: 45000 },
  { name: 'Marketing', value: 12000 },
  { name: 'Operations', value: 8500 },
  { name: 'Software', value: 5200 },
  { name: 'Office', value: 3200 },
];

const quickActions = [
  { label: 'New Invoice', icon: <Receipt className="w-5 h-5" />, onClick: () => console.log('New Invoice') },
  { label: 'Record Expense', icon: <CreditCard className="w-5 h-5" />, onClick: () => console.log('Record Expense') },
  { label: 'Generate Report', icon: <FileText className="w-5 h-5" />, onClick: () => console.log('Generate Report') },
  { label: 'Calculate Tax', icon: <Calculator className="w-5 h-5" />, onClick: () => console.log('Calculate Tax') },
];

// Helper for currency formatting
const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const FinanceHome: React.FC = () => {
  const { loading, metrics } = useDepartmentKPIs('finance');
  const { loading: txLoading, transactions } = usePayPalTransactions(10);

  type KpiItem = { title: string; value: string; delta?: string; trend?: string };

  const financeKpiData: KpiItem[] = useMemo(() => {
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    const totalRevenueValue = metrics?.totalRevenue ?? 0;

    return [
      {
        title: 'Total Revenue',
        value: loading ? '—' : currencyFormatter.format(totalRevenueValue),
        delta: undefined,
        trend: 'up',
      },
      { title: 'Outstanding Invoices', value: '$45,200', delta: '-8.3%', trend: 'down' }, // placeholder
      { title: 'Monthly Expenses', value: '$32,100', delta: '+5.2%', trend: 'up' }, // placeholder
      { title: 'Profit Margin', value: '32.8%', delta: '+2.1%', trend: 'up' }, // placeholder
    ];
  }, [loading, metrics]);

  const revenueData = metrics?.monthlyRevenue?.length ? metrics.monthlyRevenue : [
    { name: 'Jan', value: 0 },
  ];

  return (
    <PageTemplates.Department
      title="Finance Hub"
      subtitle="Manage invoices, expenses, and financial reports with automated reconciliation"
    >
      {/* Quick Actions */}
      <ContentCard title="Quick Actions" variant="elevated" className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </ContentCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {financeKpiData.map((kpi: KpiItem, index: number) => (
          <KpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts */}
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
            <p className="text-sm text-muted-foreground">Monthly revenue performance</p>
          </div>
          <SimpleBarChart data={revenueData} />
        </ContentCard>

        <ContentCard 
          title="Expense Breakdown" 
          variant="elevated"
          className="hover:shadow-xl transition-all duration-300"
          action={
            <button className="flex items-center space-x-2 px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 font-medium border border-border">
              <span className="text-sm">Manage Expenses</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          }
        >
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Monthly expense categories</p>
          </div>
          <SimpleBarChart data={expenseData} />
        </ContentCard>
      </div>

      {/* Recent Transactions */}
      <ContentCard 
        title="Recent Transactions" 
        variant="elevated"
        action={
          <button className="px-4 py-4 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
            View All Transactions
          </button>
        }
      >
        <div className="space-y-4">
          {txLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PayPal transactions found.</p>
          ) : (
            transactions.map((transaction: PayPalTransaction, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-lg bg-success/10 text-success`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{transaction.txn_id}</h4>
                    <p className="text-sm text-muted-foreground">{new Date(transaction.captured_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-semibold text-success`}>
                  {currencyFmt.format(transaction.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </ContentCard>
    </PageTemplates.Department>
  );
};

export default FinanceHome; 