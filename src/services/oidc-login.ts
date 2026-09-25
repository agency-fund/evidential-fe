import { z } from 'zod';
import { callerIdentityResponse } from '@/api/admin.zod';
import type { SessionTokenStored } from '@/providers/use-auth-storage';
import { API_BASE_URL, SUPPORT_EMAIL } from '@/services/constants';
import { exchangeCodeForTokens, generatePkceLoginInfo } from '@/services/pkce';

const PENDING_AUTH_KEY = 'pending_auth';
const SIGN_IN_FAILED_MESSAGE = `Sign-in could not be completed. Please try again. If this continues, contact ${SUPPORT_EMAIL}.`;
const PendingAuthSchema = z.object({ codeVerifier: z.string(), state: z.string(), nonce: z.string() });

// Unvalidated authentication response (success or error); see OIDC Core 1.0 §3.1.2.{5,6}.
export interface LoginCallback {
  code: string | null;
  state: string | null;
  error: string | null;
}

type LoginResult = { status: 'success'; session: SessionTokenStored } | { status: 'error'; message: string };

let completion: { key: string; promise: Promise<LoginResult> } | undefined;

export function readLoginCallback(params: Pick<URLSearchParams, 'has' | 'get'>): LoginCallback | null {
  // Missing state is still a callback, but must fail validation rather than show the idle login screen.
  if (!params.has('code') && !params.has('error')) return null;
  return { code: params.get('code'), state: params.get('state'), error: params.get('error') };
}

export const clearPendingLogin = () => sessionStorage.removeItem(PENDING_AUTH_KEY);

export const checkCallerIdentity = (sessionToken: string) =>
  fetch(new URL('/v1/m/caller-identity', API_BASE_URL), {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

export async function beginLogin(): Promise<string> {
  clearPendingLogin();
  completion = undefined;
  const { codeVerifier, state, nonce, loginUrl } = await generatePkceLoginInfo();
  sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify({ codeVerifier, state, nonce }));
  return loginUrl;
}

async function exchangeCallback(callback: LoginCallback): Promise<LoginResult> {
  try {
    const stored = sessionStorage.getItem(PENDING_AUTH_KEY);
    clearPendingLogin();
    const pending = PendingAuthSchema.safeParse(JSON.parse(stored ?? 'null'));
    if (!pending.success || !callback.state) {
      return { status: 'error', message: 'We could not resume this sign-in attempt. Please try again.' };
    }
    if (callback.state !== pending.data.state) {
      return { status: 'error', message: 'We could not verify this sign-in attempt. Please try again.' };
    }
    if (callback.error !== null || !callback.code) {
      return {
        status: 'error',
        message:
          callback.error === 'access_denied'
            ? `Sign-in was cancelled or denied. Please try again or contact ${SUPPORT_EMAIL} if you need access.`
            : SIGN_IN_FAILED_MESSAGE,
      };
    }
    const tokens = await exchangeCodeForTokens(callback.code, pending.data.codeVerifier, pending.data.nonce);
    const response = await checkCallerIdentity(tokens.session_token);
    if (response.status === 401) {
      return { status: 'error', message: `Please contact ${SUPPORT_EMAIL} for access.` };
    }
    if (!response.ok) throw new Error(`Checking caller identity failed with status ${response.status}.`);
    const identity = callerIdentityResponse.parse(await response.json());
    return {
      status: 'success',
      session: { sessionToken: tokens.session_token, email: identity.email, isPrivileged: identity.is_privileged },
    };
  } catch (error) {
    console.error('Unable to complete sign-in:', error);
    return { status: 'error', message: SIGN_IN_FAILED_MESSAGE };
  }
}

export function completeLogin(callback: LoginCallback): Promise<LoginResult> {
  const key = JSON.stringify(callback);
  // Retain the settled promise as well: remounts must not exchange a single-use code again.
  // A new login discards this one-attempt cache.
  if (completion?.key !== key) completion = { key, promise: exchangeCallback(callback) };
  return completion.promise;
}
