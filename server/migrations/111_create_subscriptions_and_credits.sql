-- Migration: Create Subscriptions and Credits System
-- Adds support for monthly subscriptions and credit management to prevent service interruption

-- Subscription Plans (Defines the tiers)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'free', 'starter', 'pro', 'enterprise'
    name VARCHAR(100) NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    monthly_credit_allowance INTEGER NOT NULL DEFAULT 0, -- 0 for Free, 100000 for Pro, etc.
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default plans (Personas/Editions)
INSERT INTO subscription_plans (id, name, price_cents, monthly_credit_allowance, features) VALUES
('explorer', 'Explorer (Free)', 0, 100, '{"tier": "basic", "allowed_models": ["gpt-4o-mini"], "capabilities": ["chat", "search"]}'),
('assistant', 'Assistant (Basic)', 1000, 100000, '{"tier": "standard", "allowed_models": ["gpt-4o-mini"], "capabilities": ["chat", "search", "docs"]}'), -- $10/mo
('professional', 'Professional (Power)', 3000, 500000, '{"tier": "premium", "allowed_models": ["gpt-4o", "gpt-4o-mini"], "capabilities": ["chat", "search", "analysis", "coding"]}'), -- $30/mo
('enterprise', 'Enterprise', 100000, -1, '{"tier": "unlimited", "allowed_models": ["all"], "capabilities": ["all"]}')
ON CONFLICT (id) DO NOTHING;

-- User Subscriptions (Links user to a plan)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id),
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id) DEFAULT 'free',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'past_due', 'canceled'
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User Credit Wallet (Holds the actual balance)
CREATE TABLE IF NOT EXISTS user_credits (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES user_profiles(user_id),
    balance_cents INTEGER DEFAULT 0, -- Current usable balance (100 cents = $1.00)
    last_refill_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions (Audit log for every usage/refill)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    amount_cents INTEGER NOT NULL, -- Negative for usage, positive for refill
    transaction_type VARCHAR(50) NOT NULL, -- 'usage', 'subscription_grant', 'top_up', 'adjustment'
    description TEXT,
    reference_id VARCHAR(255), -- e.g., requestId or paymentId
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Trigger to update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
