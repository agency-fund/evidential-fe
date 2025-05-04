'use client';
import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '@/app/providers/auth-provider';
import { useCurrentOrganization } from '@/app/providers/organization-provider';

export default function Home() {
  const auth = useAuth();
  const org = useCurrentOrganization();

  if (!auth.isAuthenticated) {
    throw Error('This application must be wrapped in a RequireLogin.');
  }

  return (
    <Flex direction="column" gap="3">
      {org && <Heading>{org.current.name}</Heading>}
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
