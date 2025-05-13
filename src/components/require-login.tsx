'use client';
import { Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '@/providers/auth-provider';
import { PropsWithChildren } from 'react';
import { PRODUCT_NAME } from '@/services/constants';

/** RequireLogin blocks the rendering of children unless the user is authenticated. */
export default function RequireLogin({ children }: PropsWithChildren) {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
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
