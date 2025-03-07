import { currentIdToken } from '@/app/providers/use-auth-storage';
import { API_BASE_URL } from '@/services/constants';
import { API_401_EVENT } from '@/app/providers/auth-provider';

export class Error422<P> extends Error {
  public readonly data: P;
  public readonly headers: Headers;
  public readonly status: 422;

  constructor(response: { status: 422; data: P; headers: Headers }) {
    super(`API 422 Error: ${response.status}`);
    Object.setPrototypeOf(this, GenericApiError.prototype);
    this.data = response.data;
    this.status = response.status;
    this.headers = response.headers;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GenericApiError);
    }
    this.name = 'Error422';
  }
}
/**
 * Custom API error class that provides structured error information
 */
export class GenericApiError extends Error {
  public readonly response: unknown;

  constructor(response: unknown) {
    super(`API Error: ${response}`);
    Object.setPrototypeOf(this, GenericApiError.prototype);
    this.response = response;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GenericApiError);
    }
    this.name = 'GenericApiError';
  }
}

const getBody = (c: Response) => {
  const contentType = c.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return c.json();
  }
  if (contentType && contentType.includes('text/csv')) {
    return c.text();
  }
  if (c.status === 204) {
    return null;
  }
  throw Error('Backend returned unsupported content-type.');
};

const getHeaders = (options: RequestInit) => {
  const idToken = currentIdToken();
  return {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(idToken && { Authorization: 'Bearer ' + idToken }),
  };
};

const sendCustomLogoutEvent = () => {
  window.dispatchEvent(new CustomEvent(API_401_EVENT));
};

export const orvalFetch = async <T>(path: string, options: RequestInit): Promise<T> => {
  const requestUrl = new URL(path, API_BASE_URL);
  const requestHeaders = getHeaders(options);
  const requestInit: RequestInit = {
    ...options,
    headers: requestHeaders,
  };
  const request = new Request(requestUrl, requestInit);
  const response = await fetch(request);
  const data = await getBody(response);

  if (request.headers.has('Authorization') && response.status === 401) {
    // Orval doesn't allow us to pass through context so we cannot invoke the logout() handler directly; instead,
    // we trigger a custom event which auth-provider will react to.
    sendCustomLogoutEvent();
  }
  const result = { status: response.status, data: data, headers: response.headers };
  if (result.status === 422) {
    throw new Error422({ ...result, status: 422 });
  } else if (response.status < 200 || response.status >= 300) {
    throw new GenericApiError(result);
  }
  return data;
};

export type ErrorType<GeneratedErrorPayload> = Error | Error422<GeneratedErrorPayload> | GenericApiError;
