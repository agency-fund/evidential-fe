/**
 * Utility functions for date formatting and manipulation
 * NOTE: consider using date-fns library for future additions.
 */

/**
 * Formats a date as a human-readable UTC timestamp label
 */
export const formatUtcDownToMinuteLabel = (date: Date): string => {
  const datePart = date.toLocaleDateString(undefined, { timeZone: 'UTC' });
  const timePart = date.toLocaleTimeString(undefined, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart}, ${timePart} UTC`;
};
