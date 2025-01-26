export const API_URL = process.env.NEXT_PUBLIC_XNGIN_API_BASE_URL ?? 'http://localhost:8000';
export const OIDC_BASE_URL = process.env.NEXT_PUBLIC_XNGIN_OIDC_BASE_URL ?? 'http://localhost:8000/a/oidc';
export const CLIENT_ID = process.env.NEXT_PUBLIC_XNGIN_GOOGLE_CLIENT_ID;
export const REDIRECT_URI = process.env.NEXT_PUBLIC_XNGIN_OIDC_REDIRECT_URI;

// Google's OAuth login endpoint is declared in https://accounts.google.com/.well-known/openid-configuration.
const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

const base64urlEncode = (buffer: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const createCodeVerifier = () => {
    const array = new Uint8Array(56);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
};

const createCodeChallenge = async (codeVerifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(digest);
};

/**
 * Generates a login URL given a PKCE code challenge.
 *
 * Docs on login URLs:
 * https://developers.google.com/identity/openid-connect/openid-connect#sendauthrequest
 * https://developers.google.com/identity/openid-connect/openid-connect#authenticationuriparameters
 */
const createGoogleLoginUrl = (code_challenge: string) => {
    if (!CLIENT_ID) {
        throw new Error("NEXT_PUBLIC_XNGIN_GOOGLE_CLIENT_ID is not set.")
    }
    if (!REDIRECT_URI) {
        throw new Error("NEXT_PUBLIC_XNGIN_OIDC_REDIRECT_URI is unset.")
    }
    const params = {
        "client_id": CLIENT_ID,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email",
    }
    const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
}

export async function generatePkceLoginInfo() {
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);
    return {codeVerifier, loginUrl: createGoogleLoginUrl(codeChallenge)};
}

export async function exchangeCodeForTokens(authCode: string, codeVerifier: string) {
    const response = await fetch(
        `${OIDC_BASE_URL}/callback?code=${authCode}&code_verifier=${codeVerifier}`
    );
    return await response.json();
}
