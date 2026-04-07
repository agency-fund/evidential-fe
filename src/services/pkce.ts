import { OIDC_CLIENT_ID, OIDC_BASE_URL, OIDC_REDIRECT_URI } from '@/services/constants';

// Google's OAuth login endpoint is declared in https://accounts.google.com/.well-known/openid-configuration.
const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

const base64urlEncode = (buffer: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const createBase64UrlToken = (bytes: number): string => {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
};

const createCodeVerifier = () => createBase64UrlToken(56);

const createCodeChallenge = async (codeVerifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
};

const createState = () => createBase64UrlToken(32);

const createNonce = () => createBase64UrlToken(32);
/**
 * Generates a login URL given a PKCE code challenge.
 *
 * Docs on login URLs:
 * https://developers.google.com/identity/openid-connect/openid-connect#sendauthrequest
 * https://developers.google.com/identity/openid-connect/openid-connect#authenticationuriparameters
 */

const createGoogleLoginUrl = (code_challenge: string, state: string, nonce: string) => {
  if (!OIDC_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_XNGIN_GOOGLE_CLIENT_ID is not set.');
  }
  if (!OIDC_REDIRECT_URI) {
    throw new Error('NEXT_PUBLIC_XNGIN_OIDC_REDIRECT_URI is unset.');
  }
  const params = {
    client_id: OIDC_CLIENT_ID,
    code_challenge: code_challenge,
    code_challenge_method: 'S256',
    nonce: nonce,
    redirect_uri: OIDC_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email',
    state: state,
  };
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams(params).toString();
  return url.toString();
};

export async function generatePkceLoginInfo() {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = createState();
  const nonce = createNonce();
  return { codeVerifier, state, nonce, loginUrl: createGoogleLoginUrl(codeChallenge, state, nonce) };
}

export async function exchangeCodeForTokens(authCode: string, codeVerifier: string, nonce: string) {
  const response = await fetch(`${OIDC_BASE_URL}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: authCode, code_verifier: codeVerifier, nonce }),
  });
  return await response.json();
}
