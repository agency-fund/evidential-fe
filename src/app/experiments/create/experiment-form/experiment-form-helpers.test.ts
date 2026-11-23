import { expect, test } from 'vitest';
import { z } from 'zod';
import { ExperimentFormData } from './experiment-form-types';
import { convertToFrequentistDesignSpec, describeDesignSpecError, isStaleDesignSpec } from './experiment-form-helpers';

function frequentistForm(overrides: Partial<ExperimentFormData> = {}): ExperimentFormData {
  return {
    name: 'Outreach test',
    hypothesis: 'The reminder increases replies.',
    designUrl: '',
    startDate: '2026-04-01',
    endDate: '2026-05-01',
    experimentType: 'freq_preassigned',
    tableName: 'participants',
    primaryKey: 'participant_id',
    primaryMetric: {
      metric: { field_name: 'replied', data_type: 'integer', description: '' },
      mde: '10',
    },
    arms: [{ arm_name: 'Control' }, { arm_name: 'Reminder' }],
    ...overrides,
  };
}

test('describeDesignSpecError lists each zod issue with its path', () => {
  const result = z.object({ arms: z.array(z.string()).min(2), power: z.number() }).safeParse({ arms: [] });

  expect(describeDesignSpecError(result.error).split('\n')).toEqual([
    expect.stringMatching(/^arms: /),
    expect.stringMatching(/^power: /),
  ]);
});

test('describeDesignSpecError uses the message of a plain error', () => {
  const message = 'arm_weights: All arms must have weights set, or none should have weights.';

  expect(describeDesignSpecError(new Error(message))).toBe(message);
});

test('isStaleDesignSpec keeps a response whose spec still matches the form', () => {
  const data = frequentistForm({ desiredN: 400 });
  const sent = convertToFrequentistDesignSpec({ ...data, desiredN: undefined, desiredNClusters: undefined });

  expect(isStaleDesignSpec(data, sent)).toBe(false);
});

test('isStaleDesignSpec drops a response after the design changes', () => {
  const data = frequentistForm();
  const sent = convertToFrequentistDesignSpec(data);

  const withFilter = frequentistForm({
    filters: [{ field_name: 'region', relation: 'includes', value: ['north'] }],
  });

  expect(isStaleDesignSpec(withFilter, sent)).toBe(true);
});

test('isStaleDesignSpec drops a response when a new filter has no field yet', () => {
  const data = frequentistForm();
  const sent = convertToFrequentistDesignSpec(data);
  const draftingFilter = frequentistForm({
    filters: [{ field_name: '', relation: 'includes', value: [] }],
  });

  expect(isStaleDesignSpec(draftingFilter, sent)).toBe(true);
});
