import { expect, test } from 'vitest';
import { apiErrorDetails, formatErrorReport } from '@/services/error-report';
import { ApiError } from '@/services/orval-fetch';

const PAGE_URL = 'https://app.example/datasources/ds-1';

test('apiErrorDetails includes the status, request, and pretty-printed body', () => {
  const error = new ApiError(
    { status: 500, data: { message: 'Internal error' } },
    { method: 'POST', path: '/v1/m/experiments' },
  );

  expect(apiErrorDetails(error, PAGE_URL)).toEqual([
    { label: 'HTTP status', value: '500' },
    { label: 'Page', value: PAGE_URL },
    { label: 'API request', value: 'POST /v1/m/experiments' },
    { label: 'Response body', value: '{\n  "message": "Internal error"\n}' },
  ]);
});

test('apiErrorDetails omits the request and body when there are none', () => {
  const error = new ApiError({ status: 502, data: null });

  expect(apiErrorDetails(error, PAGE_URL)).toEqual([
    { label: 'HTTP status', value: '502' },
    { label: 'Page', value: PAGE_URL },
  ]);
});

test('formatErrorReport lists the title, body, then details, with multi-line values after their label', () => {
  expect(
    formatErrorReport(
      'Failed to load experiment',
      ['Try again later.', 'Internal error'],
      [
        { label: 'HTTP status', value: '500' },
        { label: 'Response body', value: '{\n  "message": "Internal error"\n}' },
      ],
    ),
  ).toBe(
    [
      'Failed to load experiment',
      'Try again later.',
      'Internal error',
      'HTTP status: 500',
      'Response body:',
      '{',
      '  "message": "Internal error"',
      '}',
    ].join('\n'),
  );
});
