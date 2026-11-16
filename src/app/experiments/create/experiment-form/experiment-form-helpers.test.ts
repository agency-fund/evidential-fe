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
  const message = 'arm_weights: All arms must have weights set, or none should have weights.';

  expect(describeDesignSpecError(new Error(message))).toBe(message);
});
