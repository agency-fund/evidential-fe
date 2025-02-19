'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForTokens, generatePkceLoginInfo } from '@/services/pkce';
import { Spinner } from '@radix-ui/themes';
import { useIdTokenStorage } from '@/services/use-id-token-storage';
import { API_BASE_URL } from '@/services/constants';

interface AuthenticatedState {
  isAuthenticated: true;
  idToken: string;
  userEmail: string;
  logout: () => void;
}

interface UnauthenticatedState {
  isAuthenticated: false;
  startLogin: () => void;
  reset: () => void;
}

type AuthContext = AuthenticatedState | UnauthenticatedState;

const GoogleAuthContext = createContext<AuthContext | null>(null);

export const useAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === null) {
    throw new Error('useAuth can only be used within GoogleAuthProvider');
  }
  return context;
};

const checkCallerIdentity = async (idToken: string) => {
  const url = new URL('/v1/m/caller-identity', API_BASE_URL);
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
};

export default function GoogleAuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // TODO: consolidate idToken and userEmail
  const [idToken, setIdToken] = useIdTokenStorage();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fetching, setFetching] = useState<boolean>(false);
  const isGoogleLoginRedirect = idToken === null && searchParams.has('code') && searchParams.has('scope');

  const logout = useCallback(() => {
    console.log('logout');
    localStorage.removeItem('code_verifier');
    setIdToken(null);
    setUserEmail(null);
    router.push('/');
  }, [setIdToken, router]);

  const startLogin = useCallback(async () => {
    const { codeVerifier, loginUrl } = await generatePkceLoginInfo();
    localStorage.setItem('code_verifier', codeVerifier);
    router.push(loginUrl);
  }, [router]);

  useEffect(() => {
    if (!isGoogleLoginRedirect) {
      return;
    }
    (async () => {
      setFetching(true);
      try {
        const codeVerifier = localStorage.getItem('code_verifier');
        const tokens = await exchangeCodeForTokens(searchParams.get('code') as string, codeVerifier!);
        localStorage.removeItem('code_verifier');
        const newToken = tokens.id_token ?? null;
        if (newToken === null) {
          console.log('backend failed to return a usable token');
          logout();
          return;
        }
        const response = await checkCallerIdentity(newToken);
        if (response.status === 200) {
          setIdToken(newToken);
          setUserEmail((await response.json())['email']);
          router.push('/');
        } else {
          console.log('checkCallerIdentity failed');
          logout();
          return;
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [router, searchParams, setIdToken, isGoogleLoginRedirect, logout]);

  useEffect(() => {
    if (!idToken) {
      return;
    }
    const validateToken = async () => {
      console.log('Validating token');
      try {
        const response = await checkCallerIdentity(idToken);
        if (response.status === 401) {
          console.log('idToken has expired.');
          logout();
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };
    const interval = setInterval(validateToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [idToken, logout]);

  const contextValue: AuthContext =
    idToken && userEmail
      ? {
          isAuthenticated: true,
          idToken,
          userEmail,
          logout,
        }
      : {
          isAuthenticated: false,
          startLogin,
          reset: logout,
        };

  return fetching ? (
    <Spinner />
  ) : (
    <GoogleAuthContext.Provider value={contextValue}>{children}</GoogleAuthContext.Provider>
  );
}
