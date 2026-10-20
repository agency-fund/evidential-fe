import { currentSessionToken } from '@/providers/use-auth-storage';
import { AIRPLANE_MODE, API_BASE_URL } from '@/services/constants';
import { API_401_EVENT } from '@/providers/auth-provider';
import { HTTPValidationError } from '@/api/methods.schemas';

/** Error raised when the FastAPI backend returned a Pydantic HTTPValidationError. */
export class ApiValidationError extends Error {
  public readonly data: HTTPValidationError;
  public readonly status: 422;

  constructor(response: { status: 422; data: HTTPValidationError }) {
    super(`API 422 Error: ${response.status}`);
    Object.setPrototypeOf(this, ApiValidationError.prototype);
    this.data = response.data;
    this.status = response.status;
    this.name = 'ApiValidationError';
  }
}

const messageFromBody = (status: number, data: unknown): string => {
  if (data !== null && typeof data === 'object') {
    const body = data as { message?: unknown; detail?: unknown };
    if (typeof body.message === 'string') {
      return body.message;
    }
    if (typeof body.detail === 'string') {
      return body.detail;
    }
  }
  return `HTTP ${status}`;
};

/**
 * Error raised when the FastAPI backend returned an unsuccessful response.
 */
export class ApiError extends Error {
  constructor(public readonly response: { status: number; data: unknown }) {
    super(messageFromBody(response.status, response.data));
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
  }
}

/**
 * Error raised when fetch() rejected, which browsers do for network failures and for responses blocked by CORS. The
 * browser does not tell us which of those happened.
 */
export class ApiNetworkError extends Error {
  constructor(options?: { cause?: unknown }) {
    super(
      'The request did not complete. Check your connection and try again. If the problem continues, contact support.',
      options,
    );
    Object.setPrototypeOf(this, ApiNetworkError.prototype);
    this.name = 'ApiNetworkError';
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;

export const isApiValidationError = (err: unknown): err is ApiValidationError => err instanceof ApiValidationError;

export const isApiNetworkError = (err: unknown): err is ApiNetworkError => err instanceof ApiNetworkError;

export const getErrorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

const getBody = async (c: Response): Promise<unknown> => {
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
  if (c.status === 304) {
    // not modified
    return null;
  }
  const text = await c.text();
  return text === '' ? null : text;
};

// Returns headers to send with API requests. If we currently have a session token in localStorage, we also send that. Note
// that this means we may generate requests that do not contain the session token.
const getHeaders = (options: RequestInit) => {
  const sessionToken = AIRPLANE_MODE ? 'airplane-mode-token' : currentSessionToken();
  return {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(sessionToken && { Authorization: 'Bearer ' + sessionToken }),
  };
};

const sendCustomLogoutEvent = () => {
  window.dispatchEvent(new CustomEvent(API_401_EVENT));
};

/**
 * orvalFetch is used by Orval's generated API clients as the "fetcher". It handles all API requests made by the Orval
 * code.
 *
 * It takes care of:
 * - Adding authentication headers (from localstorage)
 * - Processing responses (reading the body and handling content-type variations)
 * - Handling errors in a consistent way
 *
 * When an API call succeeds, the data is returned directly.
 *
 * When an API call fails (non-2xx response):
 * - For regular function calls: the error is thrown.
 * - For data loading hooks: the error appears in the `error` property.
 * - For mutation triggers: the error is thrown when trigger is invoked.
 *
 * When fetch() itself rejects (network failure or a CORS-blocked response), an ApiNetworkError is thrown.
 *
 * The thrown error may be inspected; if it is an ApiValidationError, you can extract structured information from
 * the error.
 *
 * See orval.config.ts for configuration details.
 */
export const orvalFetch = async <T>(path: string, options: RequestInit): Promise<T> => {
  const requestUrl = new URL(path, API_BASE_URL);
  const requestInit: RequestInit = {
    ...options,
    headers: getHeaders(options),
  };
  const request = new Request(requestUrl, requestInit);
  let response: Response;
  try {
    response = await fetch(request);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiNetworkError({ cause: err });
    }
    throw err;
  }
  const data = await getBody(response);

  if (request.headers.has('Authorization') && response.status === 401) {
    // Orval doesn't allow us to pass through context so we cannot invoke the logout() handler directly; instead,
    // we trigger a custom event which auth-provider will react to.
    sendCustomLogoutEvent();
  }
  const result = { status: response.status, data: data, headers: response.headers };
  if (result.status === 422 && Array.isArray((data as { detail?: unknown } | null)?.detail)) {
    throw new ApiValidationError({ ...result, status: 422, data: data as HTTPValidationError });
  } else if (response.status < 200 || response.status >= 300) {
    throw new ApiError(result);
  }
  return data as T;
};

/**
 * ErrorType is used by the Orval-generated client code to add some type safety to the `error` values returned by
 * the SWR hooks. Its existence as an exported variable influences Orval's code generation.
 *
 * The API client code is automatically generated from our OpenAPI spec, which is generated by FastAPI,
 * and it expects error responses to match specific types defined in that specification. When the generator knows what
 * error type to expect (like FastAPI's handling of Pydantic validation errors with status 422), it will use that
 * specific type. For other cases, it uses 'unknown'. There are many instances where unknown is used because FastAPI
 * cannot automatically generate error types for all possible errors.
 *
 * However, our backend can return errors that aren't explicitly defined in the API spec. So instead of using the
 * generated error types (which would be incomplete), we use our own custom error types that can handle common error
 * scenarios:
 * - ApiNetworkError: the request did not complete (network failure or a CORS-blocked response).
 * - ApiValidationError: a 422 whose body is a Pydantic HTTPValidationError (`detail` is an array).
 * - ApiError: any other non-2xx response; `message` is human-readable and `response` holds the status and body.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<GeneratedErrorPayload> = Error | ApiNetworkError | ApiValidationError | ApiError;
