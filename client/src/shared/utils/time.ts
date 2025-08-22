import { DateTime } from 'luxon';

/**
 * Time utilities standardized on Luxon.
 * - All timestamps are ISO-8601 in UTC when serialized
 * - Parsing assumes inputs are ISO strings unless noted
 */

export const nowIsoUtc = (): string => DateTime.utc().toISO();

export const addDaysUtcIso = (days: number): string => DateTime.utc().plus({ days }).toISO();

export const toLocalDisplay = (isoUtc: string, format: Intl.DateTimeFormatOptions = DateTime.DATETIME_MED): string => {
  return DateTime.fromISO(isoUtc, { zone: 'utc' }).toLocal().toLocaleString(format as any);
};

export const parseIsoToDateUtc = (iso: string): Date => {
  return DateTime.fromISO(iso, { zone: 'utc' }).toJSDate();
};

export const fromMaybeDateOrIsoToDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;
  return parseIsoToDateUtc(value);
};

export const startAndEndIsoUtc = (startDaysFromNow: number, endDaysFromNow: number): { startIso: string; endIso: string } => {
  const startIso = DateTime.utc().plus({ days: startDaysFromNow }).toISO();
  const endIso = DateTime.utc().plus({ days: endDaysFromNow }).toISO();
  return { startIso, endIso };
};


