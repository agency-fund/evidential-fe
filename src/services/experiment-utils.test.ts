import { describe, expect, test } from 'vitest';
import { MetricPowerAnalysis } from '@/api/methods.schemas';
import { getAssignableN, getAvailableWithoutValuesN, isPowerAnalysisForOtherOneTimeMode } from './experiment-utils';

const analysis = (metricSpec: Partial<MetricPowerAnalysis['metric_spec']>): MetricPowerAnalysis => ({
  metric_spec: { field_name: 'converted', ...metricSpec },
});

describe('getAssignableN', () => {
  test('is everyone who meets the filters when one-time mode is off', () => {
    expect(getAssignableN(analysis({ available_n: 1000, available_nonnull_n: 400 }))).toBe(1000);
    expect(getAssignableN(analysis({ available_n: 1000, available_nonnull_n: 400, use_one_time_metric: false }))).toBe(
      1000,
    );
  });

  test('is only participants without a value when one-time mode is on', () => {
    expect(getAssignableN(analysis({ available_n: 1000, available_nonnull_n: 400, use_one_time_metric: true }))).toBe(
      600,
    );
  });

  test('is undefined in one-time mode when the non-null count is missing, rather than overstating it', () => {
    expect(getAssignableN(analysis({ available_n: 1000, use_one_time_metric: true }))).toBeUndefined();
    expect(
      getAssignableN(analysis({ available_n: 1000, available_nonnull_n: null, use_one_time_metric: true })),
    ).toBeUndefined();
  });

  test('is undefined without an analysis or an available count', () => {
    expect(getAssignableN(undefined)).toBeUndefined();
    expect(getAssignableN(analysis({ available_n: null }))).toBeUndefined();
  });
});

describe('isPowerAnalysisForOtherOneTimeMode', () => {
  test('is true only when the analysis and the switch disagree', () => {
    expect(isPowerAnalysisForOtherOneTimeMode(analysis({ use_one_time_metric: true }), false)).toBe(true);
    expect(isPowerAnalysisForOtherOneTimeMode(analysis({ use_one_time_metric: false }), true)).toBe(true);
    expect(isPowerAnalysisForOtherOneTimeMode(analysis({ use_one_time_metric: true }), true)).toBe(false);
    expect(isPowerAnalysisForOtherOneTimeMode(analysis({ use_one_time_metric: false }), false)).toBe(false);
  });

  test('treats a missing flag on either side as off', () => {
    expect(isPowerAnalysisForOtherOneTimeMode(analysis({}), undefined)).toBe(false);
    expect(isPowerAnalysisForOtherOneTimeMode(analysis({}), true)).toBe(true);
  });

  test('is false without an analysis', () => {
    expect(isPowerAnalysisForOtherOneTimeMode(undefined, true)).toBe(false);
  });
});

describe('getAvailableWithoutValuesN', () => {
  test('counts participants without a value whatever the one-time setting', () => {
    expect(getAvailableWithoutValuesN(analysis({ available_n: 1000, available_nonnull_n: 400 }))).toBe(600);
    expect(
      getAvailableWithoutValuesN(analysis({ available_n: 1000, available_nonnull_n: 400, use_one_time_metric: true })),
    ).toBe(600);
  });

  test('is undefined when either count is missing', () => {
    expect(getAvailableWithoutValuesN(analysis({ available_n: 1000 }))).toBeUndefined();
    expect(getAvailableWithoutValuesN(analysis({ available_nonnull_n: 400 }))).toBeUndefined();
    expect(getAvailableWithoutValuesN(undefined)).toBeUndefined();
  });
});
