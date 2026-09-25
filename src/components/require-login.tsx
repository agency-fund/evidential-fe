'use client';

import { PropsWithChildren, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { SessionTokenStored } from '@/providers/use-auth-storage';
import { readLoginCallback } from '@/services/oidc-login';
import LoginScreen from '@/components/auth/login-screen';
import LoginCallbackScreen from '@/components/auth/login-callback-screen';

function LoginEntry({ establishSession }: { establishSession: (session: SessionTokenStored) => void }) {
  const searchParams = useSearchParams();
  // Capture the landing URL once. Cleaning it must not unmount the callback screen.
  const [callback] = useState(() => readLoginCallback(searchParams));

  return callback ? <LoginCallbackScreen callback={callback} onSuccess={establishSession} /> : <LoginScreen />;
}

/** RequireLogin blocks the rendering of children unless the user is authenticated. */
export default function RequireLogin({ children }: PropsWithChildren) {
  const auth = useAuth();
  return auth.isAuthenticated ? children : <LoginEntry establishSession={auth.establishSession} />;
}
