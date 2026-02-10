const { query } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

/**
 * Initialize AI Monitoring Tables
 * 
 * Creates missing tables required by AIUsageMonitoringService:
 * - ai_provider_usage: Detailed logs of every AI request and cost.
 * - ai_provider_credits: Tracking balances for different AI providers.
 * - ai_usage_alerts: Security and cost alerts.
 * - ai_usage_budgets: Per-org limits for AI consumption.
 */

async function initSchema() {
    logger.info('Initializing AI Monitoring Schema...');

    try {
        // 1. ai_provider_usage
        logger.info('Creating ai_provider_usage table...');
        await query(`
            CREATE TABLE IF NOT EXISTS ai_provider_usage (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                org_id UUID,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                task_type TEXT NOT NULL,
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                cost_cents NUMERIC DEFAULT 0,
                cost_usd NUMERIC DEFAULT 0,
                request_id TEXT,
                response_time_ms NUMERIC DEFAULT 0,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_provider_usage(user_id);
            CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_provider_usage(provider);
            CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_provider_usage(created_at);
        `);

        // 2. ai_provider_credits
        logger.info('Creating ai_provider_credits table...');
        await query(`
            CREATE TABLE IF NOT EXISTS ai_provider_credits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                provider TEXT UNIQUE NOT NULL,
                current_balance_usd NUMERIC DEFAULT 0,
                total_spent_usd NUMERIC DEFAULT 0,
                api_key_status TEXT DEFAULT 'active',
                quota_limit_usd NUMERIC,
                quota_reset_date TIMESTAMPTZ,
                metadata JSONB DEFAULT '{}',
                last_updated TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 3. ai_usage_alerts
        logger.info('Creating ai_usage_alerts table...');
        await query(`
            CREATE TABLE IF NOT EXISTS ai_usage_alerts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                alert_type TEXT NOT NULL,
                provider TEXT,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                threshold_value NUMERIC,
                current_value NUMERIC,
                is_active BOOLEAN DEFAULT TRUE,
                acknowledged_by UUID,
                acknowledged_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 4. ai_usage_budgets
        logger.info('Creating ai_usage_budgets table...');
        await query(`
            CREATE TABLE IF NOT EXISTS ai_usage_budgets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL,
                provider TEXT,
                budget_type TEXT NOT NULL,
                budget_amount_usd NUMERIC NOT NULL,
                current_spend_usd NUMERIC DEFAULT 0,
                reset_date TIMESTAMPTZ,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(org_id, provider, budget_type)
            );
        `);

        logger.info('AI Monitoring Schema Initialization COMPLETED.');
    } catch (error) {
        logger.error('Failed to initialize AI monitoring schema:', error);
    } finally {
        process.exit(0);
    }
}

if (require.main === module) {
    initSchema();
}

module.exports = { initSchema };
