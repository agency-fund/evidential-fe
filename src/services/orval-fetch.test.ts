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
  expect(mod.isApiError(err)).toBe(true);
  expect((err as InstanceType<OrvalFetchModule['ApiError']>).response).toMatchObject({
    status: 500,
    data: 'Internal Server Error',
  });
  expect(mod.getErrorMessage(err)).toBe('HTTP 500');
});

test('a JSON error body supplies the ApiError message', async () => {
  stubFetch(jsonResponse({ message: 'x' }, 502));
  const err = await fetchError();
  expect(mod.isApiError(err)).toBe(true);
  expect((err as Error).message).toBe('x');
});

test('a rejected fetch becomes an ApiNetworkError', async () => {
  stubFetch(Promise.reject(new TypeError('Failed to fetch')));
  const err = await fetchError();
  expect(mod.isApiNetworkError(err)).toBe(true);
  expect(mod.isApiError(err)).toBe(false);
  expect(mod.getErrorMessage(err)).toBe(
    'The request did not complete. Check your connection and try again. If the problem continues, contact support.',
  );
});

test('a non-TypeError rejection propagates unchanged', async () => {
  const abort = new DOMException('aborted', 'AbortError');
  stubFetch(Promise.reject(abort));
  await expect(fetchError()).resolves.toBe(abort);
});

test('a 422 with a string detail is an ApiError, not an ApiValidationError', async () => {
  stubFetch(jsonResponse({ detail: 'x' }, 422));
  const err = await fetchError();
  expect(mod.isApiError(err)).toBe(true);
  expect(mod.isApiValidationError(err)).toBe(false);
  expect((err as Error).message).toBe('x');
});

test('a 422 with an array detail is an ApiValidationError', async () => {
  const body = { detail: [{ loc: [], msg: 'm', type: 't' }] };
  stubFetch(jsonResponse(body, 422));
  const err = await fetchError();
  expect(mod.isApiValidationError(err)).toBe(true);
  expect((err as InstanceType<OrvalFetchModule['ApiValidationError']>).data).toEqual(body);
});

test('an authenticated 401 dispatches the logout event even when the body is not JSON', async () => {
  localStorage.setItem('xu', JSON.stringify({ sessionToken: 'token' }));
  const listener = vi.fn();
  window.addEventListener(API_401_EVENT, listener);
  const fetchMock = stubFetch(new Response('Unauthorized', { status: 401, headers: { 'content-type': 'text/plain' } }));
  try {
    const err = await fetchError();
    expect((fetchMock.mock.calls[0] as unknown as [Request])[0].headers.get('Authorization')).toBe('Bearer token');
    expect(mod.isApiError(err)).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
  } finally {
    window.removeEventListener(API_401_EVENT, listener);
  }
});

test('getErrorMessage stringifies non-Error values', () => {
  expect(mod.getErrorMessage('oops')).toBe('oops');
});
