import { describe, expect, test } from 'vitest';
import { DataType, PowerResponse } from '@/api/methods.schemas';
import { ExperimentForm } from './experiment-form-def';
import {
  convertToFrequentistDesignSpec,
  describeOneTimeMetricRejection,
  isOneTimeMetricRejection,
} from './experiment-form-helpers';
import { ApiError, ApiRequestValidationError } from '@/services/orval-fetch';
import { ExperimentFormData, MetricWithMDE, PowerCheckOption } from './experiment-form-types';
import { ExperimentFreqStackScreenMessage, getNextDisabledReasons } from './experiment-freq-stack-screen';

const primaryMetric: MetricWithMDE = {
  metric: { field_name: 'converted', data_type: DataType.boolean, description: '' },
  mde: '10',
};

const otherMetric: MetricWithMDE = {
  metric: { field_name: 'revenue', data_type: DataType.integer, description: '' },
  mde: '5',
};

const formData = (overrides: Partial<ExperimentFormData> = {}): ExperimentFormData => ({
  ...ExperimentForm.initialData(),
  experimentType: 'freq_preassigned',
  datasourceId: 'ds-1',
  tableName: 'participants',
  primaryKey: 'id',
  primaryMetric,
  ...overrides,
});

const powerResponse = ({ useOneTimeMetric }: { useOneTimeMetric: boolean }): PowerResponse => ({
  analyses: [
    {
      metric_spec: {
        field_name: primaryMetric.metric.field_name,
        available_n: 1000,
        available_nonnull_n: 400,
        is_one_time_eligible: true,
        use_one_time_metric: useOneTimeMetric,
      },
      target_n: 200,
      sufficient_n: true,
    },
  ],
});

const reduceFreqStack = (data: ExperimentFormData, msg: ExperimentFreqStackScreenMessage) =>
  ExperimentForm.screens['freq-stack'].withScreen((screen) => screen.reducer(data, msg as never));

const reduceExperimentType = (data: ExperimentFormData, value: ExperimentFormData['experimentType']) =>
  ExperimentForm.screens['experiment-type'].withScreen((screen) =>
    screen.reducer(data, { type: 'set-experiment-type', value } as never),
  );

const powerCheckResponseMessage = (
  data: ExperimentFormData,
  response: PowerResponse,
): ExperimentFreqStackScreenMessage => ({
  type: 'set-power-check-response',
  response,
  desiredN: 200,
  sampleSizeOption: PowerCheckOption.USE_POWER_CHECK,
  designSpec: convertToFrequentistDesignSpec({ ...data, desiredN: undefined, desiredNClusters: undefined }),
});

describe('convertToFrequentistDesignSpec', () => {
  const primarySpec = (data: ExperimentFormData) =>
    convertToFrequentistDesignSpec(data).metrics.find((m) => m.field_name === primaryMetric.metric.field_name);

  test('sends the switch value on the primary metric', () => {
    expect(primarySpec(formData({ useOneTimeMetric: true }))?.use_one_time_metric).toBe(true);
    expect(primarySpec(formData({ useOneTimeMetric: false }))?.use_one_time_metric).toBe(false);
  });

  test('sends false when the switch was never touched', () => {
    expect(primarySpec(formData())?.use_one_time_metric).toBe(false);
  });

  test('never sends it on secondary metrics', () => {
    const spec = convertToFrequentistDesignSpec(formData({ useOneTimeMetric: true, secondaryMetrics: [otherMetric] }));
    const secondary = spec.metrics.find((m) => m.field_name === otherMetric.metric.field_name);
    expect(secondary).toBeDefined();
    expect(secondary).not.toHaveProperty('use_one_time_metric');
  });
});

describe('freq-stack reducer: one-time metric', () => {
  test('set-one-time-metric stores the choice and keeps the current power check results', () => {
    const response = powerResponse({ useOneTimeMetric: false });
    const data = formData({ powerCheckResponse: response, powerCurveResponse: response, desiredN: 200 });

    const next = reduceFreqStack(data, { type: 'set-one-time-metric', enabled: true });

    expect(next.useOneTimeMetric).toBe(true);
    expect(next.powerCheckResponse).toBe(response);
    expect(next.powerCurveResponse).toBe(response);
    expect(next.desiredN).toBe(200);
  });

  test.each([true, false])('a power check response sets the switch to what the backend used (%s)', (used) => {
    const data = formData({ useOneTimeMetric: !used });
    // The response is matched against the spec built from the current form, so build it from that form.
    const next = reduceFreqStack(data, powerCheckResponseMessage(data, powerResponse({ useOneTimeMetric: used })));

    expect(next.powerCheckResponse).toBeDefined();
    expect(next.useOneTimeMetric).toBe(used);
  });

  test('a stale power check response is dropped and does not change the switch', () => {
    const requested = formData({ useOneTimeMetric: false });
    const message = powerCheckResponseMessage(requested, powerResponse({ useOneTimeMetric: false }));
    // The user turned the switch on while the request was in flight.
    const current = { ...requested, useOneTimeMetric: true };

    expect(reduceFreqStack(current, message)).toBe(current);
  });

  test.each<[string, ExperimentFreqStackScreenMessage]>([
    ['primary-metric-select', { type: 'primary-metric-select', primaryMetric: otherMetric }],
    ['primary-metric-deselect', { type: 'primary-metric-deselect', primaryMetric: undefined, secondaryMetrics: [] }],
    [
      'promote-secondary-to-primary',
      { type: 'promote-secondary-to-primary', primaryMetric: otherMetric, secondaryMetrics: [] },
    ],
    ['set-filters', { type: 'set-filters', filters: [] }],
  ])('%s turns one-time mode off and clears the power check', (_name, msg) => {
    const data = formData({ useOneTimeMetric: true, powerCheckResponse: powerResponse({ useOneTimeMetric: true }) });

    const next = reduceFreqStack(data, msg);

    expect(next.useOneTimeMetric).toBe(false);
    expect(next.powerCheckResponse).toBeUndefined();
  });

  test.each<[string, ExperimentFreqStackScreenMessage]>([
    ['set-confidence', { type: 'set-confidence', value: '90' }],
    ['set-power', { type: 'set-power', value: '90' }],
    ['secondary-metric-add', { type: 'secondary-metric-add', secondaryMetrics: [otherMetric] }],
    ['mde-change', { type: 'mde-change', primaryMetric: { ...primaryMetric, mde: '20' } }],
  ])('%s clears the power check but keeps one-time mode', (_name, msg) => {
    const data = formData({ useOneTimeMetric: true, powerCheckResponse: powerResponse({ useOneTimeMetric: true }) });

    const next = reduceFreqStack(data, msg);

    expect(next.useOneTimeMetric).toBe(true);
    expect(next.powerCheckResponse).toBeUndefined();
  });
});

describe('freq-stack reducer: one-time metric failures', () => {
  test('restore puts the switch back to match the response on screen', () => {
    // The user turned it on; the re-run failed, and the stored response is still for "off".
    const data = formData({ useOneTimeMetric: true, powerCheckResponse: powerResponse({ useOneTimeMetric: false }) });

    expect(reduceFreqStack(data, { type: 'restore-one-time-metric' }).useOneTimeMetric).toBe(false);
  });

  test('restore keeps a reset made while the request was in flight', () => {
    // The user turned it off, then changed filters (which turns it off and clears the response) before the failure.
    const data = reduceFreqStack(
      formData({ useOneTimeMetric: false, powerCheckResponse: powerResponse({ useOneTimeMetric: true }) }),
      { type: 'set-filters', filters: [] },
    );

    const next = reduceFreqStack(data, { type: 'restore-one-time-metric' });

    expect(next.useOneTimeMetric).toBe(false);
  });

  test('a rejection with one-time results on screen turns it off and clears them', () => {
    const data = formData({
      useOneTimeMetric: true,
      powerCheckResponse: powerResponse({ useOneTimeMetric: true }),
      desiredN: 200,
    });

    const next = reduceFreqStack(data, { type: 'one-time-metric-rejected' });

    expect(next.useOneTimeMetric).toBe(false);
    expect(next.powerCheckResponse).toBeUndefined();
    expect(next.desiredN).toBeUndefined();
    expect(getNextDisabledReasons(next)).not.toContain(
      'Waiting for the sample size estimate to update for the one-time metric setting.',
    );
  });

  test('a rejection while turning it on keeps the valid "off" results', () => {
    const response = powerResponse({ useOneTimeMetric: false });
    const data = formData({ useOneTimeMetric: true, powerCheckResponse: response, desiredN: 200 });

    const next = reduceFreqStack(data, { type: 'one-time-metric-rejected' });

    expect(next.useOneTimeMetric).toBe(false);
    expect(next.powerCheckResponse).toBe(response);
    expect(next.desiredN).toBe(200);
  });

  test('a new response drops an MDE estimate made for the other setting', () => {
    const data = formData({
      useOneTimeMetric: true,
      mdePowerCheckResponse: powerResponse({ useOneTimeMetric: false }),
    });

    const next = reduceFreqStack(data, powerCheckResponseMessage(data, powerResponse({ useOneTimeMetric: true })));

    expect(next.mdePowerCheckResponse).toBeUndefined();
  });

  test('a new response keeps an MDE estimate made for the same setting', () => {
    const mdeResponse = powerResponse({ useOneTimeMetric: true });
    const data = formData({ useOneTimeMetric: true, mdePowerCheckResponse: mdeResponse });

    const next = reduceFreqStack(data, powerCheckResponseMessage(data, powerResponse({ useOneTimeMetric: true })));

    expect(next.mdePowerCheckResponse).toBe(mdeResponse);
  });
});

describe('experiment-type reducer: one-time metric', () => {
  test('switching away from preassigned turns one-time mode off', () => {
    expect(reduceExperimentType(formData({ useOneTimeMetric: true }), 'freq_online').useOneTimeMetric).toBe(false);
  });

  test('switching away from preassigned drops power check results computed with it on', () => {
    const data = formData({ useOneTimeMetric: true, powerCheckResponse: powerResponse({ useOneTimeMetric: true }) });

    const backToPreassigned = reduceExperimentType(reduceExperimentType(data, 'freq_online'), 'freq_preassigned');

    expect(backToPreassigned.useOneTimeMetric).toBe(false);
    expect(backToPreassigned.powerCheckResponse).toBeUndefined();
  });

  test('switching type keeps power check results when one-time mode was off', () => {
    const response = powerResponse({ useOneTimeMetric: false });

    expect(reduceExperimentType(formData({ powerCheckResponse: response }), 'freq_online').powerCheckResponse).toBe(
      response,
    );
  });

  test('staying on preassigned keeps one-time mode', () => {
    expect(reduceExperimentType(formData({ useOneTimeMetric: true }), 'freq_preassigned').useOneTimeMetric).toBe(true);
  });
});

describe('getNextDisabledReasons: one-time metric', () => {
  const waitingReason = 'Waiting for the sample size estimate to update for the one-time metric setting.';
  const readyForm = (overrides: Partial<ExperimentFormData>) =>
    formData({ desiredN: 200, sampleSizeOption: PowerCheckOption.USE_POWER_CHECK, ...overrides });

  test('blocks Next while the power check was run for the other one-time setting', () => {
    const data = readyForm({ useOneTimeMetric: true, powerCheckResponse: powerResponse({ useOneTimeMetric: false }) });

    expect(getNextDisabledReasons(data)).toEqual([waitingReason]);
  });

  test('allows Next once the power check matches the switch', () => {
    const data = readyForm({ useOneTimeMetric: true, powerCheckResponse: powerResponse({ useOneTimeMetric: true }) });

    expect(getNextDisabledReasons(data)).toEqual([]);
  });

  test('treats a response without the flag (older backends) as one-time mode off', () => {
    const response = powerResponse({ useOneTimeMetric: false });
    delete response.analyses[0].metric_spec.use_one_time_metric;

    expect(getNextDisabledReasons(readyForm({ powerCheckResponse: response }))).toEqual([]);
    expect(getNextDisabledReasons(readyForm({ useOneTimeMetric: true, powerCheckResponse: response }))).toEqual([
      waitingReason,
    ]);
  });

  test('limits the sample size to participants without a value in one-time mode', () => {
    // 1000 available, 400 with a value: only 600 can be assigned.
    const data = readyForm({
      useOneTimeMetric: true,
      desiredN: 700,
      powerCheckResponse: powerResponse({ useOneTimeMetric: true }),
    });

    expect(getNextDisabledReasons(data)).toEqual([
      "Desired N (700) exceeds the primary metric's available samples (600).",
    ]);
  });
});

describe('isOneTimeMetricRejection', () => {
  const validationError = (msg: string) =>
    new ApiRequestValidationError({
      status: 422,
      data: { detail: [{ loc: ['body', 'design_spec'], msg, type: 'value_error' }] },
    });

  test('is true when the backend refused one-time metric', () => {
    expect(
      isOneTimeMetricRejection(
        validationError(
          'Value error, use_one_time_metric is not supported for cluster-randomized designs. ' +
            'Turn off use_one_time_metric or remove cluster_key.',
        ),
      ),
    ).toBe(true);
  });

  test('is true when the field is named only in the error location', () => {
    const error = new ApiRequestValidationError({
      status: 422,
      data: {
        detail: [
          {
            loc: ['body', 'design_spec', 'metrics', 0, 'use_one_time_metric'],
            msg: 'Value error, not supported here.',
            type: 'value_error',
          },
        ],
      },
    });

    expect(isOneTimeMetricRejection(error)).toBe(true);
  });

  test('is false for other validation errors', () => {
    expect(isOneTimeMetricRejection(validationError('Value error, power must be between 0 and 1.'))).toBe(false);
  });

  test('is false for errors that are not validation errors', () => {
    expect(isOneTimeMetricRejection(new ApiError({ status: 500, data: 'use_one_time_metric' }))).toBe(false);
    expect(isOneTimeMetricRejection(new Error('use_one_time_metric'))).toBe(false);
  });
});

describe('describeOneTimeMetricRejection', () => {
  test('names the filter on the primary metric', () => {
    const data = formData({
      filters: [{ field_name: primaryMetric.metric.field_name, relation: 'excludes', value: [null] }],
    });

    expect(describeOneTimeMetricRejection(data)).toBe(
      "One-time metric was turned off because it can't be combined with a filter on converted. Remove that filter to use it.",
    );
  });

  test('names cluster designs', () => {
    expect(describeOneTimeMetricRejection(formData({ clusterKey: 'school_id' }))).toBe(
      "One-time metric was turned off because it isn't supported for cluster-randomized experiments.",
    );
  });

  test('falls back to a general explanation', () => {
    expect(describeOneTimeMetricRejection(formData())).toBe(
      "One-time metric was turned off because it isn't supported with these experiment settings.",
    );
  });
});
