import 'express';

declare module 'express' {
  interface Request {
    /** Tenant identifier injected by middleware */
    tenantId?: string;
  }
}

// Budget tier used by AI budget guard
export type BudgetTier = 'free' | 'standard' | 'premium' | 'enterprise';
