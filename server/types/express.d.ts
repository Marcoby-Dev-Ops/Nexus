// Augment express request type for the server
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Tenant identifier injected by middleware */
    tenantId?: string;
  }
}

// Budget tier used by AI budget guard
export type BudgetTier = 'free' | 'standard' | 'premium' | 'enterprise';
