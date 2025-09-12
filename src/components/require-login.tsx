'use client';
import { Button, Callout, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '@/providers/auth-provider';
import { PropsWithChildren } from 'react';
import { PRODUCT_NAME, SUPPORT_EMAIL } from '@/services/constants';
import { InfoCircledIcon } from '@radix-ui/react-icons';

/** RequireLogin blocks the rendering of children unless the user is authenticated. */
export default function RequireLogin({ children }: PropsWithChildren) {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    if (auth.userIsMissingInvite) {
      return (
        <Flex direction="column" gap="3" p="4" align="center">
          <Callout.Root color={'red'}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>Please contact {SUPPORT_EMAIL} for access.</Callout.Text>
          </Callout.Root>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Flex>
      );
    }

    return (
      <Flex direction="column" justify="center" align="center" height={'100%'}>
        <Card size="3">
          <Flex direction="column" gap="3" align="center">
            <Heading>Welcome to {PRODUCT_NAME}</Heading>
            <Text>Please log in to continue</Text>
            <Button onClick={auth.startLogin}>Log in</Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  return children;
}
