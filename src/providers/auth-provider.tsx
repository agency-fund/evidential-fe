'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { exchangeCodeForTokens, generatePkceLoginInfo } from '@/services/pkce';
import { XSpinner } from '@/components/ui/x-spinner';
import { useAuthStorage } from '@/providers/use-auth-storage';
import { AIRPLANE_MODE, API_BASE_URL } from '@/services/constants';
import { useCustomEventListener } from '@/providers/use-custom-event-handler';
import { getLogoutUrl } from '@/api/admin';

export const API_401_EVENT = 'api_returned_401';
const PENDING_AUTH_KEY = 'pending_auth';

// User satisfied IDP and has been invited to the application.
interface AuthenticatedState {
  isAuthenticated: true;
  sessionToken: string;
  userEmail: string;
  isPrivileged: boolean;
  logout: () => void;
}

// User may or may not have satisfied IDP and does not have access to the application.
interface UnauthenticatedState {
  isAuthenticated: false;
  userIsMissingInvite: boolean;
  startLogin: () => void;
  reset: () => void;
}

type AuthContext = AuthenticatedState | UnauthenticatedState;

const PendingAuthSchema = z.object({
  codeVerifier: z.string(),
  state: z.string(),
  nonce: z.string(),
});

type PendingAuth = z.infer<typeof PendingAuthSchema>;

const GoogleAuthContext = createContext<AuthContext | null>(null);

export const useAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === null) {
    throw new Error('useAuth can only be used within GoogleAuthProvider');
  }
  return context;
};

const checkCallerIdentity = async (sessionToken: string) => {
  const url = new URL('/v1/m/caller-identity', API_BASE_URL);
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
};

const getPendingAuth = (): PendingAuth | null => {
  const item = sessionStorage.getItem(PENDING_AUTH_KEY);
  if (item === null) {
    return null;
  }
  try {
    const result = PendingAuthSchema.safeParse(JSON.parse(item));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

const setPendingAuth = (pendingAuth: PendingAuth) =>
  sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pendingAuth));

const clearPendingAuth = () => sessionStorage.removeItem(PENDING_AUTH_KEY);

export default function GoogleAuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useAuthStorage();
  const [fetching, setFetching] = useState<boolean>(false);
  const isGoogleLoginRedirect =
    user === null && searchParams.has('code') && searchParams.has('scope') && searchParams.has('state');
  const [userIsMissingInvite, setUserIsMissingInvite] = useState(false);

  const logout = useCallback(async () => {
    clearPendingAuth();
    if (user?.sessionToken) {
      try {
        await fetch(new URL(getLogoutUrl(), API_BASE_URL), {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.sessionToken}` },
        });
      } catch (_) {
        // ignore
      }
    }
    setUser(null);
    router.push('/');
  }, [user, setUser, router]);

  useCustomEventListener(API_401_EVENT, logout);

  const startLogin = useCallback(async () => {
    const { codeVerifier, state, nonce, loginUrl } = await generatePkceLoginInfo();
    setPendingAuth({ codeVerifier, state, nonce });
    router.push(loginUrl);
  }, [router]);

  useEffect(() => {
    if (!isGoogleLoginRedirect) {
      return;
    }
    const pendingAuth = getPendingAuth();
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!pendingAuth || code === null || state === null) {
      return;
    }
    (async () => {
      if (state !== pendingAuth.state) {
        console.log('state mismatch');
        await logout();
        return;
      }
      setFetching(true);
      try {
        const tokens = await exchangeCodeForTokens(code, pendingAuth.codeVerifier, pendingAuth.nonce);
        clearPendingAuth();
        const newToken = tokens.session_token ?? null;
        if (newToken === null) {
          console.log('exchangeCodeForTokens failed to return a usable token');
          await logout();
          return;
        }
        const response = await checkCallerIdentity(newToken);
        if (response.status === 200) {
          const callerIdentity = await response.json();
          setUser({
            sessionToken: newToken,
            email: callerIdentity['email'],
            isPrivileged: callerIdentity['is_privileged'],
          });
          router.push('/');
        } else if (response.status === 401) {
          console.log('exchangeCodeForTokens succeeded but checkCallerIdentity failed');
          setUserIsMissingInvite(true);
          await logout();
        } else {
          console.log('checkCallerIdentity failed');
          await logout();
        }
      } finally {
        setFetching(false);
      }
    })().catch(console.error);
  }, [router, searchParams, setUser, isGoogleLoginRedirect, logout]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const sessionToken = user.sessionToken;
    const validateToken = async () => {
      console.log('Validating token');
      try {
        const response = await checkCallerIdentity(sessionToken);
        if (response.status === 401) {
          console.log('session token has expired.');
          await logout();
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
      isPrivileged: true,
      sessionToken: 'airplane-mode-token',
      userEmail: 'testing@example.com',
      logout: () => console.log('Login and logout functionality is not available when AIRPLANE_MODE is set.'),
    };
  } else if (user) {
    contextValue = {
      isAuthenticated: true,
      sessionToken: user.sessionToken,
      userEmail: user.email,
      isPrivileged: !!user.isPrivileged,
      logout: logout,
    };
  } else {
    contextValue = {
      isAuthenticated: false,
      userIsMissingInvite,
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
