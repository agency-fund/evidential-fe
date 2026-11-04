import { expect, test } from 'vitest';
import { DwhErrorCode } from '@/api/methods.schemas';
import { apiErrorDetails, dwhErrorDetails, formatErrorReport } from '@/services/error-report';
import { ApiDwhError, ApiError } from '@/services/orval-fetch';

const PAGE_URL = 'https://app.example/datasources/ds-1';

test('dwhErrorDetails includes every field the response and request carry', () => {
  const error = new ApiDwhError(
    {
      status: 424,
      data: {
        message: 'The data warehouse user cannot read the table.',
        code: DwhErrorCode.dwh_permission_denied,
        hint: 'Ask your database administrator to run the following statement.',
        hint_command: 'GRANT SELECT ON participants TO evidential;',
        dwh_message: 'permission denied for table participants',
        table_name: 'participants',
        request_id: 'req-123',
      },
    },
    { method: 'GET', path: '/v1/m/datasources/ds-1/inspect?refresh=true' },
  );

  expect(dwhErrorDetails(error, PAGE_URL)).toEqual([
    { label: 'Error code', value: 'dwh_permission_denied' },
    { label: 'Table', value: 'participants' },
    { label: 'Page', value: PAGE_URL },
    { label: 'API request', value: 'GET /v1/m/datasources/ds-1/inspect?refresh=true' },
    { label: 'Request ID', value: 'req-123' },
    { label: 'Data warehouse message', value: 'permission denied for table participants' },
  ]);
});

test('dwhErrorDetails omits fields the response and request do not carry', () => {
  const error = new ApiDwhError({
    status: 424,
    data: { message: 'The data warehouse did not respond in time.', code: DwhErrorCode.dwh_timeout },
  });

  expect(dwhErrorDetails(error, PAGE_URL)).toEqual([
    { label: 'Error code', value: 'dwh_timeout' },
    { label: 'Page', value: PAGE_URL },
  ]);
});

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
