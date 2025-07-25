import React from 'react';
import { BillingDashboard } from './BillingDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { CreditCard } from 'lucide-react';

/**
 * Billing Page Component
 * 
 * Provides comprehensive billing management including: * - Current subscription status
 * - Usage tracking and analytics
 * - Plan upgrades and downgrades
 * - Payment history and invoices
 */
export const BillingPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-2">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your subscription, view usage analytics, and upgrade your plan.
        </p>
      </div>

      <BillingDashboard />

      {/* Additional Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Common questions about billing and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Billing Questions</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Billing occurs on the same day each month</li>
                <li>• Unused credits don't roll over</li>
                <li>• Cancel anytime with no penalties</li>
                <li>• Prorated refunds for downgrades</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Usage & Limits</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Daily limits reset at midnight UTC</li>
                <li>• Overage charges apply after limits</li>
                <li>• Rate limits prevent abuse</li>
                <li>• Enterprise plans have priority queues</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              For billing support, contact us at{' '}
              <a href="mailto: billing@nexus.com" className="text-primary underline">
                billing@nexus.com
              </a>{' '}
              or visit our{' '}
              <a href="/help" className="text-primary underline">
                help center
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 