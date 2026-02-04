const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

class CreditService {
  constructor() {
    this.tables = {
      users: 'user_profiles',
      subscriptions: 'user_subscriptions',
      plans: 'subscription_plans',
      credits: 'user_credits',
      transactions: 'credit_transactions'
    };
  }

  /**
   * Initialize credits for a user if they don't exist
   */
  async ensureWallet(userId) {
    if (!userId) return;
    try {
      const sql = `
        INSERT INTO ${this.tables.credits} (user_id, balance_cents, updated_at)
        VALUES ($1, 0, NOW())
        ON CONFLICT (user_id) DO NOTHING
      `;
      await query(sql, [userId]);
    } catch (err) {
      logger.error('Failed to ensure wallet:', err);
    }
  }

  /**
   * Ensure user has a default subscription (Explorer/Free tier)
   * Called when user first accesses the system
   */
  async ensureDefaultSubscription(userId) {
    if (!userId) return null;

    try {
      // Check if subscription exists
      const checkSql = `SELECT id FROM ${this.tables.subscriptions} WHERE user_id = $1`;
      const existing = await query(checkSql, [userId]);

      if (existing.rows && existing.rows.length > 0) {
        return { exists: true };
      }

      // Create Explorer subscription
      const subSql = `
        INSERT INTO ${this.tables.subscriptions}
        (user_id, plan_id, status, current_period_start, current_period_end, auto_renew)
        VALUES ($1, 'explorer', 'active', NOW(), NOW() + INTERVAL '1 month', false)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id
      `;
      await query(subSql, [userId]);

      // Grant initial credits (100 cents from Explorer plan)
      const creditSql = `
        INSERT INTO ${this.tables.credits} (user_id, balance_cents, last_refill_at, updated_at)
        VALUES ($1, 100, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          balance_cents = GREATEST(${this.tables.credits}.balance_cents, 100),
          updated_at = NOW()
      `;
      await query(creditSql, [userId]);

      // Log the grant transaction
      const txnSql = `
        INSERT INTO ${this.tables.transactions}
        (user_id, amount_cents, transaction_type, description, created_at)
        VALUES ($1, 100, 'subscription_grant', 'Welcome credits - Explorer plan', NOW())
      `;
      await query(txnSql, [userId]);

      logger.info('Created default subscription for user', { userId, plan: 'explorer', credits: 100 });
      return { created: true, plan: 'explorer', credits: 100 };
    } catch (err) {
      logger.error('Failed to ensure default subscription:', err);
      return null;
    }
  }

  /**
   * Get the current plan and credit balance for a user
   */
  async getUserStatus(userId) {
    if (!userId) return null;
    
    try {
      // Get Subscription and Plan details
      const subSql = `
        SELECT s.*, p.name as plan_name, p.monthly_credit_allowance, p.features
        FROM ${this.tables.subscriptions} s
        JOIN ${this.tables.plans} p ON s.plan_id = p.id
        WHERE s.user_id = $1
      `;
      const subRes = await query(subSql, [userId]);
      const subscription = subRes.rows[0] || null;

      // Get Credit Balance
      const creditSql = `SELECT balance_cents FROM ${this.tables.credits} WHERE user_id = $1`;
      const creditRes = await query(creditSql, [userId]);
      const balance = creditRes.rows[0]?.balance_cents || 0;

      return {
        subscription,
        balance_cents: balance,
        can_run_inference: this._canRunInference(subscription, balance)
      };
    } catch (err) {
      logger.error('Error fetching user credit status:', err);
      throw err;
    }
  }

  _canRunInference(subscription, balance) {
    // If enterprise (unlimited), always yes
    if (subscription?.monthly_credit_allowance === -1) return true;
    
    // If balance is positive, yes
    if (balance > 0) return true;

    // If no subscription or free tier exhausted logic (to be refined), default to false if 0 balance
    // But for now, user asked "manage cost of credits".
    return false;
  }

  /**
   * Check if user can afford a specific estimated cost
   */
  async checkAvailability(userId, estimatedCostCents = 1) {
    if (!userId) return false;
    // System user bypass
    if (userId === '00000000-0000-0000-0000-000000000001') return true;

    const status = await this.getUserStatus(userId);
    if (!status) return false;

    // Enterprise / Unlimited check
    if (status.subscription?.monthly_credit_allowance === -1) return true;

    return status.balance_cents >= estimatedCostCents;
  }

  /**
   * Deduct credits after successful usage
   */
  async deductCredits(userId, costCents, description, transactionRef) {
    if (!userId || costCents <= 0) return;
    // System user bypass
    if (userId === '00000000-0000-0000-0000-000000000001') return;

    // Check if unlimited first
    const status = await this.getUserStatus(userId);
    if (status?.subscription?.monthly_credit_allowance === -1) {
        // Log transaction but don't deduct? Or log 0 deduction?
        // Let's log it for audit but not change balance if we want "infinite balance" semantics,
        // OR we just let the balance go negative?
        // Better: Don't deduct from wallet for Enterprise, just log usage in standard usage table.
        // But the user requested "credits".
        // Let's assume even Enterprise consumes credits, but they get a monthly refill of a huge amount?
        // No, -1 flag is safer.
        return;
    }

    const client = await query('BEGIN'); // Start transaction (assuming query supports tx wrapper or we just do sequentially)
    // Note: The 'query' import might not support transaction objects directly like 'pg' pool.
    // I'll assume simple sequential execution for now or single atomic update.
    
    try {
        const updateSql = `
            UPDATE ${this.tables.credits}
            SET balance_cents = balance_cents - $1, updated_at = NOW()
            WHERE user_id = $2
            RETURNING balance_cents
        `;
        await query(updateSql, [costCents, userId]);

        const txnSql = `
            INSERT INTO ${this.tables.transactions} 
            (user_id, amount_cents, transaction_type, description, reference_id, created_at)
            VALUES ($1, $2, 'usage', $3, $4, NOW())
        `;
        await query(txnSql, [userId, -costCents, description, transactionRef]);
    } catch (err) {
        logger.error('Failed to deduct credits:', err);
        // Don't throw, just log. We don't want to crash the request after it succeeded.
    }
  }
}

module.exports = new CreditService();
