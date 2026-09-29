'use client';

import { useEffect, useState } from 'react';
import { Button, Callout, Text } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import LoginCard from '@/components/auth/login-card';
import { XSpinner } from '@/components/ui/x-spinner';
import { beginLogin } from '@/services/oidc-login';
import { SUPPORT_EMAIL } from '@/services/constants';

type LoginState = { status: 'idle' } | { status: 'starting' } | { status: 'error'; message: string };

export default function LoginScreen({ initialError }: { initialError?: string }) {
  const [state, setState] = useState<LoginState>(
    initialError ? { status: 'error', message: initialError } : { status: 'idle' },
  );

  useEffect(() => {
    // Back from the identity provider can restore this page from the browser's back/forward cache,
    // including its 'starting' state, without remounting. Restore the login button instead of leaving
    // the user stuck on the spinner. Keep 'starting' until navigation to avoid a pre-redirect flicker.
    const resetAfterRestore = (event: PageTransitionEvent) => {
      if (event.persisted) setState((current) => (current.status === 'starting' ? { status: 'idle' } : current));
    };
    window.addEventListener('pageshow', resetAfterRestore);
    return () => window.removeEventListener('pageshow', resetAfterRestore);
  }, []);

  const startLogin = async () => {
    setState({ status: 'starting' });
    try {
      window.location.assign(await beginLogin());
    } catch (error) {
      console.error('Unable to start login:', error);
      setState({
        status: 'error',
        message: `We could not start sign-in. Please try again. If this continues, contact ${SUPPORT_EMAIL}.`,
      });
    }
  };

  return (
    <LoginCard>
      {state.status === 'starting' ? (
        <XSpinner message="Connecting to sign-in..." />
      ) : (
        <>
          <Text>Please log in to continue</Text>
          <Button onClick={startLogin}>{state.status === 'error' ? 'Try again' : 'Log in'}</Button>
          {state.status === 'error' && (
            <Callout.Root color="red" role="alert">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>{state.message}</Callout.Text>
            </Callout.Root>
          )}
        </>
      )}
    </LoginCard>
  );
}
