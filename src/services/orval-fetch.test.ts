import { afterEach, beforeEach, expect, test, vi } from 'vitest';

type OrvalFetchModule = typeof import('@/services/orval-fetch');

let mod: OrvalFetchModule;
let API_401_EVENT: string;

const stubFetch = (response: Response | Promise<never>) => {
  const fetchMock = vi.fn(() => (response instanceof Response ? Promise.resolve(response) : response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fetchError = async (): Promise<unknown> => {
  try {
    await mod.orvalFetch('/v1/thing', { method: 'GET' });
  } catch (err) {
    return err;
  }
  throw new Error('orvalFetch did not throw');
};

beforeEach(async () => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_XNGIN_API_BASE_URL = 'http://api.test';
  mod = await import('@/services/orval-fetch');
  ({ API_401_EVENT } = await import('@/providers/auth-provider'));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

test('returns parsed JSON for a 2xx response', async () => {
  const fetchMock = stubFetch(jsonResponse({ ok: true }, 200));
  await expect(mod.orvalFetch('/v1/thing', { method: 'GET' })).resolves.toEqual({ ok: true });
  expect((fetchMock.mock.calls[0] as unknown as [Request])[0].url).toBe('http://api.test/v1/thing');
});

test('returns null for a 204 response', async () => {
  stubFetch(new Response(null, { status: 204 }));
  await expect(mod.orvalFetch('/v1/thing', { method: 'DELETE' })).resolves.toBeNull();
});

test('a text/plain 500 becomes an ApiError carrying the text', async () => {
  stubFetch(new Response('Internal Server Error', { status: 500, headers: { 'content-type': 'text/plain' } }));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiError);
  expect((err as InstanceType<OrvalFetchModule['ApiError']>).response).toMatchObject({
    status: 500,
    data: 'Internal Server Error',
  });
  expect(mod.getErrorMessage(err)).toBe('HTTP 500');
});

test('a JSON error body supplies the ApiError message', async () => {
  stubFetch(jsonResponse({ message: 'x' }, 502));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiError);
  expect((err as Error).message).toBe('x');
});

test('a rejected fetch becomes an ApiNetworkError', async () => {
  stubFetch(Promise.reject(new TypeError('Failed to fetch')));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiNetworkError);
  expect(err).not.toBeInstanceOf(mod.ApiError);
  expect(mod.getErrorMessage(err)).toBe(
    'The request did not complete. Check your connection and try again. If the problem continues, contact support.',
  );
});

test('a non-TypeError rejection propagates unchanged', async () => {
  const abort = new DOMException('aborted', 'AbortError');
  stubFetch(Promise.reject(abort));
  await expect(fetchError()).resolves.toBe(abort);
});

test('a 422 with a string detail is an ApiError, not an ApiRequestValidationError', async () => {
  stubFetch(jsonResponse({ detail: 'x' }, 422));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiError);
  expect(err).not.toBeInstanceOf(mod.ApiRequestValidationError);
  expect((err as Error).message).toBe('x');
});

test('a 422 with an array detail is an ApiRequestValidationError', async () => {
  const body = { detail: [{ loc: ['body', 'desired_n'], msg: 'm', type: 't' }] };
  stubFetch(jsonResponse(body, 422));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiRequestValidationError);
  const validationError = err as InstanceType<OrvalFetchModule['ApiRequestValidationError']>;
  expect(validationError.data).toEqual(body);
  expect(validationError.message).toBe('body.desired_n: m');
});

test('an ApiRequestValidationError is an ApiError that records the status and the failed request', async () => {
  stubFetch(jsonResponse({ detail: [{ loc: ['body'], msg: 'm', type: 't' }] }, 422));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiError);
  const apiError = err as InstanceType<OrvalFetchModule['ApiError']>;
  expect(apiError.response.status).toBe(422);
  expect(apiError.request).not.toBeNull();
});

test('an authenticated 401 dispatches the logout event even when the body is not JSON', async () => {
  localStorage.setItem('xu', JSON.stringify({ sessionToken: 'token' }));
  const listener = vi.fn();
  window.addEventListener(API_401_EVENT, listener);
  const fetchMock = stubFetch(new Response('Unauthorized', { status: 401, headers: { 'content-type': 'text/plain' } }));
  try {
    const err = await fetchError();
    expect((fetchMock.mock.calls[0] as unknown as [Request])[0].headers.get('Authorization')).toBe('Bearer token');
    expect(err).toBeInstanceOf(mod.ApiError);
    expect(listener).toHaveBeenCalledOnce();
  } finally {
    window.removeEventListener(API_401_EVENT, listener);
  }
});

test('getErrorMessage stringifies non-Error values', () => {
  expect(mod.getErrorMessage('oops')).toBe('oops');
});

test('a DwhErrorResponse body becomes an ApiDwhError with every field mapped', async () => {
  const body = {
    code: 'dwh_permission_denied',
    message: 'Evidential cannot read the table.',
    hint: 'Ask your database administrator to run the following statement.',
    hint_command: 'GRANT SELECT ON t TO evidential;',
    dwh_message: 'permission denied for table t',
    table_name: 't',
    request_id: 'req-1',
  };
  stubFetch(jsonResponse(body, 424));
  const err = await fetchError();
  expect(mod.isApiDwhError(err)).toBe(true);
  expect(err).toBeInstanceOf(mod.ApiError);
  const dwhError = err as InstanceType<OrvalFetchModule['ApiDwhError']>;
  expect(dwhError.response.status).toBe(424);
  expect(dwhError.message).toBe('Evidential cannot read the table.');
  expect(dwhError.code).toBe('dwh_permission_denied');
  expect(dwhError.hint).toBe('Ask your database administrator to run the following statement.');
  expect(dwhError.hintCommand).toBe('GRANT SELECT ON t TO evidential;');
  expect(dwhError.dwhMessage).toBe('permission denied for table t');
  expect(dwhError.tableName).toBe('t');
  expect(dwhError.requestId).toBe('req-1');
});

test('an ApiError records the method and path, with query string, of the request that failed', async () => {
  stubFetch(jsonResponse({ message: 'nope' }, 500));
  let err: unknown;
  try {
    await mod.orvalFetch('/v1/thing?page_size=5', { method: 'POST' });
  } catch (caught) {
    err = caught;
  }
  expect((err as InstanceType<OrvalFetchModule['ApiError']>).request).toEqual({
    method: 'POST',
    path: '/v1/thing?page_size=5',
  });
});

test('an ApiDwhError records the request that failed', async () => {
  stubFetch(jsonResponse({ code: 'dwh_timeout', message: 'x' }, 424));
  const err = await fetchError();
  expect((err as InstanceType<OrvalFetchModule['ApiDwhError']>).request).toEqual({ method: 'GET', path: '/v1/thing' });
});

test('a body with an unknown code is a plain ApiError, not an ApiDwhError', async () => {
  stubFetch(jsonResponse({ code: 'dwh_unknown', message: 'x' }, 424));
  const err = await fetchError();
  expect(err).toBeInstanceOf(mod.ApiError);
  expect(mod.isApiDwhError(err)).toBe(false);
  expect((err as Error).message).toBe('x');
});

test('a DwhErrorResponse with null or omitted optional fields maps them to null', async () => {
  stubFetch(jsonResponse({ code: 'dwh_connection', message: 'x', hint: null, dwh_message: null }, 424));
  const err = await fetchError();
  expect(mod.isApiDwhError(err)).toBe(true);
  const dwhError = err as InstanceType<OrvalFetchModule['ApiDwhError']>;
  expect(dwhError.response.status).toBe(424);
  expect(dwhError.code).toBe('dwh_connection');
  expect(dwhError.message).toBe('x');
  expect(dwhError.hint).toBeNull();
  expect(dwhError.hintCommand).toBeNull();
  expect(dwhError.dwhMessage).toBeNull();
  expect(dwhError.tableName).toBeNull();
  expect(dwhError.requestId).toBeNull();
});
