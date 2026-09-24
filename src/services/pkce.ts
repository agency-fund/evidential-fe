import { z } from 'zod';
import { OIDC_BASE_URL } from '@/services/constants';

const OidcClientConfigSchema = z.object({
  authorization_endpoint: z.string(),
  client_id: z.string(),
  redirect_uri: z.string(),
  scope: z.string(),
});

type OidcClientConfig = z.infer<typeof OidcClientConfigSchema>;

// The browser navigates to the authorization endpoint, so its scheme is an allowlist rather than a format check: a
// javascript: URL would run in our origin. Plain http is tolerated only for local development identity providers.
const ALLOWED_AUTHORIZATION_SCHEMES =
  process.env.NODE_ENV === 'development' ? new Set(['https:', 'http:']) : new Set(['https:']);

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
 * Fetches the identity provider settings from the backend, which is the only place the identity provider is
 * configured.
 */
const fetchOidcClientConfig = async (): Promise<OidcClientConfig> => {
  if (!OIDC_BASE_URL) {
    throw new Error('NEXT_PUBLIC_XNGIN_OIDC_BASE_URL is not set.');
  }
  const response = await fetch(`${OIDC_BASE_URL}/config`);
  if (!response.ok) {
    throw new Error(`Fetching the login configuration failed with status ${response.status}.`);
  }
  return OidcClientConfigSchema.parse(await response.json());
};

/**
 * Generates the authorization request URL for the authorization code flow with PKCE.
 *
 * https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
const createLoginUrl = (config: OidcClientConfig, codeChallenge: string, state: string, nonce: string) => {
  const url = new URL(config.authorization_endpoint);
  if (!ALLOWED_AUTHORIZATION_SCHEMES.has(url.protocol)) {
    throw new Error(`Refusing to use an authorization endpoint with scheme ${url.protocol}`);
  }
  const params = {
    client_id: config.client_id,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    nonce: nonce,
    redirect_uri: config.redirect_uri,
    response_type: 'code',
    scope: config.scope,
    state: state,
  };
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

export async function generatePkceLoginInfo() {
  const config = await fetchOidcClientConfig();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const state = createState();
  const nonce = createNonce();
  return { codeVerifier, state, nonce, loginUrl: createLoginUrl(config, codeChallenge, state, nonce) };
}

export async function exchangeCodeForTokens(authCode: string, codeVerifier: string, nonce: string) {
  const response = await fetch(`${OIDC_BASE_URL}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: authCode, code_verifier: codeVerifier, nonce }),
  });
  return await response.json();
}
