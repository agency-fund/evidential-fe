import { describe, expect, it } from 'vitest';
import { formatDateUtcYYYYMMDD, formatIsoDateLocal } from '@/services/date-utils';

describe('formatDateUtcYYYYMMDD', () => {
  it('uses the UTC calendar date', () => {
    expect(formatDateUtcYYYYMMDD(new Date('2026-03-01T23:30:00-05:00'))).toBe('2026-03-02');
  });
});

describe('formatIsoDateLocal', () => {
  it('formats the date portion without shifting it across time zones', () => {
    expect(formatIsoDateLocal('2026-03-01T00:00:00Z')).toBe(new Date(2026, 2, 1).toLocaleDateString());
  });
});
