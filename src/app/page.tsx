'use client';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '@/app/auth-provider';
import { useCurrentOrganization } from '@/app/organization-provider';

export default function Home() {
  const auth = useAuth();
  const { current } = useCurrentOrganization();

  if (!auth.isAuthenticated) {
    return (
      <Flex direction="column" justify="center" align="center" height={'100%'}>
        <Card size="3">
          <Flex direction="column" gap="3" align="center">
            <Heading>Welcome to xngin</Heading>
            <Text>Please log in to continue</Text>
            <Button onClick={auth.startLogin}>Log in</Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <Heading>{current.name}</Heading>
      <Card>
        <Flex direction="column" gap="2">
          <Text>Logged in as:</Text>
          <Box>
            <Text weight="bold">{auth.userEmail}</Text>
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
}
