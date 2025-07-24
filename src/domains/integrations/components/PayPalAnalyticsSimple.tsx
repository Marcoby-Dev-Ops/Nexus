import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { PayPalAnalyticsService } from '../lib/PayPalAnalytics.ts';
import type { PayPalAnalyticsData } from '../lib/PayPalAnalytics.ts';
import { supabase } from '@/core/supabase';

interface PayPalAnalyticsSimpleProps {
  className?: string;
}

export const PayPalAnalyticsSimple: React.FC<PayPalAnalyticsSimpleProps> = ({ className }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PayPalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const analyticsService = new PayPalAnalyticsService();

  // Get user's PayPal integration
  useEffect(() => {
    const getPayPalIntegration = async () => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('user_integrations')
          .select('id, integration_id, status')
          .eq('user_id', user.id)
          .eq('integration_type', 'paypal')
          .eq('status', 'active')
          .single();

        if (error && error.code !== 'PGRST116') {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching PayPal integration: ', error);
          return;
        }

        if (integrations) {
          setIntegrationId(integrations.id);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error getting PayPal integration: ', error);
      }
    };

    getPayPalIntegration();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user || !integrationId) {
      setError('PayPal integration not found. Please connect your PayPal account first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await analyticsService.getAnalytics(startDate, endDate, user.id, integrationId);
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to fetch analytics';
      setError(errorMessage);
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('PayPal analytics error: ', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (integrationId) {
      fetchAnalytics();
    }
  }, [integrationId, startDate, endDate]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to view your PayPal analytics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!integrationId) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              PayPal integration not found. Please connect your PayPal account in the Setup tab.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Date Range Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm: flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <Button
              onClick={fetchAnalytics}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !analytics && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading PayPal analytics...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Display */}
      {analytics && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.totalTransactions}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(analytics.averageTransactionValue)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Currency Breakdown */}
          {Object.keys(analytics.currencyBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue by Currency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.currencyBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([currency, amount]) => (
                      <div key={currency} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{currency}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(amount, analytics.totalRevenue)}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Type Breakdown */}
          {Object.keys(analytics.transactionTypeBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Transactions by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.transactionTypeBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(count, analytics.totalTransactions)}
                          </span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Breakdown */}
          {Object.keys(analytics.statusBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Transactions by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.statusBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={status === 'completed' ? 'default' : 'outline'}
                          >
                            {status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(count, analytics.totalTransactions)}
                          </span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          {analytics.recentTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{transaction.transaction_type}</Badge>
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.time).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(parseFloat(transaction.amount.value), transaction.amount.currency_code)}
                        </p>
                        {transaction.paypal_fee && (
                          <p className="text-xs text-muted-foreground">
                            Fee: {formatCurrency(parseFloat(transaction.paypal_fee.value), transaction.paypal_fee.currency_code)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}; 