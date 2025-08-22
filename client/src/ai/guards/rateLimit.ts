import { RateLimiterMemory } from 'rate-limiter-flexible';

export interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Time window in seconds
  blockDuration?: number; // Block duration in seconds after limit exceeded
}

export class RateLimitExceededError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

// Default rate limit configurations
export const DEFAULT_RATE_LIMITS = {
  perMinute: { points: 60, duration: 60 },
  perHour: { points: 1000, duration: 3600 },
  perDay: { points: 10000, duration: 86400 },
} as const;

// Create rate limiters for different time windows
const perMinuteLimiter = new RateLimiterMemory({
  points: DEFAULT_RATE_LIMITS.perMinute.points,
  duration: DEFAULT_RATE_LIMITS.perMinute.duration,
});

const perHourLimiter = new RateLimiterMemory({
  points: DEFAULT_RATE_LIMITS.perHour.points,
  duration: DEFAULT_RATE_LIMITS.perHour.duration,
});

const perDayLimiter = new RateLimiterMemory({
  points: DEFAULT_RATE_LIMITS.perDay.points,
  duration: DEFAULT_RATE_LIMITS.perDay.duration,
});

export async function assertRateLimit(tenantId: string): Promise<void> {
  try {
    // Check all rate limits
    await Promise.all([
      perMinuteLimiter.consume(tenantId),
      perHourLimiter.consume(tenantId),
      perDayLimiter.consume(tenantId),
    ]);
  } catch (error: any) {
    // Rate limit exceeded
    const retryAfter = Math.ceil(error.msBeforeNext / 1000);
    throw new RateLimitExceededError(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    );
  }
}

export async function getRateLimitInfo(tenantId: string): Promise<{
  perMinute: { remaining: number; resetTime: number };
  perHour: { remaining: number; resetTime: number };
  perDay: { remaining: number; resetTime: number };
}> {
  const [minuteInfo, hourInfo, dayInfo] = await Promise.all([
    perMinuteLimiter.get(tenantId),
    perHourLimiter.get(tenantId),
    perDayLimiter.get(tenantId),
  ]);

  return {
    perMinute: {
      remaining: minuteInfo.remainingPoints,
      resetTime: minuteInfo.msBeforeNext,
    },
    perHour: {
      remaining: hourInfo.remainingPoints,
      resetTime: hourInfo.msBeforeNext,
    },
    perDay: {
      remaining: dayInfo.remainingPoints,
      resetTime: dayInfo.msBeforeNext,
    },
  };
}

// Custom rate limiter for specific use cases
export function createCustomRateLimiter(config: RateLimitConfig): RateLimiterMemory {
  return new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  });
}

// Rate limiter for expensive operations (e.g., large context windows)
export const expensiveOperationLimiter = createCustomRateLimiter({
  points: 10, // 10 requests
  duration: 3600, // per hour
  blockDuration: 1800, // block for 30 minutes if exceeded
});

export async function assertExpensiveOperation(tenantId: string): Promise<void> {
  try {
    await expensiveOperationLimiter.consume(tenantId);
  } catch (error: any) {
    const retryAfter = Math.ceil(error.msBeforeNext / 1000);
    throw new RateLimitExceededError(
      `Expensive operation rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    );
  }
}

// Reset all rate limiters (useful for testing)
export function resetRateLimiters(): void {
  // Reset by consuming all remaining points (this effectively resets the limiter)
  try {
    perMinuteLimiter.consume('__reset__', 1000);
  } catch {}
  try {
    perHourLimiter.consume('__reset__', 1000);
  } catch {}
  try {
    perDayLimiter.consume('__reset__', 1000);
  } catch {}
  try {
    expensiveOperationLimiter.consume('__reset__', 1000);
  } catch {}
}
