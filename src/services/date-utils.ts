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
