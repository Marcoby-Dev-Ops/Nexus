import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Shield, 
  Crown,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { billingService } from '../../lib/services/billingService';
import { quotaService } from '../../lib/services/quotaService';
import { useEnhancedUser } from '../../contexts/EnhancedUserContext';
import type { BillingStatus, UsageBilling } from '../../lib/types/billing';
import type { ChatQuotas, UsageTracking } from '../../lib/types/licensing';

interface BillingDashboardProps {
  className?: string;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ className }) => {
  const { user } = useEnhancedUser();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<ChatQuotas | null>(null);
  const [usageData, setUsageData] = useState<UsageTracking | null>(null);
  const [usageBilling, setUsageBilling] = useState<UsageBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [billing, usageStats, usage] = await Promise.all([
        billingService.getBillingStatus(user.id),
        quotaService.getUserUsageStats(user.id),
        billingService.getUsageBilling(user.id)
      ]);

      setBillingStatus(billing);
      setQuotaStatus(usageStats.currentQuotas);
      setUsageData(usageStats.todayUsage);
      setUsageBilling(usage);
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan: 'pro' | 'enterprise') => {
    const paymentLinks = billingService.getPaymentLinks();
    const url = plan === 'pro' ? paymentLinks.pro : paymentLinks.enterprise;
    window.open(url, '_blank');
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Zap className="h-5 w-5 text-primary" />;
      case 'pro': return <Shield className="h-5 w-5 text-secondary" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-warning" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-primary/10 text-primary';
      case 'pro': return 'bg-secondary/10 text-purple-800';
      case 'enterprise': return 'bg-warning/10 text-yellow-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <LoadingStates.Skeleton />
        <div>
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button onClick={loadBillingData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!billingStatus || !quotaStatus) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getTierIcon(billingStatus.currentPlan)}
              <div>
                <CardTitle className="text-xl">
                  {billingStatus.currentPlan === 'free' && 'Free Plan'}
                  {billingStatus.currentPlan === 'pro' && 'Pro Plan'}
                  {billingStatus.currentPlan === 'enterprise' && 'Enterprise Plan'}
                </CardTitle>
                <CardDescription>
                  {billingStatus.currentPlan === 'free' && 'Basic AI chat features'}
                  {billingStatus.currentPlan === 'pro' && 'Professional AI tools for growing teams'}
                  {billingStatus.currentPlan === 'enterprise' && 'Enterprise-grade AI solutions'}
                </CardDescription>
              </div>
            </div>
            <Badge className={getTierColor(billingStatus.currentPlan)}>
              {billingStatus.currentPlan.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {quotaStatus.max_messages_per_day}
              </div>
              <div className="text-sm text-muted-foreground">Messages/day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {quotaStatus.max_messages_per_hour}
              </div>
              <div className="text-sm text-muted-foreground">Messages/hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(
                  billingStatus.currentPlan === 'pro' ? 29 : 
                  billingStatus.currentPlan === 'enterprise' ? 99 : 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {billingStatus.currentPlan === 'free' ? 'Free' : 'Per month'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {quotaStatus.streaming_enabled ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">Streaming</div>
            </div>
          </div>

          {billingStatus.billingPeriodEnd && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  {billingStatus.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                  {billingStatus.billingPeriodEnd.toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Usage Summary</span>
            </CardTitle>
            <CardDescription>
              Your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-lg font-semibold">
                  {usageData?.messages_sent || 0}
                </div>
                <div className="text-sm text-muted-foreground">Messages Today</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-lg font-semibold">
                  {usageData?.ai_requests_made || 0}
                </div>
                <div className="text-sm text-muted-foreground">AI Requests</div>
              </div>
            </div>

            {quotaStatus.max_file_uploads_per_day > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">
                    {usageData?.files_uploaded || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Files Uploaded</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">
                    {formatCurrency(usageData?.estimated_cost_usd || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Cost</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing & Upgrade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Billing & Upgrades</span>
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingStatus.currentPlan === 'free' && (
              <>
                <div className="space-y-4">
                  <Button 
                    onClick={() => handleUpgrade('pro')} 
                    className="w-full"
                    variant="default"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Upgrade to Pro - $29/month
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    onClick={() => handleUpgrade('enterprise')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Enterprise - $99/month
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p>✓ No credit card required for free plan</p>
                  <p>✓ Cancel anytime</p>
                  <p>✓ Instant activation</p>
                </div>
              </>
            )}

            {billingStatus.currentPlan === 'pro' && (
              <>
                <div className="p-4 bg-secondary/5 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-800">Pro Plan Active</div>
                  <div className="text-sm text-secondary">
                    Next billing: {billingStatus.billingPeriodEnd?.toLocaleDateString()}
                  </div>
                </div>
                <Button 
                  onClick={() => handleUpgrade('enterprise')} 
                  className="w-full"
                  variant="outline"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Enterprise
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {billingStatus.currentPlan === 'enterprise' && (
              <div className="p-4 bg-warning/5 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-800">Enterprise Plan Active</div>
                <div className="text-sm text-warning">
                  You have access to all premium features
                </div>
              </div>
            )}

            {billingStatus.hasActiveSubscription && (
              <div className="pt-2 text-xs text-muted-foreground">
                Manage your subscription and view invoices in the{' '}
                <button className="text-primary underline">customer portal</button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 