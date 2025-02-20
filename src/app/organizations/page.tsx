'use client';
import { Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useListOrganizations } from '@/api/admin';
import { CreateOrganizationDialog } from '@/app/organizations/create-organization-dialog';
import { OrganizationsTable } from '@/app/organizations/organizations-table';

export default function Page() {
  const { data, isLoading, error } = useListOrganizations();

  if (isLoading || data === undefined) {
    return <Spinner />;
  }
  if (error) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }
  return (
    <Flex direction="column" gap="3">
      <Heading>Manage Organizations</Heading>
      <Flex justify="between" align="center">
        <Heading size="4">Organizations</Heading>
        <CreateOrganizationDialog />
      </Flex>
      <OrganizationsTable organizations={data.data.items} />
    </Flex>
  );
}
