# Stripe Production Setup Guide

## 🔥 **Critical: Complete This Before Deployment**

Your Stripe webhook handler is ready, but you need to complete the webhook configuration to ensure billing works properly.

## Step 1: Set Up Webhook Endpoint in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - Visit [dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're in **Live mode** (not test mode)

2. **Create Webhook Endpoint:**
   - Navigate to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Enter your endpoint URL:
     ```
     https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/stripe-billing
     ```

3. **Select Events to Listen For:**
   ```
   ✅ checkout.session.completed
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ customer.created
   ✅ payment_intent.succeeded
   ```

4. **Get Your Webhook Secret:**
   - After creating the endpoint, click on it
   - Click **Click to reveal** under **Signing secret**
   - Copy the secret (starts with `whsec_...`)

## Step 2: Update Environment Variables

### Local Development (.env file):
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### Production (Coolify Environment Variables):
Add this to your Coolify deployment environment:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### Supabase Environment Variables:
1. Go to your Supabase project settings
2. Navigate to **Settings** → **Edge Functions**
3. Add environment variable:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

## Step 3: Deploy Updated Function

Run this command to deploy your updated webhook handler:
```bash
supabase functions deploy stripe-billing --project-ref kqclbpimkraenvbffnpk
```

## Step 4: Test Your Webhook

### Using Stripe CLI (Recommended):
```bash
# Install Stripe CLI
# Then test your webhook
stripe trigger checkout.session.completed
```

### Using Stripe Dashboard:
1. Go to **Webhooks** → Your endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Click **Send test webhook**

## Step 5: Verify Database Tables

Make sure these tables exist in your Supabase database:

### user_licenses table:
```sql
CREATE TABLE IF NOT EXISTS user_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    tier TEXT NOT NULL DEFAULT 'free',
    subscription_status TEXT,
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### billing_events table:
```sql
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_customer_id TEXT NOT NULL,
    stripe_invoice_id TEXT,
    event_type TEXT NOT NULL,
    amount INTEGER,
    currency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payments table:
```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_customer_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Step 6: Update Your Price IDs

In the webhook handler, update the price IDs to match your actual Stripe prices:

```typescript
// Current price IDs in the code:
if (priceId === 'price_1RXtraRsVFqVQ7Biya1sIQZI') {
  tier = 'pro';
} else if (priceId === 'price_1RXtraRsVFqVQ7BikUOc02TQ') {
  tier = 'enterprise';
}
```

Replace these with your actual Stripe price IDs from your dashboard.

## Step 7: Final Verification

✅ **Pre-Deployment Checklist:**
- [ ] Webhook endpoint created in Stripe Dashboard (live mode)
- [ ] Webhook secret added to all environments
- [ ] Database tables created
- [ ] Price IDs updated in webhook handler
- [ ] Supabase function deployed
- [ ] Webhook tested and working

## 🚨 **Important Security Notes:**

1. **Never commit webhook secrets to git**
2. **Always verify webhook signatures** (our handler does this)
3. **Use HTTPS endpoints only** (required for live mode)
4. **Monitor webhook delivery in Stripe Dashboard**

## 📊 **Monitoring Your Webhooks:**

After deployment, monitor:
- Stripe Dashboard → Webhooks → Your endpoint → Attempts
- Supabase Dashboard → Edge Functions → Logs
- Your application's billing functionality

## 🆘 **Troubleshooting:**

**Webhook failing?**
1. Check Supabase function logs
2. Verify environment variables are set
3. Test with Stripe CLI
4. Check database table permissions

**Need help?**
- Check Stripe webhook documentation
- Review Supabase Edge Function logs
- Test with smaller webhook events first 