import React from 'react';
import { BillingDashboard } from '../../components/billing/BillingDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

/**
 * BillingSettings Component
 * 
 * Settings page for billing and subscription management.
 * Uses the BillingDashboard component within the settings layout.
 */
export const BillingSettings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>
            Manage your subscription, view usage, and update billing information.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Billing Dashboard */}
      <div className="space-y-6">
        <BillingDashboard />
      </div>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Support</CardTitle>
          <CardDescription>
            Need help with your subscription or billing?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Billing Information</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Billing occurs monthly on your signup date</li>
                <li>• All plans include secure payment processing</li>
                <li>• Cancel anytime with no penalties</li>
                <li>• Prorated refunds for plan downgrades</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Usage & Limits</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Daily limits reset at midnight UTC</li>
                <li>• Real-time usage tracking</li>
                <li>• Email notifications for limit alerts</li>
                <li>• Enterprise plans include priority support</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              For billing support, contact us at{' '}
              <a href="mailto:support@nexus.com" className="text-primary underline hover:text-primary/80">
                support@nexus.com
              </a>
              {' '}or visit our help center.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 