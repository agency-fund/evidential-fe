/**
 * Utility functions for date formatting and manipulation
 * NOTE: consider using date-fns library for future additions.
 */

/**
 * Formats a date as a human-readable UTC timestamp label
 */
export const extractUtcHHMMLabel = (date: Date, hour12: boolean = false): string => {
  const timePart = date.toLocaleTimeString(undefined, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: hour12,
  });
  return `${timePart} UTC`;
};

/**
 * Formats a date as a human-readable UTC timestamp label
 */
export const formatUtcDownToMinuteLabel = (date: Date): string => {
  const datePart = date.toLocaleDateString(undefined, { timeZone: 'UTC' });
  const timePart = extractUtcHHMMLabel(date);
  return `${datePart}, ${timePart}`;
};

/**
 * Converts an ISO datetime string or Date obj to YYYY-MM-DD format. Uses local timezone to preserve
 * the user's calendar date
 */
export const formatIsoDateYYYYMMDD = (dateInput: string | Date): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Converts a date input string (YYYY-MM-DD) to an ISO datetime string
 * Preserves the local date by creating a date in local timezone at midnight
 */
export const dateInputToIsoString = (dateInput: string): string => {
  const date = new Date(dateInput + 'T00:00:00');
  return date.toISOString();
};

/**
 * Formats an ISO date string to a localized date string without timezone conversion
 * Extracts the date portion (YYYY-MM-DD) and parses it as a local date to avoid
 * timezone shifts that can cause off-by-one-day bugs
 */
export const formatIsoDateLocal = (isoString: string): string => {
  const datePart = isoString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);

  // Create date in local timezone to avoid UTC conversion
  return new Date(year, month - 1, day).toLocaleDateString();
};
