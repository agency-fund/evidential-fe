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
 * Converts an ISO datetime string to YYYY-MM-DD format for HTML date inputs
 * Handles timezone conversion properly by using the same Date object as display functions
 */
export const formatDateForInput = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Converts a local date string (YYYY-MM-DD) to an ISO datetime string
 * Preserves the local date by creating a date in local timezone
 */
export const formatLocalDateForApi = (localDateString: string): string => {
  const date = new Date(localDateString + 'T00:00:00');
  return date.toISOString();
};
