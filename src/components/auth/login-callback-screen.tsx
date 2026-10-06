'use client';

import { useEffect, useState } from 'react';
import LoginCard from '@/components/auth/login-card';
import LoginScreen from '@/components/auth/login-screen';
import { XSpinner } from '@/components/ui/x-spinner';
import { completeLogin, LoginCallback } from '@/services/oidc-login';
import { SessionTokenStored } from '@/providers/use-auth-storage';

interface LoginCallbackScreenProps {
  callback: LoginCallback;
  onSuccess: (session: SessionTokenStored) => void;
}

export default function LoginCallbackScreen({ callback, onSuccess }: LoginCallbackScreenProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // The registered redirect URI is the root without query parameters.
    window.history.replaceState(null, '', window.location.pathname);
    completeLogin(callback)
      .then((result) => {
        if (!active) return;
        if (result.status === 'success') onSuccess(result.session);
        else setError(result.message);
      })
      .catch((error) => {
        console.error('Unable to save sign-in session:', error);
        if (active) setError('We could not save your sign-in session. Please enable browser storage and try again.');
      });
    return () => {
      active = false;
    };
  }, [callback, onSuccess]);

  return error ? (
    <LoginScreen initialError={error} />
  ) : (
    <LoginCard>
      <XSpinner message="Authenticating..." />
    </LoginCard>
  );
}
