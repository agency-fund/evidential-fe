'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForTokens, generatePkceLoginInfo } from '@/services/pkce';
import { XSpinner } from '@/app/components/ui/x-spinner';
import { useAuthStorage } from '@/app/providers/use-auth-storage';
import { AIRPLANE_MODE, API_BASE_URL } from '@/services/constants';
import { useCustomEventListener } from '@/app/providers/use-custom-event-handler';

export const API_401_EVENT = 'api_returned_401';
const CODE_VERIFIER_KEY = 'code_verifier';

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
  const [user, setUser] = useAuthStorage();
  const [fetching, setFetching] = useState<boolean>(false);
  const isGoogleLoginRedirect = user === null && searchParams.has('code') && searchParams.has('scope');

  const logout = useCallback(() => {
    console.log('logout');
    localStorage.removeItem(CODE_VERIFIER_KEY);
    setUser(null);
    router.push('/');
  }, [setUser, router]);

  useCustomEventListener(API_401_EVENT, logout);

  const startLogin = useCallback(async () => {
    const { codeVerifier, loginUrl } = await generatePkceLoginInfo();
    localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    router.push(loginUrl);
  }, [router]);

  useEffect(() => {
    if (!isGoogleLoginRedirect) {
      return;
    }
    (async () => {
      setFetching(true);
      try {
        const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
        const tokens = await exchangeCodeForTokens(searchParams.get('code') as string, codeVerifier!);
        localStorage.removeItem(CODE_VERIFIER_KEY);
        const newToken = tokens.id_token ?? null;
        if (newToken === null) {
          console.log('backend failed to return a usable token');
          logout();
          return;
        }
        const response = await checkCallerIdentity(newToken);
        if (response.status === 200) {
          setUser({ idToken: newToken, email: (await response.json())['email'] });
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
  }, [router, searchParams, setUser, isGoogleLoginRedirect, logout]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const idToken = user.idToken;
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
  }, [user, logout]);

  let contextValue: AuthContext;

  if (AIRPLANE_MODE) {
    contextValue = {
      isAuthenticated: true,
      idToken: 'airplane-mode-token',
      userEmail: 'testing@agency.fund',
      logout: () => console.log('Login and logout functionality is not available when AIRPLANE_MODE is set.'),
    };
  } else if (user) {
    contextValue = {
      isAuthenticated: true,
      idToken: user.idToken,
      userEmail: user.email,
      logout,
    };
  } else {
    contextValue = {
      isAuthenticated: false,
      startLogin,
      reset: logout,
    };
  }

  return fetching ? (
    <XSpinner message="Authenticating..." />
  ) : (
    <GoogleAuthContext.Provider value={contextValue}>{children}</GoogleAuthContext.Provider>
  );
}
