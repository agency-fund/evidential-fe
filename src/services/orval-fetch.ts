import { currentIdToken } from '@/app/providers/use-auth-storage';
import { API_BASE_URL } from '@/services/constants';
import { API_401_EVENT } from '@/app/auth-provider';

const getBody = <T>(c: Response | Request): Promise<T> => {
  const contentType = c.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return c.json();
  }
  if (contentType && contentType.includes('application/pdf')) {
    return c.blob() as Promise<T>;
  }
  return c.text() as Promise<T>;
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
  const data = await getBody<T>(response);
  if (request.headers.has('Authorization') && response.status === 401) {
    // Orval doesn't allow us to pass through context so we cannot invoke the logout() handler directly; instead,
    // we trigger a custom event which auth-provider will react to.
    sendCustomLogoutEvent();
  }
  return { status: response.status, data, headers: response.headers } as T;
};
