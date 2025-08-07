import { z } from 'zod';

/**
 * Custom datetime validator that accepts both PostgreSQL and ISO 8601 formats
 * 
 * PostgreSQL format: "2025-08-05 01:20:14.982894+00"
 * ISO 8601 format: "2025-08-05T01:20:14.982894Z"
 */
export const datetimeString = () => 
  z.string().refine((val) => {
    if (!val) return true; // Allow empty strings for optional fields
    
    // Check if it's a valid date string
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: "Invalid datetime format. Expected PostgreSQL or ISO 8601 format."
  });

/**
 * Schema for optional datetime fields
 */
export const optionalDatetime = () => datetimeString().optional().nullable();

/**
 * Schema for required datetime fields
 */
export const requiredDatetime = () => datetimeString();

/**
 * Common datetime field patterns for reuse
 */
export const datetimeFields = {
  created_at: optionalDatetime(),
  updated_at: optionalDatetime(),
  createdat: optionalDatetime(),
  updatedat: optionalDatetime(),
  issued_at: optionalDatetime(),
  expires_at: optionalDatetime(),
  assigned_at: optionalDatetime(),
  canceled_at: optionalDatetime(),
  trial_start: optionalDatetime(),
  trial_end: optionalDatetime(),
  due_date: optionalDatetime(),
  paid_at: optionalDatetime(),
  period_start: optionalDatetime(),
  period_end: optionalDatetime(),
  last_assessment: optionalDatetime(),
  next_assessment: optionalDatetime(),
  expected_close_date: optionalDatetime(),
  current_period_start: optionalDatetime(),
  current_period_end: optionalDatetime(),
} as const;

/**
 * Utility to create a schema with common datetime fields
 */
export const withDatetimeFields = <T extends z.ZodRawShape>(schema: T) => {
  return z.object({
    ...schema,
    ...datetimeFields,
  });
};

/**
 * Convert any datetime string to ISO 8601 format
 */
export const toISOString = (datetime: string | null | undefined): string | null => {
  if (!datetime) return null;
  try {
    return new Date(datetime).toISOString();
  } catch {
    return null;
  }
};

/**
 * Convert any datetime string to PostgreSQL format
 */
export const toPostgreSQLString = (datetime: string | null | undefined): string | null => {
  if (!datetime) return null;
  try {
    const date = new Date(datetime);
    return date.toISOString().replace('T', ' ').replace('Z', '+00');
  } catch {
    return null;
  }
};
