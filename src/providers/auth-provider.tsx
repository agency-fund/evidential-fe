'use client';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionTokenStored, useAuthStorage } from '@/providers/use-auth-storage';
import { AIRPLANE_MODE, API_BASE_URL } from '@/services/constants';
import { checkCallerIdentity, clearPendingLogin } from '@/services/oidc-login';
import { useCustomEventListener } from '@/providers/use-custom-event-handler';
import { getLogoutUrl } from '@/api/admin';

export const API_401_EVENT = 'api_returned_401';

interface AuthenticatedState {
  isAuthenticated: true;
  sessionToken: string;
  userEmail: string;
  isPrivileged: boolean;
  logout: () => void;
}

interface UnauthenticatedState {
  isAuthenticated: false;
  establishSession: (session: SessionTokenStored) => void;
  reset: () => void;
}

type AuthContext = AuthenticatedState | UnauthenticatedState;
const AuthStateContext = createContext<AuthContext | null>(null);

export const useAuth = () => {
  const context = useContext(AuthStateContext);
  if (context === null) throw new Error('useAuth can only be used within AuthProvider');
  return context;
};

export default function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [user, setUser] = useAuthStorage();

  const logout = useCallback(async () => {
    clearPendingLogin();
    if (user?.sessionToken) {
      try {
        await fetch(new URL(getLogoutUrl(), API_BASE_URL), {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.sessionToken}` },
        });
      } catch (_) {
        // Local logout must succeed even when the backend is unavailable.
      }
    }
    setUser(null);
    router.push('/');
  }, [user, setUser, router]);

  useCustomEventListener(API_401_EVENT, logout);

  useEffect(() => {
    if (!user) return;
    const validateToken = async () => {
      try {
        const response = await checkCallerIdentity(user.sessionToken);
        if (response.status === 401) await logout();
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
      logout,
    };
  } else {
    contextValue = { isAuthenticated: false, establishSession: setUser, reset: logout };
  }

  return <AuthStateContext.Provider value={contextValue}>{children}</AuthStateContext.Provider>;
}
