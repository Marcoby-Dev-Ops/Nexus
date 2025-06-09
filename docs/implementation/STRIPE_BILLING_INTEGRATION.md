# Stripe Billing Integration for Nexus AI Chat

## Overview

This document outlines the complete Stripe billing integration for the Nexus AI Chat system, providing subscription management, usage tracking, and automated billing for the three-tier licensing model.

## Architecture

### Components

1. **Frontend Components**
   - `BillingDashboard.tsx` - Main billing interface
   - `BillingPage.tsx` - Billing page wrapper
   - `billingService.ts` - Frontend billing service

2. **Backend Services**
   - `stripe-billing` Edge Function - Stripe API integration
   - Database tables for licensing and usage tracking
   - Webhook handlers for subscription events

3. **Database Schema**
   - `user_licenses` - User subscription and license data
   - `chat_usage_tracking` - Daily usage metrics
   - `stripe_events` - Webhook event logging

## Pricing Structure

### Products Created in Stripe

1. **Nexus AI Chat Free** (`prod_SSpWGQ9Asuv8JL`)
   - Price: $0.00 (`price_1RXtrgRsVFqVQ7BiOUTOF4xM`)
   - 20 messages/day, basic features

2. **Nexus AI Chat Pro** (`prod_SSpWPE3A7NWmd9`)
   - Price: $29.00 (`price_1RXtraRsVFqVQ7Biya1sIQZI`)
   - 500 messages/day, all features, file uploads

3. **Nexus AI Chat Enterprise** (`prod_SSpW2AOu6axxoY`)
   - Price: $99.00 (`price_1RXtraRsVFqVQ7BikUOc02TQ`)
   - 2000 messages/day, priority queue, custom integrations

### Payment Links

- **Pro Plan**: https://buy.stripe.com/7sY7sNeAy0XrbIFd9e9R605
- **Enterprise Plan**: https://buy.stripe.com/14A3cxbomcG93c94CI9R606

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your Supabase project:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... # Frontend publishable key
```

### 2. Database Migration

The migration `create_user_licenses_and_stripe_integration` has been applied, creating:

- `user_licenses` table with Stripe integration fields
- `chat_usage_tracking` table for quota management
- `stripe_events` table for webhook processing
- Database functions for billing and quota operations

### 3. Edge Function Deployment

The `stripe-billing` Edge Function has been deployed and handles:

- Customer creation and management
- Subscription lifecycle events
- Webhook processing
- Payment intent creation

### 4. Webhook Configuration

Configure webhooks in your Stripe dashboard:

**Endpoint URL**: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/stripe-billing`

**Events to listen for**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Usage

### Frontend Integration

The billing system is accessible at `/billing` and provides:

1. **Current Plan Overview**
   - Plan details and features
   - Billing period information
   - Subscription status

2. **Usage Analytics**
   - Daily and monthly message counts
   - File upload tracking
   - Cost breakdown

3. **Plan Management**
   - Upgrade/downgrade options
   - Payment link integration
   - Subscription cancellation

### API Integration

#### Get Billing Status

```typescript
import { billingService } from '@/lib/services/billingService';

const status = await billingService.getBillingStatus(userId);
```

#### Track Usage

```typescript
import { quotaService } from '@/lib/services/quotaService';

await quotaService.trackUsage(userId, {
  messages: 1,
  aiRequests: 1,
  cost: 0.002
});
```

#### Check Quotas

```typescript
const quotaStatus = await quotaService.getQuotaStatus(userId);
const canSendMessage = quotaStatus.usage.messages_today < quotaStatus.limits.max_messages_per_day;
```

## Database Functions

### get_user_billing_status(user_id)

Returns current billing information for a user:

```sql
SELECT * FROM get_user_billing_status('user-uuid');
```

### track_daily_usage(user_id, message_count, ai_requests, files_uploaded, tokens_used, estimated_cost)

Records daily usage metrics:

```sql
SELECT track_daily_usage('user-uuid', 1, 1, 0, 100, 0.002);
```

### get_user_quota_status(user_id)

Returns current quota status and limits:

```sql
SELECT * FROM get_user_quota_status('user-uuid');
```

## Webhook Processing

The system automatically processes Stripe webhooks to:

1. **Update User Licenses**
   - Sync subscription status changes
   - Update billing periods
   - Handle plan upgrades/downgrades

2. **Track Payment Events**
   - Log successful payments
   - Handle failed payment scenarios
   - Update subscription statuses

3. **Maintain Data Consistency**
   - Ensure Stripe and database sync
   - Handle edge cases and failures

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- Users can only access their own data
- Service role has full access for webhooks
- Authenticated users can execute quota functions

### API Security

- Edge functions validate Stripe webhook signatures
- All database operations use parameterized queries
- User authentication required for all operations

## Monitoring and Analytics

### Usage Tracking

The system tracks:
- Daily message counts per user
- AI request volumes
- File upload statistics
- Cost estimation and billing

### Business Intelligence

Query examples for business analytics:

```sql
-- Monthly revenue by plan
SELECT 
  tier,
  COUNT(*) as subscribers,
  SUM(CASE tier 
    WHEN 'pro' THEN 29 
    WHEN 'enterprise' THEN 99 
    ELSE 0 
  END) as monthly_revenue
FROM user_licenses 
WHERE subscription_status = 'active'
GROUP BY tier;

-- Usage trends
SELECT 
  date,
  SUM(message_count) as total_messages,
  SUM(estimated_cost_usd) as total_cost
FROM chat_usage_tracking 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date;
```

## Cost Analysis

### OpenAI Cost Structure
- Average cost per message: ~$0.002
- Pro plan: $29/month ÷ 500 messages = $0.058/message (29x markup)
- Enterprise: $99/month ÷ 2000 messages = $0.049/message (24x markup)

### Revenue Protection
- Free tier: Max $0.04/day cost (20 × $0.002)
- Rate limiting prevents abuse
- Usage tracking enables cost monitoring

## Troubleshooting

### Common Issues

1. **Webhook Failures**
   - Check webhook endpoint configuration
   - Verify environment variables
   - Review Edge Function logs

2. **Subscription Sync Issues**
   - Check user_licenses table for updates
   - Verify Stripe customer IDs match
   - Review webhook event processing

3. **Quota Enforcement**
   - Ensure usage tracking is working
   - Check quota calculation functions
   - Verify rate limiting implementation

### Debugging

```sql
-- Check user's current license
SELECT * FROM user_licenses WHERE user_id = 'user-uuid';

-- Review recent usage
SELECT * FROM chat_usage_tracking 
WHERE user_id = 'user-uuid' 
ORDER BY date DESC LIMIT 7;

-- Check webhook events
SELECT * FROM stripe_events 
WHERE processed = false 
ORDER BY created_at DESC;
```

## Future Enhancements

### Planned Features

1. **Customer Portal Integration**
   - Self-service subscription management
   - Invoice downloads
   - Payment method updates

2. **Advanced Analytics**
   - Usage forecasting
   - Churn prediction
   - Revenue optimization

3. **Enterprise Features**
   - Custom pricing models
   - Volume discounts
   - Multi-seat management

### Scaling Considerations

1. **Performance Optimization**
   - Usage aggregation for large datasets
   - Caching for frequently accessed data
   - Database indexing optimization

2. **Multi-tenancy**
   - Organization-level billing
   - Team subscription management
   - Hierarchical quota inheritance

## Support

For billing-related issues:
- Email: billing@nexus.com
- Documentation: /help/billing
- Status page: status.nexus.com

## Compliance

The billing system adheres to:
- PCI DSS compliance (via Stripe)
- GDPR data protection requirements
- SOC 2 Type II standards
- Industry-standard security practices 