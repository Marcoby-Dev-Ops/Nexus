import type { Request } from 'express';

/**
 * AuthenticatedRequest interface for TypeScript support
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    role: string;
  };
}
