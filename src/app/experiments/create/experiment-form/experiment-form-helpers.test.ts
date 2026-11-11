import { expect, test } from 'vitest';
import { z } from 'zod';
import { describeDesignSpecError } from './experiment-form-helpers';

test('describeDesignSpecError lists each zod issue with its path', () => {
  const result = z.object({ arms: z.array(z.string()).min(2), power: z.number() }).safeParse({ arms: [] });

  expect(describeDesignSpecError(result.error).split('\n')).toEqual([
    expect.stringMatching(/^arms: /),
    expect.stringMatching(/^power: /),
  ]);
});

test('describeDesignSpecError uses the message of a plain error', () => {
  expect(describeDesignSpecError(new Error('arm_weights: All arms must have weights set.'))).toBe(
    'arm_weights: All arms must have weights set.',
  );
});

test('describeDesignSpecError stringifies values that are not errors', () => {
  expect(describeDesignSpecError('boom')).toBe('boom');
});
