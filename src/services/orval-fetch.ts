import {currentIdToken} from "@/services/use-id-token-storage";
import {FALLBACK_API_BASE_URL} from "@/services/constants";

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

const getUrl = (methodUrl: string): string => {
    const baseUrl =
        process.env.NODE_ENV === 'production'
            ? process.env.NEXT_PUBLIC_XNGIN_API_BASE_URL
            : FALLBACK_API_BASE_URL;
    return new URL(methodUrl, baseUrl).toString();
};

const getHeaders = (options: RequestInit) => {
    const idToken = currentIdToken();
    return {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(idToken && {"Authorization": "Bearer " + idToken}),
    };
};

export const orvalFetch = async <T>(
    url: string,
    options: RequestInit,
): Promise<T> => {
    const requestUrl = getUrl(url);
    const requestHeaders = getHeaders(options);
    const requestInit: RequestInit = {
        ...options,
        headers: requestHeaders,
    };
    const request = new Request(requestUrl, requestInit);
    const response = await fetch(request);
    const data = await getBody<T>(response);
    return {status: response.status, data, headers: response.headers} as T;
};
