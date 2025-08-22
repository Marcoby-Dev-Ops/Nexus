export type BudgetTier = 'low' | 'standard' | 'premium';

export interface BudgetConfig {
  tier: BudgetTier;
  maxCostUSD?: number;
  dailyLimitUSD?: number;
}

export class BudgetExceededError extends Error {
  constructor(
    message: string,
    public readonly budgetUSD: number,
    public readonly actualUSD: number
  ) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

export function assertBudget(
  costUSD: number, 
  config: BudgetConfig
): void {
  const cap = config.maxCostUSD ?? getDefaultBudgetForTier(config.tier);
  
  if (costUSD > cap) {
    throw new BudgetExceededError(
      `Budget exceeded: $${costUSD.toFixed(4)} > $${cap.toFixed(4)}`,
      cap,
      costUSD
    );
  }
}

export function getDefaultBudgetForTier(tier: BudgetTier): number {
  switch (tier) {
    case 'low':
      return 0.002; // $0.002 USD
    case 'standard':
      return 0.01; // $0.01 USD
    case 'premium':
      return 0.05; // $0.05 USD
    default:
      return 0.01;
  }
}

export function getDailyBudgetForTier(tier: BudgetTier): number {
  switch (tier) {
    case 'low':
      return 0.10; // $0.10 USD per day
    case 'standard':
      return 1.00; // $1.00 USD per day
    case 'premium':
      return 10.00; // $10.00 USD per day
    default:
      return 1.00;
  }
}

// In-memory daily spending tracker (in production, use Redis or database)
const dailySpending = new Map<string, number>();

export function assertDailyBudget(
  tenantId: string,
  costUSD: number,
  config: BudgetConfig
): void {
  const dailyLimit = config.dailyLimitUSD ?? getDailyBudgetForTier(config.tier);
  const currentSpending = dailySpending.get(tenantId) ?? 0;
  const newTotal = currentSpending + costUSD;
  
  if (newTotal > dailyLimit) {
    throw new BudgetExceededError(
      `Daily budget exceeded: $${newTotal.toFixed(4)} > $${dailyLimit.toFixed(4)}`,
      dailyLimit,
      newTotal
    );
  }
  
  dailySpending.set(tenantId, newTotal);
}

// Reset daily spending (call this daily at midnight)
export function resetDailySpending(): void {
  dailySpending.clear();
}

// Get current daily spending for a tenant
export function getDailySpending(tenantId: string): number {
  return dailySpending.get(tenantId) ?? 0;
}
