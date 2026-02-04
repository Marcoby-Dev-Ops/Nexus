import React, { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useAuth } from '@/hooks/index';
import { useSubscription } from '@/components/admin/user/hooks/useSubscription';
import { useService } from '@/shared/hooks/useService';
import { logger } from '@/shared/utils/logger';
// import { serviceFactory } from '@/core/services/ServiceFactory'; // TEMPORARILY DISABLED
import { toast } from 'sonner';
import { CreditCard, Calendar, ExternalLink, Download, Plus, Edit, Trash2, Crown, Sparkles, XCircle } from 'lucide-react';

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
  
  // Use BillingService directly
  const billingService = useService('billing');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [isCreatingPaymentMethod, setIsCreatingPaymentMethod] = useState(false);
  const [isDeletingPaymentMethod, setIsDeletingPaymentMethod] = useState(false);

  // Fetch billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return;
      
      const filters = {
        user_id: user.id,
        company_id: (user as any)?.company?.id
      };

      // Fetch subscriptions
      setIsLoadingSubscriptions(true);
      try {
        const subscriptionsResult = await billingService.list(filters);
        if (subscriptionsResult.success && subscriptionsResult.data) {
          setSubscriptions(subscriptionsResult.data);
        }
              } catch (error) {
          logger.error('Failed to fetch subscriptions:', error);
        } finally {
        setIsLoadingSubscriptions(false);
      }

      // Fetch payment methods
      setIsLoadingPaymentMethods(true);
      try {
        const paymentMethodsResult = await billingService.list(filters);
        if (paymentMethodsResult.success && paymentMethodsResult.data) {
          setPaymentMethods(paymentMethodsResult.data);
        }
              } catch (error) {
          logger.error('Failed to fetch payment methods:', error);
        } finally {
        setIsLoadingPaymentMethods(false);
      }

      // Fetch invoices
      setIsLoadingInvoices(true);
      try {
        const invoicesResult = await billingService.list(filters);
        if (invoicesResult.success && invoicesResult.data) {
          setInvoices(invoicesResult.data);
        }
              } catch (error) {
          logger.error('Failed to fetch invoices:', error);
        } finally {
        setIsLoadingInvoices(false);
      }
    };

    fetchBillingData();
  }, [user?.id, user?.company?.id, billingService]);
  
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  // Get current subscription
  const currentSubscription = subscriptions?.find((sub: any) => 
    sub.status === 'active' || sub.status === 'trialing'
  );

  // Convert service data to component format
  const billingInfo: BillingInfo | null = currentSubscription ? {
    plan: (currentSubscription as any).plan_id as 'free' | 'pro' | 'enterprise',
    status: (currentSubscription as any).status as 'active' | 'past_due' | 'canceled' | 'trialing',
    currentPeriodStart: (currentSubscription as any).current_period_start,
    currentPeriodEnd: (currentSubscription as any).current_period_end,
    amount: 29, // This would come from the plan
    currency: 'USD',
    nextBillingDate: (currentSubscription as any).current_period_end,
    usage: {
      aiRequests: 1250,
      aiRequestsLimit: plan === 'pro' ? 10000 : 100,
      storageUsed: 2.5,
      storageLimit: plan === 'pro' ? 100 : 1,
      integrations: 3,
      integrationsLimit: plan === 'pro' ? 50 : 5
    }
  } : null;

  // Convert payment methods
  const paymentMethodsList: PaymentMethod[] = paymentMethods?.map((pm: any) => ({
    id: pm.id,
    type: pm.type as 'card' | 'bank_account',
    last4: pm.last4 || '',
    brand: pm.brand,
    expiryMonth: pm.exp_month,
    expiryYear: pm.exp_year,
    isDefault: pm.is_default
  })) || [];

  // Convert invoices
  const invoicesList: Invoice[] = invoices?.map((inv: any) => ({
    id: inv.id,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status as 'paid' | 'pending' | 'failed',
    date: inv.created_at,
    description: `Invoice for ${inv.amount} ${inv.currency}`,
    pdfUrl: inv.invoice_pdf
  })) || [];

  const handleUpgradePlan = async (newPlan: 'pro' | 'enterprise') => {
    if (!currentSubscription) return;

    setIsUpdatingSubscription(true);
    try {
      const result = await billingService.update((currentSubscription as any).id, {
        plan_id: newPlan,
        status: 'active'
      });
      
      if (result.success) {
        toast.success(`Successfully upgraded to ${newPlan} plan`);
        // Refresh billing data
        const refreshResult = await billingService.list({
          user_id: user?.id,
          company_id: (user as any)?.company?.id
        });
        if (refreshResult.success && refreshResult.data) {
          setSubscriptions(refreshResult.data);
        }
      } else {
        toast.error(result.error || 'Failed to upgrade plan');
      }
    } catch (error) {
      toast.error('Failed to upgrade plan');
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      // TEMPORARILY DISABLED: ServiceFactory is commented out
      // const service = serviceFactory.get('billing') as any;
      // await service.cancelSubscription((currentSubscription as any).id, true);
      toast.info('Subscription cancellation temporarily disabled');
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleAddPaymentMethod = async (paymentData: any) => {
    if (!user?.id || !(user as any)?.company?.id) return;

    setIsCreatingPaymentMethod(true);
    try {
      const result = await billingService.create({
        user_id: user.id,
        company_id: (user as any).company.id,
        type: paymentData.type,
        brand: paymentData.brand,
        last4: paymentData.last4,
        exp_month: paymentData.expiryMonth,
        exp_year: paymentData.expiryYear,
        is_default: paymentData.isDefault || false
      });
      
      if (result.success) {
        toast.success('Payment method added successfully');
        setShowAddPaymentMethod(false);
        // Refresh payment methods
        const refreshResult = await billingService.list({
          user_id: user.id,
          company_id: (user as any).company.id
        });
        if (refreshResult.success && refreshResult.data) {
          setPaymentMethods(refreshResult.data);
        }
      } else {
        toast.error(result.error || 'Failed to add payment method');
      }
    } catch (error) {
      toast.error('Failed to add payment method');
    } finally {
      setIsCreatingPaymentMethod(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    setIsDeletingPaymentMethod(true);
    try {
      const result = await billingService.delete(paymentMethodId);
      if (result.success) {
        toast.success('Payment method removed successfully');
        // Refresh payment methods
        const refreshResult = await billingService.list({
          user_id: user?.id,
          company_id: (user as any)?.company?.id
        });
        if (refreshResult.success && refreshResult.data) {
          setPaymentMethods(refreshResult.data);
        }
      } else {
        toast.error(result.error || 'Failed to remove payment method');
      }
    } catch (error) {
      toast.error('Failed to remove payment method');
    } finally {
      setIsDeletingPaymentMethod(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getPlanFeatures = (planType: string) => {
    const features = {
      free: ['Basic AI requests', '1GB storage', '5 integrations', 'Community support'],
      pro: ['Unlimited AI requests', '100GB storage', '50 integrations', 'Priority support', 'Advanced analytics'],
      enterprise: ['Custom AI limits', 'Unlimited storage', 'Unlimited integrations', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
    };
    return features[planType as keyof typeof features] || [];
  };

  // Show loading state while fetching billing data
  if (isLoadingSubscriptions || isLoadingPaymentMethods || isLoadingInvoices) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Billing & Subscription</h2>
          <p className="text-muted-foreground">Manage your subscription and billing information</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading billing information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Billing & Subscription</h2>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Current Plan
              </CardTitle>
              <CardDescription>
                {billingInfo ? (
                  `You're currently on the ${billingInfo.plan} plan`
                ) : (
                  'No active subscription found'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingInfo ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{billingInfo.plan.charAt(0).toUpperCase() + billingInfo.plan.slice(1)} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        ${billingInfo.amount}/{billingInfo.plan === 'free' ? 'month' : 'month'}
                      </p>
                    </div>
                    <Badge variant={billingInfo.status === 'active' ? 'default' : 'secondary'}>
                      {billingInfo.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Next billing date</p>
                      <p>{new Date(billingInfo.nextBillingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Currency</p>
                      <p>{billingInfo.currency}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleUpgradePlan('pro')}
                      disabled={billingInfo.plan === 'pro' || billingInfo.plan === 'enterprise' || isUpdatingSubscription}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCancelSubscription}
                      disabled={billingInfo.plan === 'free' || isUpdatingSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No active subscription</p>
                  <Button onClick={() => handleUpgradePlan('pro')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started with Pro
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Overview */}
          {billingInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>Your current usage for this billing period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>AI Requests</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {billingInfo.usage.aiRequests.toLocaleString()} / {billingInfo.usage.aiRequestsLimit.toLocaleString()}
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billingInfo.usage.aiRequests, billingInfo.usage.aiRequestsLimit))}`}
                          style={{ width: `${getUsagePercentage(billingInfo.usage.aiRequests, billingInfo.usage.aiRequestsLimit)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Storage</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {billingInfo.usage.storageUsed}GB / {billingInfo.usage.storageLimit}GB
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billingInfo.usage.storageUsed, billingInfo.usage.storageLimit))}`}
                          style={{ width: `${getUsagePercentage(billingInfo.usage.storageUsed, billingInfo.usage.storageLimit)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>Integrations</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {billingInfo.usage.integrations} / {billingInfo.usage.integrationsLimit}
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(billingInfo.usage.integrations, billingInfo.usage.integrationsLimit))}`}
                          style={{ width: `${getUsagePercentage(billingInfo.usage.integrations, billingInfo.usage.integrationsLimit)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
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
              {paymentMethodsList.length === 0 ? (
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
                  {paymentMethodsList.map((method) => (
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
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesList.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-medium mb-2">No Billing History</h4>
                  <p className="text-muted-foreground">
                    Your billing history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoicesList.map((invoice) => (
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
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
              <CardDescription>Detailed breakdown of your usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">AI Requests</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
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
                </div>
                <div>
                  <h4 className="font-medium mb-2">Storage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
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
                <div>
                  <h4 className="font-medium mb-2">Integrations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span className={getUsageColor(getUsagePercentage(billingInfo?.usage.integrations || 0, billingInfo?.usage.integrationsLimit || 1))}>
                        {billingInfo?.usage.integrations}/{billingInfo?.usage.integrationsLimit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${getUsagePercentage(billingInfo?.usage.integrations || 0, billingInfo?.usage.integrationsLimit || 1)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
