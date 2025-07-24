import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useAuth } from '@/core/auth/AuthProvider';
import { useSubscription } from '@/domains/admin/user/hooks/useSubscription';
import { supabase } from '@/core/supabase';
import { toast } from 'sonner';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, ExternalLink, Download, Eye, EyeOff, Plus, Edit, Trash2, RefreshCw, Crown, Sparkles, XCircle } from 'lucide-react';
interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
  usage: {
    aiRequests: number;
    aiRequestsLimit: number;
    storageUsed: number;
    storageLimit: number;
    integrations: number;
    integrationsLimit: number;
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  description: string;
  pdfUrl?: string;
}

const BillingSettings: React.FC = () => {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBillingData();
    }
  }, [user?.id]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockBillingInfo: BillingInfo = {
        plan: plan,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: plan === 'pro' ? 29 : 0,
        currency: 'USD',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage: {
          aiRequests: 1250,
          aiRequestsLimit: plan === 'pro' ? 10000 : 100,
          storageUsed: 2.5,
          storageLimit: plan === 'pro' ? 100 : 1,
          integrations: 3,
          integrationsLimit: plan === 'pro' ? 50 : 5
        }
      };

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        }
      ];

      const mockInvoices: Invoice[] = [
        {
          id: 'inv_1',
          amount: 29,
          currency: 'USD',
          status: 'paid',
          date: new Date().toISOString(),
          description: 'Pro Plan - Monthly'
        }
      ];

      setBillingInfo(mockBillingInfo);
      setPaymentMethods(mockPaymentMethods);
      setInvoices(mockInvoices);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching billing data: ', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (newPlan: 'pro' | 'enterprise') => {
    try {
      setLoading(true);
      
      // Simulate plan upgrade
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully upgraded to ${newPlan} plan`);
      fetchBillingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to upgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      // Simulate subscription cancellation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Subscription cancelled successfully');
      fetchBillingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (__paymentData: any) => {
    try {
      setLoading(true);
      
      // Simulate adding payment method
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Payment method added successfully');
      setShowAddPaymentMethod(false);
      fetchBillingData(); // Refresh data
    } catch (error) {
      toast.error('Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      setLoading(true);
      
      // Simulate removing payment method
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      toast.success('Payment method removed successfully');
    } catch (error) {
      toast.error('Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  const getPlanFeatures = (planType: string) => {
    switch (planType) {
      case 'pro':
        return [
          'Unlimited AI requests',
          'Advanced analytics',
          'Priority support',
          'Custom integrations',
          'Team collaboration',
          'Advanced automation'
        ];
      case 'enterprise':
        return [
          'Everything in Pro',
          'Dedicated support',
          'Custom AI models',
          'Advanced security',
          'SLA guarantees',
          'On-premise options'
        ];
      default: return [
          'Basic AI features',
          'Standard analytics',
          'Community support',
          'Limited integrations'
        ];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm: flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Billing & Subscription</h3>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, payment methods, and usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBillingData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowUsageDetails(!showUsageDetails)}>
            {showUsageDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showUsageDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2" />
            Current Plan
          </CardTitle>
          <CardDescription>
            {billingInfo?.plan === 'free' ? 'Free Plan' : `${billingInfo?.plan?.toUpperCase()} Plan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Plan Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={billingInfo?.status === 'active' ? 'default' : 'secondary'}>
                    {billingInfo?.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-sm font-medium">
                    ${billingInfo?.amount}/{billingInfo?.plan === 'free' ? 'month' : 'month'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next billing:</span>
                  <span className="text-sm">
                    {billingInfo?.nextBillingDate ? new Date(billingInfo.nextBillingDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Usage</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>AI Requests</span>
                    <span className={getUsageColor(getUsagePercentage(billingInfo?.usage.aiRequests || 0, billingInfo?.usage.aiRequestsLimit || 1))}>
                      {billingInfo?.usage.aiRequests}/{billingInfo?.usage.aiRequestsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${getUsagePercentage(billingInfo?.usage.aiRequests || 0, billingInfo?.usage.aiRequestsLimit || 1)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Storage</span>
                    <span className={getUsageColor(getUsagePercentage(billingInfo?.usage.storageUsed || 0, billingInfo?.usage.storageLimit || 1))}>
                      {billingInfo?.usage.storageUsed}GB/{billingInfo?.usage.storageLimit}GB
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${getUsagePercentage(billingInfo?.usage.storageUsed || 0, billingInfo?.usage.storageLimit || 1)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                {plan === 'free' ? (
                  <Button onClick={() => handleUpgradePlan('pro')} className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleCancelSubscription} className="w-full">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Billing Portal
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose the plan that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="border rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></p>
              </div>
              <ul className="space-y-2 mb-6">
                {getPlanFeatures('free').map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant={plan === 'free' ? 'default' : 'outline'} 
                className="w-full"
                disabled={plan === 'free'}
              >
                {plan === 'free' ? 'Current Plan' : 'Select Free'}
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="border rounded-lg p-6 border-primary">
              <div className="text-center mb-4">
                <Badge className="mb-2">Most Popular</Badge>
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-3xl font-bold">$29<span className="text-sm font-normal">/month</span></p>
              </div>
              <ul className="space-y-2 mb-6">
                {getPlanFeatures('pro').map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant={plan === 'pro' ? 'default' : 'outline'} 
                className="w-full"
                onClick={() => handleUpgradePlan('pro')}
                disabled={plan === 'pro'}
              >
                {plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="border rounded-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Enterprise</h3>
                <p className="text-3xl font-bold">Custom</p>
              </div>
              <ul className="space-y-2 mb-6">
                {getPlanFeatures('enterprise').map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Methods
            </span>
            <Button size="sm" onClick={() => setShowAddPaymentMethod(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No Payment Methods</h4>
              <p className="text-muted-foreground mb-4">
                Add a payment method to manage your subscription
              </p>
              <Button onClick={() => setShowAddPaymentMethod(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <p className="font-medium">
                        {method.brand ? `${method.brand.toUpperCase()} •••• ${method.last4}` : `•••• ${method.last4}`}
                      </p>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No Billing History</h4>
              <p className="text-muted-foreground">
                Your billing history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invoice.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                    <p className="font-medium">
                      ${invoice.amount} {invoice.currency}
                    </p>
                    {invoice.pdfUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Modal */}
      {showAddPaymentMethod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add Payment Method</h2>
                <Button variant="outline" onClick={() => setShowAddPaymentMethod(false)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="1234 5678 9012 3456" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="name">Cardholder Name</Label>
                  <Input id="name" placeholder="John Doe" />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddPaymentMethod(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleAddPaymentMethod({})}>
                  Add Payment Method
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSettings; 