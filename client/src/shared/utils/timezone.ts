import { DateTime } from 'luxon';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

/**
 * Get the user's timezone from their profile
 * Falls back to UTC if not set
 */
export async function getUserTimezone(): Promise<string> {
  try {
    const result = await authentikAuthService.getSession();
    if (result.success && result.data?.user?.timezone) {
      return result.data.user.timezone;
    }
    return 'UTC';
  } catch (error) {
    // Timezone warning removed for production
    return 'UTC';
  }
}

/**
 * Convert a date to the user's timezone
 */
export function toUserTimezone(date: Date, userTimezone: string = 'UTC'): DateTime {
  return DateTime.fromJSDate(date).setZone(userTimezone);
}

/**
 * Convert a date from the user's timezone to UTC
 */
export function fromUserTimezone(date: Date, userTimezone: string = 'UTC'): DateTime {
  return DateTime.fromJSDate(date, { zone: userTimezone }).toUTC();
}

/**
 * Format a date in the user's timezone
 */
export function formatInUserTimezone(
  date: Date, 
  format: string, 
  userTimezone: string = 'UTC'
): string {
  return toUserTimezone(date, userTimezone).toFormat(format);
}

/**
 * Get current time in user's timezone
 */
export function getCurrentUserTime(userTimezone: string = 'UTC'): DateTime {
  return DateTime.now().setZone(userTimezone);
}

/**
 * Check if a date is today in the user's timezone
 */
export function isTodayInUserTimezone(date: Date, userTimezone: string = 'UTC'): boolean {
  const userDate = toUserTimezone(date, userTimezone);
  const today = getCurrentUserTime(userTimezone);
  return userDate.hasSame(today, 'day');
}

/**
 * Check if a date is tomorrow in the user's timezone
 */
export function isTomorrowInUserTimezone(date: Date, userTimezone: string = 'UTC'): boolean {
  const userDate = toUserTimezone(date, userTimezone);
  const tomorrow = getCurrentUserTime(userTimezone).plus({ days: 1 });
  return userDate.hasSame(tomorrow, 'day');
}

/**
 * Check if a date is yesterday in the user's timezone
 */
export function isYesterdayInUserTimezone(date: Date, userTimezone: string = 'UTC'): boolean {
  const userDate = toUserTimezone(date, userTimezone);
  const yesterday = getCurrentUserTime(userTimezone).minus({ days: 1 });
  return userDate.hasSame(yesterday, 'day');
}

/**
 * Get the start of day in user's timezone
 */
export function startOfDayInUserTimezone(date: Date, userTimezone: string = 'UTC'): DateTime {
  return toUserTimezone(date, userTimezone).startOf('day');
}

/**
 * Get the end of day in user's timezone
 */
export function endOfDayInUserTimezone(date: Date, userTimezone: string = 'UTC'): DateTime {
  return toUserTimezone(date, userTimezone).endOf('day');
}
