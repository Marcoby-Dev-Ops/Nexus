-- Migration: Add Stripe integration to user_licenses table
-- Description: Adds Stripe customer and subscription tracking to support billing

-- Add Stripe-specific columns to user_licenses table
ALTER TABLE user_licenses 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create indexes for efficient Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_licenses_stripe_customer_id 
ON user_licenses(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_licenses_stripe_subscription_id 
ON user_licenses(stripe_subscription_id);

-- Create stripe_events table for webhook processing
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for efficient event processing
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed 
ON stripe_events(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type 
ON stripe_events(type);

-- Function to handle subscription updates from webhooks
CREATE OR REPLACE FUNCTION handle_stripe_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the webhook event
  INSERT INTO stripe_events (id, type, data, processed)
  VALUES (
    NEW.stripe_subscription_id || '_' || extract(epoch from NOW()),
    'subscription.updated',
    jsonb_build_object(
      'subscription_id', NEW.stripe_subscription_id,
      'customer_id', NEW.stripe_customer_id,
      'tier', NEW.tier,
      'status', NEW.subscription_status
    ),
    TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription updates
DROP TRIGGER IF EXISTS trigger_stripe_subscription_update ON user_licenses;
CREATE TRIGGER trigger_stripe_subscription_update
  AFTER UPDATE OF stripe_subscription_id, subscription_status, tier
  ON user_licenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_stripe_subscription_update();

-- Create or update RLS policies for new columns
DROP POLICY IF EXISTS "Users can view their own billing info" ON user_licenses;
CREATE POLICY "Users can view their own billing info" 
ON user_licenses FOR SELECT 
USING (auth.uid() = user_id::uuid);

DROP POLICY IF EXISTS "Users can update their own billing info" ON user_licenses;
CREATE POLICY "Users can update their own billing info" 
ON user_licenses FOR UPDATE 
USING (auth.uid() = user_id::uuid);

-- Service role can manage all billing data for webhooks
DROP POLICY IF EXISTS "Service role can manage billing" ON user_licenses;
CREATE POLICY "Service role can manage billing" 
ON user_licenses FOR ALL 
USING (auth.role() = 'service_role');

-- Stripe events table policies
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage stripe events" 
ON stripe_events FOR ALL 
USING (auth.role() = 'service_role');

-- Function to get user's current billing status
CREATE OR REPLACE FUNCTION get_user_billing_status(p_user_id UUID)
RETURNS TABLE (
  tier TEXT,
  has_active_subscription BOOLEAN,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.tier,
    CASE 
      WHEN ul.subscription_status = 'active' THEN TRUE
      ELSE FALSE
    END as has_active_subscription,
    ul.subscription_status,
    ul.current_period_end,
    ul.stripe_customer_id
  FROM user_licenses ul
  WHERE ul.user_id = p_user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_billing_status(UUID) TO authenticated; 